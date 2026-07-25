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

async function checkStatus() {
  try {
    const res = await coreApi.transaction.status('A120260725034710ZeifeGGwQ8ID');
    console.log(JSON.stringify(res, null, 2));
  } catch (e) {
    console.error(e);
  }
}

checkStatus();
