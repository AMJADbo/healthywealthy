// ===== AUTH MODAL =====

function openAuthModal() {
  document.getElementById('auth-modal').style.display = 'flex';
  setTimeout(() => document.getElementById('auth-email').focus(), 50);
}

function closeAuthModal() {
  document.getElementById('auth-modal').style.display = 'none';
  document.getElementById('auth-error').style.display = 'none';
  document.getElementById('auth-email').value = '';
  document.getElementById('auth-password').value = '';
}

function switchTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.auth-tab[data-tab="${tab}"]`).classList.add('active');
  document.getElementById('auth-submit-btn').textContent =
    tab === 'signin' ? 'SE CONNECTER' : "S'INSCRIRE";
  document.getElementById('auth-modal').dataset.tab = tab;
  document.getElementById('auth-error').style.display = 'none';
}

async function handleAuth() {
  const email    = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  const tab      = document.getElementById('auth-modal').dataset.tab || 'signin';
  const btn      = document.getElementById('auth-submit-btn');

  if (!email || !password) { showAuthError('Veuillez remplir tous les champs.'); return; }

  btn.disabled = true;
  btn.textContent = '…';

  let error;
  if (tab === 'signup') {
    ({ error } = await db.auth.signUp({ email, password }));
  } else {
    ({ error } = await db.auth.signInWithPassword({ email, password }));
  }

  btn.disabled = false;
  btn.textContent = tab === 'signin' ? 'SE CONNECTER' : "S'INSCRIRE";

  if (error) { showAuthError(translateAuthError(error.message)); return; }

  if (tab === 'signup') {
    showAuthError('✓ Compte créé ! Vous êtes maintenant connecté.', true);
    setTimeout(closeAuthModal, 1800);
  } else {
    closeAuthModal();
  }
}

function showAuthError(msg, success = false) {
  const el = document.getElementById('auth-error');
  el.textContent = msg;
  el.style.display = 'block';
  el.style.background    = success ? 'rgba(66,239,140,0.1)' : '#fff5f5';
  el.style.borderColor   = success ? '#42ef8c' : '#fed7d7';
  el.style.color         = success ? '#42ef8c' : '#e53e3e';
}

function translateAuthError(msg) {
  if (msg.includes('Invalid login'))      return 'Email ou mot de passe incorrect.';
  if (msg.includes('already registered')) return 'Cet email est déjà utilisé.';
  if (msg.includes('Password should'))    return 'Le mot de passe doit contenir au moins 6 caractères.';
  if (msg.includes('valid email'))        return 'Adresse email invalide.';
  return msg;
}

async function handleSignOut() {
  await db.auth.signOut();
}

// ===== AUTH STATE =====

function updateAuthUI(user) {
  const loginBtn  = document.getElementById('nav-login-btn');
  const userArea  = document.getElementById('nav-user-area');
  const userEmail = document.getElementById('nav-user-email');
  const banner    = document.getElementById('journal-login-banner');

  if (user) {
    loginBtn.style.display = 'none';
    userArea.style.display = 'flex';
    userEmail.textContent  = user.email;
    if (banner) banner.style.display = 'none';
  } else {
    loginBtn.style.display = 'inline-flex';
    userArea.style.display = 'none';
    if (banner) banner.style.display = 'flex';
  }
}

async function initAuth() {
  const { data: { session } } = await db.auth.getSession();
  currentUser = session?.user || null;
  updateAuthUI(currentUser);

  db.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user || null;
    updateAuthUI(currentUser);
    renderJournal();
  });

  renderJournal();
}

// ===== SUPABASE JOURNAL CRUD =====

async function supaAddEntry(mealKey, entry) {
  const { error } = await db.from('food_journal').insert({
    user_id:   currentUser.id,
    date:      todayDate(),
    meal:      mealKey,
    food_name: entry.name,
    qty:       entry.qty,
    kcal:      entry.kcal,
    protein:   entry.protein,
    fat:       entry.fat,
    carbs:     entry.carbs,
  });
  if (error) console.error('supaAddEntry:', error);
}

async function supaLoadDay(date) {
  const { data, error } = await db
    .from('food_journal')
    .select('*')
    .eq('user_id', currentUser.id)
    .eq('date', date)
    .order('created_at', { ascending: true });

  if (error) { console.error('supaLoadDay:', error); return emptyJournal(); }

  const journal = emptyJournal();
  (data || []).forEach(row => {
    if (journal[row.meal]) {
      journal[row.meal].push({
        id:      row.id,
        name:    row.food_name,
        qty:     row.qty,
        kcal:    row.kcal,
        protein: row.protein || 0,
        fat:     row.fat     || 0,
        carbs:   row.carbs   || 0,
      });
    }
  });
  return journal;
}

async function supaRemoveEntry(id) {
  const { error } = await db.from('food_journal').delete().eq('id', id);
  if (error) console.error('supaRemoveEntry:', error);
}

async function supaClearDay(date) {
  const { error } = await db
    .from('food_journal')
    .delete()
    .eq('user_id', currentUser.id)
    .eq('date', date);
  if (error) console.error('supaClearDay:', error);
}

// ===== HISTORY =====

async function openHistory() {
  const modal = document.getElementById('history-modal');
  modal.style.display = 'flex';
  document.getElementById('history-detail').style.display = 'none';

  if (!currentUser) {
    document.getElementById('history-list').innerHTML =
      '<p class="history-empty">Connectez-vous pour accéder à votre historique.</p>';
    return;
  }

  document.getElementById('history-list').innerHTML =
    '<p class="history-empty" style="color:#666;">Chargement…</p>';

  const { data, error } = await db
    .from('food_journal')
    .select('date')
    .eq('user_id', currentUser.id)
    .order('date', { ascending: false });

  if (error || !data) return;

  const dates = [...new Set(data.map(r => r.date))].filter(d => d !== todayDate());
  const list  = document.getElementById('history-list');

  if (!dates.length) {
    list.innerHTML = '<p class="history-empty">Aucun historique disponible pour l\'instant.</p>';
    return;
  }

  list.innerHTML = dates.map(d => `
    <div class="history-day-row" onclick="loadHistoryDay('${d}')">
      <span class="history-day-date">${formatDate(d)}</span>
      <span class="history-day-arrow">→</span>
    </div>`).join('');
}

function closeHistory() {
  document.getElementById('history-modal').style.display = 'none';
  document.getElementById('history-detail').style.display = 'none';
  document.getElementById('history-list').innerHTML = '';
}

async function loadHistoryDay(date) {
  const journal = await supaLoadDay(date);
  const allEntries = Object.values(journal).flat();
  const detail     = document.getElementById('history-detail');
  const titleEl    = document.getElementById('history-detail-date');

  titleEl.textContent = formatDate(date);

  if (!allEntries.length) {
    detail.innerHTML = `<h3 class="history-detail-date">${formatDate(date)}</h3><p class="history-empty">Aucune entrée ce jour.</p>`;
    detail.style.display = 'block';
    return;
  }

  const totKcal = allEntries.reduce((s, e) => s + e.kcal, 0);

  const mealsHtml = Object.entries(MEAL_LABELS).map(([key, label]) => {
    const entries = journal[key];
    if (!entries.length) return '';
    return `<div class="history-meal">
      <div class="history-meal-title">${label}</div>
      ${entries.map(e => `
        <div class="history-meal-row">
          <span>${e.name} <em>${e.qty} g</em></span>
          <span>${e.kcal} kcal</span>
        </div>`).join('')}
    </div>`;
  }).join('');

  detail.innerHTML = `
    <h3 class="history-detail-date">${formatDate(date)}</h3>
    ${mealsHtml}
    <div class="history-total-row">TOTAL : ${totKcal} kcal</div>`;
  detail.style.display = 'block';
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

// Close modals on overlay click
document.addEventListener('click', e => {
  if (e.target.id === 'auth-modal')    closeAuthModal();
  if (e.target.id === 'history-modal') closeHistory();
});

// Enter key on auth inputs
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.getElementById('auth-modal').style.display === 'flex') {
    handleAuth();
  }
});
