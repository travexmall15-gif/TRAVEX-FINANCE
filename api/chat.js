// ═══════════════════════════════════════════════════════════
// Q360 AI — Provider-Independent AI Core
// Architecture: Provider Interface Pattern
//
// To switch AI provider: change ONLY the provider section below.
// Application code never changes — only the provider.
// ═══════════════════════════════════════════════════════════

// ── PROVIDER REGISTRY ──────────────────────────────────────
const PROVIDERS = {
  anthropic: {
    name: 'Anthropic Claude',
    endpoint: 'https://api.anthropic.com/v1/messages',
    model: 'claude-sonnet-4-6',
    async buildHeaders() {
      return {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      };
    },
    async buildBody(systemPrompt, messages, maxTokens) {
      return JSON.stringify({
        model: this.model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages
      });
    },
    async parseResponse(data) {
      return data.content?.[0]?.text || '';
    }
  },

  // Future providers — uncomment and configure to switch
  // openai: { ... },
  // gemini: { ... },
  // selfhosted: { endpoint: process.env.LOCAL_AI_ENDPOINT, ... },
  // mock: { ... }
};

// ── ACTIVE PROVIDER ────────────────────────────────────────
const ACTIVE_PROVIDER = process.env.AI_PROVIDER || 'anthropic';

// ── CONTEXT ENGINE ──────────────────────────────────────────
function buildSystemPrompt(context, language, personality) {
  const lang = language === 'en' ? 'English' : 'Kiswahili';
  const personalityMap = {
    friendly:     'Jibu kwa urafiki, upole na ufupi. Tumia maneno rahisi.',
    professional: 'Jibu kwa weledi na utaalamu. Tumia lugha rasmi ya biashara.',
    analyst:      'Jibu kwa uchambuzi wa kina. Toa takwimu, mifano na maelezo kamili.'
  };

  return `Wewe ni Q360 AI — mfumo wa akili bandia wa kibinafsi wa biashara na maisha.

UTAMBULISHO:
Wewe ni msaidizi mkuu wa AI wa Q360 — mfumo unaosaidia wafanyabiashara, wajasiriamali na watu binafsi kusimamia maisha na biashara zao vizuri zaidi.

LUGHA: Jibu KILA WAKATI kwa ${lang}.
UTU: ${personalityMap[personality] || personalityMap.friendly}

TAARIFA ZA MTUMIAJI:
${JSON.stringify(context?.mtumiaji || {}, null, 2)}

DATA YA LEO:
${JSON.stringify(context?.leo || {}, null, 2)}

DATA YA BIASHARA:
${JSON.stringify(context?.biashara || {}, null, 2)}

DATA YA KIBINAFSI:
${JSON.stringify(context?.personal || {}, null, 2)}

MIRADI:
${JSON.stringify(context?.miradi || {}, null, 2)}

UWEZO WAKO:
1. Jibu maswali kuhusu biashara kwa data halisi iliyo hapo juu
2. Toa uchambuzi wa fedha, mauzo, stock, madeni
3. Saidia kupanga miradi na kazi
4. Toa ushauri wa kibinafsi wa kifedha
5. Fanya vitendo vya mfumo kwa amri maalum

VITENDO (Actions):
Ukiulizwa KUFANYA kitu (si kujibu tu), tumia format hii:
ACTION:{"type":"action_name","data":{...},"confirm":true}

Vitendo vinavyopatikana:
- create_invoice — Tengeneza invoice
- add_product — Ongeza bidhaa kwenye stock
- create_sale — Rekodi muamala mpya
- add_expense — Ongeza gharama
- create_project — Unda mradi mpya
- add_task — Ongeza kazi kwenye mradi

Vitendo VYOTE vinahitaji uthibitisho wa mtumiaji kabla ya kutekelezwa.

KANUNI ZA KUJIBU:
- Tumia namba za kweli kutoka kwa data iliyotolewa
- Ukiulizwa kuhusu data ambayo haipo, sema wazi
- Usiseme "Sijui" — toa maelezo mazuri daima
- Format ya pesa: TZS 1,000,000
- Format ya tarehe: Swahili locale

Q360 AI — Smart life, smarter business.`;
}

// ── MEMORY ENGINE ───────────────────────────────────────────
function extractMemoryFromConversation(messages) {
  // Extract key facts from conversation for context continuity
  const memory = [];
  messages.slice(-10).forEach(msg => {
    if (msg.role === 'assistant' && msg.content.includes('ACTION:')) {
      memory.push('[Hatua ilifanywa: ' + msg.content.match(/ACTION:({.*?})/s)?.[1] + ']');
    }
  });
  return memory.join('\n');
}

// ── MAIN HANDLER ────────────────────────────────────────────
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const {
    messages = [],
    context = {},
    language = 'sw',
    personality = 'friendly',
    maxTokens = 1024,
    stream = false
  } = req.body;

  // Validate
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages required as array' });
  }

  // Get provider
  const provider = PROVIDERS[ACTIVE_PROVIDER];
  if (!provider) {
    return res.status(500).json({ error: `Provider "${ACTIVE_PROVIDER}" not configured` });
  }

  // Build system prompt via Context Engine
  const systemPrompt = buildSystemPrompt(context, language, personality);

  // Add memory context if conversation is long
  const memory = extractMemoryFromConversation(messages);
  const fullSystem = memory ? `${systemPrompt}\n\nMEMORIA YA MAZUNGUMZO:\n${memory}` : systemPrompt;

  // Prepare messages — last 20 only for token efficiency
  const trimmedMessages = messages.slice(-20).map(m => ({
    role: m.role,
    content: String(m.content || '')
  }));

  try {
    const headers = await provider.buildHeaders();
    const body = await provider.buildBody(fullSystem, trimmedMessages, maxTokens);

    const response = await fetch(provider.endpoint, { method: 'POST', headers, body });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error('Provider error:', errData);
      return res.status(response.status).json({
        error: errData?.error?.message || `Provider error: ${response.status}`
      });
    }

    const data = await response.json();
    const content = await provider.parseResponse(data);

    // Usage tracking
    const usage = {
      provider: ACTIVE_PROVIDER,
      model: provider.model,
      input_tokens: data.usage?.input_tokens || 0,
      output_tokens: data.usage?.output_tokens || 0
    };

    return res.json({ content, usage });

  } catch (err) {
    console.error('Q360 AI Core error:', err);
    return res.status(500).json({ error: 'Hitilafu ya seva ya AI. Jaribu tena.' });
  }
}
