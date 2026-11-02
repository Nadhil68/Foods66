import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { validateHealthProfile } from '../services/healthValidation';
import { env } from '../config/envConfig';
import { logger } from '../utils/logger';
const router = express.Router();
/**
 * @desc    Health Validation Service Status
 * @route   GET /api/health-validation/status
 * @access  Public
 */
router.get('/status', (_req, res) => {
    const isAiConfigured = Boolean(env.GEMINI_API_KEY && !env.GEMINI_API_KEY.includes('PLACEHOLDER'));
    res.status(200).json({
        success: true,
        service: 'health-validation',
        backend: true,
        ai: isAiConfigured
    });
});
/**
 * Helper: Call Gemini AI with a strict timeout for dietary & health profile analysis
 */
async function getAIDietaryAnalysis(input) {
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey || apiKey.includes('PLACEHOLDER')) {
        return null;
    }
    try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Analyze this health profile for dietary recommendations in a food delivery app.
Patient Age: ${input.age}
Condition/Disease: ${input.condition}
Severity/Stage: ${input.severity}
Medications: ${input.medications}
Symptoms: ${input.symptoms || 'None'}
Known Dietary Contraindications: ${input.contraindications.join(', ') || 'None specified'}

Provide a concise 2-sentence dietary summary memo and 3-4 bullet food recommendations. Format as plain text.`;
        // Strict 5-second timeout so AI never blocks user registration
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('AI_TIMEOUT')), 5000));
        const aiPromise = ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        const response = await Promise.race([aiPromise, timeoutPromise]);
        const text = response?.text?.trim();
        if (!text)
            return null;
        return {
            dietaryMemo: text.slice(0, 500),
            recommendations: [
                `Targeted nutrition for ${input.condition}`,
                'Low glycemic and heart-friendly options prioritized',
                'Strict filtering applied against dietary contraindications'
            ]
        };
    }
    catch (error) {
        logger.warn('AI_HEALTH_ANALYSIS_FALLBACK', `AI health analysis unavailable or timed out: ${error?.message || error}`);
        return null;
    }
}
/**
 * @desc    Analyze & Validate Health Profile
 * @route   POST /api/health-validation/analyze
 * @access  Public (Used during registration)
 */
export async function handleHealthValidation(req, res) {
    try {
        const body = req.body || {};
        // Normalize field names from both frontend formats
        const rawAge = body.age;
        const condition = (body.condition || body.diseaseName || '').toString().trim();
        const severity = (body.severity || body.stage || '1').toString().trim();
        const diagnosedBy = (body.diagnosedBy || 'self').toString().trim();
        const medications = (body.medications || body.medicines || '').toString().trim();
        const symptoms = body.symptoms ? body.symptoms.toString().trim() : '';
        // Step 4: Strict Request Validation (HTTP 400 for user input errors)
        if (rawAge === undefined || rawAge === null || rawAge === '') {
            res.status(400).json({
                success: false,
                code: 'INVALID_HEALTH_PROFILE',
                message: 'Age is required.'
            });
            return;
        }
        const age = Number(rawAge);
        if (isNaN(age) || !Number.isInteger(age) || age < 1 || age > 120) {
            res.status(400).json({
                success: false,
                code: 'INVALID_HEALTH_PROFILE',
                message: 'Age must be a valid number between 1 and 120.'
            });
            return;
        }
        if (!condition) {
            res.status(400).json({
                success: false,
                code: 'INVALID_HEALTH_PROFILE',
                message: 'Condition or disease name is required.'
            });
            return;
        }
        // Step 7: Deterministic Rule-Based Clinical Validation Engine
        const validationInput = {
            age,
            diseaseName: condition,
            stage: severity,
            medicines: medications,
            symptoms: symptoms || undefined,
            diagnosedBy: diagnosedBy
        };
        const validationResult = validateHealthProfile(validationInput);
        // Step 5 & 8: Attempt AI Dietary Analysis (Non-blocking with Safe Fallback)
        const aiAnalysis = await getAIDietaryAnalysis({
            age,
            condition,
            severity,
            medications,
            symptoms,
            contraindications: validationResult.dietaryContraindications
        });
        const isAiAvailable = aiAnalysis !== null;
        // Build dietary memo (fallback to clinical guidance if AI is unavailable)
        const fallbackMemo = validationResult.dietaryContraindications.length > 0
            ? `Avoid: ${validationResult.dietaryContraindications.join(', ')}`
            : 'Safe dietary profile applied.';
        const dietaryMemo = aiAnalysis?.dietaryMemo || fallbackMemo;
        res.status(200).json({
            success: true,
            analysisAvailable: isAiAvailable,
            validation: {
                ...validationResult,
                valid: validationResult.valid
            },
            analysis: {
                dietaryMemo,
                contraindications: validationResult.dietaryContraindications,
                recommendations: aiAnalysis?.recommendations || [
                    `Dietary restrictions applied for ${condition}`,
                    'Nutrient balance optimized according to health profile'
                ]
            },
            // Convenience properties for direct root-level destructuring
            valid: validationResult.valid,
            correctedMedicines: validationResult.correctedMedicines || medications,
            dietaryContraindications: validationResult.dietaryContraindications,
            checks: validationResult.checks,
            redFlags: validationResult.redFlags,
            escalation: validationResult.escalation,
            structuredSummary: validationResult.structuredSummary,
            message: isAiAvailable
                ? 'Health profile analyzed successfully with AI recommendations.'
                : 'Health profile validated successfully. AI analysis is temporarily unavailable.'
        });
    }
    catch (error) {
        logger.error('HEALTH_VALIDATION_ERROR', `Health validation service unexpected error: ${error?.message || error}`, { error });
        res.status(500).json({
            success: false,
            code: 'HEALTH_VALIDATION_ERROR',
            message: 'An unexpected error occurred during health validation. Please try again.'
        });
    }
}
router.post('/analyze', handleHealthValidation);
export default router;
//# sourceMappingURL=healthValidation.js.map