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

// ===== FOOD NUTRITION (Open Food Facts API) =====

let suggestTimer = null;
let lastProducts = [];

function onFoodInput() {
  const q = document.getElementById('food-query').value.trim();
  clearTimeout(suggestTimer);
  if (q.length < 2) {
    hideSuggestions();
    return;
  }
  suggestTimer = setTimeout(() => fetchSuggestions(q), 350);
}

async function fetchSuggestions(query) {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=6&fields=product_name,brands,nutriments,_id&lc=fr&language=fr`;
    const res = await fetch(url);
    const data = await res.json();
    const products = (data.products || []).filter(p => p.product_name && p.nutriments && p.nutriments['energy-kcal_100g'] != null);
    lastProducts = products;
    showSuggestions(products);
  } catch {
    hideSuggestions();
  }
}

function showSuggestions(products) {
  const box = document.getElementById('food-suggestions');
  if (!products.length) { hideSuggestions(); return; }
  box.innerHTML = products.map((p, i) => {
    const kcal = Math.round(p.nutriments['energy-kcal_100g'] || 0);
    const brand = p.brands ? ` — ${p.brands.split(',')[0]}` : '';
    return `<div class="food-suggestion-item" onclick="selectSuggestion(${i})">
      ${p.product_name}<span>${kcal} kcal/100g${brand}</span>
    </div>`;
  }).join('');
  box.style.display = 'block';
}

function hideSuggestions() {
  document.getElementById('food-suggestions').style.display = 'none';
}

function selectSuggestion(index) {
  const p = lastProducts[index];
  document.getElementById('food-query').value = p.product_name;
  hideSuggestions();
  const qtyInput = document.getElementById('food-qty');
  if (!qtyInput.value) qtyInput.focus();
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.food-input-wrap')) hideSuggestions();
});

async function searchFood() {
  const query = document.getElementById('food-query').value.trim();
  const qty   = parseFloat(document.getElementById('food-qty').value);
  const errEl = document.getElementById('food-error');

  if (!query) { showFoodError('Veuillez entrer un aliment.'); return; }
  if (!qty || qty <= 0) { showFoodError('Veuillez entrer une quantité valide (en grammes).'); return; }
  errEl.style.display = 'none';
  hideSuggestions();

  document.getElementById('food-loading').style.display = 'flex';
  document.getElementById('food-results-list').style.display = 'none';
  document.getElementById('food-nutrition-card').style.display = 'none';

  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10&fields=product_name,brands,nutriments,_id&lc=fr&language=fr`;
    const res  = await fetch(url);
    const data = await res.json();
    const products = (data.products || []).filter(p => p.product_name && p.nutriments && p.nutriments['energy-kcal_100g'] != null);

    document.getElementById('food-loading').style.display = 'none';

    if (!products.length) {
      showFoodError('Aucun résultat nutritionnel trouvé. Essayez un autre terme (ex: "poulet", "riz blanc", "boeuf haché").');
      return;
    }

    if (products.length === 1) {
      displayNutrition(products[0], qty);
    } else {
      showProductList(products, qty);
    }
  } catch {
    document.getElementById('food-loading').style.display = 'none';
    showFoodError('Erreur de connexion. Vérifiez votre connexion internet et réessayez.');
  }
}

function showProductList(products, qty) {
  const container = document.getElementById('food-items-container');
  container.innerHTML = products.slice(0, 8).map((p, i) => {
    const kcal = Math.round((p.nutriments['energy-kcal_100g'] || 0) * qty / 100);
    const brand = p.brands ? p.brands.split(',')[0] : '';
    return `<div class="food-item-row" onclick="selectProduct(${i}, ${qty})">
      <div>
        <div class="food-item-name">${p.product_name}</div>
        ${brand ? `<div class="food-item-brand">${brand}</div>` : ''}
      </div>
      <div class="food-item-kcal">${kcal} <span>kcal pour ${qty}g</span></div>
    </div>`;
  }).join('');

  lastProducts = products;
  document.getElementById('food-results-list').style.display = 'block';
}

function selectProduct(index, qty) {
  document.getElementById('food-results-list').style.display = 'none';
  displayNutrition(lastProducts[index], qty);
}

function displayNutrition(product, qty) {
  const n   = product.nutriments;
  const mul = qty / 100;

  const kcal    = Math.round((n['energy-kcal_100g'] || 0) * mul);
  const protein = Math.round((n['proteins_100g']    || 0) * mul * 10) / 10;
  const fat     = Math.round((n['fat_100g']          || 0) * mul * 10) / 10;
  const carbs   = Math.round((n['carbohydrates_100g']|| 0) * mul * 10) / 10;
  const fiber   = n['fiber_100g']  != null ? Math.round(n['fiber_100g']  * mul * 10) / 10 + ' g' : '—';
  const salt    = n['salt_100g']   != null ? Math.round(n['salt_100g']   * mul * 100) / 100 + ' g' : '—';

  const brand = product.brands ? ` (${product.brands.split(',')[0]})` : '';
  document.getElementById('food-card-name').textContent = product.product_name + brand;
  document.getElementById('food-card-qty').textContent  = `Pour ${qty} g`;

  document.getElementById('fn-kcal').textContent    = kcal + ' kcal';
  document.getElementById('fn-protein').textContent = protein + ' g';
  document.getElementById('fn-fat').textContent     = fat + ' g';
  document.getElementById('fn-carbs').textContent   = carbs + ' g';
  document.getElementById('fn-fiber').textContent   = fiber;
  document.getElementById('fn-salt').textContent    = salt;

  // Distribution bar
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
  document.getElementById('food-query').focus();
}
