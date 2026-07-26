import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { haversineDistance, calculateOngkir } from '@/lib/haversine';
import { sendWhatsAppMessage } from '@/lib/fonnte';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const listingId = body.listing_id || body.listingId;
    const rakQuantity = Number(body.rak_quantity ?? body.rakQuantity ?? 1);
    const fulfillmentMethod = body.fulfillment_method || body.fulfillmentMethod || 'pickup';
    const consumerAddressId = body.consumer_address_id || body.consumerAddressId || null;
    const deliverySlotId = body.delivery_slot_id || body.deliverySlotId || null;

    if (!listingId) {
      return NextResponse.json({ error: 'listing_id is required' }, { status: 400 });
    }

    if (!Number.isFinite(rakQuantity) || rakQuantity < 1) {
      return NextResponse.json({ error: 'rak_quantity must be >= 1' }, { status: 400 });
    }

    // fetch listing and peternak info
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, peternak_id, price_per_rak, is_listing_active, stock_rak')
      .eq('id', listingId)
      .maybeSingle();

    if (listingError) return NextResponse.json({ error: listingError.message }, { status: 500 });
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    if (!listing.is_listing_active)
      return NextResponse.json({ error: 'Listing is not active' }, { status: 400 });

    // snapshot price
    const pricePerRak = Number(listing.price_per_rak);
    const subtotal = Number((pricePerRak * rakQuantity).toFixed(2));

    let distanceKm: number | null = null;
    let ongkirAmount = 0;

    if (fulfillmentMethod === 'delivery') {
      if (!consumerAddressId)
        return NextResponse.json(
          { error: 'consumer_address_id required for delivery' },
          { status: 400 }
        );

      const { data: consumerAddress, error: addrErr } = await supabase
        .from('consumer_addresses')
        .select('latitude, longitude')
        .eq('id', consumerAddressId)
        .maybeSingle();

      if (addrErr) return NextResponse.json({ error: addrErr.message }, { status: 500 });
      if (!consumerAddress)
        return NextResponse.json({ error: 'Consumer address not found' }, { status: 404 });

      const adminSupabase = createAdminClient();
      const { data: peternakDetail, error: pdErr } = await adminSupabase
        .from('peternak_details')
        .select('farm_latitude, farm_longitude')
        .eq('id', listing.peternak_id)
        .maybeSingle();

      if (pdErr) return NextResponse.json({ error: pdErr.message }, { status: 500 });
      if (!peternakDetail)
        return NextResponse.json({ error: 'Peternak details not found' }, { status: 404 });

      distanceKm = haversineDistance(
        Number(peternakDetail.farm_latitude),
        Number(peternakDetail.farm_longitude),
        Number(consumerAddress.latitude),
        Number(consumerAddress.longitude)
      );

      ongkirAmount = calculateOngkir(distanceKm);
    }

    const createdAt = new Date().toISOString();
    const responseDeadline = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const insertPayload: any = {
      order_code: `ADT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 9000) + 1000}`,
      consumer_id: user.id,
      peternak_id: listing.peternak_id,
      listing_id: listing.id,
      rak_quantity: rakQuantity,
      price_per_rak: pricePerRak,
      subtotal,
      fulfillment_method: fulfillmentMethod,
      distance_km: distanceKm,
      ongkir_amount: ongkirAmount,
      total_amount: Number((subtotal + ongkirAmount).toFixed(2)),
      delivery_slot_id: deliverySlotId,
      consumer_address_id: consumerAddressId,
      payment_status: 'unpaid',
      order_status: 'waiting',
      responded_at: null,
      response_deadline: responseDeadline,
      push_notif_sent_at: null,
      created_at: createdAt,
      updated_at: createdAt,
    };

    const adminClientForInsert = createAdminClient();

    const { data: order, error: orderErr } = await adminClientForInsert
      .from('orders')
      .insert(insertPayload)
      .select()
      .single();

    if (orderErr) return NextResponse.json({ error: orderErr.message }, { status: 500 });

    const { error: histErr } = await adminClientForInsert.from('order_status_history').insert({
      order_id: order.id,
      status: 'waiting',
      note: 'Order created',
      created_at: createdAt,
    });

    if (histErr) {
      console.error('Failed to insert order history', histErr.message);
    }

    try {
      const { data: peternakDetail } = await adminClientForInsert
        .from('peternak_details')
        .select('profile_id')
        .eq('id', listing.peternak_id)
        .single();

      if (peternakDetail?.profile_id) {
        const { data: peternakProfile } = await adminClientForInsert
          .from('profiles')
          .select('phone_number')
          .eq('id', peternakDetail.profile_id)
          .single();

        const { data: consumerProfile } = await adminClientForInsert
          .from('profiles')
          .select('full_name, phone_number')
          .eq('id', user.id)
          .single();

        if (peternakProfile?.phone_number) {
          const shortId = order.id.slice(0, 8);
          const methodLabel = fulfillmentMethod === 'delivery' ? 'Diantar' : 'Ambil Sendiri';
          const device = process.env.FONNTE_DEVICE_NUMBER;

          let slotLine = '';
          if (deliverySlotId) {
            const { data: slot } = await adminClientForInsert
              .from('delivery_slots')
              .select('start_time, end_time')
              .eq('id', deliverySlotId)
              .maybeSingle();
            if (slot) {
              const jamLabel = fulfillmentMethod === 'delivery' ? 'Jam antar' : 'Jam ambil';
              slotLine = `${jamLabel}: ${slot.start_time.substring(0, 5)}-${slot.end_time.substring(0, 5)} WIB\n`;
            }
          }

          let addressLine = '';
          if (fulfillmentMethod === 'delivery' && consumerAddressId) {
            const { data: address } = await adminClientForInsert
              .from('consumer_addresses')
              .select('full_address')
              .eq('id', consumerAddressId)
              .maybeSingle();
            if (address?.full_address) {
              addressLine = `Alamat: ${address.full_address}\n`;
            }
          }

          const replyInstruction = device
            ? `Tap untuk membalas (dalam 5 menit):\n` +
              `Terima: https://wa.me/${device}?text=${encodeURIComponent(`TERIMA ${shortId}`)}\n` +
              `Tolak: https://wa.me/${device}?text=${encodeURIComponent(`TOLAK ${shortId}`)}`
            : `Balas dalam 5 menit:\n` +
              `TERIMA ${shortId} (untuk menerima)\n` +
              `TOLAK ${shortId} (untuk menolak)`;

          const message =
            `Pesanan baru di adatelur!\n\n` +
            `Pemesan: ${consumerProfile?.full_name || 'Konsumen'}\n` +
            `No. WA: ${consumerProfile?.phone_number || '-'}\n` +
            `Jumlah: ${rakQuantity} rak\n` +
            `Metode: ${methodLabel}\n` +
            addressLine +
            slotLine +
            `Total: Rp${Number(order.total_amount).toLocaleString('id-ID')}\n\n` +
            replyInstruction;

          await sendWhatsAppMessage(peternakProfile.phone_number, message);

          await adminClientForInsert.from('notifications_log').insert({
            recipient_id: peternakDetail.profile_id,
            channel: 'whatsapp',
            notif_type: 'order_new',
            related_order_id: order.id,
            payload: { rak_quantity: rakQuantity, total_amount: order.total_amount },
          });
        }
      }
    } catch (notifError) {
      console.error('Gagal kirim notifikasi WA ke peternak', notifError);
    }

    return NextResponse.json({ success: true, order, data: order });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
