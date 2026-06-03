// TRAVEX Finance — Supabase Client
// ══════════════════════════════════════════════════════

const SUPABASE_URL = 'https://ilcpcikmfbictwiafvqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsY3BjaWttZmJpY3R3aWFmdnF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NjkxNTksImV4cCI6MjA5NjA0NTE1OX0.M9FDI2x97rfRMMAqgTwHuTF__H-1bur3_E9HXhb_CQs';

// Load Supabase SDK
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── AUTH ──────────────────────────────────────────────

const Auth = {
  // Jiandikishe
  async signup(email, password, meta) {
    const { data, error } = await supabaseClient.auth.signUp({
      email, password,
      options: { data: meta }
    });
    return { data, error };
  },

  // Ingia
  async login(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email, password
    });
    return { data, error };
  },

  // Ondoka
  async logout() {
    await supabaseClient.auth.signOut();
    window.location.href = 'login.html';
  },

  // Pata mtumiaji wa sasa
  async getUser() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    return user;
  },

  // Pata session
  async getSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session;
  },

  // Angalia kama ameingia
  async isLoggedIn() {
    const session = await this.getSession();
    return !!session;
  },

  // Hifadhi profile kwenye localStorage kwa speed
  cacheUser(profile) {
    localStorage.setItem('tx_profile', JSON.stringify(profile));
  },

  getCachedUser() {
    try { return JSON.parse(localStorage.getItem('tx_profile')); }
    catch { return null; }
  },

  clearCache() {
    localStorage.removeItem('tx_profile');
  }
};

// ── DATABASE ──────────────────────────────────────────

