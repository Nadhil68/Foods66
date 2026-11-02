import { Router } from 'express';
import { GoogleGenAI, Type } from "@google/genai";
import { Food } from '../models/Food';
import { protect } from '../middlewares/auth';
import { env } from '../config/envConfig';
import { validateBody, aiChatSchema } from '../middlewares/validation';
import { logger } from '../utils/logger';
import rateLimit from 'express-rate-limit';
const router = Router();
const API_KEY = env.GEMINI_API_KEY;
// Rate limit for AI endpoints — stricter than global limit
const aiRateLimit = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 15, // 15 requests per minute per user
    message: { success: false, message: 'AI rate limit exceeded. Please try again shortly.', code: 'AI_RATE_LIMITED' },
    standardHeaders: true,
    legacyHeaders: false,
});
/**
 * @desc    AI Chat Stream — Proxies Gemini calls for the frontend
 * @route   POST /api/ai/chat/stream
 * @access  Private (Authenticated users only)
 *
 * SECURITY: Requires authentication. Rate limited. Uses server-side API key.
 */
router.post('/chat/stream', protect, aiRateLimit, validateBody(aiChatSchema), async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    try {
        const { message, healthProfile, history } = req.body;
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            res.write(`data: ${JSON.stringify({ type: 'error', text: 'Message is required' })}\n\n`);
            res.end();
            return;
        }
        // Truncate message to prevent abuse
        const safeMessage = message.slice(0, 2000);
        // 1. RAG: Fetch available food items
        const foods = await Food.find({ available: true }).lean();
        const menuContext = foods.map(f => `- ${f.name} (ID: ${f._id}): ${f.description} (₹${f.price}) [${f.category}]`).join('\n');
        // 2. Build system instructions
        const systemInstruction = `
You are Chef AI, a health-processing assistant for Foods66.
The user has the following health profile:
Disease: ${healthProfile?.diseaseName || 'None'}
Dietary Guidelines: ${healthProfile?.dietaryMemo || 'None'}

Here is our current live menu:
${menuContext}

When asked about unhealthy foods for their disease, identify common foods in the general diet or menu that are high risk. For each listed food, you must provide:
- Why it's risky for the disease (mechanism or symptom impact)
- Suggested alternatives
- Any caveats (e.g., portion guidance, rare exceptions)

Require a concise, bulleted list mapped to the input diseases. Request clarifications if details are missing (e.g., age, comorbidities, medication interactions).

If the user wants to order food, you MUST use the addToCart tool with the exact food ID from the menu.
If the food is not on the menu, tell them gently. Do not hallucinate foods.
    `;
        // 3. Define the tool
        const tools = [{
                functionDeclarations: [{
                        name: 'addToCart',
                        description: 'Adds a specific food item to the user\'s shopping cart.',
                        parameters: {
                            type: Type.OBJECT,
                            properties: {
                                foodId: { type: Type.STRING, description: 'The exact ID of the food item from the menu.' },
                                quantity: { type: Type.INTEGER, description: 'The number of items to order.' }
                            },
                            required: ['foodId', 'quantity']
                        }
                    }]
            }];
        if (!API_KEY || API_KEY.includes('PLACEHOLDER')) {
            const lowerMsg = safeMessage.toLowerCase();
            let mockText = "I'm your Simulated Chef AI! ";
            if (lowerMsg.includes('breakfast') || lowerMsg.includes('morning')) {
                const breakfastFoods = foods.filter(f => f.category.toLowerCase().includes('breakfast') || f.name.toLowerCase().includes('idli') || f.name.toLowerCase().includes('dosa') || f.name.toLowerCase().includes('poha'));
                if (breakfastFoods.length > 0) {
                    mockText += "For breakfast, I highly recommend: " + breakfastFoods.map(f => f.name).join(', ') + ". ";
                }
                else {
                    mockText += "We have many fresh options that are perfect for breakfast. Check out the menu! ";
                }
            }
            else if (lowerMsg.includes('lunch') || lowerMsg.includes('dinner') || lowerMsg.includes('meal')) {
                const meals = foods.filter(f => f.category.toLowerCase().includes('lunch') || f.category.toLowerCase().includes('dinner') || f.name.toLowerCase().includes('thali') || f.name.toLowerCase().includes('rice'));
                if (meals.length > 0) {
                    mockText += "For a hearty meal, you should try: " + meals.slice(0, 3).map(f => f.name).join(', ') + ". ";
                }
                else {
                    mockText += "Our main courses are packed with nutrition! ";
                }
            }
            else if (lowerMsg.includes('healthy') || lowerMsg.includes('diet') || lowerMsg.includes('sugar')) {
                mockText += "Based on your health profile, I recommend sticking to our low-carb, high-protein options and fresh salads! ";
            }
            else {
                mockText += "I can help you find the best food choices based on your health profile. Try asking me for breakfast or lunch recommendations! ";
            }
            for (const char of mockText.split('')) {
                res.write(`data: ${JSON.stringify({ type: 'text', text: char })}\n\n`);
                await new Promise(r => setTimeout(r, 10));
            }
            res.end();
            return;
        }
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: systemInstruction,
                tools: tools,
            },
            history: (history || []).map((h) => ({ role: h.role, parts: [{ text: h.text }] }))
        });
        const responseStream = await chat.sendMessageStream({ message: safeMessage });
        for await (const chunk of responseStream) {
            if (chunk.functionCalls && chunk.functionCalls.length > 0) {
                const call = chunk.functionCalls[0];
                // SECURITY: Validate function call arguments before forwarding to client
                if (call.name === 'addToCart') {
                    const foodId = call.args?.foodId;
                    const quantity = call.args?.quantity;
                    // Verify the food exists and is available
                    if (foodId) {
                        const foodExists = foods.some(f => f._id.toString() === foodId);
                        if (!foodExists) {
                            res.write(`data: ${JSON.stringify({ type: 'text', text: "I couldn't find that item on our menu. Let me suggest something else!" })}\n\n`);
                            res.end();
                            return;
                        }
                    }
                    // Validate quantity is reasonable (1-20)
                    const safeQty = Math.min(Math.max(1, Number(quantity) || 1), 20);
                    res.write(`data: ${JSON.stringify({ type: 'functionCall', name: call.name, args: { foodId, quantity: safeQty } })}\n\n`);
                }
                res.end();
                return;
            }
            if (chunk.text) {
                res.write(`data: ${JSON.stringify({ type: 'text', text: chunk.text })}\n\n`);
            }
        }
        res.end();
    }
    catch (error) {
        logger.error('AI_STREAM_ERROR', 'AI Chat Stream Error', { error });
        res.write(`data: ${JSON.stringify({ type: 'error', text: 'AI Service Error' })}\n\n`);
        res.end();
    }
});
/**
 * @desc    Get AI recommendations based on context
 * @route   POST /api/ai/recommend
 * @access  Private (Authenticated users only)
 *
 * SECURITY: Requires authentication. Uses server-side API key.
 */
