import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FOODS = [
    'Masala Dosa', 'Ghee Roast Dosa', 'Plain Idli', 'Mini Idli', 'Medu Vada', 'Pongal', 'Rava Upma', 'Curd Rice', 'Sambar Rice',
    'Chicken Biryani', 'Mutton Biryani', 'Veg Biryani', 'Egg Biryani', 'Prawn Biryani',
    'Butter Chicken', 'Palak Paneer', 'Paneer Butter Masala', 'Dal Makhani', 'Chole Bhature', 'Pav Bhaji', 'Aloo Paratha', 'Naan',
    'Chicken 65', 'Tandoori Chicken', 'Chicken Tikka', 'Chicken Shawarma', 'Mutton Curry', 'Fish Fry', 'Prawn Masala', 'Egg Curry', 'Chicken Fried Rice', 'Veg Fried Rice', 'Gobi Manchurian', 'Veg Momos', 'Chicken Momos',
    'Mango Lassi', 'Fresh Lime Soda', 'Watermelon Juice', 'Coconut Water', 'Sugarcane Juice', 'Mixed Fruit Milkshake', 'Buttermilk',
    'Madras Filter Coffee', 'Cappuccino', 'Cafe Latte', 'Cold Coffee', 'Espresso Shot', 'Cafe Mocha', 'Americano', 'Dalgona Coffee',
    'Vanilla Ice Cream', 'Chocolate Brownie', 'Chocolate Cake', 'Gulab Jamun', 'Rasmalai', 'Jalebi', 'Fruit Salad',
    'Quinoa Salad Bowl', 'Sprouts Bhel', 'Millet Dosa with Chutney', 'Mushroom Soup', 'Brown Rice Palak Paneer',
    'Grilled Chicken Breast', 'Egg White Omelette', 'Oatmeal with Almonds', 'Protein Smoothie Bowl', 'Grilled Fish Salad'
];
const getSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const downloadImage = async (url) => {
    const res = await fetch(url, { headers: { 'User-Agent': 'Foods66App/1.0 (test@example.com)' } });
    if (!res.ok)
        throw new Error(`Failed to download image. Status Code: ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
};
const getWikipediaImage = async (name) => {
    const fetchImageForTitle = async (title) => {
        try {
            const url = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&titles=${encodeURIComponent(title)}&format=json&pithumbsize=1200`;
            const res = await fetch(url, { headers: { 'User-Agent': 'Foods66App/1.0 (test@example.com)' } });
            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            }
            catch (e) {
                return null; // Rate limited or invalid JSON
            }
            const pages = data.query?.pages;
            if (!pages)
                return null;
            const pageId = Object.keys(pages)[0];
            if (pageId === '-1' || !pages[pageId].thumbnail)
                return null;
            return pages[pageId].thumbnail.source;
        }
        catch (err) {
            return null;
        }
    };
    // Try exact match
    let img = await fetchImageForTitle(name.replace(/ /g, '_'));
    if (img)
        return img;
    // Try search match
    try {
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name)}&format=json`;
        const searchRes = await fetch(searchUrl, { headers: { 'User-Agent': 'Foods66App/1.0 (test@example.com)' } });
        const searchText = await searchRes.text();
        const searchData = JSON.parse(searchText);
        const results = searchData.query?.search;
        if (results && results.length > 0) {
            for (let i = 0; i < Math.min(3, results.length); i++) {
                img = await fetchImageForTitle(results[i].title);
                if (img)
                    return img;
            }
        }
    }
    catch (err) { }
    return null;
};
const processImage = async (name, uploadsDir) => {
    const slug = getSlug(name);
    const filepath = path.join(uploadsDir, `${slug}.webp`);
    const filepathMedium = path.join(uploadsDir, `${slug}-medium.webp`);
    const filepathThumb = path.join(uploadsDir, `${slug}-thumb.webp`);
    if (fs.existsSync(filepath) && fs.statSync(filepath).size > 0) {
        console.log(`Skipping ${name}, already exists.`);
        return;
    }
    console.log(`Generating image for ${name}...`);
    let buffer;
    const wikiUrl = await getWikipediaImage(name);
    if (wikiUrl) {
        console.log(`Using Wikipedia image for ${name}`);
        try {
            buffer = await downloadImage(wikiUrl);
        }
        catch (e) {
            console.log(`Wikipedia image download failed (${e.message}). Falling back to placeholder.`);
            const url = `https://picsum.photos/seed/${slug}/1200/800`;
            buffer = await downloadImage(url);
        }
    }
    else {
        console.log(`No Wikipedia image found for ${name}. Using a placeholder stock image.`);
        const url = `https://picsum.photos/seed/${slug}/1200/800`;
        buffer = await downloadImage(url);
    }
    // Primary
    await sharp(buffer)
        .resize({ width: 1200, height: 800, fit: 'cover' })
        .webp({ quality: 85 })
        .toFile(filepath);
    // Medium
    await sharp(buffer)
        .resize({ width: 600, height: 400, fit: 'cover' })
        .webp({ quality: 85 })
        .toFile(filepathMedium);
    // Thumb
    await sharp(buffer)
        .resize({ width: 300, height: 300, fit: 'cover' })
        .webp({ quality: 85 })
        .toFile(filepathThumb);
    console.log(`✓ Saved ${name}`);
};
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const processImageWithRetry = async (name, uploadsDir, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            await processImage(name, uploadsDir);
            return; // success
        }
        catch (err) {
            if (i === retries - 1)
                throw err;
            console.log(`Retrying ${name}...`);
            await sleep(1000);
        }
    }
};
const processImages = async () => {
    const uploadsDir = path.join(__dirname, '../../../uploads/foods');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
    // Generate a fallback default image too
    const defaultFilepath = path.join(uploadsDir, 'default.webp');
    if (!fs.existsSync(defaultFilepath)) {
        try {
            const buffer = await downloadImage(`https://picsum.photos/seed/foods66/1200/800`);
            await sharp(buffer).resize({ width: 1200, height: 800, fit: 'cover' }).webp({ quality: 85 }).toFile(defaultFilepath);
        }
        catch (e) { }
    }
    for (const name of FOODS) {
        await processImageWithRetry(name, uploadsDir);
        await sleep(1000); // Larger delay to be polite to Wikipedia
    }
    console.log('✅ Image generation complete!');
};
processImages();
//# sourceMappingURL=generateAllImages.js.map