const DB = {
  // MAUZO
  mauzo: {
    async getAll() {
      const user = await Auth.getUser();
      const { data } = await supabaseClient.from('mauzo')
        .select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      return data || [];
    },
    async add(item) {
      const user = await Auth.getUser();
      const { data, error } = await supabaseClient.from('mauzo')
        .insert({ ...item, user_id: user.id }).select().single();
      return { data, error };
    },
    async delete(id) {
      return await supabaseClient.from('mauzo').delete().eq('id', id);
    },
    async getByDate(tarehe) {
      const user = await Auth.getUser();
      const { data } = await supabaseClient.from('mauzo')
        .select('*').eq('user_id', user.id).eq('tarehe', tarehe);
      return data || [];
    },
    async getByMonth(mwezi, mwaka) {
      const user = await Auth.getUser();
      const from = `${mwaka}-${String(mwezi+1).padStart(2,'0')}-01`;
      const to = `${mwaka}-${String(mwezi+1).padStart(2,'0')}-31`;
      const { data } = await supabaseClient.from('mauzo')
        .select('*').eq('user_id', user.id)
        .gte('tarehe', from).lte('tarehe', to);
      return data || [];
    }
  },

  // STOCK
  stock: {
    async getAll() {
      const user = await Auth.getUser();
      const { data } = await supabaseClient.from('stock')
        .select('*').eq('user_id', user.id).order('jina');
      return data || [];
    },
    async add(item) {
      const user = await Auth.getUser();
      const { data, error } = await supabaseClient.from('stock')
        .insert({ ...item, user_id: user.id }).select().single();
      return { data, error };
    },
    async update(id, updates) {
      return await supabaseClient.from('stock').update(updates).eq('id', id);
    },
    async delete(id) {
      return await supabaseClient.from('stock').delete().eq('id', id);
    },
    async search(query) {
      const user = await Auth.getUser();
      const { data } = await supabaseClient.from('stock')
        .select('*').eq('user_id', user.id)
        .ilike('jina', `%${query}%`).limit(10);
      return data || [];
    }
  },

  // MADENI
  madeni: {
    async getAll() {
      const user = await Auth.getUser();
      const { data } = await supabaseClient.from('madeni')
        .select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      return data || [];
    },
    async add(item) {
      const user = await Auth.getUser();
      const { data, error } = await supabaseClient.from('madeni')
        .insert({ ...item, user_id: user.id }).select().single();
      return { data, error };
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
      const { data } = await supabaseClient.from('invoice')
        .select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      return data || [];
    },
    async add(item) {
      const user = await Auth.getUser();
      const { data, error } = await supabaseClient.from('invoice')
        .insert({ ...item, user_id: user.id }).select().single();
      return { data, error };
    },
    async update(id, updates) {
      return await supabaseClient.from('invoice').update(updates).eq('id', id);
    },
    async delete(id) {
      return await supabaseClient.from('invoice').delete().eq('id', id);
    },
    async getNextNamba() {
      const user = await Auth.getUser();
      const { count } = await supabaseClient.from('invoice')
        .select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      return 'INV-' + String((count || 0) + 1).padStart(3, '0');
    }
  },

  // WAFANYAKAZI
  wafanyakazi: {
    async getAll() {
      const user = await Auth.getUser();
      const { data } = await supabaseClient.from('wafanyakazi')
        .select('*').eq('user_id', user.id).order('jina');
      return data || [];
    },
    async add(item) {
      const user = await Auth.getUser();
      const { data, error } = await supabaseClient.from('wafanyakazi')
        .insert({ ...item, user_id: user.id }).select().single();
      return { data, error };
    },
    async delete(id) {
      return await supabaseClient.from('wafanyakazi').delete().eq('id', id);
    }
  },

  // MISHAHARA
  mishahara: {
    async getByMonth(mwezi, mwaka) {
      const user = await Auth.getUser();
      const { data } = await supabaseClient.from('mishahara')
        .select('*').eq('user_id', user.id)
        .eq('mwezi', mwezi).eq('mwaka', mwaka);
      return data || [];
    },
    async lipa(mfanyakaziId, mwezi, mwaka) {
      const user = await Auth.getUser();
      // Check kama ipo tayari
      const { data: existing } = await supabaseClient.from('mishahara')
        .select('id').eq('user_id', user.id)
        .eq('mfanyakazi_id', mfanyakaziId).eq('mwezi', mwezi).eq('mwaka', mwaka).single();
      if (existing) {
        return await supabaseClient.from('mishahara')
          .update({ imelipwa: true }).eq('id', existing.id);
      }
      return await supabaseClient.from('mishahara')
        .insert({ user_id: user.id, mfanyakazi_id: mfanyakaziId, mwezi, mwaka, imelipwa: true });
    }
  },

  // ATTENDANCE
  attendance: {
    async getByDate(tarehe) {
      const user = await Auth.getUser();
      const { data } = await supabaseClient.from('attendance')
        .select('*').eq('user_id', user.id).eq('tarehe', tarehe);
      return data || [];
    },
    async set(mfanyakaziId, tarehe, hali, muda) {
      const user = await Auth.getUser();
      const { data: existing } = await supabaseClient.from('attendance')
        .select('id').eq('user_id', user.id)
        .eq('mfanyakazi_id', mfanyakaziId).eq('tarehe', tarehe).single();
      if (existing) {
        return await supabaseClient.from('attendance')
          .update({ hali, muda }).eq('id', existing.id);
      }
      return await supabaseClient.from('attendance')
        .insert({ user_id: user.id, mfanyakazi_id: mfanyakaziId, tarehe, hali, muda });
    }
  },

  // PROFILE
  profile: {
    async get() {
      const user = await Auth.getUser();
      const { data } = await supabaseClient.from('profiles')
        .select('*').eq('id', user.id).single();
      return data;
    },
    async update(updates) {
      const user = await Auth.getUser();
      return await supabaseClient.from('profiles').update(updates).eq('id', user.id);
    }
  }
};

// ── STORAGE (Picha za Bidhaa) ─────────────────────────

