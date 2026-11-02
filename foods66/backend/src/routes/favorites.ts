import { Router, Response } from 'express';
import { ObjectIdMock } from '../models/firestoreModel';
import { Favorite } from '../models/Favorite';
import { Food } from '../models/Food';
import { protect, AuthRequest } from '../middlewares/auth';

const router = Router();

/**
 * @desc    Get user's favorite foods
 * @route   GET /api/favorites
 * @access  Private
 */
router.get('/', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) {
      res.status(401).json({ success: false, message: 'Not authorized', code: 'UNAUTHORIZED' });
      return;
    }

    const favorites = await Favorite.find({ userId }).sort({ createdAt: -1 });
    const foodIds = favorites.map(f => f.foodId);

    // Fetch full food details for each favorite
    const foods = await Food.find({ _id: { $in: foodIds } }).lean();
    const foodMap = new Map(foods.map(f => [(f as any)._id.toString(), f]));

    const result = favorites
      .map(fav => {
        const food = foodMap.get(fav.foodId);
        if (!food) return null;
        return {
          _id: fav._id,
          foodId: fav.foodId,
          food,
          createdAt: fav.createdAt,
        };
      })
      .filter(Boolean);

    res.json({ success: true, count: result.length, favorites: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch favorites', code: 'FAVORITES_FETCH_ERROR' });
  }
});

/**
 * @desc    Add food to favorites
 * @route   POST /api/favorites
 * @access  Private
 */
router.post('/', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    const { foodId } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Not authorized', code: 'UNAUTHORIZED' });
      return;
    }

    if (!foodId || !ObjectIdMock.isValid(foodId)) {
      res.status(400).json({ success: false, message: 'Valid food ID is required', code: 'INVALID_FOOD_ID' });
      return;
    }

    // Verify food exists
    const food = await Food.findById(foodId);
    if (!food) {
      res.status(404).json({ success: false, message: 'Food item not found', code: 'FOOD_NOT_FOUND' });
      return;
    }

    // Check if already favorited
    const existing = await Favorite.findOne({ userId, foodId });
    if (existing) {
      res.status(409).json({ success: false, message: 'Food is already in favorites', code: 'ALREADY_FAVORITED' });
      return;
    }

    const favorite = await Favorite.create({ userId, foodId });
    res.status(201).json({ success: true, message: 'Added to favorites', favorite });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add favorite', code: 'FAVORITE_ADD_ERROR' });
  }
});

/**
 * @desc    Remove food from favorites
 * @route   DELETE /api/favorites/:foodId
 * @access  Private
 */
router.delete('/:foodId', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    const { foodId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Not authorized', code: 'UNAUTHORIZED' });
      return;
    }

    const result = await Favorite.findOneAndDelete({ userId, foodId });
    if (!result) {
      res.status(404).json({ success: false, message: 'Favorite not found', code: 'FAVORITE_NOT_FOUND' });
      return;
    }

    res.json({ success: true, message: 'Removed from favorites' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to remove favorite', code: 'FAVORITE_REMOVE_ERROR' });
  }
});

/**
 * @desc    Check if a food is favorited by current user
 * @route   GET /api/favorites/check/:foodId
 * @access  Private
 */
router.get('/check/:foodId', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    const { foodId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Not authorized', code: 'UNAUTHORIZED' });
      return;
    }

    const favorite = await Favorite.findOne({ userId, foodId });
    res.json({ success: true, isFavorited: !!favorite });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to check favorite status', code: 'FAVORITE_CHECK_ERROR' });
  }
});

export default router;
