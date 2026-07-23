// Q360 AI — Vercel Serverless Function
// Proxies requests to Anthropic Claude API
// Set ANTHROPIC_API_KEY in Vercel environment variables

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages, context, language = 'sw', personality = 'friendly' } = req.body;

  const personalities = {
    friendly: 'Jibu kwa urafiki na ufupi. Tumia lugha rahisi.',
    professional: 'Jibu kwa weledi na utaalamu. Tumia lugha rasmi.',
    analyst: 'Jibu kwa uchambuzi wa kina na data. Toa takwimu na mifano.'
  };

  const systemPrompt = `Wewe ni Q360 AI — msaidizi mzuri wa biashara na maisha ya kibinafsi.
Unasaidia watumiaji kusimamia: biashara, fedha za kibinafsi, miradi, na maamuzi.

TAARIFA ZA MTUMIAJI:
${JSON.stringify(context || {}, null, 2)}

KANUNI:
1. Jibu kwa ${language === 'sw' ? 'Kiswahili' : 'English'} kila wakati
2. ${personalities[personality] || personalities.friendly}
3. Ukiulizwa kuhusu data — tumia data halisi iliyotolewa kwenye context
4. Ukiulizwa kufanya action — jibu kwa format: ACTION:{"type":"action_name","data":{...}}
5. Toa majibu yenye thamani — usiseme tu "sijui"
6. Kwa namba — format: TZS 1,000,000

Mada unazoweza kusaidia:
- Biashara: mauzo, stock, madeni, invoice, wafanyakazi
- Fedha za kibinafsi: mapato, matumizi, akiba, bajeti
- Miradi: progress, kazi, bajeti ya mradi
- Uchambuzi: ripoti, trends, ushauri

Q360 AI — Smart life, smarter business.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages || []
      })
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err.error?.message || 'AI error' });
    }

    const data = await response.json();
    return res.json({
      content: data.content?.[0]?.text || '',
      usage: data.usage
    });
  } catch (err) {
    console.error('Q360 AI error:', err);
    return res.status(500).json({ error: 'Server error. Jaribu tena.' });
  }
}
