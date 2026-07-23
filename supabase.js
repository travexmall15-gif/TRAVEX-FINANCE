// ═══════════════════════════════════════════════════════════
// Q360 AI — Supabase Client v2.0
// ═══════════════════════════════════════════════════════════

const SUPABASE_URL = 'https://ilcpcikmfbictwiafvqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsY3BjaWttZmJpY3R3aWFmdnF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NjkxNTksImV4cCI6MjA5NjA0NTE1OX0.M9FDI2x97rfRMMAqgTwHuTF__H-1bur3_E9HXhb_CQs';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── AUTH ─────────────────────────────────────────────────
const Auth = {
  async signup(email, password, meta) {
    return await supabaseClient.auth.signUp({ email, password, options: { data: meta } });
  },
  async login(email, password) {
    return await supabaseClient.auth.signInWithPassword({ email, password });
  },
  async loginWithGoogle() {
    return await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard.html` }
    });
  },
  async logout() {
    Auth.clearCache();
    localStorage.removeItem('q360_dev_active');
    await supabaseClient.auth.signOut().catch(()=>{});
    window.location.href = 'login.html';
  },
  async getUser() {
    // DEV MODE: return mock user
    if (localStorage.getItem('q360_dev_active') === 'true') {
      return { id: 'dev-00000001', email: 'dev@q360ai.local' };
    }
    const { data: { user } } = await supabaseClient.auth.getUser();
    return user;
  },
  async getSession() {
    // DEV MODE: check localStorage flag
    if (localStorage.getItem('q360_dev_active') === 'true') {
      return { user: { id: 'dev-00000001', email: 'dev@q360ai.local' } };
    }
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session;
  },
  async isLoggedIn() {
    const s = await this.getSession();
    return !!s;
  },
  cacheUser(profile) {
    localStorage.setItem('q360_profile', JSON.stringify(profile));
  },
  getCachedUser() {
    try { return JSON.parse(localStorage.getItem('q360_profile')); } catch { return null; }
  },
  clearCache() {
    localStorage.removeItem('q360_profile');
    localStorage.removeItem('q360_ai_settings');
  }
};

// ── DATABASE ──────────────────────────────────────────────
const DB = {

  // PROFILE
  profile: {
    async get() {
      // DEV MODE: return cached profile
      if (localStorage.getItem('q360_dev_active') === 'true') {
        return Auth.getCachedUser();
      }
      const user = await Auth.getUser();
      if (!user) return null;
      const { data } = await supabaseClient.from('profiles').select('*').eq('id', user.id).single();
      return data;
    },
    async update(updates) {
      const user = await Auth.getUser();
      return await supabaseClient.from('profiles').update(updates).eq('id', user.id);
    },
    async upsert(data) {
      const user = await Auth.getUser();
      return await supabaseClient.from('profiles').upsert({ id: user.id, ...data });
    }
  },

  // MAUZO (Sales)
  mauzo: {
    async getAll() {
      const user = await Auth.getUser();
      const { data } = await supabaseClient.from('mauzo').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      return data || [];
    },
    async add(item) {
      const user = await Auth.getUser();
      return await supabaseClient.from('mauzo').insert({ ...item, user_id: user.id }).select().single();
    },
    async delete(id) {
      return await supabaseClient.from('mauzo').delete().eq('id', id);
    },
    async getByDate(tarehe) {
      const user = await Auth.getUser();
      const { data } = await supabaseClient.from('mauzo').select('*').eq('user_id', user.id).eq('tarehe', tarehe);
      return data || [];
    },
    async getByMonth(m, y) {
      const user = await Auth.getUser();
      const from = `${y}-${String(m+1).padStart(2,'0')}-01`;
      const to   = `${y}-${String(m+1).padStart(2,'0')}-31`;
      const { data } = await supabaseClient.from('mauzo').select('*').eq('user_id', user.id).gte('tarehe', from).lte('tarehe', to);
      return data || [];
    }
  },

  // STOCK
  stock: {
    async getAll() {
      const user = await Auth.getUser();
      const { data } = await supabaseClient.from('stock').select('*').eq('user_id', user.id).order('jina');
      return data || [];
    },
    async add(item) {
      const user = await Auth.getUser();
      return await supabaseClient.from('stock').insert({ ...item, user_id: user.id }).select().single();
    },
    async update(id, updates) {
      return await supabaseClient.from('stock').update(updates).eq('id', id);
    },
    async delete(id) {
      return await supabaseClient.from('stock').delete().eq('id', id);
    }
  },

  // MADENI
  madeni: {
    async getAll() {
      const user = await Auth.getUser();
      const { data } = await supabaseClient.from('madeni').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      return data || [];
    },
    async add(item) {
      const user = await Auth.getUser();
      return await supabaseClient.from('madeni').insert({ ...item, user_id: user.id }).select().single();
    },
    async update(id, updates) {
      return await supabaseClient.from('madeni').update(updates).eq('id', id);
    },
    async delete(id) {
      return await supabaseClient.from('madeni').delete().eq('id', id);
    }
  },

  // INVOICE
  invoice: {
    async getAll() {
      const user = await Auth.getUser();
      const { data } = await supabaseClient.from('invoice').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      return data || [];
    },
    async add(item) {
      const user = await Auth.getUser();
      return await supabaseClient.from('invoice').insert({ ...item, user_id: user.id }).select().single();
    },
    async update(id, updates) {
      return await supabaseClient.from('invoice').update(updates).eq('id', id);
    },
    async delete(id) {
      return await supabaseClient.from('invoice').delete().eq('id', id);
    },
    async getNextNamba() {
      const user = await Auth.getUser();
      const { count } = await supabaseClient.from('invoice').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      return 'INV-' + String((count || 0) + 1).padStart(3, '0');
    }
  },

  // WAFANYAKAZI
  wafanyakazi: {
    async getAll() {
      const user = await Auth.getUser();
      const { data } = await supabaseClient.from('wafanyakazi').select('*').eq('user_id', user.id).order('jina');
      return data || [];
    },
    async add(item) {
      const user = await Auth.getUser();
      return await supabaseClient.from('wafanyakazi').insert({ ...item, user_id: user.id }).select().single();
    },
    async delete(id) {
      return await supabaseClient.from('wafanyakazi').delete().eq('id', id);
    }
  },

  // MISHAHARA
  mishahara: {
    async getByMonth(mwezi, mwaka) {
      const user = await Auth.getUser();
      const { data } = await supabaseClient.from('mishahara').select('*').eq('user_id', user.id).eq('mwezi', mwezi).eq('mwaka', mwaka);
      return data || [];
    },
    async lipa(mfanyakaziId, mwezi, mwaka) {
      const user = await Auth.getUser();
      const { data: existing } = await supabaseClient.from('mishahara').select('id').eq('user_id', user.id).eq('mfanyakazi_id', mfanyakaziId).eq('mwezi', mwezi).eq('mwaka', mwaka).single();
      if (existing) return await supabaseClient.from('mishahara').update({ imelipwa: true }).eq('id', existing.id);
      return await supabaseClient.from('mishahara').insert({ user_id: user.id, mfanyakazi_id: mfanyakaziId, mwezi, mwaka, imelipwa: true });
    }
  },

  // ATTENDANCE
  attendance: {
    async getByDate(tarehe) {
      const user = await Auth.getUser();
      const { data } = await supabaseClient.from('attendance').select('*').eq('user_id', user.id).eq('tarehe', tarehe);
      return data || [];
    },
    async set(mfanyakaziId, tarehe, hali, muda) {
      const user = await Auth.getUser();
      const { data: existing } = await supabaseClient.from('attendance').select('id').eq('user_id', user.id).eq('mfanyakazi_id', mfanyakaziId).eq('tarehe', tarehe).single();
      if (existing) return await supabaseClient.from('attendance').update({ hali, muda }).eq('id', existing.id);
      return await supabaseClient.from('attendance').insert({ user_id: user.id, mfanyakazi_id: mfanyakaziId, tarehe, hali, muda });
    }
  },

  // PERSONAL FINANCE (NEW)
  personal: {
    async getAll() {
      const user = await Auth.getUser();
      const { data } = await supabaseClient.from('personal_finance').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      return data || [];
    },
    async add(item) {
      const user = await Auth.getUser();
      return await supabaseClient.from('personal_finance').insert({ ...item, user_id: user.id }).select().single();
    },
    async delete(id) {
      return await supabaseClient.from('personal_finance').delete().eq('id', id);
    },
    async getByMonth(m, y) {
      const user = await Auth.getUser();
      const from = `${y}-${String(m+1).padStart(2,'0')}-01`;
      const to   = `${y}-${String(m+1).padStart(2,'0')}-31`;
      const { data } = await supabaseClient.from('personal_finance').select('*').eq('user_id', user.id).gte('tarehe', from).lte('tarehe', to);
      return data || [];
    }
  },

  // PROJECTS (NEW)
  projects: {
    async getAll() {
      const user = await Auth.getUser();
      const { data } = await supabaseClient.from('projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      return data || [];
    },
    async get(id) {
      const { data } = await supabaseClient.from('projects').select('*').eq('id', id).single();
      return data;
    },
    async add(item) {
      const user = await Auth.getUser();
      return await supabaseClient.from('projects').insert({ ...item, user_id: user.id }).select().single();
    },
    async update(id, updates) {
      return await supabaseClient.from('projects').update(updates).eq('id', id);
    },
    async delete(id) {
      return await supabaseClient.from('projects').delete().eq('id', id);
    }
  },

  // PROJECT TASKS (NEW)
  tasks: {
    async getByProject(projectId) {
      const { data } = await supabaseClient.from('project_tasks').select('*').eq('project_id', projectId).order('created_at');
      return data || [];
    },
    async add(item) {
      const user = await Auth.getUser();
      return await supabaseClient.from('project_tasks').insert({ ...item, user_id: user.id }).select().single();
    },
    async update(id, updates) {
      return await supabaseClient.from('project_tasks').update(updates).eq('id', id);
    },
    async delete(id) {
      return await supabaseClient.from('project_tasks').delete().eq('id', id);
    }
  },

  // AI CONVERSATIONS (NEW)
  conversations: {
    async getAll() {
      const user = await Auth.getUser();
      const { data } = await supabaseClient.from('ai_conversations').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
      return data || [];
    },
    async save(messages, title) {
      const user = await Auth.getUser();
      return await supabaseClient.from('ai_conversations').insert({ user_id: user.id, messages: JSON.stringify(messages), title: title || 'Mazungumzo' }).select().single();
    },
    async delete(id) {
      return await supabaseClient.from('ai_conversations').delete().eq('id', id);
    }
  },

  // AI USAGE — Credits reset every 3 hours per plan
  usage: {
    async get() {
      const user = await Auth.getUser();
      const { data } = await supabaseClient.from('ai_usage').select('*').eq('user_id', user.id).single();
      if (!data) return null;
      // Auto-reset check — every 3 hours
      const resetAt = new Date(data.reset_at || 0);
      if (new Date() > resetAt) {
        const nextReset = new Date(Date.now() + 3 * 60 * 60 * 1000); // +3 hours
        await supabaseClient.from('ai_usage').update({ credits_used: 0, reset_at: nextReset.toISOString() }).eq('user_id', user.id);
        return { ...data, credits_used: 0 };
      }
      return data;
    },
    async increment(credits) {
      const user = await Auth.getUser();
      const existing = await this.get();
      const nextReset = new Date(Date.now() + 3 * 60 * 60 * 1000);
      if (existing) {
        return await supabaseClient.from('ai_usage').update({
          credits_used: (existing.credits_used || 0) + credits,
          updated_at: new Date().toISOString()
        }).eq('user_id', user.id);
      }
      return await supabaseClient.from('ai_usage').insert({
        user_id: user.id, credits_used: credits, credits_limit: 100,
        reset_at: nextReset.toISOString()
      });
    },
    getResetCountdown(resetAt) {
      const diff = new Date(resetAt) - new Date();
      if (diff <= 0) return 'Inafufuka sasa...';
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      return `${h}s ${m}d`;
    }
  },

  // SUBSCRIPTIONS (NEW)
  subscription: {
    async get() {
      const user = await Auth.getUser();
      const { data } = await supabaseClient.from('subscriptions').select('*').eq('user_id', user.id).single();
      return data;
    }
  }
};

// ── HELPERS ──────────────────────────────────────────────
function formatTZS(n) {
  return 'TZS ' + Number(n || 0).toLocaleString('sw-TZ');
}
function formatDate(d) {
  return new Date(d).toLocaleDateString('sw-TZ', { day: '2-digit', month: 'short', year: 'numeric' });
}
function today() {
  return new Date().toISOString().split('T')[0];
}
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.innerHTML = `<i class="ti ti-${type === 'success' ? 'check' : 'alert-circle'}"></i> ${msg}`;
  t.className = `toast show ${type === 'error' ? 'error' : ''}`;
  setTimeout(() => t.classList.remove('show'), 3500);
}
function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const g = btn.closest('.tab-group') || document;
      g.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      g.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab)?.classList.add('active');
    });
  });
}
function searchTable(inputId, tableId) {
  const input = document.getElementById(inputId);
  const table = document.getElementById(tableId);
  if (!input || !table) return;
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase();
    table.querySelectorAll('tbody tr').forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });
}

// ── SIDEBAR ──────────────────────────────────────────────
async function loadSidebar(activePage) {
  let profile = Auth.getCachedUser();
  if (!profile) {
    profile = await DB.profile.get();
    if (profile) Auth.cacheUser(profile);
  }
  if (!profile) return;

  const plan = profile.plan || 'free';
  const initials = (profile.biashara || profile.jina || 'Q3').substring(0, 2).toUpperCase();
  const planColors = { free: 'var(--text-muted)', starter: 'var(--gold)', professional: 'var(--cyan)', enterprise: '#a78bfa' };
  const planNames = { free: 'Free', starter: 'Starter', professional: 'Pro', enterprise: 'Enterprise' };

  const planColors = { free: '#9ca3af', starter: '#FFD700', professional: '#00d4ff', enterprise: '#a78bfa' };
  const planLabels = { free: 'Free', starter: 'Starter', professional: 'Professional', enterprise: 'Enterprise' };
  const userPlan   = profile?.plan || 'free';

  const nav = [
    { id: 'ai',          icon: 'ti-brand-openai',     label: 'Q360 AI',       href: 'ai.html',           badge: 'AI' },
    { id: 'dashboard',   icon: 'ti-layout-dashboard', label: 'Dashboard',     href: 'dashboard.html' },
    null,
    { label: 'KIBINAFSI' },
    { id: 'personal',    icon: 'ti-wallet',            label: 'Fedha Zangu',  href: 'personal.html' },
    { id: 'projects',    icon: 'ti-layout-kanban',     label: 'Miradi',       href: 'projects.html' },
    null,
    { label: 'BIASHARA' },
    { id: 'mauzo',       icon: 'ti-shopping-cart',     label: 'Mauzo',        href: 'mauzo.html' },
    { id: 'stock',       icon: 'ti-package',            label: 'Stock',        href: 'stock.html' },
    { id: 'madeni',      icon: 'ti-credit-card',        label: 'Madeni',       href: 'madeni.html' },
    { id: 'invoice',     icon: 'ti-file-invoice',       label: 'Invoice',      href: 'invoice.html' },
    { id: 'wafanyakazi', icon: 'ti-users',              label: 'Wafanyakazi',  href: 'wafanyakazi.html' },
    null,
    { label: 'ZAIDI' },
    { id: 'reports',     icon: 'ti-chart-bar',          label: 'Ripoti',       href: 'reports.html' },
    { id: 'subscription',icon: 'ti-crown',              label: 'Mpango Wangu', href: 'subscription.html' },
    { id: 'mipangilio',  icon: 'ti-settings',           label: 'Mipangilio',   href: 'mipangilio.html' },
  ];

  const navHTML = nav.map(item => {
    if (!item) return '';
    if (!item.id) return `<div class="nav-label">${item.label}</div>`;
    return `<a href="${item.href}" class="nav-item ${activePage === item.id ? 'active' : ''}">
      <i class="ti ${item.icon}"></i> ${item.label}
      ${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ''}
    </a>`;
  }).join('');

  document.getElementById('sidebar').innerHTML = `
    <div class="sidebar-logo">
      <div class="sidebar-logo-icon">Q3</div>
      <div>
        <div class="sidebar-logo-brand">Q360<span> AI</span></div>
        <div class="sidebar-logo-tag">Smart life, smarter business</div>
      </div>
    </div>
    <div class="sidebar-user">
      <div class="sidebar-avatar">${initials}</div>
      <div>
        <div class="sidebar-user-name">${profile.biashara || profile.jina || 'Q360 User'}</div>
        <span class="sidebar-user-plan" style="color:${planColors[plan]}">${planNames[plan]}</span>
      </div>
    </div>
    <nav class="sidebar-nav">${navHTML}</nav>
    <div style="margin:8px 10px 0;padding:10px 12px;background:rgba(255,255,255,0.04);border-radius:10px;border:1px solid rgba(255,255,255,0.07)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
        <span style="font-size:10px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.8px">Mpango</span>
        <span style="font-size:10px;font-weight:700;color:${planColors[userPlan]}">${planLabels[userPlan]}</span>
      </div>
      <a href="subscription.html" style="display:flex;align-items:center;justify-content:center;gap:5px;background:rgba(0,212,255,0.08);border:1px solid rgba(0,212,255,0.2);border-radius:7px;padding:7px;font-size:11px;font-weight:700;color:var(--cyan);text-decoration:none;transition:all 0.2s" onmouseover="this.style.background='rgba(0,212,255,0.15)'" onmouseout="this.style.background='rgba(0,212,255,0.08)'">
        <i class="ti ti-crown" style="font-size:12px"></i> Boresha Mpango
      </a>
    </div>
    <div class="sidebar-footer">
      <button class="logout-btn" onclick="Auth.logout()"><i class="ti ti-logout"></i> Ondoka</button>
    </div>
  `;
}

// ── AI CONTEXT ENGINE (Provider-Independent) ─────────────
async function buildAIContext() {
  const profile = Auth.getCachedUser() || await DB.profile.get();
  const todayDate = today();

  try {
    const [mauzoLeo, allMauzo, allStock, allMadeni, allPersonal, allProjects] = await Promise.all([
      DB.mauzo.getByDate(todayDate),
      DB.mauzo.getAll(),
      DB.stock.getAll(),
      DB.madeni.getAll(),
      DB.personal.getAll().catch(() => []),
      DB.projects.getAll().catch(() => [])
    ]);

    // Business context
    const mapato = mauzoLeo.filter(m => m.aina === 'mapato').reduce((a, m) => a + Number(m.jumla), 0);
    const matumizi = mauzoLeo.filter(m => m.aina === 'matumizi').reduce((a, m) => a + Number(m.jumla), 0);
    const stockLow = allStock.filter(s => Number(s.idadi) <= Number(s.kiwango_chini));
    const totalMadeni = allMadeni.filter(m => m.aina === 'unaodai').reduce((a, m) => a + Number(m.kiasi), 0);

    // Monthly sales
    const now = new Date();
    const mauzoMwezi = allMauzo.filter(m => {
      const d = new Date(m.tarehe);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const mapatoMwezi = mauzoMwezi.filter(m => m.aina === 'mapato').reduce((a, m) => a + Number(m.jumla), 0);

    // Personal finance context
    const personalMwezi = allPersonal.filter(p => {
      const d = new Date(p.tarehe);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const personalMapato = personalMwezi.filter(p => p.aina === 'mapato').reduce((a, p) => a + Number(p.kiasi), 0);
    const personalMatumizi = personalMwezi.filter(p => p.aina === 'matumizi').reduce((a, p) => a + Number(p.kiasi), 0);

    // Projects
    const miradi_inayoendelea = allProjects.filter(p => p.hali === 'active');
    const avg_progress = miradi_inayoendelea.length
      ? Math.round(miradi_inayoendelea.reduce((a, p) => a + (p.progress || 0), 0) / miradi_inayoendelea.length)
      : 0;

    return {
      mtumiaji: {
        jina: profile?.jina || 'Mtumiaji',
        biashara: profile?.biashara || '',
        mkoa: profile?.mkoa || '',
        nchi: profile?.nchi || 'TZ',
        plan: profile?.plan || 'free',
        lugha: profile?.lugha || 'sw',
        madhumuni: profile?.purpose || 'both'
      },
      leo: {
        tarehe: todayDate,
        siku: new Date().toLocaleDateString('sw-TZ', { weekday: 'long' }),
        mapato_leo: mapato,
        matumizi_leo: matumizi,
        faida_leo: mapato - matumizi,
        miamala_leo: mauzoLeo.length
      },
      biashara: {
        bidhaa_jumla: allStock.length,
        stock_inayokwisha: stockLow.length,
        stock_majina: stockLow.slice(0,3).map(s => s.jina).join(', '),
        madeni_unaodai: totalMadeni,
        wadeni_wote: allMadeni.filter(m => m.aina === 'unaodai').length,
        mapato_mwezi_huu: mapatoMwezi,
        mauzo_mwezi_huu: mauzoMwezi.length
      },
      personal: {
        mapato_mwezi: personalMapato,
        matumizi_mwezi: personalMatumizi,
        akiba_mwezi: personalMapato - personalMatumizi,
        rekodi_zote: allPersonal.length
      },
      miradi: {
        jumla: allProjects.length,
        inayoendelea: miradi_inayoendelea.length,
        wastani_maendeleo: avg_progress,
        miradi_majina: miradi_inayoendelea.slice(0,3).map(p => p.jina).join(', ')
      }
    };
  } catch (err) {
    console.warn('buildAIContext error:', err);
    return {
      mtumiaji: { jina: profile?.jina || 'Mtumiaji', lugha: profile?.lugha || 'sw' },
      leo: { tarehe: todayDate }
    };
  }
}
