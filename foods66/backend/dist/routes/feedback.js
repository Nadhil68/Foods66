import { Router } from 'express';
import { protect } from '../middlewares/auth';
import { Feedback } from '../models/Feedback';
import { Order } from '../models/Order';
import { validateBody, feedbackSchema } from '../middlewares/validation';
import { logger } from '../utils/logger';
const router = Router();
// @desc    Submit feedback for an order
// @route   POST /api/feedback
// @access  Private (Owner of the order)
router.post('/', protect, validateBody(feedbackSchema), async (req, res) => {
    try {
        const { orderId, rating, deliveryRating, comment } = req.body;
        const userId = req.user?._id?.toString();
        // Verify order exists and belongs to this user
        const order = await Order.findById(orderId);
        if (!order) {
            res.status(404).json({ success: false, message: 'Order not found', code: 'ORDER_NOT_FOUND' });
            return;
        }
        if (req.user?.role !== 'admin' && order.userId !== userId) {
            logger.security('FEEDBACK_UNAUTHORIZED_SUBMISSION', 'User attempted to submit feedback for another user\'s order', {
                userId,
                orderUserId: order.userId,
                orderId,
            });
            res.status(403).json({ success: false, message: 'You can only submit feedback for your own orders', code: 'FORBIDDEN' });
            return;
        }
        // Check if feedback already exists for this order
        const existing = await Feedback.findOne({ orderId });
        if (existing) {
            res.status(409).json({ success: false, message: 'Feedback already submitted for this order', code: 'FEEDBACK_EXISTS' });
            return;
        }
        const feedback = await Feedback.create({
            orderId,
            userId: req.user?._id,
            rating,
            deliveryRating,
            comment: comment || '',
        });
        res.status(201).json({ success: true, feedback });
    }
    catch (error) {
        logger.error('FEEDBACK_CREATION_ERROR', 'Feedback creation error', { error });
        res.status(500).json({ success: false, message: 'Failed to submit feedback', code: 'FEEDBACK_ERROR' });
    }
});
// @desc    Get feedback for an order
// @route   GET /api/feedback/:orderId
// @access  Private (Owner or Admin/Restaurant)
router.get('/:orderId', protect, async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user?._id?.toString();
        const order = await Order.findById(orderId);
        if (!order) {
            res.status(404).json({ success: false, message: 'Order not found', code: 'ORDER_NOT_FOUND' });
            return;
        }
        // Role / ownership check
        if (req.user?.role === 'customer' && order.userId !== userId) {
            res.status(403).json({ success: false, message: 'Not authorized to view feedback for this order', code: 'FORBIDDEN' });
            return;
        }
        const feedback = await Feedback.findOne({ orderId });
        if (!feedback) {
            res.status(404).json({ success: false, message: 'No feedback found for this order', code: 'FEEDBACK_NOT_FOUND' });
            return;
        }
        res.json({ success: true, feedback });
    }
    catch (error) {
        logger.error('FEEDBACK_FETCH_ERROR', 'Failed to fetch feedback', { error });
        res.status(500).json({ success: false, message: 'Failed to fetch feedback', code: 'FEEDBACK_FETCH_ERROR' });
    }
});
export default router;
//# sourceMappingURL=feedback.js.map