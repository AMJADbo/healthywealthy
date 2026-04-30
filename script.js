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
  offProducts = [];
  document.getElementById('food-query').focus();
}
