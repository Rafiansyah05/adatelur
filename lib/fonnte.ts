export async function sendWhatsAppMessage(target: string, message: string) {
  const token = process.env.FONNTE_API_TOKEN;

  if (!token) {
    console.warn('FONNTE_API_TOKEN is not set. Skipping WhatsApp message.');
    return { success: false, error: 'Token not configured' };
  }

  try {
    const res = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target,
        message,
        delay: '1',
      }),
    });

    const data = await res.json();

    if (!data.status) {
      throw new Error(data.reason || 'Fonnte API returned false status');
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending WhatsApp message via Fonnte:', error);
    return { success: false, error: error instanceof Error ? error.message : 'unknown error' };
  }
}
