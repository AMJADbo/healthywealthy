function calculate() {
  const age = parseInt(document.getElementById('age').value);
  const weight = parseFloat(document.getElementById('weight').value);
  const height = parseFloat(document.getElementById('height').value);
  const gender = document.querySelector('input[name="gender"]:checked').value;
  const activity = parseFloat(document.getElementById('activity').value);
  const goal = document.getElementById('goal').value;
  const errorEl = document.getElementById('form-error');

  if (!age || !weight || !height || !activity || !goal) {
    errorEl.style.display = 'block';
    return;
  }
  errorEl.style.display = 'none';

  // Mifflin-St Jeor BMR
  let bmr;
  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  let tdee = bmr * activity;

  // Goal adjustments & macro ratios [protein%, fat%, carbs%]
  let kcal, ratios;
  switch (goal) {
    case 'gain':
      kcal = Math.round(tdee + 350);
      ratios = [0.25, 0.25, 0.50];
      break;
    case 'loss':
      kcal = Math.round(tdee - 500);
      ratios = [0.35, 0.30, 0.35];
      break;
    case 'tone':
      kcal = Math.round(tdee - 200);
      ratios = [0.35, 0.25, 0.40];
      break;
    case 'endurance':
      kcal = Math.round(tdee + 150);
      ratios = [0.20, 0.25, 0.55];
      break;
    default: // maintain
      kcal = Math.round(tdee);
      ratios = [0.25, 0.25, 0.50];
  }

  if (kcal < 1200) kcal = 1200;

  // Macros in grams (protein=4kcal/g, fat=9kcal/g, carbs=4kcal/g)
  const protein = Math.round((kcal * ratios[0]) / 4);
  const fat     = Math.round((kcal * ratios[1]) / 9);
  const carbs   = Math.round((kcal * ratios[2]) / 4);

  // Actual percentages from grams
  const totalCals = protein * 4 + fat * 9 + carbs * 4;
  const pctProtein = Math.round((protein * 4 / totalCals) * 100);
  const pctFat     = Math.round((fat * 9 / totalCals) * 100);
  const pctCarbs   = 100 - pctProtein - pctFat;

  // Update DOM
  document.getElementById('res-kcal').textContent    = kcal.toLocaleString('fr-FR');
  document.getElementById('res-protein').textContent = protein;
  document.getElementById('res-fat').textContent     = fat;
  document.getElementById('res-carbs').textContent   = carbs;

  document.getElementById('pct-protein').textContent = pctProtein + '%';
  document.getElementById('pct-fat').textContent     = pctFat + '%';
  document.getElementById('pct-carbs').textContent   = pctCarbs + '%';

  document.getElementById('bar-protein').style.width = pctProtein + '%';
  document.getElementById('bar-fat').style.width     = pctFat + '%';
  document.getElementById('bar-carbs').style.width   = pctCarbs + '%';

  // Show results and scroll
  const resultsSection = document.getElementById('results-section');
  resultsSection.style.display = 'block';
  setTimeout(() => {
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 50);
}

function resetForm() {
  document.getElementById('age').value = '';
  document.getElementById('weight').value = '';
  document.getElementById('height').value = '';
  document.getElementById('activity').value = '';
  document.getElementById('goal').value = '';
  document.querySelector('input[name="gender"][value="male"]').checked = true;
  document.getElementById('form-error').style.display = 'none';
  document.getElementById('results-section').style.display = 'none';
}

// ===== FOOD NUTRITION — dual source: local DB + Open Food Facts =====

let suggestTimer = null;
let offProducts = [];  // packaged products from Open Food Facts

// ── Autocomplete (local DB only — instant, no network) ──────────────────────
function onFoodInput() {
  const q = document.getElementById('food-query').value.trim();
  clearTimeout(suggestTimer);
  hideSuggestions();
  if (q.length < 2) return;
  suggestTimer = setTimeout(() => {
    const hits = searchLocalDB(q).slice(0, 6);
    showLocalSuggestions(hits);
  }, 150);
}

function showLocalSuggestions(foods) {
  const box = document.getElementById('food-suggestions');
  if (!foods.length) { hideSuggestions(); return; }
  box.innerHTML = foods.map((f, i) =>
    `<div class="food-suggestion-item" onclick="pickLocalSuggestion(${i})">
       ${f.name}
       <span>${f.kcal} kcal/100g &mdash; ${f.category}</span>
     </div>`
  ).join('');
  box._localHits = foods;
  box.style.display = 'block';
}

function hideSuggestions() {
  document.getElementById('food-suggestions').style.display = 'none';
}

function pickLocalSuggestion(i) {
  const box = document.getElementById('food-suggestions');
  const food = box._localHits[i];
  document.getElementById('food-query').value = food.name;
  hideSuggestions();
  const qtyEl = document.getElementById('food-qty');
  if (!qtyEl.value) qtyEl.focus();
}

document.addEventListener('click', e => {
  if (!e.target.closest('.food-input-wrap')) hideSuggestions();
});

// ── Main search ─────────────────────────────────────────────────────────────
async function searchFood() {
  const query = document.getElementById('food-query').value.trim();
  const qty   = parseFloat(document.getElementById('food-qty').value);
  const errEl = document.getElementById('food-error');

  if (!query) { showFoodError('Veuillez entrer un aliment.'); return; }
  if (!qty || qty <= 0) { showFoodError('Veuillez entrer une quantité valide (en grammes).'); return; }

  errEl.style.display = 'none';
  hideSuggestions();
  document.getElementById('food-results-list').style.display = 'none';
  document.getElementById('food-nutrition-card').style.display = 'none';
  document.getElementById('food-off-section').style.display = 'none';

  // 1. Search local DB first — always instant
  const localHits = searchLocalDB(query);

  if (localHits.length === 1) {
    displayLocalNutrition(localHits[0], qty);
  } else if (localHits.length > 1) {
    showLocalList(localHits, qty);
  } else {
    // No local match → fall back to OFF
    document.getElementById('food-loading').style.display = 'flex';
    await searchOFF(query, qty);
    document.getElementById('food-loading').style.display = 'none';
    return;
  }

  // 2. Also fetch packaged products from OFF in background (non-blocking)
  fetchOFFProducts(query, qty);
}

// ── Local DB display ─────────────────────────────────────────────────────────
function showLocalList(foods, qty) {
  const container = document.getElementById('food-items-container');
  document.getElementById('food-results-label').textContent =
    'Plusieurs ingrédients correspondent — choisissez le plus adapté :';
  container.innerHTML = foods.slice(0, 6).map((f, i) =>
    `<div class="food-item-row" onclick="pickLocalProduct(${i}, ${qty})">
       <div>
         <div class="food-item-name">${f.name}</div>
         <div class="food-item-brand">${f.category}</div>
       </div>
       <div class="food-item-kcal">
         ${Math.round(f.kcal * qty / 100)}
         <span>kcal pour ${qty}g</span>
       </div>
     </div>`
  ).join('');
  container._localHits = foods;
  document.getElementById('food-results-list').style.display = 'block';
}

function pickLocalProduct(i, qty) {
  const foods = document.getElementById('food-items-container')._localHits;
  document.getElementById('food-results-list').style.display = 'none';
  displayLocalNutrition(foods[i], qty);
}

function displayLocalNutrition(food, qty) {
  const mul = qty / 100;
  const kcal    = Math.round(food.kcal    * mul);
  const protein = Math.round(food.protein * mul * 10) / 10;
  const fat     = Math.round(food.fat     * mul * 10) / 10;
  const carbs   = Math.round(food.carbs   * mul * 10) / 10;
  const fiber   = food.fiber > 0 ? (Math.round(food.fiber * mul * 10) / 10) + ' g' : '—';
  const salt    = food.salt  > 0 ? (Math.round(food.salt  * mul * 100) / 100) + ' g' : '—';

  document.getElementById('food-card-name').textContent = food.name;
  document.getElementById('food-card-qty').textContent  = `Pour ${qty} g · ${food.category}`;
  document.getElementById('off-badge-text').textContent = 'Base USDA';

  renderNutritionCard(kcal, protein, fat, carbs, fiber, salt);
}

// ── Open Food Facts (packaged products) ──────────────────────────────────────
const OFF_PROXY = 'https://corsproxy.io/?';
const OFF_BASE  = 'https://world.openfoodfacts.org/cgi/search.pl';

async function fetchOFF(query) {
  const url = `${OFF_BASE}?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10&fields=product_name,brands,nutriments&lc=fr`;
  // Try direct first, then proxy fallback
  try {
    const res  = await fetch(url, { signal: AbortSignal.timeout(6000) });
    const data = await res.json();
    return (data.products || []).filter(p =>
      p.product_name && p.nutriments && p.nutriments['energy-kcal_100g'] != null
    );
  } catch {
    try {
      const res  = await fetch(OFF_PROXY + encodeURIComponent(url), { signal: AbortSignal.timeout(8000) });
      const data = await res.json();
      return (data.products || []).filter(p =>
        p.product_name && p.nutriments && p.nutriments['energy-kcal_100g'] != null
      );
    } catch { return []; }
  }
}

async function fetchOFFProducts(query, qty) {
  const products = await fetchOFF(query);
  if (!products.length) return;
  offProducts = products;
  renderOFFSection(products, qty);
}

async function searchOFF(query, qty) {
  const products = await fetchOFF(query);
  if (!products.length) {
    showFoodError('Aucun résultat trouvé. Essayez : "poulet", "riz", "oeuf", "saumon"…');
    return;
  }
  offProducts = products;
  document.getElementById('food-results-label').textContent =
    'Produits trouvés — choisissez le plus adapté :';
  showOFFList(products, qty);
}

function showOFFList(products, qty) {
  const container = document.getElementById('food-items-container');
  container.innerHTML = buildOFFRows(products, qty, 'selectOFFProduct');
  document.getElementById('food-results-list').style.display = 'block';
}

function renderOFFSection(products, qty) {
  const sec = document.getElementById('food-off-section');
  document.getElementById('food-off-items').innerHTML =
    buildOFFRows(products.slice(0, 5), qty, 'selectOFFFromSection');
  sec.style.display = 'block';
}

function buildOFFRows(products, qty, fnName) {
  return products.slice(0, 8).map((p, i) => {
    const kcal  = Math.round((p.nutriments['energy-kcal_100g'] || 0) * qty / 100);
    const brand = p.brands ? p.brands.split(',')[0] : '';
    return `<div class="food-item-row" onclick="${fnName}(${i}, ${qty})">
      <div>
        <div class="food-item-name">${p.product_name}</div>
        ${brand ? `<div class="food-item-brand">${brand}</div>` : ''}
      </div>
      <div class="food-item-kcal">${kcal} <span>kcal pour ${qty}g</span></div>
    </div>`;
  }).join('');
}

function selectOFFProduct(i, qty) {
  document.getElementById('food-results-list').style.display = 'none';
  displayOFFNutrition(offProducts[i], qty);
}

function selectOFFFromSection(i, qty) {
  document.getElementById('food-off-section').style.display = 'none';
  displayOFFNutrition(offProducts[i], qty);
}

function displayOFFNutrition(product, qty) {
  const n   = product.nutriments;
  const mul = qty / 100;
  const kcal    = Math.round((n['energy-kcal_100g']    || 0) * mul);
  const protein = Math.round((n['proteins_100g']        || 0) * mul * 10) / 10;
  const fat     = Math.round((n['fat_100g']             || 0) * mul * 10) / 10;
  const carbs   = Math.round((n['carbohydrates_100g']   || 0) * mul * 10) / 10;
  const fiber   = n['fiber_100g'] != null ? (Math.round(n['fiber_100g']  * mul * 10) / 10) + ' g' : '—';
  const salt    = n['salt_100g']  != null ? (Math.round(n['salt_100g']   * mul * 100) / 100) + ' g' : '—';

  const brand = product.brands ? ` · ${product.brands.split(',')[0]}` : '';
  document.getElementById('food-card-name').textContent = product.product_name + brand;
  document.getElementById('food-card-qty').textContent  = `Pour ${qty} g`;
  document.getElementById('off-badge-text').textContent = 'Open Food Facts';

  renderNutritionCard(kcal, protein, fat, carbs, fiber, salt);
}

// ── Shared render ────────────────────────────────────────────────────────────
function renderNutritionCard(kcal, protein, fat, carbs, fiber, salt) {
  document.getElementById('fn-kcal').textContent    = kcal + ' kcal';
  document.getElementById('fn-protein').textContent = protein + ' g';
  document.getElementById('fn-fat').textContent     = fat + ' g';
  document.getElementById('fn-carbs').textContent   = carbs + ' g';
  document.getElementById('fn-fiber').textContent   = fiber;
  document.getElementById('fn-salt').textContent    = salt;

  const totalCals = protein * 4 + fat * 9 + carbs * 4;
  if (totalCals > 0) {
    const pP = Math.round((protein * 4 / totalCals) * 100);
    const pF = Math.round((fat     * 9 / totalCals) * 100);
    const pC = 100 - pP - pF;
    document.getElementById('food-bar-protein').style.width = pP + '%';
    document.getElementById('food-bar-fat').style.width     = pF + '%';
    document.getElementById('food-bar-carbs').style.width   = pC + '%';
    document.getElementById('food-pct-protein').textContent = pP + '%';
    document.getElementById('food-pct-fat').textContent     = pF + '%';
    document.getElementById('food-pct-carbs').textContent   = pC + '%';
    document.getElementById('food-bar-wrapper').style.display = 'flex';
  } else {
    document.getElementById('food-bar-wrapper').style.display = 'none';
  }

  const card = document.getElementById('food-nutrition-card');
  card.style.display = 'block';
  setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
}

function showFoodError(msg) {
  const el = document.getElementById('food-error');
  el.textContent = msg;
  el.style.display = 'block';
}

function resetFoodSearch() {
  document.getElementById('food-query').value = '';
  document.getElementById('food-qty').value = '';
  document.getElementById('food-error').style.display = 'none';
  document.getElementById('food-results-list').style.display = 'none';
  document.getElementById('food-nutrition-card').style.display = 'none';
  document.getElementById('food-off-section').style.display = 'none';
  document.getElementById('meal-added-confirm').style.display = 'none';
  offProducts = [];
  currentFoodEntry = null;
  document.getElementById('food-query').focus();
}

// ===== JOURNAL ALIMENTAIRE =====

const MEAL_LABELS = {
  breakfast: '🌅 Petit-déjeuner',
  lunch:     '☀️ Déjeuner',
  dinner:    '🌙 Dîner',
  snack:     '🍎 Collation',
};

let currentFoodEntry = null;
let journalData = { breakfast: [], lunch: [], dinner: [], snack: [] };

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function emptyJournal() {
  return { breakfast: [], lunch: [], dinner: [], snack: [] };
}

function getJournalKey() {
  return 'hw_journal_' + todayDate();
}

function loadLocalJournal() {
  const raw = localStorage.getItem(getJournalKey());
  return raw ? JSON.parse(raw) : emptyJournal();
}

function saveLocalJournal(data) {
  localStorage.setItem(getJournalKey(), JSON.stringify(data));
}

async function addToMeal(mealKey) {
  if (!currentFoodEntry) return;

  if (currentUser) {
    await supaAddEntry(mealKey, currentFoodEntry);
  } else {
    const journal = loadLocalJournal();
    journal[mealKey].push({ ...currentFoodEntry });
    saveLocalJournal(journal);
  }

  await renderJournal();

  const label   = MEAL_LABELS[mealKey];
  const confirm = document.getElementById('meal-added-confirm');
  confirm.textContent   = `✓ Ajouté à ${label} — ${currentFoodEntry.kcal} kcal`;
  confirm.style.display = 'block';
  setTimeout(() => { confirm.style.display = 'none'; }, 3000);

  document.getElementById('journal').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function removeFromMeal(mealKey, index) {
  if (currentUser) {
    const entry = journalData[mealKey][index];
    if (entry?.id) await supaRemoveEntry(entry.id);
  } else {
    const journal = loadLocalJournal();
    journal[mealKey].splice(index, 1);
    saveLocalJournal(journal);
  }
  await renderJournal();
}

async function clearJournal() {
  if (!confirm('Réinitialiser tout le journal du jour ?')) return;
  if (currentUser) {
    await supaClearDay(todayDate());
  } else {
    localStorage.removeItem(getJournalKey());
  }
  await renderJournal();
}

async function renderJournal() {
  if (currentUser) {
    journalData = await supaLoadDay(todayDate());
  } else {
    journalData = loadLocalJournal();
  }
  renderJournalDOM(journalData);
  renderProgressChart();
}

function renderJournalDOM(journal) {
  const mealsEl = document.getElementById('journal-meals');
  const totalEl = document.getElementById('journal-total');
  const emptyEl = document.getElementById('journal-empty');

  document.getElementById('journal-date').textContent =
    new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const allEntries = Object.values(journal).flat();

  if (allEntries.length === 0) {
    mealsEl.innerHTML     = '';
    totalEl.style.display = 'none';
    emptyEl.style.display = 'block';
    return;
  }

  emptyEl.style.display = 'none';

  mealsEl.innerHTML = Object.entries(MEAL_LABELS).map(([key, label]) => {
    const entries = journal[key];
    if (!entries.length) return '';
    const mealKcal = entries.reduce((s, e) => s + e.kcal, 0);

    const rows = entries.map((e, i) => `
      <div class="meal-food-row">
        <div class="meal-food-name">${e.name} <span>${e.qty} g</span></div>
        <div class="meal-food-macros">
          <span>🔥 <strong>${e.kcal}</strong> kcal</span>
          <span>P <strong>${e.protein}g</strong></span>
          <span>L <strong>${e.fat}g</strong></span>
          <span>G <strong>${e.carbs}g</strong></span>
        </div>
        <button class="btn-remove-food" onclick="removeFromMeal('${key}', ${i})" title="Supprimer">✕</button>
      </div>`).join('');

    return `
      <div class="journal-meal-block">
        <div class="meal-block-header">
          <span class="meal-block-title">${label}</span>
          <span class="meal-block-kcal">${mealKcal} <span>kcal</span></span>
        </div>
        <div class="meal-food-list">${rows}</div>
      </div>`;
  }).join('');

  const totKcal    = allEntries.reduce((s, e) => s + e.kcal,    0);
  const totProtein = Math.round(allEntries.reduce((s, e) => s + e.protein, 0) * 10) / 10;
  const totFat     = Math.round(allEntries.reduce((s, e) => s + e.fat,     0) * 10) / 10;
  const totCarbs   = Math.round(allEntries.reduce((s, e) => s + e.carbs,   0) * 10) / 10;

  document.getElementById('total-kcal').textContent    = totKcal;
  document.getElementById('total-protein').textContent = totProtein + ' g';
  document.getElementById('total-fat').textContent     = totFat + ' g';
  document.getElementById('total-carbs').textContent   = totCarbs + ' g';

  const totalMacroCals = totProtein * 4 + totFat * 9 + totCarbs * 4;
  if (totalMacroCals > 0) {
    const pP = Math.round((totProtein * 4 / totalMacroCals) * 100);
    const pF = Math.round((totFat     * 9 / totalMacroCals) * 100);
    const pC = 100 - pP - pF;
    document.getElementById('total-bar-p').style.width = pP + '%';
    document.getElementById('total-bar-f').style.width = pF + '%';
    document.getElementById('total-bar-c').style.width = pC + '%';
    document.getElementById('total-pct-p').textContent = pP + '%';
    document.getElementById('total-pct-f').textContent = pF + '%';
    document.getElementById('total-pct-c').textContent = pC + '%';
  }

  totalEl.style.display = 'block';
}

// ===== PROGRESS CHART =====

let caloriesChart = null;

async function loadLast15Days() {
  const dates = [];
  for (let i = 14; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }

  const kcalPerDay = {};

  if (currentUser) {
    const { data } = await db
      .from('food_journal')
      .select('date, kcal')
      .eq('user_id', currentUser.id)
      .gte('date', dates[0])
      .lte('date', dates[14]);

    (data || []).forEach(row => {
      kcalPerDay[row.date] = (kcalPerDay[row.date] || 0) + Number(row.kcal);
    });
  } else {
    dates.forEach(date => {
      const raw = localStorage.getItem('hw_journal_' + date);
      if (raw) {
        const journal = JSON.parse(raw);
        const total = Object.values(journal).flat().reduce((s, e) => s + e.kcal, 0);
        if (total > 0) kcalPerDay[date] = total;
      }
    });
  }

  return dates.map(d => ({ date: d, kcal: kcalPerDay[d] || 0 }));
}

async function renderProgressChart() {
  const data = await loadLast15Days();
  const hasData = data.some(d => d.kcal > 0);

  document.getElementById('progress-empty').style.display = hasData ? 'none' : 'block';

  const labels = data.map(d => {
    const date = new Date(d.date + 'T12:00:00');
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  });
  const values = data.map(d => d.kcal);

  const colors = values.map(v =>
    v > 0 ? 'rgba(66, 89, 239, 0.85)' : 'rgba(66, 89, 239, 0.12)'
  );
  const borders = values.map(v =>
    v > 0 ? '#4259ef' : 'rgba(66, 89, 239, 0.2)'
  );

  if (caloriesChart) {
    caloriesChart.data.labels = labels;
    caloriesChart.data.datasets[0].data = values;
    caloriesChart.data.datasets[0].backgroundColor = colors;
    caloriesChart.data.datasets[0].borderColor = borders;
    caloriesChart.update('none');
    return;
  }

  const ctx = document.getElementById('calories-chart').getContext('2d');
  caloriesChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderColor: borders,
        borderWidth: 1,
        borderRadius: 5,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1a1a1a',
          borderColor: '#333',
          borderWidth: 1,
          titleColor: '#aaa',
          bodyColor: '#fff',
          callbacks: {
            label: ctx => ctx.parsed.y > 0 ? `${ctx.parsed.y} kcal` : 'Aucune donnée',
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#555', font: { size: 11, family: 'Inter' } },
          border: { color: '#222' }
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            color: '#555',
            font: { size: 11, family: 'Inter' },
            callback: v => v === 0 ? '0' : v + ' kcal'
          },
          border: { color: '#222' },
          beginAtZero: true
        }
      }
    }
  });
}

// Capture current food entry when nutrition card renders
const _origRender = renderNutritionCard;
renderNutritionCard = function(kcal, protein, fat, carbs, fiber, salt) {
  _origRender(kcal, protein, fat, carbs, fiber, salt);
  const name    = document.getElementById('food-card-name').textContent;
  const qtyText = document.getElementById('food-card-qty').textContent;
  const qty     = parseFloat(qtyText.replace(/[^0-9.]/g, '')) || 0;
  currentFoodEntry = {
    name, qty, kcal,
    protein: parseFloat(protein) || 0,
    fat:     parseFloat(fat)     || 0,
    carbs:   parseFloat(carbs)   || 0,
  };
  document.getElementById('meal-added-confirm').style.display = 'none';
};

// Init on page load — auth.js handles this via initAuth()
document.addEventListener('DOMContentLoaded', initAuth);