router.post('/recommend', protect, aiRateLimit, async (req, res) => {
    try {
        const { budget, healthProfile, weather, timeOfDay } = req.body;
        const foods = await Food.find({ available: true }).lean();
        if (!API_KEY || API_KEY.includes('PLACEHOLDER')) {
            // Mock Recommendation Logic
            const recommendations = foods.filter(f => f.price <= (budget || 500)).slice(0, 3);
            return res.json(recommendations);
        }
        const menuContext = foods.map(f => `- ${f.name} (ID: ${f._id}): ₹${f.price} [${f.category}]`).join('\n');
        const prompt = `
      You are an expert food recommendation engine.
      Context:
      - Budget: ₹${budget || 'Any'}
      - Time of Day: ${timeOfDay || new Date().getHours() + ':00'}
      - Weather: ${weather || 'Normal'}
      - Dietary Restrictions: ${healthProfile?.dietaryMemo || 'None'}
      
      Menu:
      ${menuContext}
      
      Based on the context, select the top 3 best matching food IDs from the menu.
      Return ONLY a JSON array of strings containing the IDs. Do not return markdown, just the raw JSON array.
    `;
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        try {
            const text = (response.text || '').replace(/```json/g, '').replace(/```/g, '').trim();
            const recommendedIds = JSON.parse(text);
            const recommendedFoods = foods.filter(f => recommendedIds.includes(f._id.toString()));
            res.json(recommendedFoods);
        }
        catch (parseError) {
            logger.warn('AI_RECOMMENDATION_PARSE', 'Failed to parse AI recommendation', { error: parseError });
            res.json(foods.slice(0, 3)); // Fallback
        }
    }
    catch (error) {
        logger.error('AI_RECOMMENDATION_ERROR', 'AI Recommendation Error', { error });
        res.status(500).json({ error: 'Failed to get recommendations' });
    }
});
/**
 * @desc    Health recommendations proxy — replaces direct Gemini calls from frontend
 * @route   POST /api/ai/health-recommendations
 * @access  Private
 *
 * SECURITY: This endpoint replaces the frontend's direct Gemini API call,
 * keeping the API key server-side only.
 */
