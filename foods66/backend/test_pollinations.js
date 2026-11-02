const fs = require('fs');
const https = require('https');

const prompt = encodeURIComponent("Restaurant-quality professional photography of Masala Dosa. Photorealistic, 4K, high detail, natural colors, authentic ingredients, white plate, soft lighting, clean background.");
const url = `https://image.pollinations.ai/prompt/${prompt}?width=1200&height=800&nologo=true`;

https.get(url, (res) => {
    if (res.statusCode === 200) {
        const file = fs.createWriteStream('test_image.jpg');
        res.pipe(file);
        file.on('finish', () => {
            file.close();
            console.log('Image downloaded successfully.');
        });
    } else {
        console.error(`Failed to download image. Status Code: ${res.statusCode}`);
    }
}).on('error', (err) => {
    console.error('Error downloading image:', err.message);
});
