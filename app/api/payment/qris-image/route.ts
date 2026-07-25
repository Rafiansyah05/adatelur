import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 });
  }

  const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
  const basicAuth = Buffer.from(`${serverKey}:`).toString('base64');

  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${basicAuth}`,
      Accept: 'image/png,image/*',
    },
  });

  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to fetch QR image' }, { status: response.status });
  }

  const buffer = await response.arrayBuffer();
  const contentType = response.headers.get('Content-Type') || 'image/png';

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'no-store',
    },
  });
}
