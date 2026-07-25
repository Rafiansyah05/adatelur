import * as fs from 'fs';
const envFile = fs.readFileSync('.env.local', 'utf-8');
const serverKey = envFile.match(/MIDTRANS_SERVER_KEY=(.*)/)?.[1]?.trim() || '';

async function test() {
  const url = "https://api.sandbox.midtrans.com/v2/qris/df337fec-d010-4b52-bccf-d5f7e7d52f5b/qr-code";
  const basicAuth = Buffer.from(`${serverKey}:`).toString('base64');
  const imgRes = await fetch(url, {
    headers: { Authorization: `Basic ${basicAuth}`, Accept: 'image/png,image/*' }
  });
  console.log("Status:", imgRes.status);
  const arrayBuffer = await imgRes.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType = imgRes.headers.get('Content-Type') || 'image/png';
  const base64Qris = `data:${contentType};base64,${buffer.toString('base64')}`;
  console.log(base64Qris.substring(0, 100));
}

test();
