import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { connectDB } from '../config/database';
import { Food } from '../models/Food';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const validateImages = async () => {
  try {
    await connectDB();
    console.log('🔍 Starting Image Validation...\n');

    const foods = await Food.find({});
    let missingImages = 0;
    let duplicateImagePaths = new Set();
    let uniqueImages = new Set();

    const uploadsDir = path.join(__dirname, '../../../uploads/foods');

    console.log(`Checking ${foods.length} food items...`);

    for (const food of foods) {
      if (!food.image) {
        console.error(`❌ ${food.name} has no image path in DB.`);
        missingImages++;
        continue;
      }

      // Convert DB path (/uploads/foods/...) to local path
      const filename = path.basename(food.image);
      const localPath = path.join(uploadsDir, filename);

      if (!fs.existsSync(localPath)) {
        console.error(`❌ ${food.name} image missing on disk: ${filename}`);
        missingImages++;
      }

      if (uniqueImages.has(food.image)) {
        console.warn(`⚠️ Duplicate image path found for ${food.name}: ${food.image}`);
        duplicateImagePaths.add(food.image);
      } else {
        uniqueImages.add(food.image);
      }
    }

    // Check for orphan images
    let orphanCount = 0;
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        // Only check primary images (no -medium or -thumb)
        if (file.endsWith('.webp') && !file.includes('-medium') && !file.includes('-thumb') && file !== 'default.webp') {
          const dbPath = `/uploads/foods/${file}`;
          if (!uniqueImages.has(dbPath)) {
            console.warn(`⚠️ Orphan image found on disk: ${file}`);
            orphanCount++;
          }
        }
      }
    }

    console.log('\n📊 VALIDATION REPORT:');
    console.log('-----------------------------------');
    console.log(`Total Food Items:       ${foods.length}`);
    console.log(`Unique Images Used:     ${uniqueImages.size}`);
    console.log(`Missing Images:         ${missingImages}`);
    console.log(`Duplicate References:   ${duplicateImagePaths.size}`);
    console.log(`Orphan Images on Disk:  ${orphanCount}`);
    
    if (missingImages === 0 && duplicateImagePaths.size === 0) {
      console.log('\n✅ ALL PASSED! Every food item displays its exact corresponding image.');
    } else {
      console.log('\n❌ VALIDATION FAILED. Please check the errors above.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Validation error:', error);
    process.exit(1);
  }
};

validateImages();
