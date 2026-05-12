/* ── Eye toggle ── */
const pwInput = document.getElementById('pw-input');
const pwToggle = document.getElementById('pw-toggle');
const eyeIcon  = document.getElementById('eye-icon');
let visible = false;

const EYE = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
const EYEOFF = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`;

pwToggle.addEventListener('click', () => {
  visible = !visible;
  pwInput.type = visible ? 'text' : 'password';
  eyeIcon.innerHTML = visible ? EYEOFF : EYE;
});

/* ── Analyzer ── */
function entropy(pw) {
  let cs = 0;
  if (/[a-z]/.test(pw)) cs += 26;
  if (/[A-Z]/.test(pw)) cs += 26;
  if (/[0-9]/.test(pw)) cs += 10;
  if (/[^a-zA-Z0-9]/.test(pw)) cs += 32;
  return cs ? Math.round(pw.length * Math.log2(cs)) : 0;
}

function crackTime(ent) {
  const gps = 1e10;
  const s   = Math.pow(2, ent) / gps;
  if (s < 1)         return 'Instantly';
  if (s < 60)        return Math.round(s) + ' seconds';
  if (s < 3600)      return Math.round(s / 60) + ' minutes';
  if (s < 86400)     return Math.round(s / 3600) + ' hours';
  if (s < 31536000)  return Math.round(s / 86400) + ' days';
  if (s < 3.154e9)   return Math.round(s / 31536000) + ' years';
  if (s < 3.154e12)  return Math.round(s / 3.154e9) + ' thousand years';
  if (s < 3.154e15)  return Math.round(s / 3.154e12) + ' million years';
  return 'Billions of years';
}

function score(pw) {
  let s = 0;
  if (pw.length >= 8)  s++;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^a-zA-Z0-9]/.test(pw)) s++;
  if (pw.length > 0 && new Set(pw).size / pw.length > 0.7) s++;
  return Math.min(4, Math.max(0, s <= 1 ? 0 : s <= 2 ? 1 : s <= 3 ? 2 : s <= 4 ? 3 : 4));
}

const LEVELS = [
  { label: 'Very weak',   color: '#ff5757', w: '12%' },
  { label: 'Weak',        color: '#ffb347', w: '30%' },
  { label: 'Fair',        color: '#ffd447', w: '52%' },
  { label: 'Strong',      color: '#57ffc9', w: '76%' },
  { label: 'Very strong', color: '#c9ff57', w: '100%' },
];

function analyze() {
  const pw = pwInput.value;
  const checks = {
    len:    pw.length >= 12,
    upper:  /[A-Z]/.test(pw),
    lower:  /[a-z]/.test(pw),
    num:    /[0-9]/.test(pw),
    sym:    /[^a-zA-Z0-9]/.test(pw),
    unique: pw.length > 0 && new Set(pw).size / pw.length > 0.7,
  };

  ['len','upper','lower','num','sym','unique'].forEach(k => {
    document.getElementById('chk-' + k).classList.toggle('pass', checks[k]);
  });

  let cs = 0;
  if (checks.lower) cs += 26;
  if (checks.upper) cs += 26;
  if (checks.num)   cs += 10;
  if (checks.sym)   cs += 32;

  document.getElementById('s-len').textContent  = pw.length;
  document.getElementById('s-cs').textContent   = cs;
  document.getElementById('s-uniq').textContent = new Set(pw).size;

  const ent = entropy(pw);
  document.getElementById('entropy-pill').textContent = ent + ' bits';

  const ct = pw.length ? crackTime(ent) : '—';
  document.getElementById('crack-val').textContent = ct;

  const crIcon = !pw ? '⏱' :
    ['Instantly','seconds','minutes'].some(x => ct.includes(x)) ? '⚡' :
    ['hours','days'].some(x => ct.includes(x)) ? '🔓' : '🛡';
  document.getElementById('crack-icon').textContent = crIcon;

  const fill  = document.getElementById('bar-fill');
  const label = document.getElementById('bar-label');

  if (!pw) {
    fill.style.width = '0%';
    fill.style.background = 'var(--muted)';
    label.textContent = 'Waiting…';
    label.style.color = 'var(--muted)';
  } else {
    const lvl = LEVELS[score(pw)];
    fill.style.width      = lvl.w;
    fill.style.background = lvl.color;
    label.textContent     = lvl.label;
    label.style.color     = lvl.color;
  }

  const tips = [
    [!checks.len,    '<strong>Tip:</strong> Use at least 12 characters — length is the single biggest factor in password strength.'],
    [!checks.sym,    '<strong>Tip:</strong> Add symbols like <code>!@#$%</code> to dramatically expand the search space.'],
    [!checks.upper || !checks.lower, '<strong>Tip:</strong> Mix uppercase and lowercase letters for greater variety.'],
    [!checks.num,    '<strong>Tip:</strong> Include at least one number to increase charset size.'],
    [!checks.unique, '<strong>Tip:</strong> Avoid repeating characters — high uniqueness greatly boosts entropy.'],
  ];

  const box = document.getElementById('tip-box');
  if (!pw) {
    box.innerHTML = '<strong>Tip:</strong> Start typing above to analyze your password in real time.';
  } else {
    const t = tips.find(([fail]) => fail);
    box.innerHTML = t ? t[1] : '<strong>Excellent!</strong> This password is very strong. Store it in a password manager!';
  }
}

pwInput.addEventListener('input', analyze);

/* ── Generator ── */
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const NUMS  = '0123456789';
const SYMS  = '!@#$%^&*()-_=+[]{}|;:,.<>?';

const genLen = document.getElementById('gen-len');
const lenOut = document.getElementById('len-out');
genLen.addEventListener('input', () => { lenOut.textContent = genLen.value; updateGenEntropy(); });

function charsetFromOptions() {
  let cs = '';
  if (document.getElementById('g-upper').checked) cs += UPPER;
  if (document.getElementById('g-lower').checked) cs += LOWER;
  if (document.getElementById('g-num').checked)   cs += NUMS;
  if (document.getElementById('g-sym').checked)   cs += SYMS;
  return cs;
}

function updateGenEntropy() {
  const cs  = charsetFromOptions();
  const len = parseInt(genLen.value);
  const ent = cs ? Math.round(len * Math.log2(cs.length)) : 0;
  document.getElementById('gen-entropy-out').textContent = ent + ' bits';
  const pct = Math.min(100, Math.round((ent / 128) * 100));
  const bar = document.getElementById('gen-ent-bar');
  bar.style.width = pct + '%';
  bar.style.background = pct < 30 ? '#ff5757' : pct < 60 ? '#ffb347' : '#c9ff57';
}

['g-upper','g-lower','g-num','g-sym'].forEach(id => {
  document.getElementById(id).addEventListener('change', updateGenEntropy);
});

document.getElementById('gen-btn').addEventListener('click', () => {
  const cs  = charsetFromOptions();
  if (!cs) { document.getElementById('gen-pw').textContent = 'Select at least one character type'; return; }
  const len = parseInt(genLen.value);
  let pw = '';
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  for (let i = 0; i < len; i++) pw += cs[arr[i] % cs.length];
  document.getElementById('gen-pw').textContent = pw;
  updateGenEntropy();
});

document.getElementById('gen-copy').addEventListener('click', () => {
  const pw = document.getElementById('gen-pw').textContent;
  if (!pw || pw.includes('Select') || pw.includes('Click')) return;
  navigator.clipboard.writeText(pw).then(() => {
    const btn = document.getElementById('gen-copy');
    btn.textContent = 'Copied!';
    setTimeout(() => btn.textContent = 'Copy', 1800);
  });
});

updateGenEntropy();