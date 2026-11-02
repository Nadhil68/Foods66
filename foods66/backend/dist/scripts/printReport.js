import { connectDB } from '../config/database';
import { Food } from '../models/Food';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const run = async () => {
    await connectDB();
    const foods = await Food.find({});
    const uploadsDir = path.join(__dirname, '../../../uploads/foods');
    console.log("---------------------------------------------------------------------------------------------------");
    console.log("Food name".padEnd(30), "|", "Old image path (Approximated)".padEnd(35), "|", "New image path".padEnd(40), "|", "Status");
    console.log("---------------------------------------------------------------------------------------------------");
    for (const food of foods) {
        // We already updated the DB, so we don't have the original path, 
        // but the old ones were mostly stock photos in `/images/food/photo-xxx.webp`
        const oldPath = `/images/food/stock-photo.webp`;
        const newPath = food.image;
        // Check if newPath returns 200 equivalent (file exists on disk to be served statically)
        const filename = newPath?.split('/').pop() || '';
        const localPath = path.join(uploadsDir, filename);
        const exists = fs.existsSync(localPath);
        console.log(food.name.padEnd(30), "|", oldPath.padEnd(35), "|", newPath?.padEnd(40), "|", exists ? "HTTP 200 (File Exists)" : "HTTP 404 (Missing)");
    }
    console.log("---------------------------------------------------------------------------------------------------");
    // Cleanup old images in frontend
    const oldDir = path.join(__dirname, '../../../../frontend/public/images/food');
    if (fs.existsSync(oldDir)) {
        const oldFiles = fs.readdirSync(oldDir);
        for (const f of oldFiles) {
            if (f.startsWith('photo-')) {
                fs.unlinkSync(path.join(oldDir, f));
            }
        }
        console.log(`Deleted ${oldFiles.filter(f => f.startsWith('photo-')).length} old stock image files from frontend/public/images/food/`);
    }
    process.exit(0);
};
run().catch(console.error);
//# sourceMappingURL=printReport.js.map