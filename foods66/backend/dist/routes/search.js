import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { Food } from '../models/Food';
import { env } from '../config/envConfig';
const router = Router();
const API_KEY = env.GEMINI_API_KEY;
router.post('/', async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) {
            res.status(400).json({ error: 'Search query is required' });
            return;
        }
        if (!API_KEY || API_KEY.includes('PLACEHOLDER')) {
            const escapedQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escapedQuery, 'i');
            const foods = await Food.find({
                $or: [
                    { name: regex },
                    { description: regex },
                    { category: regex }
                ]
            });
            res.json(foods);
            return;
        }
        // Step 1: Use Gemini to extract search parameters
        const prompt = `
      You are a search query parser for a food delivery app.
      Extract the intent from the following search query: "${query}"
      
      Return a JSON object with these exact keys:
      - minPrice: number or null
      - maxPrice: number or null
      - isVegetarian: boolean or null
      - isVegan: boolean or null
      - isHealthy: boolean or null
      - isSpicy: boolean or null
      - keywords: array of strings representing the main food items (e.g. "pizza", "burger", "salad")
      
      Output ONLY valid JSON.
    `;
        // Lazy-init GenAI only when actually needed
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        const aiText = response.text || "{}";
        const cleanedText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
        const params = JSON.parse(cleanedText);
        // Step 2: Build MongoDB Query
        const matchQuery = {};
        if (params.maxPrice) {
            matchQuery.price = { $lte: params.maxPrice };
        }
        if (params.minPrice) {
            matchQuery.price = { ...matchQuery.price, $gte: params.minPrice };
        }
        if (params.keywords && params.keywords.length > 0) {
            // Use text search for the keywords
            matchQuery.$text = { $search: params.keywords.join(' ') };
        }
        // Since we don't have boolean flags in the current Food model for spicy/vegan/etc,
        // we'll append them to the text search if they are requested
        const extraKeywords = [];
        if (params.isVegetarian)
            extraKeywords.push('veg');
        if (params.isVegan)
            extraKeywords.push('vegan');
        if (params.isHealthy)
            extraKeywords.push('healthy');
        if (params.isSpicy)
            extraKeywords.push('spicy');
        if (extraKeywords.length > 0) {
            if (matchQuery.$text) {
                matchQuery.$text.$search += ' ' + extraKeywords.join(' ');
            }
            else {
                matchQuery.$text = { $search: extraKeywords.join(' ') };
            }
        }
        // Execute query
        let results;
        if (Object.keys(matchQuery).length === 0) {
            // If we couldn't parse anything meaningful, fallback to regex search
            results = await Food.find({ name: { $regex: query, $options: 'i' } });
        }
        else {
            results = await Food.find(matchQuery);
        }
        res.json(results);
    }
    catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Failed to process AI search' });
    }
});
export default router;
//# sourceMappingURL=search.js.map