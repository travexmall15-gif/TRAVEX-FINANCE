// ═══════════════════════════════════════════════════════════
// Q360 AI — DEVELOPMENT AUTHENTICATION MODE
// ═══════════════════════════════════════════════════════════
//
// PURPOSE: MVP testing only. Bypass real OAuth for fast UI/UX testing.
//
// TO DISABLE IN PRODUCTION:
//   1. Set DEV_MODE = false  OR
//   2. Delete this file entirely
//   3. Remove <script src="dev-config.js"> from login.html + signup.html
//
// This file has ZERO effect when DEV_MODE = false.
// ═══════════════════════════════════════════════════════════

const DEV_MODE = true; // ← FLIP TO false FOR PRODUCTION

// ── DEV ACCOUNT ──────────────────────────────────────────
// Fixed Supabase account used for all dev sessions.
// This account is created automatically on first use.
const DEV_CREDENTIALS = {
  email:    'dev@q360ai.local',
  password: 'q360Dev2026!!'
};

// ── DEV PROFILE ──────────────────────────────────────────
// Profile injected automatically — skips all onboarding.
const DEV_PROFILE = {
  jina:        'Jumanne Maregeri',
  biashara:    'Q360 AI Demo Store',
  mkoa:        'Dar es Salaam',
  nchi:        'TZ',
  lugha:       'sw',
  personality: 'friendly',
  purpose:     'both',
  plan:        'professional',  // full access in dev mode
  trial_start: new Date().toISOString(),
  trial_days:  30
};

// ── DEV QUICK LOGIN ───────────────────────────────────────
// Called when user clicks "Continue with Google" in DEV_MODE.
// Tries to login first, if not exists — creates the dev account.
async function devQuickLogin() {
  if (!DEV_MODE) return false;

  console.log('%c[DEV MODE] Bypassing OAuth — using dev account', 'color:#00d4ff;font-weight:bold');

  showDevBanner('Inaingia kwa Dev Mode...');

  // Step 1: Try login with dev credentials
  const { data: loginData, error: loginErr } = await supabaseClient.auth.signInWithPassword({
    email:    DEV_CREDENTIALS.email,
    password: DEV_CREDENTIALS.password
  });

  if (!loginErr && loginData?.session) {
    // Already exists — ensure profile is set
    await ensureDevProfile(loginData.session.user.id);
    console.log('%c[DEV MODE] ✅ Dev session restored', 'color:#00d4ff');
    window.location.replace('ai.html');
    return true;
  }

  // Step 2: Account doesn't exist — create it
  const { data: signupData, error: signupErr } = await supabaseClient.auth.signUp({
    email:    DEV_CREDENTIALS.email,
    password: DEV_CREDENTIALS.password,
    options:  { data: DEV_PROFILE }
  });

  if (signupErr) {
    console.error('[DEV MODE] Failed to create dev account:', signupErr.message);
    hideDevBanner();
    showDevError('Dev login imeshindwa: ' + signupErr.message);
    return false;
  }

  // Step 3: Try to login after signup (handles email confirmation disabled)
  const { data: retryLogin, error: retryErr } = await supabaseClient.auth.signInWithPassword({
    email:    DEV_CREDENTIALS.email,
    password: DEV_CREDENTIALS.password
  });

  if (!retryErr && retryLogin?.session) {
    await ensureDevProfile(retryLogin.session.user.id);
    console.log('%c[DEV MODE] ✅ Dev account created and logged in', 'color:#00d4ff');
    window.location.replace('ai.html');
    return true;
  }

  // Step 4: Session from signup (email confirmation disabled in Supabase)
  if (signupData?.session) {
    await ensureDevProfile(signupData.session.user.id);
    window.location.replace('ai.html');
    return true;
  }

  // Couldn't get session — email confirmation might be ON
  hideDevBanner();
  showDevError('Zima "Email confirmation" kwenye Supabase → Authentication → Email Auth');
  return false;
}

// ── ENSURE DEV PROFILE ─────────────────────────────────────
async function ensureDevProfile(userId) {
  try {
    const { data } = await supabaseClient.from('profiles').select('id').eq('id', userId).single();
    if (!data) {
      await supabaseClient.from('profiles').insert({ id: userId, ...DEV_PROFILE });
    }
    // Cache it
    localStorage.setItem('q360_profile', JSON.stringify({ id: userId, ...DEV_PROFILE }));
  } catch(e) {
    console.warn('[DEV MODE] Profile upsert skipped:', e.message);
  }
}

// ── UI HELPERS ─────────────────────────────────────────────
function showDevBanner(msg) {
  const el = document.getElementById('devBanner');
  if (el) { el.textContent = msg; el.style.display = 'flex'; }
}
function hideDevBanner() {
  const el = document.getElementById('devBanner');
  if (el) el.style.display = 'none';
}
function showDevError(msg) {
  const el = document.getElementById('devError');
  if (el) { el.textContent = '⚠️ ' + msg; el.style.display = 'block'; }
}