const Storage = {
  async uploadPicha(file, bidhaaId) {
    const user = await Auth.getUser();
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${bidhaaId}.${ext}`;
    const { data, error } = await supabaseClient.storage
      .from('bidhaa-picha').upload(path, file, { upsert: true });
    if (error) return null;
    const { data: { publicUrl } } = supabaseClient.storage
      .from('bidhaa-picha').getPublicUrl(path);
    return publicUrl;
  },
  async deletePicha(bidhaaId) {
    const user = await Auth.getUser();
    await supabaseClient.storage.from('bidhaa-picha')
      .remove([`${user.id}/${bidhaaId}`]);
  }
};

// ── HELPERS ───────────────────────────────────────────

function formatTZS(n) {
  return 'TZS ' + Number(n || 0).toLocaleString('sw-TZ');
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('sw-TZ', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.innerHTML = `<i class="ti ti-${type === 'success' ? 'check' : 'alert-circle'}"></i> ${msg}`;
  t.className = 'toast show';
  t.style.borderLeftColor = type === 'success' ? 'var(--gold)' : 'var(--danger)';
  setTimeout(() => t.classList.remove('show'), 3500);
}

function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.closest('.tab-group') || document;
      group.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      group.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab)?.classList.add('active');
    });
  });
}

// ── SIDEBAR ───────────────────────────────────────────

async function loadSidebar(activePage) {
  let profile = Auth.getCachedUser();
  if (!profile) {
    profile = await DB.profile.get();
    if (profile) Auth.cacheUser(profile);
  }
  if (!profile) return;

  const plan = profile.plan || 'retailer';
  const initials = (profile.biashara || 'TX').substring(0, 2).toUpperCase();

  const retailerNav = `
    <div class="nav-label">Huduma Kuu</div>
    <a href="dashboard.html" class="nav-item ${activePage==='dashboard'?'active':''}"><i class="ti ti-home"></i> Muhtasari</a>
    <a href="mauzo.html" class="nav-item ${activePage==='mauzo'?'active':''}"><i class="ti ti-shopping-cart"></i> Mauzo</a>
    <a href="stock.html" class="nav-item ${activePage==='stock'?'active':''}"><i class="ti ti-package"></i> Stock</a>
    <a href="madeni.html" class="nav-item ${activePage==='madeni'?'active':''}"><i class="ti ti-credit-card"></i> Madeni</a>
    <a href="invoice.html" class="nav-item ${activePage==='invoice'?'active':''}"><i class="ti ti-file-invoice"></i> Invoice</a>
    <div class="nav-label">Zaidi</div>
    <a href="ripoti.html" class="nav-item ${activePage==='ripoti'?'active':''}"><i class="ti ti-chart-bar"></i> Ripoti</a>
    <a href="wafanyakazi.html" class="nav-item ${activePage==='wafanyakazi'?'active':''}"><i class="ti ti-users"></i> Wafanyakazi</a>
    <a href="mipangilio.html" class="nav-item ${activePage==='mipangilio'?'active':''}"><i class="ti ti-settings"></i> Mipangilio</a>
  `;

  const wholesalerExtra = plan === 'wholesaler' ? `
    <a href="wasambazaji.html" class="nav-item ${activePage==='wasambazaji'?'active':''}"><i class="ti ti-truck"></i> Wasambazaji</a>
  ` : '';

  document.getElementById('sidebar').innerHTML = `
    <div class="sidebar-logo">
      <div class="sidebar-logo-brand">TX TRAVEX Finance</div>
      <div class="sidebar-logo-tag">Smart Finance for Every Business</div>
    </div>
    <div class="sidebar-user">
      <div class="sidebar-avatar">${initials}</div>
      <div>
        <div class="sidebar-user-name">${profile.biashara || 'Biashara Yangu'}</div>
        <span class="sidebar-user-plan">${plan === 'wholesaler' ? 'Wholesaler' : 'Retailer'}</span>
      </div>
    </div>
    <nav class="sidebar-nav">${retailerNav}${wholesalerExtra}</nav>
    <div class="sidebar-footer">
      <button class="logout-btn" onclick="Auth.logout()">
        <i class="ti ti-logout"></i> Ondoka
      </button>
    </div>
  `;
}

// ── AUTH GUARDS ───────────────────────────────────────

async function requireAuth() {
  const session = await Auth.getSession();
  if (!session) window.location.href = 'login.html';
}

async function requireGuest() {
  const session = await Auth.getSession();
  if (session) window.location.href = 'dashboard.html';
}
