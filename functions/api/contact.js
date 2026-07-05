const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://diamondreklam.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { name, email, phone, message } = body;

    if (!name || !email) {
      return json({ error: 'Ad ve e-posta zorunlu.' }, 400);
    }

    const res = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': env.MAILCHANNELS_API_KEY,
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: 'info@diamondreklam.com', name: 'Diamond Reklam' }],
          reply_to: { email, name },
        }],
        from: {
          email: 'noreply@diamondreklam.com',
          name: 'Diamond Web Formu',
        },
        subject: `Yeni teklif talebi — ${name}`,
        content: [{
          type: 'text/html',
          value: `
            <div style="font-family:sans-serif;max-width:560px">
              <h2 style="color:#0D0E0F;margin-bottom:24px">Yeni Teklif Talebi</h2>
              <table style="width:100%;border-collapse:collapse">
                <tr><td style="padding:10px 0;border-bottom:1px solid #E5E7EB;color:#6B7280;width:120px">Ad Soyad</td><td style="padding:10px 0;border-bottom:1px solid #E5E7EB;font-weight:600">${name}</td></tr>
                <tr><td style="padding:10px 0;border-bottom:1px solid #E5E7EB;color:#6B7280">E-posta</td><td style="padding:10px 0;border-bottom:1px solid #E5E7EB"><a href="mailto:${email}">${email}</a></td></tr>
                <tr><td style="padding:10px 0;border-bottom:1px solid #E5E7EB;color:#6B7280">Telefon</td><td style="padding:10px 0;border-bottom:1px solid #E5E7EB">${phone || '—'}</td></tr>
                <tr><td style="padding:10px 0;color:#6B7280;vertical-align:top">Mesaj</td><td style="padding:10px 0">${message ? message.replace(/\n/g, '<br>') : '—'}</td></tr>
              </table>
              <p style="margin-top:32px;font-size:12px;color:#9CA3AF">Bu mail diamondreklam.com iletişim formu üzerinden gönderildi.</p>
            </div>
          `,
        }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('MailChannels error:', err);
      return json({ error: 'Mail gönderilemedi. Lütfen tekrar deneyin.' }, 500);
    }

    return json({ ok: true }, 200);

  } catch (err) {
    console.error('Contact handler error:', err);
    return json({ error: 'Sunucu hatası.' }, 500);
  }
}

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
