import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allFoodsPath = path.join(__dirname, '../data/allFoods.json');
const uploadsDir = path.join(__dirname, '../../../uploads/foods');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const allFoods = JSON.parse(fs.readFileSync(allFoodsPath, 'utf-8'));

// Find available base webp images in uploads/foods
const existingFiles = fs.readdirSync(uploadsDir);
const primaryImages = existingFiles.filter(f => f.endsWith('.webp') && !f.includes('-medium') && !f.includes('-thumb'));

console.log(`Found ${primaryImages.length} primary base images in uploads/foods`);

// Best base image selector for category and name
const selectBaseImage = (item) => {
  const name = item.name.toLowerCase();
  const cat = item.category;

  if (cat === 'Coffee') {
    if (name.includes('filter')) return 'madras-filter-coffee.webp';
    if (name.includes('cold') || name.includes('iced') || name.includes('frappe')) return 'cold-coffee.webp';
    if (name.includes('latte')) return 'cafe-latte.webp';
    if (name.includes('mocha')) return 'cafe-mocha.webp';
    if (name.includes('espresso')) return 'espresso-shot.webp';
    return 'cappuccino.webp';
  }

  if (cat === 'Drinks') {
    if (name.includes('water') || name.includes('coconut')) return 'coconut-water.webp';
    if (name.includes('watermelon')) return 'watermelon-juice.webp';
    if (name.includes('sugarcane')) return 'sugarcane-juice.webp';
    if (name.includes('buttermilk') || name.includes('chaas') || name.includes('moru')) return 'buttermilk.webp';
    if (name.includes('shake')) return 'mixed-fruit-milkshake.webp';
    if (name.includes('soda') || name.includes('lime') || name.includes('lemon')) return 'fresh-lime-soda.webp';
    return 'mango-lassi.webp';
  }

  if (cat === 'Ice Creams & Dessert') {
    if (name.includes('ice cream') || name.includes('vanilla')) return 'vanilla-ice-cream.webp';
    if (name.includes('brownie')) return 'chocolate-brownie.webp';
    if (name.includes('cake') || name.includes('pastry') || name.includes('waffle')) return 'chocolate-cake.webp';
    if (name.includes('rasmalai') || name.includes('rasgulla')) return 'rasmalai.webp';
    if (name.includes('jalebi') || name.includes('imarti')) return 'jalebi.webp';
    if (name.includes('salad')) return 'fruit-salad.webp';
    return 'gulab-jamun.webp';
  }

  if (cat === 'Gym Combo') {
    if (name.includes('egg') || name.includes('omelette') || name.includes('bhurji')) return 'egg-white-omelette.webp';
    if (name.includes('oat') || name.includes('almond') || name.includes('shake') || name.includes('smoothie')) return 'protein-smoothie-bowl.webp';
    if (name.includes('fish') || name.includes('salmon') || name.includes('tuna') || name.includes('prawn')) return 'grilled-fish-salad.webp';
    return 'grilled-chicken-breast.webp';
  }

  if (cat === 'Healthy Combo') {
    if (name.includes('soup') || name.includes('broth')) return 'mushroom-soup.webp';
    if (name.includes('dosa') || name.includes('idli')) return 'millet-dosa-with-chutney.webp';
    if (name.includes('rice') || name.includes('palak') || name.includes('paneer') || name.includes('khichdi')) return 'brown-rice-palak-paneer.webp';
    if (name.includes('sprout') || name.includes('chaat') || name.includes('bhel')) return 'sprouts-bhel.webp';
    return 'quinoa-salad-bowl.webp';
  }

  if (cat === 'Non-Veg') {
    if (name.includes('biryani') || name.includes('pulao')) return 'chicken-biryani.webp';
    if (name.includes('mutton') || name.includes('lamb') || name.includes('keema') || name.includes('sukka') || name.includes('rogan')) return 'mutton-curry.webp';
    if (name.includes('fish') || name.includes('surmai') || name.includes('pomfret')) return 'fish-fry.webp';
    if (name.includes('prawn') || name.includes('crab') || name.includes('squid')) return 'prawn-masala.webp';
    if (name.includes('egg')) return 'egg-curry.webp';
    if (name.includes('fried') || name.includes('popcorn') || name.includes('lollipop') || name.includes('nugget') || name.includes('65')) return 'chicken-65.webp';
    if (name.includes('tikka') || name.includes('kebab') || name.includes('tandoori') || name.includes('wings')) return 'tandoori-chicken.webp';
    if (name.includes('shawarma') || name.includes('roll') || name.includes('wrap') || name.includes('burger')) return 'chicken-shawarma.webp';
    return 'butter-chicken.webp';
  }

  // Veg
  if (name.includes('dosa') || name.includes('uttapam') || name.includes('crepe')) return 'masala-dosa.webp';
  if (name.includes('idli')) return 'plain-idli.webp';
  if (name.includes('vada')) return 'medu-vada.webp';
  if (name.includes('pongal')) return 'pongal.webp';
  if (name.includes('upma')) return 'rava-upma.webp';
  if (name.includes('curd rice')) return 'curd-rice.webp';
  if (name.includes('sambar')) return 'sambar-rice.webp';
  if (name.includes('biryani') || name.includes('pulao') || name.includes('rice')) return 'veg-biryani.webp';
  if (name.includes('palak') || name.includes('spinach')) return 'palak-paneer.webp';
  if (name.includes('paneer')) return 'paneer-butter-masala.webp';
  if (name.includes('dal')) return 'dal-makhani.webp';
  if (name.includes('chole') || name.includes('chana')) return 'chole-bhature.webp';
  if (name.includes('pav bhaji')) return 'pav-bhaji.webp';
  if (name.includes('paratha') || name.includes('roti') || name.includes('kulcha') || name.includes('naan')) return 'aloo-paratha.webp';
  if (name.includes('fried rice')) return 'veg-fried-rice.webp';
  if (name.includes('gobi') || name.includes('manchurian')) return 'gobi-manchurian.webp';
  if (name.includes('momo')) return 'veg-momos.webp';
  return 'masala-dosa.webp';
};

const getSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

let createdCount = 0;
let existingCount = 0;

for (const item of allFoods) {
  const slug = getSlug(item.name);
  const targetMain = path.join(uploadsDir, `${slug}.webp`);
  const targetMedium = path.join(uploadsDir, `${slug}-medium.webp`);
  const targetThumb = path.join(uploadsDir, `${slug}-thumb.webp`);

  if (fs.existsSync(targetMain)) {
    existingCount++;
    continue;
  }

  const baseImageName = selectBaseImage(item);
  const baseImagePath = path.join(uploadsDir, baseImageName);
  
  if (fs.existsSync(baseImagePath)) {
    fs.copyFileSync(baseImagePath, targetMain);

    // Also copy medium and thumb if available
    const baseMedium = path.join(uploadsDir, baseImageName.replace('.webp', '-medium.webp'));
    const baseThumb = path.join(uploadsDir, baseImageName.replace('.webp', '-thumb.webp'));

    if (fs.existsSync(baseMedium)) {
      fs.copyFileSync(baseMedium, targetMedium);
    } else {
      fs.copyFileSync(baseImagePath, targetMedium);
    }

    if (fs.existsSync(baseThumb)) {
      fs.copyFileSync(baseThumb, targetThumb);
    } else {
      fs.copyFileSync(baseImagePath, targetThumb);
    }

    createdCount++;
  } else {
    // Fallback to default.webp
    const defaultPath = path.join(uploadsDir, 'default.webp');
    if (fs.existsSync(defaultPath)) {
      fs.copyFileSync(defaultPath, targetMain);
      fs.copyFileSync(defaultPath, targetMedium);
      fs.copyFileSync(defaultPath, targetThumb);
      createdCount++;
    }
  }
}

console.log(`\n🎉 Image Sync Completed:`);
console.log(`   Existing images on disk: ${existingCount}`);
console.log(`   New image sets created: ${createdCount}`);
console.log(`   Total items covered: ${existingCount + createdCount}`);
