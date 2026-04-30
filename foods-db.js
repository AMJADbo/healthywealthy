// Local ingredient database — values per 100g — source: USDA FoodData Central
const FOODS_DB = [

  // ── PROTÉINES ANIMALES ──────────────────────────────────────────────────
  { name: "Oeuf entier cru",          aliases: ["oeuf","oeufs","egg","eggs","oeuf entier"],
    kcal:155, protein:13.0, fat:11.0, carbs:1.1,  fiber:0.0, salt:0.4, category:"Oeufs & Produits laitiers" },
  { name: "Blanc d'oeuf cru",         aliases: ["blanc d'oeuf","blanc oeuf","albumen","egg white"],
    kcal:52,  protein:10.9, fat:0.2,  carbs:0.7,  fiber:0.0, salt:0.4, category:"Oeufs & Produits laitiers" },
  { name: "Jaune d'oeuf cru",         aliases: ["jaune d'oeuf","jaune oeuf","egg yolk"],
    kcal:322, protein:15.9, fat:26.5, carbs:3.6,  fiber:0.0, salt:0.1, category:"Oeufs & Produits laitiers" },

  { name: "Poulet (sein, cuit)",       aliases: ["poulet","chicken","blanc poulet","sein poulet","filet poulet","poitrine poulet"],
    kcal:165, protein:31.0, fat:3.6,  carbs:0.0,  fiber:0.0, salt:0.2, category:"Viandes & Poissons" },
  { name: "Poulet (cuisse, cuit)",     aliases: ["cuisse poulet","pilon poulet","poulet cuisse"],
    kcal:177, protein:24.0, fat:8.2,  carbs:0.0,  fiber:0.0, salt:0.3, category:"Viandes & Poissons" },
  { name: "Viande hachée boeuf 5%",   aliases: ["viande hachee","viande hachée","boeuf haché","boeuf hache","steak haché","steak hache","ground beef"],
    kcal:137, protein:21.4, fat:5.0,  carbs:0.0,  fiber:0.0, salt:0.2, category:"Viandes & Poissons" },
  { name: "Viande hachée boeuf 15%",  aliases: ["boeuf 15","viande hachee 15","viande hachée 15%","hamburger"],
    kcal:215, protein:18.0, fat:15.0, carbs:0.0,  fiber:0.0, salt:0.3, category:"Viandes & Poissons" },
  { name: "Boeuf (rumsteak, cuit)",   aliases: ["boeuf","beef","steak","rumsteak","entrecote","entrecôte"],
    kcal:207, protein:26.3, fat:10.5, carbs:0.0,  fiber:0.0, salt:0.2, category:"Viandes & Poissons" },
  { name: "Porc (filet, cuit)",        aliases: ["porc","pork","filet porc","côte porc","cote porc"],
    kcal:143, protein:26.0, fat:3.5,  carbs:0.0,  fiber:0.0, salt:0.1, category:"Viandes & Poissons" },
  { name: "Dinde (sein, cuite)",       aliases: ["dinde","turkey","escalope dinde","blanc dinde"],
    kcal:157, protein:29.9, fat:3.2,  carbs:0.0,  fiber:0.0, salt:0.2, category:"Viandes & Poissons" },
  { name: "Agneau (côtelette, cuit)",  aliases: ["agneau","lamb","côtelette agneau"],
    kcal:294, protein:24.5, fat:20.7, carbs:0.0,  fiber:0.0, salt:0.3, category:"Viandes & Poissons" },

  { name: "Saumon (cuit)",             aliases: ["saumon","salmon","filet saumon"],
    kcal:208, protein:20.4, fat:13.4, carbs:0.0,  fiber:0.0, salt:0.1, category:"Viandes & Poissons" },
  { name: "Thon (en boîte, au naturel)",aliases: ["thon","tuna","thon naturel","thon boite","thon boîte"],
    kcal:116, protein:25.5, fat:1.0,  carbs:0.0,  fiber:0.0, salt:0.5, category:"Viandes & Poissons" },
  { name: "Cabillaud (cuit)",          aliases: ["cabillaud","cod","morue","colin"],
    kcal:105, protein:22.8, fat:0.9,  carbs:0.0,  fiber:0.0, salt:0.2, category:"Viandes & Poissons" },
  { name: "Crevettes (cuites)",        aliases: ["crevettes","shrimp","gambas","crevette"],
    kcal:99,  protein:23.7, fat:0.3,  carbs:0.2,  fiber:0.0, salt:1.3, category:"Viandes & Poissons" },
  { name: "Sardines (en boîte, huile)",aliases: ["sardines","sardine"],
    kcal:208, protein:24.6, fat:11.5, carbs:0.0,  fiber:0.0, salt:0.8, category:"Viandes & Poissons" },
  { name: "Maquereau (cuit)",          aliases: ["maquereau","mackerel"],
    kcal:262, protein:23.8, fat:17.8, carbs:0.0,  fiber:0.0, salt:0.3, category:"Viandes & Poissons" },

  // ── PRODUITS LAITIERS ───────────────────────────────────────────────────
  { name: "Lait entier (3,5%)",        aliases: ["lait","milk","lait entier","lait 3","whole milk"],
    kcal:61,  protein:3.2,  fat:3.3,  carbs:4.7,  fiber:0.0, salt:0.1, category:"Oeufs & Produits laitiers" },
  { name: "Lait écrémé (0,1%)",        aliases: ["lait ecreme","lait écrémé","lait 0","skim milk"],
    kcal:34,  protein:3.4,  fat:0.1,  carbs:4.9,  fiber:0.0, salt:0.1, category:"Oeufs & Produits laitiers" },
  { name: "Fromage blanc 0%",          aliases: ["fromage blanc","faisselle","fromage blanc 0"],
    kcal:47,  protein:8.0,  fat:0.2,  carbs:3.5,  fiber:0.0, salt:0.1, category:"Oeufs & Produits laitiers" },
  { name: "Yaourt nature entier",      aliases: ["yaourt","yogurt","yaourt nature","yoghurt"],
    kcal:61,  protein:3.5,  fat:3.3,  carbs:4.7,  fiber:0.0, salt:0.1, category:"Oeufs & Produits laitiers" },
  { name: "Skyr nature",               aliases: ["skyr"],
    kcal:60,  protein:11.0, fat:0.2,  carbs:4.0,  fiber:0.0, salt:0.1, category:"Oeufs & Produits laitiers" },
  { name: "Emmental",                  aliases: ["emmental","emmenthal","gruyere","gruyère"],
    kcal:382, protein:28.6, fat:29.7, carbs:0.5,  fiber:0.0, salt:0.7, category:"Oeufs & Produits laitiers" },
  { name: "Mozzarella",                aliases: ["mozzarella"],
    kcal:280, protein:28.0, fat:17.1, carbs:2.2,  fiber:0.0, salt:0.6, category:"Oeufs & Produits laitiers" },
  { name: "Cottage cheese",            aliases: ["cottage","cottage cheese"],
    kcal:98,  protein:11.1, fat:4.3,  carbs:3.4,  fiber:0.0, salt:0.4, category:"Oeufs & Produits laitiers" },
  { name: "Beurre",                    aliases: ["beurre","butter"],
    kcal:717, protein:0.9,  fat:81.1, carbs:0.1,  fiber:0.0, salt:0.6, category:"Oeufs & Produits laitiers" },
  { name: "Crème fraîche entière",     aliases: ["creme fraiche","crème fraîche","creme","crème"],
    kcal:292, protein:2.5,  fat:30.0, carbs:2.7,  fiber:0.0, salt:0.1, category:"Oeufs & Produits laitiers" },

  // ── FÉCULENTS & CÉRÉALES ────────────────────────────────────────────────
  { name: "Riz blanc (cru)",           aliases: ["riz","rice","riz blanc","riz cru"],
    kcal:365, protein:7.1,  fat:0.7,  carbs:80.0, fiber:1.3, salt:0.0, category:"Féculents & Céréales" },
  { name: "Riz blanc (cuit)",          aliases: ["riz cuit","riz blanc cuit"],
    kcal:130, protein:2.7,  fat:0.3,  carbs:28.2, fiber:0.4, salt:0.0, category:"Féculents & Céréales" },
  { name: "Pâtes (crues)",             aliases: ["pates","pâtes","pasta","spaghetti","penne","fusilli","pate"],
    kcal:371, protein:13.0, fat:1.5,  carbs:74.7, fiber:3.2, salt:0.0, category:"Féculents & Céréales" },
  { name: "Pâtes (cuites)",            aliases: ["pates cuites","pâtes cuites","pasta cuite","spaghetti cuit"],
    kcal:131, protein:5.0,  fat:1.1,  carbs:25.0, fiber:1.8, salt:0.0, category:"Féculents & Céréales" },
  { name: "Flocons d'avoine",          aliases: ["avoine","flocons avoine","oatmeal","oats","porridge","muesli"],
    kcal:389, protein:16.9, fat:6.9,  carbs:66.3, fiber:10.6,salt:0.0, category:"Féculents & Céréales" },
  { name: "Quinoa (cuit)",             aliases: ["quinoa"],
    kcal:120, protein:4.4,  fat:1.9,  carbs:21.3, fiber:2.8, salt:0.0, category:"Féculents & Céréales" },
  { name: "Pain blanc",               aliases: ["pain","bread","baguette","pain blanc","pain de mie"],
    kcal:265, protein:9.0,  fat:3.2,  carbs:49.0, fiber:2.7, salt:1.1, category:"Féculents & Céréales" },
  { name: "Pain complet",             aliases: ["pain complet","pain integral","pain intégral","whole wheat bread"],
    kcal:247, protein:13.0, fat:3.4,  carbs:41.0, fiber:7.0, salt:0.9, category:"Féculents & Céréales" },
  { name: "Pomme de terre (cuite)",    aliases: ["pomme de terre","pommes de terre","potato","patate","pomme terre"],
    kcal:87,  protein:1.9,  fat:0.1,  carbs:20.1, fiber:1.8, salt:0.0, category:"Féculents & Céréales" },
  { name: "Patate douce (cuite)",      aliases: ["patate douce","sweet potato","yam"],
    kcal:90,  protein:2.0,  fat:0.1,  carbs:20.7, fiber:3.3, salt:0.0, category:"Féculents & Céréales" },
  { name: "Lentilles (cuites)",        aliases: ["lentilles","lentille","lentils"],
    kcal:116, protein:9.0,  fat:0.4,  carbs:20.1, fiber:7.9, salt:0.0, category:"Légumineuses" },
  { name: "Pois chiches (cuits)",      aliases: ["pois chiches","pois chiche","chickpeas","poids chiches"],
    kcal:164, protein:8.9,  fat:2.6,  carbs:27.4, fiber:7.6, salt:0.0, category:"Légumineuses" },
  { name: "Haricots rouges (cuits)",   aliases: ["haricots","haricots rouges","kidney beans","haricot rouge"],
    kcal:127, protein:8.7,  fat:0.5,  carbs:22.8, fiber:7.4, salt:0.0, category:"Légumineuses" },

  // ── LÉGUMES ─────────────────────────────────────────────────────────────
  { name: "Brocoli (cuit)",            aliases: ["brocoli","broccoli","brocolis"],
    kcal:35,  protein:2.4,  fat:0.4,  carbs:7.2,  fiber:3.3, salt:0.0, category:"Légumes" },
  { name: "Épinards (crus)",           aliases: ["epinards","épinards","spinach","epinard","épinard"],
    kcal:23,  protein:2.9,  fat:0.4,  carbs:3.6,  fiber:2.2, salt:0.1, category:"Légumes" },
  { name: "Carotte (crue)",            aliases: ["carotte","carottes","carrot"],
    kcal:41,  protein:0.9,  fat:0.2,  carbs:9.6,  fiber:2.8, salt:0.1, category:"Légumes" },
  { name: "Tomate",                    aliases: ["tomate","tomates","tomato"],
    kcal:18,  protein:0.9,  fat:0.2,  carbs:3.9,  fiber:1.2, salt:0.0, category:"Légumes" },
  { name: "Courgette (cuite)",         aliases: ["courgette","courgettes","zucchini"],
    kcal:17,  protein:1.2,  fat:0.3,  carbs:3.1,  fiber:1.0, salt:0.0, category:"Légumes" },
  { name: "Concombre",                 aliases: ["concombre","cucumber"],
    kcal:15,  protein:0.7,  fat:0.1,  carbs:3.6,  fiber:0.5, salt:0.0, category:"Légumes" },
  { name: "Poivron rouge",             aliases: ["poivron","poivrons","pepper","poivron rouge"],
    kcal:31,  protein:1.0,  fat:0.3,  carbs:6.0,  fiber:2.1, salt:0.0, category:"Légumes" },
  { name: "Champignon blanc",          aliases: ["champignon","champignons","mushroom","champignons de paris"],
    kcal:22,  protein:3.1,  fat:0.3,  carbs:3.3,  fiber:1.0, salt:0.0, category:"Légumes" },

  // ── FRUITS ──────────────────────────────────────────────────────────────
  { name: "Banane",                    aliases: ["banane","banana"],
    kcal:89,  protein:1.1,  fat:0.3,  carbs:22.8, fiber:2.6, salt:0.0, category:"Fruits" },
  { name: "Pomme",                     aliases: ["pomme","apple"],
    kcal:52,  protein:0.3,  fat:0.2,  carbs:13.8, fiber:2.4, salt:0.0, category:"Fruits" },
  { name: "Orange",                    aliases: ["orange"],
    kcal:47,  protein:0.9,  fat:0.1,  carbs:11.8, fiber:2.4, salt:0.0, category:"Fruits" },
  { name: "Myrtilles",                 aliases: ["myrtilles","myrtille","blueberry","blueberries"],
    kcal:57,  protein:0.7,  fat:0.3,  carbs:14.5, fiber:2.4, salt:0.0, category:"Fruits" },
  { name: "Fraises",                   aliases: ["fraise","fraises","strawberry"],
    kcal:32,  protein:0.7,  fat:0.3,  carbs:7.7,  fiber:2.0, salt:0.0, category:"Fruits" },
  { name: "Avocat",                    aliases: ["avocat","avocado"],
    kcal:160, protein:2.0,  fat:14.7, carbs:8.5,  fiber:6.7, salt:0.0, category:"Fruits" },

  // ── MATIÈRES GRASSES & NOIX ─────────────────────────────────────────────
  { name: "Huile d'olive",             aliases: ["huile olive","huile d'olive","olive oil"],
    kcal:884, protein:0.0,  fat:100.0,carbs:0.0,  fiber:0.0, salt:0.0, category:"Matières grasses" },
  { name: "Huile de coco",             aliases: ["huile coco","huile de coco","coconut oil"],
    kcal:862, protein:0.0,  fat:100.0,carbs:0.0,  fiber:0.0, salt:0.0, category:"Matières grasses" },
  { name: "Amandes",                   aliases: ["amandes","amande","almond","almonds"],
    kcal:579, protein:21.2, fat:49.9, carbs:21.6, fiber:12.5,salt:0.0, category:"Noix & Graines" },
  { name: "Noix",                      aliases: ["noix","walnut","walnuts"],
    kcal:654, protein:15.2, fat:65.2, carbs:13.7, fiber:6.7, salt:0.0, category:"Noix & Graines" },
  { name: "Noix de cajou",             aliases: ["cajou","cashew","noix de cajou"],
    kcal:553, protein:18.2, fat:43.9, carbs:30.2, fiber:3.3, salt:0.0, category:"Noix & Graines" },
  { name: "Beurre de cacahuète",       aliases: ["beurre cacahuete","beurre de cacahuète","peanut butter","cacahuete","cacahuète"],
    kcal:588, protein:25.1, fat:50.4, carbs:20.1, fiber:5.9, salt:0.4, category:"Noix & Graines" },
  { name: "Graines de chia",           aliases: ["chia","graines chia","chia seeds"],
    kcal:486, protein:16.5, fat:30.7, carbs:42.1, fiber:34.4,salt:0.0, category:"Noix & Graines" },

  // ── PROTÉINES EN POUDRE ─────────────────────────────────────────────────
  { name: "Whey protéine (standard)",  aliases: ["whey","proteine poudre","whey protein","proteines","whey isolat"],
    kcal:380, protein:75.0, fat:5.0,  carbs:10.0, fiber:0.0, salt:0.5, category:"Compléments" },
  { name: "Protéine de soja",          aliases: ["proteine soja","soja","soy protein"],
    kcal:338, protein:81.0, fat:1.0,  carbs:8.0,  fiber:0.0, salt:1.0, category:"Compléments" },
];

/**
 * Search local DB — returns matching foods (normalized, accent-insensitive)
 */
function searchLocalDB(query) {
  const normalize = s => s.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ").trim();
  const q = normalize(query);
  const words = q.split(/\s+/).filter(w => w.length > 1);

  return FOODS_DB.filter(food => {
    return food.aliases.some(alias => {
      const a = normalize(alias);
      return words.some(w => a.includes(w)) || a.includes(q);
    });
  }).sort((a, b) => {
    // exact alias match first
    const aN = normalize(a.name);
    const bN = normalize(b.name);
    const qa = aN.includes(q) ? 0 : 1;
    const qb = bN.includes(q) ? 0 : 1;
    return qa - qb;
  });
}
