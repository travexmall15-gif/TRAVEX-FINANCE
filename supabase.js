// ═══════════════════════════════════════════════════════════
// Q360 AI — Supabase Client v3.0
// Dev mode: full bypass, no Supabase calls, instant load
// ═══════════════════════════════════════════════════════════

const SUPABASE_URL      = 'https://ilcpcikmfbictwiafvqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsY3BjaWttZmJpY3R3aWFmdnF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NjkxNTksImV4cCI6MjA5NjA0NTE1OX0.M9FDI2x97rfRMMAqgTwHuTF__H-1bur3_E9HXhb_CQs';

// ── DEV MODE CHECK ─────────────────────────────────────────
const DEV_ACTIVE = localStorage.getItem('q360_dev_active') === 'true';

const DEV_MOCK_PROFILE = (() => {
  try { return JSON.parse(localStorage.getItem('q360_profile')); } catch { return null; }
})() || {
  id: 'dev-00000001',
  jina: 'Jumanne Maregeri',
  biashara: 'Q360 AI Demo',
  mkoa: 'Dar es Salaam',
  nchi: 'TZ',
  lugha: 'sw',
  personality: 'friendly',
  purpose: 'both',
  plan: 'professional',
  trial_start: new Date().toISOString(),
  trial_days: 30
};

