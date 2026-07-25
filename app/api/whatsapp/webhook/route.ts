import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Fonnte webhook structure typically includes sender, message, etc.
    const sender = body.sender;
    const message = body.message?.toLowerCase().trim();

    if (!sender || !message) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Expecting message format like "TERIMA ORDER-12345" or "TOLAK ORDER-12345"
    // Or we just expect the peternak to reply "terima" to the latest order.
    // For MVP, let's assume they reply "terima <order_id>"
    const parts = message.split(' ');
    const actionStr = parts[0];
    const shortOrderId = parts[1];

    if (!['terima', 'tolak'].includes(actionStr) || !shortOrderId) {
      return NextResponse.json({ message: 'Format pesan tidak dikenali. Balas dengan: TERIMA <ID_ORDER> atau TOLAK <ID_ORDER>' });
    }

    const action = actionStr === 'terima' ? 'accept' : 'reject';
    const newStatus = action === 'accept' ? 'accepted' : 'rejected';

    const supabase = createAdminClient();

    // Find the order that starts with shortOrderId and belongs to peternak with this sender (phone number)
    // We would need to match sender phone number with peternak's profile.
    // But for now, let's just find the order by ID prefix.
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, order_status, peternak_id')
      .eq('order_status', 'waiting')
      .ilike('id', `${shortOrderId}%`);

    if (error || !orders || orders.length === 0) {
      return NextResponse.json({ message: 'Order tidak ditemukan atau sudah tidak berstatus waiting.' });
    }

    const order = orders[0];

    // Update order
    const now = new Date().toISOString();
    await supabase.from('orders').update({
      order_status: newStatus,
      responded_at: now,
      updated_at: now,
    }).eq('id', order.id);

    // Insert history
    await supabase.from('order_status_history').insert({
      order_id: order.id,
      status: newStatus,
      note: `Peternak ${action} via WhatsApp`,
      created_at: now
    });

    return NextResponse.json({ message: `Order ${shortOrderId} berhasil di-${actionStr}.` });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
