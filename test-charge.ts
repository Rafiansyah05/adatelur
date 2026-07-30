import midtransClient from 'midtrans-client';
import * as fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const serverKey = envFile.match(/MIDTRANS_SERVER_KEY=(.*)/)?.[1]?.trim() || '';
const clientKey = envFile.match(/NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=(.*)/)?.[1]?.trim() || '';

const coreApi = new midtransClient.CoreApi({
  isProduction: false,
  serverKey,
  clientKey
});

async function testCharge() {
  try {
    const parameter = {
      payment_type: 'qris',
      transaction_details: {
        order_id: `ADT-test-${Date.now()}`,
        gross_amount: 150000
      },
      customer_details: {
        first_name: 'Pelanggan',
        email: 'customer@adatelur'
      },
      qris: {
        acquirer: 'gopay'
      }
    };

    const chargeResponse = await coreApi.charge(parameter);
    console.log(JSON.stringify(chargeResponse, null, 2));
  } catch (e) {
    console.error(e);
  }
}

testCharge();
