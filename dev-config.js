// ═══════════════════════════════════════════════
// Q360 AI — DEV MODE (MVP Testing)
// Remove this file in production.
// ═══════════════════════════════════════════════
const DEV_MODE = true;
const DEV_KEY  = 'q360_dev_active';

const DEV_PROFILE = {
  id:          'dev-00000001',
  jina:        'Jumanne Maregeri',
  biashara:    'Q360 AI Demo',
  mkoa:        'Dar es Salaam',
  nchi:        'TZ',
  lugha:       'sw',
  personality: 'friendly',
  purpose:     'both',
  plan:        'professional',
  trial_start: new Date().toISOString(),
  trial_days:  30
};

// Called on every login/signup button click
function devQuickLogin() {
  localStorage.setItem(DEV_KEY, 'true');
  localStorage.setItem('q360_profile', JSON.stringify(DEV_PROFILE));
  window.location.replace('ai.html');
}

// Called on logout to clear dev flag
function devClearSession() {
  localStorage.removeItem(DEV_KEY);
  localStorage.removeItem('q360_profile');
}
