import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ error: 'URL parameter is missing' }, { status: 400 });
    }

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const imageBuffer = await response.arrayBuffer();
    const headers = new Headers();
    headers.set('Content-Type', response.headers.get('Content-Type') || 'image/png');
    headers.set('Content-Disposition', 'inline'); 

    return new NextResponse(imageBuffer, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error('Error proxying image:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
