import fs from 'fs';
import path from 'path';

// Re-read constants.ts to extract U IDs to test directly
const constantsContent = fs.readFileSync(path.join(process.cwd(), 'constants.ts'), 'utf8');

// Regex to extract all U('id') calls
const uRegex = /U\(['"]([^'"]+)['"]\)/g;
let match;
const idsToTest = new Set<string>();

while ((match = uRegex.exec(constantsContent)) !== null) {
  idsToTest.add(match[1]);
}

async function validateImages() {
  console.log(`Testing ${idsToTest.size} unique Unsplash IDs...`);
  const brokenLinks: string[] = [];

  for (const id of idsToTest) {
    const url = `https://images.unsplash.com/photo-${id}?w=600&q=80&auto=format&fit=crop`;
    try {
      // Use standard fetch
      const res = await fetch(url, { method: 'HEAD' });
      if (!res.ok) {
        console.error(`❌ Broken ID: ${id} (Status: ${res.status})`);
        brokenLinks.push(id);
      } else {
        console.log(`✅ OK: ${id}`);
      }
    } catch (e: any) {
      console.error(`❌ Error on ID: ${id} (${e.message})`);
      brokenLinks.push(id);
    }
  }

  console.log('\n--- REPORT ---');
  if (brokenLinks.length > 0) {
    console.log(`Found ${brokenLinks.length} broken image IDs:`);
    console.log(brokenLinks.join('\n'));
    process.exit(1);
  } else {
    console.log('All image IDs are valid!');
    process.exit(0);
  }
}

validateImages();