router.post('/health-recommendations', protect, aiRateLimit, async (req, res) => {
    try {
        const { healthProfile } = req.body;
        if (!healthProfile?.hasIssues || !healthProfile?.diseaseName) {
            res.json([]);
            return;
        }
        const foods = await Food.find({ available: true }).lean();
        if (foods.length === 0) {
            res.json([]);
            return;
        }
        const disease = (healthProfile.diseaseName || '').toLowerCase();
        const memo = (healthProfile.dietaryMemo || '').toLowerCase();
        // Deterministic clinical filter over real DB foods
        let matchedFoods = foods.filter(f => {
            const name = f.name.toLowerCase();
            const desc = (f.description || '').toLowerCase();
            const cat = (f.category || '').toLowerCase();
            // Diabetes / Sugar
            if (disease.includes('diabet') || disease.includes('sugar') || disease.includes('pcos')) {
                if (cat.includes('dessert') || cat.includes('sweet') || name.includes('sweet') || name.includes('halwa') || name.includes('jamun') || name.includes('cake')) {
                    return false;
                }
            }
            // Hypertension / Heart / Cholesterol
            if (disease.includes('pressure') || disease.includes('heart') || disease.includes('bp') || disease.includes('cholesterol') || disease.includes('hypertens')) {
                if (name.includes('fried') || name.includes('fry') || name.includes('butter') || name.includes('pickle')) {
                    return false;
                }
            }
            // Ulcer / GERD / Gastric / Stomach
            if (disease.includes('ulcer') || disease.includes('gerd') || disease.includes('acid') || disease.includes('stomach')) {
                if (name.includes('spicy') || name.includes('chilli') || name.includes('chili') || desc.includes('spicy')) {
                    return false;
                }
            }
            return true;
        });
        if (matchedFoods.length < 6) {
            // If strict filter removed too many, take healthy options from DB
            const generalHealthy = foods.filter(f => f.category === 'Veg' || f.nutritionalInfo?.calories < 400 || f.price < 150);
            matchedFoods = Array.from(new Map([...matchedFoods, ...generalHealthy].map(f => [f._id.toString(), f])).values());
        }
        if (!API_KEY || API_KEY.includes('PLACEHOLDER')) {
            res.json(matchedFoods.slice(0, 15));
            return;
        }
        // If Gemini is available, rank matching foods using LLM
        try {
            const ai = new GoogleGenAI({ apiKey: API_KEY });
            const menuList = matchedFoods.slice(0, 25).map(f => `- ID: ${f._id} | Name: ${f.name} | Category: ${f.category} | Price: ₹${f.price}`).join('\n');
            const prompt = `
        The patient has: ${healthProfile.diseaseName} (Stage ${healthProfile.stage || '1'}).
        Dietary restrictions: ${memo || 'Healthy balanced diet'}.
        
        From this available restaurant menu:
        ${menuList}
        
        Select the top 12 safest and healthiest food IDs for this condition.
        Return ONLY a JSON array of strings containing the exact food IDs from the list above. Example: ["6a96...", "6a97..."]
      `;
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: "application/json" }
            });
            const rawData = (response.text || '').replace(/```json\s*|\s*```/g, '').replace(/```/g, '').trim();
            const selectedIds = JSON.parse(rawData);
            if (Array.isArray(selectedIds) && selectedIds.length > 0) {
                const idSet = new Set(selectedIds.map(String));
                const ranked = matchedFoods.filter(f => idSet.has(f._id.toString()));
                if (ranked.length > 0) {
                    res.json(ranked);
                    return;
                }
            }
        }
        catch (aiRankError) {
            logger.warn('AI_RANK_FALLBACK', 'AI ranking fallback to deterministic matching', { error: aiRankError });
        }
        res.json(matchedFoods.slice(0, 15));
    }
    catch (error) {
        logger.warn('AI_HEALTH_REC_ERROR', 'Health recommendations error', { error });
        res.status(500).json({ success: false, message: 'Failed to retrieve recommendations' });
    }
});
/**
 * @desc    Food safety check proxy — replaces direct Gemini calls from frontend
 * @route   POST /api/ai/food-safety
 * @access  Private
 */
router.post('/food-safety', protect, aiRateLimit, async (req, res) => {
    try {
        const { foodName, healthProfile } = req.body;
        if (!healthProfile?.hasIssues || !foodName) {
            res.json({ safe: true });
            return;
        }
        if (!API_KEY || API_KEY.includes('PLACEHOLDER')) {
            // Return fallback signal — frontend will use offline logic
            res.json({ fallback: true });
            return;
        }
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        const prompt = `
      User: ${healthProfile.diseaseName} (Stage ${healthProfile.stage}).
      Food: ${foodName}.
      Safe to eat? Return JSON: { "safe": boolean, "reason": "string" }
    `;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        const rawData = (response.text || '').replace(/```json\s*|\s*```/g, '').replace(/```/g, '').trim();
        res.json(JSON.parse(rawData));
    }
    catch (error) {
        logger.warn('AI_FOOD_SAFETY_ERROR', 'Food safety check AI error', { error });
        res.json({ fallback: true });
    }
});
export default router;
//# sourceMappingURL=ai.js.map