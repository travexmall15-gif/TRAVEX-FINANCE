// TRAVEX Finance — Shared JS Utilities

// ── SESSION ──────────────────────────────────────────
const Session = {
  set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },
  get(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
  clear() { localStorage.clear(); },
  isLoggedIn() { return !!this.get('tx_user'); },
  getUser() { return this.get('tx_user'); },
  getPlan() { return this.get('tx_user')?.plan || 'retailer'; }
};

// ── GUARD — Redirect if not logged in ─────────────────
function requireAuth() {
  if (!Session.isLoggedIn()) {
    window.location.href = 'login.html';
  }
}

// ── GUARD — Redirect if already logged in ─────────────
function requireGuest() {
  if (Session.isLoggedIn()) {
    window.location.href = 'dashboard.html';
  }
}

// ── LOGOUT ────────────────────────────────────────────
function logout() {
  Session.clear();
  window.location.href = 'login.html';
}

// ── TOAST ─────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.innerHTML = `<i class="ti ti-${type === 'success' ? 'check' : 'alert-circle'}"></i> ${msg}`;
  t.className = `toast show`;
  t.style.borderLeftColor = type === 'success' ? 'var(--gold)' : 'var(--danger)';
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── MODAL ─────────────────────────────────────────────
function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

// ── TABS ──────────────────────────────────────────────
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
function loadSidebar(activePage) {
  const user = Session.getUser();
  if (!user) return;

  const plan = user.plan;
  const initials = user.biashara?.substring(0, 2).toUpperCase() || 'TX';

  const retailerNav = `
    <div class="nav-label">Huduma Kuu</div>
    <a href="dashboard.html" class="nav-item ${activePage==='dashboard'?'active':''}">
      <i class="ti ti-home"></i> Muhtasari
    </a>
    <a href="mauzo.html" class="nav-item ${activePage==='mauzo'?'active':''}">
      <i class="ti ti-shopping-cart"></i> Mauzo
    </a>
    <a href="stock.html" class="nav-item ${activePage==='stock'?'active':''}">
      <i class="ti ti-package"></i> Stock
    </a>
    <a href="madeni.html" class="nav-item ${activePage==='madeni'?'active':''}">
      <i class="ti ti-credit-card"></i> Madeni
    </a>
    <a href="invoice.html" class="nav-item ${activePage==='invoice'?'active':''}">
      <i class="ti ti-file-invoice"></i> Invoice
    </a>
    <div class="nav-label">Zaidi</div>
    <a href="ripoti.html" class="nav-item ${activePage==='ripoti'?'active':''}">
      <i class="ti ti-chart-bar"></i> Ripoti
    </a>
    <a href="wafanyakazi.html" class="nav-item ${activePage==='wafanyakazi'?'active':''}">
      <i class="ti ti-users"></i> Wafanyakazi
    </a>
    <a href="mipangilio.html" class="nav-item ${activePage==='mipangilio'?'active':''}">
      <i class="ti ti-settings"></i> Mipangilio
    </a>
  `;

  const wholesalerExtra = `
    <a href="wasambazaji.html" class="nav-item ${activePage==='wasambazaji'?'active':''}">
      <i class="ti ti-truck"></i> Wasambazaji
    </a>
  `;

  const sidebarHTML = `
    <div class="sidebar-logo">
      <div class="sidebar-logo-brand">TX TRAVEX Finance</div>
      <div class="sidebar-logo-tag">Smart Finance for Every Business</div>
    </div>
    <div class="sidebar-user">
      <div class="sidebar-avatar">${initials}</div>
      <div>
        <div class="sidebar-user-name">${user.biashara || 'Biashara Yangu'}</div>
        <span class="sidebar-user-plan">${plan === 'wholesaler' ? 'Wholesaler' : 'Retailer'}</span>
      </div>
    </div>
    <nav class="sidebar-nav">
      ${retailerNav}
      ${plan === 'wholesaler' ? wholesalerExtra : ''}
    </nav>
    <div class="sidebar-footer">
      <button class="logout-btn" onclick="logout()">
        <i class="ti ti-logout"></i> Ondoka
      </button>
    </div>
  `;

  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.innerHTML = sidebarHTML;
}

// ── DATA STORE ────────────────────────────────────────
const DB = {
  get(key) { try { return JSON.parse(localStorage.getItem('tx_' + key)) || []; } catch { return []; } },
  set(key, val) { localStorage.setItem('tx_' + key, JSON.stringify(val)); },
  add(key, item) {
    const data = this.get(key);
    item.id = item.id || Date.now();
    item.createdAt = item.createdAt || new Date().toISOString();
    data.push(item);
    this.set(key, data);
    return item;
  },
  update(key, id, updates) {
    const data = this.get(key);
    const idx = data.findIndex(d => d.id == id);
    if (idx !== -1) { data[idx] = { ...data[idx], ...updates }; this.set(key, data); }
  },
  delete(key, id) {
    const data = this.get(key).filter(d => d.id != id);
    this.set(key, data);
  }
};

// ── FORMAT ────────────────────────────────────────────
function formatTZS(n) {
  return 'TZS ' + Number(n || 0).toLocaleString('sw-TZ');
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('sw-TZ', { day: '2-digit', month: 'short', year: 'numeric' });
}

function today() {
  return new Date().toISOString().split('T')[0];
}

// ── SEARCH TABLE ──────────────────────────────────────
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
