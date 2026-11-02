import { Router, Request, Response } from 'express';
import { Restaurant } from '../models/Restaurant';
import { protect, authorize, AuthRequest } from '../middlewares/auth';
import { validateBody, reviewSchema } from '../middlewares/validation';
import { GoogleGenAI } from '@google/genai';
import { env } from '../config/envConfig';
import { logger } from '../utils/logger';

const router = Router();

// @desc    Get all verified restaurants
// @route   GET /api/restaurants
// @access  Public
router.get('/', async (_req: Request, res: Response) => {
  try {
    const restaurants = await Restaurant.find({ verificationStatus: 'verified' });
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch restaurants', code: 'RESTAURANTS_FETCH_ERROR' });
  }
});

// @desc    Get restaurant profile for the logged in restaurant owner
// @route   GET /api/restaurants/me
// @access  Private (Restaurant)
router.get('/me', protect, authorize('restaurant'), async (req: AuthRequest, res: Response) => {
  try {
    const restaurant = await Restaurant.findOne({ userId: req.user?._id });
    if (!restaurant) {
      res.status(404).json({ success: false, message: 'Restaurant profile not found', code: 'RESTAURANT_NOT_FOUND' });
      return;
    }
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch restaurant profile', code: 'RESTAURANT_FETCH_ERROR' });
  }
});

// @desc    Create restaurant profile
// @route   POST /api/restaurants
// @access  Private (Restaurant)
router.post('/', protect, authorize('restaurant'), async (req: AuthRequest, res: Response) => {
  try {
    const existing = await Restaurant.findOne({ userId: req.user?._id });
    if (existing) {
      res.status(400).json({ success: false, message: 'Restaurant profile already exists for this user', code: 'PROFILE_EXISTS' });
      return;
    }

    const restaurant = await Restaurant.create({
      ...req.body,
      userId: req.user?._id,
      verificationStatus: 'pending', // Admins must verify
      liveStatus: 'closed'
    });
    res.status(201).json(restaurant);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create restaurant', code: 'RESTAURANT_CREATE_ERROR' });
  }
});

// @desc    Update restaurant live status
// @route   PUT /api/restaurants/me/status
// @access  Private (Restaurant)
router.put('/me/status', protect, authorize('restaurant'), async (req: AuthRequest, res: Response) => {
  try {
    const { liveStatus } = req.body;
    if (!['open', 'closed'].includes(liveStatus)) {
      res.status(400).json({ success: false, message: 'Invalid live status. Allowed: open, closed', code: 'INVALID_STATUS' });
      return;
    }

    const restaurant = await Restaurant.findOneAndUpdate(
      { userId: req.user?._id },
      { liveStatus },
      { new: true }
    );
    
    if (!restaurant) {
      res.status(404).json({ success: false, message: 'Restaurant profile not found', code: 'RESTAURANT_NOT_FOUND' });
      return;
    }
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update status', code: 'STATUS_UPDATE_ERROR' });
  }
});

// @desc    Verify restaurant
// @route   PUT /api/restaurants/:id/verify
// @access  Private (Admin)
router.put('/:id/verify', protect, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!['verified', 'rejected', 'pending'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid verification status', code: 'INVALID_STATUS' });
      return;
    }

    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { verificationStatus: status },
      { new: true }
    );

    if (!restaurant) {
      res.status(404).json({ success: false, message: 'Restaurant not found', code: 'RESTAURANT_NOT_FOUND' });
      return;
    }
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to verify restaurant', code: 'VERIFICATION_ERROR' });
  }
});

// @desc    Add review to restaurant (AI Sentiment Analysis)
// @route   POST /api/restaurants/:id/reviews
// @access  Private (Authenticated users only)
router.post('/:id/reviews', protect, validateBody(reviewSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { text } = req.body;

    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      res.status(404).json({ success: false, message: 'Restaurant not found', code: 'RESTAURANT_NOT_FOUND' });
      return;
    }

    // Call Gemini API for sentiment analysis (score from -1.0 to 1.0)
    let sentimentScore = 0;
    if (env.GEMINI_API_KEY && !env.GEMINI_API_KEY.includes('PLACEHOLDER')) {
      try {
        const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
        const prompt = `Analyze the sentiment of the following restaurant review. Return a single number between -1.0 (extremely negative) and 1.0 (extremely positive). Do not include any other text, just the number.\n\nReview: "${text}"`;
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt
        });
        const resultText = (response.text || '').trim();
        sentimentScore = parseFloat(resultText);
        if (isNaN(sentimentScore)) sentimentScore = 0;
      } catch (aiError) {
        logger.warn('AI_SENTIMENT_ERROR', 'AI Sentiment Analysis failed, defaulting to neutral', { error: aiError });
        sentimentScore = 0;
      }
    }

    // Add review
    if (!restaurant.reviews) restaurant.reviews = [];
    restaurant.reviews.push({ text, sentimentScore, date: new Date() });

    // Recalculate average restaurant rating based on AI sentiments (map -1 to 1 into 1 to 5 stars)
    const avgSentiment = restaurant.reviews.reduce((acc, rev) => acc + rev.sentimentScore, 0) / restaurant.reviews.length;
    const newRating = Math.max(1, Math.min(5, (avgSentiment + 1) * 2 + 1));
    restaurant.rating = parseFloat(newRating.toFixed(1));

    await restaurant.save();

    res.json({ success: true, message: 'Review added', rating: restaurant.rating, sentimentScore });
  } catch (error) {
    logger.error('ADD_REVIEW_ERROR', 'Failed to add review', { error });
    res.status(500).json({ success: false, message: 'Failed to add review', code: 'REVIEW_ERROR' });
  }
});

export default router;
