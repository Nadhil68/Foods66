import express, { Router, Request, Response } from 'express';
import { Food, generateFoodImagePath } from '../models/Food';
import { getCache, setCache } from '../services/cacheService';
import { protect, authorize, AuthRequest } from '../middlewares/auth';
import { validateBody, createFoodSchema, updateFoodSchema } from '../middlewares/validation';
import { applyDynamicPrice } from '../services/pricingService';
import fs from 'fs';
import path from 'path';

const router = Router();

// Get all foods
router.get('/', async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string;
    const search = (req.query.search || req.query.q) as string;
    const cacheKey = (category || search) ? `foods:filter:${category || ''}:${search || ''}` : 'foods:all';

    let foods = await getCache(cacheKey);

    if (!foods) {
      const filter: any = {};
      if (category && category !== 'All') {
        filter.category = category;
      }
      if (search && search.trim()) {
        const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escaped, 'i');
        filter.$or = [
          { name: regex },
          { description: regex },
          { category: regex }
        ];
      }
      foods = await Food.find(filter).lean();
      await setCache(cacheKey, foods, 300);
    }
    
    // Dynamic Pricing Logic: Use centralized pricing service
    const now = new Date();
    foods = foods.map((food: any) => {
      const dynamicPrice = applyDynamicPrice(food.price, now);
      if (dynamicPrice !== food.price) {
        return {
          ...food,
          originalPrice: food.price,
          price: dynamicPrice
        };
      }
      return food;
    });

    res.json(foods);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch foods', code: 'FOODS_FETCH_ERROR' });
  }
});

// Search and filter foods using Aggregation Pipeline
router.get('/search/aggregate', async (req: Request, res: Response) => {
  try {
    const { category, minPrice, maxPrice, sort } = req.query;

    const pipeline: any[] = [];

    // Match stage
    const matchStage: any = {};
    if (category) matchStage.category = category;
    if (minPrice || maxPrice) {
      matchStage.price = {};
      if (minPrice) matchStage.price.$gte = Number(minPrice);
      if (maxPrice) matchStage.price.$lte = Number(maxPrice);
    }
    
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // Sort stage
    if (sort === 'price_asc') pipeline.push({ $sort: { price: 1 } });
    else if (sort === 'price_desc') pipeline.push({ $sort: { price: -1 } });

    const foods = await Food.aggregate(pipeline.length > 0 ? pipeline : [{ $match: {} }]);
    res.json(foods);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to aggregate foods', code: 'FOODS_AGGREGATE_ERROR' });
  }
});

// Get food by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const food = await Food.findById(req.params.id);
    if (!food) {
      res.status(404).json({ success: false, message: 'Food not found', code: 'FOOD_NOT_FOUND' });
      return;
    }
    res.json(food);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch food', code: 'FOOD_FETCH_ERROR' });
  }
});

/**
 * @desc    Create food
 * @route   POST /api/foods
 * @access  Private (Admin, Restaurant)
 * 
 * SECURITY: Requires authentication and admin/restaurant role.
 */
router.post('/', protect, authorize('admin', 'restaurant'), validateBody(createFoodSchema), async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body;

    // Validate image format (must be a relative path or URL)
    const imageValue: string = body.image;
    if (!imageValue.startsWith('/') && !imageValue.startsWith('http')) {
      res.status(400).json({ success: false, message: 'Image must be a valid path (starting with /) or a URL', code: 'INVALID_IMAGE' });
      return;
    }

    const food = new Food(body);
    await food.save();
    res.status(201).json(food);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create food', code: 'FOOD_CREATE_ERROR' });
  }
});

/**
 * @desc    Update food
 * @route   PUT /api/foods/:id
 * @access  Private (Admin, Restaurant)
 * 
 * SECURITY: Requires authentication and admin/restaurant role.
 * Old images are only deleted AFTER the database update succeeds (safe replacement).
 */
router.put('/:id', protect, authorize('admin', 'restaurant'), validateBody(updateFoodSchema), async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body;
    const existing = await Food.findById(req.params.id);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Food not found', code: 'FOOD_NOT_FOUND' });
      return;
    }

    // Auto-generate image path if being cleared
    if (body.image !== undefined && (body.image === null || (typeof body.image === 'string' && body.image.trim() === ''))) {
      body.image = generateFoodImagePath(existing.name);
    }

    // Track old image before update
    const oldImage = existing.image;
    const imageChanged = body.image && body.image !== oldImage && oldImage.startsWith('/uploads/foods/');

    // Update database FIRST (safe replacement pattern)
    const food = await Food.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });

    // Only delete old images AFTER successful database update
    if (imageChanged && food) {
      const baseName = oldImage.replace('.webp', '');
      const toDelete = [
        oldImage,
        `${baseName}-medium.webp`,
        `${baseName}-thumb.webp`
      ];

      toDelete.forEach(img => {
        const absolutePath = path.join(__dirname, '../../', img);
        if (fs.existsSync(absolutePath)) {
          try {
            fs.unlinkSync(absolutePath);
          } catch (err) {
            console.error('Failed to delete old image:', img, err);
          }
        }
      });
    }

    res.json(food);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update food', code: 'FOOD_UPDATE_ERROR' });
  }
});

/**
 * @desc    Delete food
 * @route   DELETE /api/foods/:id
 * @access  Private (Admin, Restaurant)
 * 
 * SECURITY: Requires authentication and admin/restaurant role.
 */
router.delete('/:id', protect, authorize('admin', 'restaurant'), async (req: AuthRequest, res: Response) => {
  try {
    const food = await Food.findByIdAndDelete(req.params.id);
    if (!food) {
      res.status(404).json({ success: false, message: 'Food not found', code: 'FOOD_NOT_FOUND' });
      return;
    }
    res.json({ success: true, message: 'Food deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete food', code: 'FOOD_DELETE_ERROR' });
  }
});

/**
 * @desc    Admin: Backfill missing image paths for all existing food records
 * @route   POST /api/foods/admin/fix-images
 * @access  Private (Admin only)
 * 
 * SECURITY: Now requires admin authentication.
 */
router.post('/admin/fix-images', protect, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const foods = await Food.find({ $or: [{ image: { $exists: false } }, { image: '' }, { image: null }] });
    let fixed = 0;

    for (const food of foods) {
      food.image = generateFoodImagePath(food.name);
      await food.save();
      fixed++;
    }

    res.json({
      success: true,
      message: `Image paths backfilled successfully`,
      totalFixed: fixed,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to backfill images', code: 'BACKFILL_ERROR' });
  }
});

export default router;
