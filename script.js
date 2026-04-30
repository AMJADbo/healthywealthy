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