// ── SUPABASE CLIENT (real mode only) ───────────────────────
let supabaseClient = null;
if (!DEV_ACTIVE && typeof supabase !== 'undefined') {
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// ── AUTH ───────────────────────────────────────────────────
const Auth = {
  async signup(email, password, meta) {
    if (DEV_ACTIVE) return { data: {}, error: null };
    return await supabaseClient.auth.signUp({ email, password, options: { data: meta } });
  },
  async login(email, password) {
    if (DEV_ACTIVE) return { data: {}, error: null };
    return await supabaseClient.auth.signInWithPassword({ email, password });
  },
  async loginWithGoogle() {
    if (DEV_ACTIVE) { window.location.replace('ai.html'); return; }
    return await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/ai.html` }
    });
  },
  async logout() {
    localStorage.removeItem('q360_dev_active');
    localStorage.removeItem('q360_profile');
    if (!DEV_ACTIVE && supabaseClient) await supabaseClient.auth.signOut().catch(()=>{});
    window.location.href = 'login.html';
  },
  async getUser() {
    if (DEV_ACTIVE) return { id: DEV_MOCK_PROFILE.id, email: 'dev@q360ai.local' };
    if (!supabaseClient) return null;
    const { data: { user } } = await supabaseClient.auth.getUser();
    return user;
  },
  async getSession() {
    if (DEV_ACTIVE) return { user: { id: DEV_MOCK_PROFILE.id } };
    if (!supabaseClient) return null;
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session;
  },
  cacheUser(p)    { localStorage.setItem('q360_profile', JSON.stringify(p)); },
  getCachedUser() { try { return JSON.parse(localStorage.getItem('q360_profile')); } catch { return null; } },
  clearCache()    { localStorage.removeItem('q360_profile'); }
};

// ── DB HELPER — wraps real Supabase or returns empty in dev ─
function dbTable(table) {
  if (DEV_ACTIVE) {
    // In dev mode: all operations return empty data instantly
    const noop = async () => ({ data: [], error: null });
    return {
      async getAll()          { return []; },
      async get(id)           { return null; },
      async add(item)         { return { data: { id: Date.now(), ...item }, error: null }; },
      async update(id, data)  { return { data: {}, error: null }; },
      async delete(id)        { return { data: {}, error: null }; }
    };
  }
  return null; // use real Supabase below
}

// ── DATABASE ───────────────────────────────────────────────
const DB = {
  profile: {
    async get() {
      if (DEV_ACTIVE) return DEV_MOCK_PROFILE;
      const user = await Auth.getUser();
      if (!user) return null;
      const { data } = await supabaseClient.from('profiles').select('*').eq('id', user.id).single();
      return data;
    },
    async update(updates) {
      if (DEV_ACTIVE) { Object.assign(DEV_MOCK_PROFILE, updates); Auth.cacheUser(DEV_MOCK_PROFILE); return { error: null }; }
      const user = await Auth.getUser();
      return await supabaseClient.from('profiles').update(updates).eq('id', user.id);
    },
    async upsert(data) {
      if (DEV_ACTIVE) return { error: null };
      const user = await Auth.getUser();
      return await supabaseClient.from('profiles').upsert({ id: user.id, ...data });
    }
  },

  mauzo: {
    async getAll()       { if (DEV_ACTIVE) return []; const u=await Auth.getUser(); const {data}=await supabaseClient.from('mauzo').select('*').eq('user_id',u.id).order('created_at',{ascending:false}); return data||[]; },
    async getByDate(t)   { if (DEV_ACTIVE) return []; const u=await Auth.getUser(); const {data}=await supabaseClient.from('mauzo').select('*').eq('user_id',u.id).eq('tarehe',t); return data||[]; },
    async getByMonth(m,y){ if (DEV_ACTIVE) return []; const u=await Auth.getUser(); const f=`${y}-${String(m+1).padStart(2,'0')}-01`,to=`${y}-${String(m+1).padStart(2,'0')}-31`; const {data}=await supabaseClient.from('mauzo').select('*').eq('user_id',u.id).gte('tarehe',f).lte('tarehe',to); return data||[]; },
    async add(item)      { if (DEV_ACTIVE) return {data:{id:Date.now(),...item},error:null}; const u=await Auth.getUser(); return await supabaseClient.from('mauzo').insert({...item,user_id:u.id}).select().single(); },
    async delete(id)     { if (DEV_ACTIVE) return {error:null}; return await supabaseClient.from('mauzo').delete().eq('id',id); }
  },

  stock: {
    async getAll()       { if (DEV_ACTIVE) return []; const u=await Auth.getUser(); const {data}=await supabaseClient.from('stock').select('*').eq('user_id',u.id).order('jina'); return data||[]; },
    async add(item)      { if (DEV_ACTIVE) return {data:{id:Date.now(),...item},error:null}; const u=await Auth.getUser(); return await supabaseClient.from('stock').insert({...item,user_id:u.id}).select().single(); },
    async update(id,upd) { if (DEV_ACTIVE) return {error:null}; return await supabaseClient.from('stock').update(upd).eq('id',id); },
    async delete(id)     { if (DEV_ACTIVE) return {error:null}; return await supabaseClient.from('stock').delete().eq('id',id); }
  },

  madeni: {
    async getAll()       { if (DEV_ACTIVE) return []; const u=await Auth.getUser(); const {data}=await supabaseClient.from('madeni').select('*').eq('user_id',u.id).order('created_at',{ascending:false}); return data||[]; },
    async add(item)      { if (DEV_ACTIVE) return {data:{id:Date.now(),...item},error:null}; const u=await Auth.getUser(); return await supabaseClient.from('madeni').insert({...item,user_id:u.id}).select().single(); },
    async update(id,upd) { if (DEV_ACTIVE) return {error:null}; return await supabaseClient.from('madeni').update(upd).eq('id',id); },
    async delete(id)     { if (DEV_ACTIVE) return {error:null}; return await supabaseClient.from('madeni').delete().eq('id',id); }
  },

  invoice: {
    async getAll()       { if (DEV_ACTIVE) return []; const u=await Auth.getUser(); const {data}=await supabaseClient.from('invoice').select('*').eq('user_id',u.id).order('created_at',{ascending:false}); return data||[]; },
    async add(item)      { if (DEV_ACTIVE) return {data:{id:Date.now(),...item},error:null}; const u=await Auth.getUser(); return await supabaseClient.from('invoice').insert({...item,user_id:u.id}).select().single(); },
    async update(id,upd) { if (DEV_ACTIVE) return {error:null}; return await supabaseClient.from('invoice').update(upd).eq('id',id); },
    async delete(id)     { if (DEV_ACTIVE) return {error:null}; return await supabaseClient.from('invoice').delete().eq('id',id); },
    async getNextNamba() { if (DEV_ACTIVE) return 'INV-001'; const u=await Auth.getUser(); const {count}=await supabaseClient.from('invoice').select('*',{count:'exact',head:true}).eq('user_id',u.id); return 'INV-'+String((count||0)+1).padStart(3,'0'); }
  },

  wafanyakazi: {
    async getAll()       { if (DEV_ACTIVE) return []; const u=await Auth.getUser(); const {data}=await supabaseClient.from('wafanyakazi').select('*').eq('user_id',u.id).order('jina'); return data||[]; },
    async add(item)      { if (DEV_ACTIVE) return {data:{id:Date.now(),...item},error:null}; const u=await Auth.getUser(); return await supabaseClient.from('wafanyakazi').insert({...item,user_id:u.id}).select().single(); },
    async delete(id)     { if (DEV_ACTIVE) return {error:null}; return await supabaseClient.from('wafanyakazi').delete().eq('id',id); }
  },

  mishahara: {
    async getByMonth(m,y){ if (DEV_ACTIVE) return []; const u=await Auth.getUser(); const {data}=await supabaseClient.from('mishahara').select('*').eq('user_id',u.id).eq('mwezi',m).eq('mwaka',y); return data||[]; },
    async lipa(wid,m,y)  { if (DEV_ACTIVE) return {error:null}; const u=await Auth.getUser(); const {data:ex}=await supabaseClient.from('mishahara').select('id').eq('user_id',u.id).eq('mfanyakazi_id',wid).eq('mwezi',m).eq('mwaka',y).single(); if(ex)return await supabaseClient.from('mishahara').update({imelipwa:true}).eq('id',ex.id); return await supabaseClient.from('mishahara').insert({user_id:u.id,mfanyakazi_id:wid,mwezi:m,mwaka:y,imelipwa:true}); }
  },

  attendance: {
    async getByDate(t)      { if (DEV_ACTIVE) return []; const u=await Auth.getUser(); const {data}=await supabaseClient.from('attendance').select('*').eq('user_id',u.id).eq('tarehe',t); return data||[]; },
    async set(wid,t,hali,muda){ if (DEV_ACTIVE) return {error:null}; const u=await Auth.getUser(); const {data:ex}=await supabaseClient.from('attendance').select('id').eq('user_id',u.id).eq('mfanyakazi_id',wid).eq('tarehe',t).single(); if(ex)return await supabaseClient.from('attendance').update({hali,muda}).eq('id',ex.id); return await supabaseClient.from('attendance').insert({user_id:u.id,mfanyakazi_id:wid,tarehe:t,hali,muda}); }
  },

  personal: {
    async getAll()       { if (DEV_ACTIVE) return []; const u=await Auth.getUser(); const {data}=await supabaseClient.from('personal_finance').select('*').eq('user_id',u.id).order('created_at',{ascending:false}); return data||[]; },
    async add(item)      { if (DEV_ACTIVE) return {data:{id:Date.now(),...item},error:null}; const u=await Auth.getUser(); return await supabaseClient.from('personal_finance').insert({...item,user_id:u.id}).select().single(); },
    async delete(id)     { if (DEV_ACTIVE) return {error:null}; return await supabaseClient.from('personal_finance').delete().eq('id',id); },
    async getByMonth(m,y){ if (DEV_ACTIVE) return []; const u=await Auth.getUser(); const f=`${y}-${String(m+1).padStart(2,'0')}-01`,to=`${y}-${String(m+1).padStart(2,'0')}-31`; const {data}=await supabaseClient.from('personal_finance').select('*').eq('user_id',u.id).gte('tarehe',f).lte('tarehe',to); return data||[]; }
  },

  projects: {
    async getAll()       { if (DEV_ACTIVE) return []; const u=await Auth.getUser(); const {data}=await supabaseClient.from('projects').select('*').eq('user_id',u.id).order('created_at',{ascending:false}); return data||[]; },
    async get(id)        { if (DEV_ACTIVE) return null; const {data}=await supabaseClient.from('projects').select('*').eq('id',id).single(); return data; },
    async add(item)      { if (DEV_ACTIVE) return {data:{id:Date.now(),...item},error:null}; const u=await Auth.getUser(); return await supabaseClient.from('projects').insert({...item,user_id:u.id}).select().single(); },
    async update(id,upd) { if (DEV_ACTIVE) return {error:null}; return await supabaseClient.from('projects').update(upd).eq('id',id); },
    async delete(id)     { if (DEV_ACTIVE) return {error:null}; return await supabaseClient.from('projects').delete().eq('id',id); }
  },

  tasks: {
    async getByProject(pid){ if (DEV_ACTIVE) return []; const {data}=await supabaseClient.from('project_tasks').select('*').eq('project_id',pid).order('created_at'); return data||[]; },
    async add(item)        { if (DEV_ACTIVE) return {data:{id:Date.now(),...item},error:null}; const u=await Auth.getUser(); return await supabaseClient.from('project_tasks').insert({...item,user_id:u.id}).select().single(); },
    async update(id,upd)   { if (DEV_ACTIVE) return {error:null}; return await supabaseClient.from('project_tasks').update(upd).eq('id',id); },
    async delete(id)       { if (DEV_ACTIVE) return {error:null}; return await supabaseClient.from('project_tasks').delete().eq('id',id); }
  },

  conversations: {
    async getAll()       { if (DEV_ACTIVE) return []; const u=await Auth.getUser(); const {data}=await supabaseClient.from('ai_conversations').select('*').eq('user_id',u.id).order('created_at',{ascending:false}).limit(50); return data||[]; },
    async save(msgs,ttl) { if (DEV_ACTIVE) return {data:{id:Date.now()},error:null}; const u=await Auth.getUser(); return await supabaseClient.from('ai_conversations').insert({user_id:u.id,messages:JSON.stringify(msgs),title:ttl||'Mazungumzo'}).select().single(); },
    async delete(id)     { if (DEV_ACTIVE) return {error:null}; return await supabaseClient.from('ai_conversations').delete().eq('id',id); }
  },

  usage: {
    async get()          { if (DEV_ACTIVE) return {credits_used:0,credits_limit:2000,reset_at:null}; const u=await Auth.getUser(); const {data}=await supabaseClient.from('ai_usage').select('*').eq('user_id',u.id).single(); return data; },
    async increment(c)   { if (DEV_ACTIVE) return {error:null}; const u=await Auth.getUser(); const ex=await this.get(); const next=new Date(Date.now()+3*60*60*1000); if(ex){return await supabaseClient.from('ai_usage').update({credits_used:(ex.credits_used||0)+c,updated_at:new Date().toISOString()}).eq('user_id',u.id);} return await supabaseClient.from('ai_usage').insert({user_id:u.id,credits_used:c,credits_limit:100,reset_at:next.toISOString()}); }
  },

  subscription: {
    async get() { if (DEV_ACTIVE) return {plan:'professional',status:'trial'}; const u=await Auth.getUser(); const {data}=await supabaseClient.from('subscriptions').select('*').eq('user_id',u.id).single(); return data; }
  }
};

// ── HELPERS ────────────────────────────────────────────────
function formatTZS(n) { return 'TZS '+Number(n||0).toLocaleString('sw-TZ'); }
function formatDate(d){ return new Date(d).toLocaleDateString('sw-TZ',{day:'2-digit',month:'short',year:'numeric'}); }
function today()      { return new Date().toISOString().split('T')[0]; }
function showToast(msg,type='success'){const t=document.getElementById('toast');if(!t)return;t.innerHTML=`<i class="ti ti-${type==='success'?'check':'alert-circle'}"></i> ${msg}`;t.className=`toast show ${type==='error'?'error':''}`;setTimeout(()=>t.classList.remove('show'),3500);}
function openModal(id) {document.getElementById(id)?.classList.add('open');}
function closeModal(id){document.getElementById(id)?.classList.remove('open');}
function initTabs(){document.querySelectorAll('.tab-btn').forEach(btn=>{btn.addEventListener('click',()=>{const g=btn.closest('.tab-group')||document;g.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));g.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));btn.classList.add('active');document.getElementById(btn.dataset.tab)?.classList.add('active');});});}
function searchTable(iId,tId){const inp=document.getElementById(iId);const tbl=document.getElementById(tId);if(!inp||!tbl)return;inp.addEventListener('input',()=>{const q=inp.value.toLowerCase();tbl.querySelectorAll('tbody tr').forEach(r=>{r.style.display=r.textContent.toLowerCase().includes(q)?'':'none';});});}

// ── SIDEBAR ────────────────────────────────────────────────
async function loadSidebar(activePage) {
  const el = document.getElementById('sidebar');
  if (!el) return;

  const profile = Auth.getCachedUser() || await DB.profile.get();
  if (profile) Auth.cacheUser(profile);
  if (!profile) return;

  const plan   = profile.plan || 'free';
  const init   = (profile.biashara || profile.jina || 'Q3').substring(0,2).toUpperCase();
  const planColors = { free:'#9ca3af', starter:'#FFD700', professional:'#00d4ff', enterprise:'#a78bfa' };
  const planLabels = { free:'Free', starter:'Starter', professional:'Professional', enterprise:'Enterprise' };
  const userPlan   = profile?.plan || 'free';

  const nav = [
    { id:'ai',          icon:'ti-brand-openai',     label:'Q360 AI',       href:'ai.html',           badge:'AI' },
    { id:'dashboard',   icon:'ti-layout-dashboard', label:'Dashboard',     href:'dashboard.html' },
    null,
    { label:'KIBINAFSI' },
    { id:'personal',    icon:'ti-wallet',            label:'Fedha Zangu',  href:'personal.html' },
    { id:'projects',    icon:'ti-layout-kanban',     label:'Miradi',       href:'projects.html' },
    null,
    { label:'BIASHARA' },
    { id:'mauzo',       icon:'ti-shopping-cart',     label:'Mauzo',        href:'mauzo.html' },
    { id:'stock',       icon:'ti-package',            label:'Stock',        href:'stock.html' },
    { id:'madeni',      icon:'ti-credit-card',        label:'Madeni',       href:'madeni.html' },
    { id:'invoice',     icon:'ti-file-invoice',       label:'Invoice',      href:'invoice.html' },
    { id:'wafanyakazi', icon:'ti-users',              label:'Wafanyakazi',  href:'wafanyakazi.html' },
    null,
    { label:'ZAIDI' },
    { id:'reports',     icon:'ti-chart-bar',          label:'Ripoti',       href:'reports.html' },
    { id:'subscription',icon:'ti-crown',              label:'Mpango Wangu', href:'subscription.html' },
    { id:'mipangilio',  icon:'ti-settings',           label:'Mipangilio',   href:'mipangilio.html' },
  ];

  const navHTML = nav.map(item => {
    if (!item) return '';
    if (!item.id) return `<div class="nav-label">${item.label}</div>`;
    return `<a href="${item.href}" class="nav-item ${activePage===item.id?'active':''}">
      <i class="ti ${item.icon}"></i> ${item.label}
      ${item.badge?`<span class="nav-badge">${item.badge}</span>`:''}
    </a>`;
  }).join('');

  el.innerHTML = `
    <div class="sidebar-logo">
      <div class="sidebar-logo-icon">Q3</div>
      <div>
        <div class="sidebar-logo-brand">Q360<span> AI</span></div>
        <div class="sidebar-logo-tag">Smart life, smarter business</div>
      </div>
    </div>
    <div class="sidebar-user">
      <div class="sidebar-avatar">${init}</div>
      <div>
        <div class="sidebar-user-name">${profile.biashara||profile.jina||'Q360 User'}</div>
        <span class="sidebar-user-plan" style="color:${planColors[plan]}">${planLabels[plan]}</span>
      </div>
    </div>
    <nav class="sidebar-nav">${navHTML}</nav>
    <div style="margin:8px 10px 0;padding:10px 12px;background:rgba(255,255,255,0.04);border-radius:10px;border:1px solid rgba(255,255,255,0.07)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
        <span style="font-size:10px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:0.8px">Mpango</span>
        <span style="font-size:10px;font-weight:700;color:${planColors[userPlan]}">${planLabels[userPlan]}</span>
      </div>
      <a href="subscription.html" style="display:flex;align-items:center;justify-content:center;gap:5px;background:rgba(0,212,255,0.08);border:1px solid rgba(0,212,255,0.2);border-radius:7px;padding:7px;font-size:11px;font-weight:700;color:#00d4ff;text-decoration:none">
        <i class="ti ti-crown" style="font-size:12px"></i> Boresha Mpango
      </a>
    </div>
    <div class="sidebar-footer">
      <button class="logout-btn" onclick="Auth.logout()"><i class="ti ti-logout"></i> Ondoka</button>
    </div>`;
}

// ── AI CONTEXT (dev returns minimal context) ───────────────
async function buildAIContext() {
  const profile = Auth.getCachedUser() || DEV_MOCK_PROFILE;
  const todayDate = today();

  if (DEV_ACTIVE) {
    return {
      mtumiaji: { jina: profile.jina, biashara: profile.biashara, plan: profile.plan, lugha: profile.lugha },
      leo: { tarehe: todayDate, mapato_leo: 0, matumizi_leo: 0, faida_leo: 0, miamala_leo: 0 },
      biashara: { bidhaa_jumla: 0, stock_inayokwisha: 0, madeni_unaodai: 0, wadeni_wote: 0 },
      personal: { mapato_mwezi: 0, matumizi_mwezi: 0, akiba_mwezi: 0 },
      miradi:   { jumla: 0, inayoendelea: 0, wastani_maendeleo: 0 }
    };
  }

  try {
    const [mauzoLeo, allStock, allMadeni] = await Promise.all([
      DB.mauzo.getByDate(todayDate),
      DB.stock.getAll(),
      DB.madeni.getAll()
    ]);
    const mapato   = mauzoLeo.filter(m=>m.aina==='mapato').reduce((a,m)=>a+Number(m.jumla),0);
    const matumizi = mauzoLeo.filter(m=>m.aina==='matumizi').reduce((a,m)=>a+Number(m.jumla),0);
    return {
      mtumiaji: { jina:profile?.jina, biashara:profile?.biashara, plan:profile?.plan, lugha:profile?.lugha },
      leo:      { tarehe:todayDate, mapato_leo:mapato, matumizi_leo:matumizi, faida_leo:mapato-matumizi, miamala_leo:mauzoLeo.length },
      biashara: { bidhaa_jumla:allStock.length, stock_inayokwisha:allStock.filter(s=>Number(s.idadi)<=Number(s.kiwango_chini)).length, madeni_unaodai:allMadeni.filter(m=>m.aina==='unaodai').reduce((a,m)=>a+Number(m.kiasi),0), wadeni_wote:allMadeni.filter(m=>m.aina==='unaodai').length }
    };
  } catch { return { mtumiaji:{ jina:profile?.jina, lugha:profile?.lugha||'sw' }, leo:{ tarehe:todayDate } }; }
}
