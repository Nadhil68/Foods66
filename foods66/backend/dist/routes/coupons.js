import { Router } from 'express';
import { Coupon } from '../models/Coupon';
import { Order } from '../models/Order';
import { Food } from '../models/Food';
import { protect, authorize } from '../middlewares/auth';
const router = Router();
/**
 * Helper to calculate coupon discount on an order
 */
export const calculateCouponDiscount = async (code, userId, items) => {
    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (!coupon) {
        return { isValid: false, discountAmount: 0, deliveryFeeDiscount: 0, finalSubtotal: 0, message: 'Invalid coupon code', code: 'INVALID_COUPON' };
    }
    const now = new Date();
    if (!coupon.active) {
        return { isValid: false, discountAmount: 0, deliveryFeeDiscount: 0, finalSubtotal: 0, message: 'This coupon is no longer active', code: 'COUPON_INACTIVE' };
    }
    if (coupon.startDate && now < coupon.startDate) {
        return { isValid: false, discountAmount: 0, deliveryFeeDiscount: 0, finalSubtotal: 0, message: 'This coupon is not yet active', code: 'COUPON_NOT_STARTED' };
    }
    if (coupon.expiryDate && now > coupon.expiryDate) {
        return { isValid: false, discountAmount: 0, deliveryFeeDiscount: 0, finalSubtotal: 0, message: 'Coupon has expired', code: 'COUPON_EXPIRED' };
    }
    if (coupon.usedCount >= coupon.usageLimit) {
        return { isValid: false, discountAmount: 0, deliveryFeeDiscount: 0, finalSubtotal: 0, message: 'Coupon usage limit reached', code: 'COUPON_LIMIT_REACHED' };
    }
    // Check per-user limit
    const userUsageCount = await Order.countDocuments({
        userId,
        couponCode: coupon.code,
        status: { $nin: ['CANCELLED', 'REFUNDED'] }
    });
    if (userUsageCount >= coupon.perUserLimit) {
        return { isValid: false, discountAmount: 0, deliveryFeeDiscount: 0, finalSubtotal: 0, message: 'You have reached your limit for this coupon', code: 'COUPON_USER_LIMIT_REACHED' };
    }
    // Calculate actual subtotal
    let subtotal = 0;
    const itemCategories = [];
    const itemFoodIds = [];
    if (typeof items === 'number') {
        subtotal = items;
    }
    else if (Array.isArray(items)) {
        for (const it of items) {
            const food = await Food.findById(it.foodId);
            if (food) {
                subtotal += food.price * Number(it.quantity);
                if (food.category)
                    itemCategories.push(food.category);
                itemFoodIds.push(food._id.toString());
            }
        }
    }
    if (subtotal < coupon.minimumOrderAmount) {
        return {
            isValid: false,
            discountAmount: 0,
            deliveryFeeDiscount: 0,
            finalSubtotal: subtotal,
            message: `Minimum order amount of ₹${coupon.minimumOrderAmount} required for this coupon`,
            code: 'MINIMUM_ORDER_NOT_MET'
        };
    }
    // Check Category & Food restrictions
    if (coupon.applicableCategories && coupon.applicableCategories.length > 0 && itemCategories.length > 0) {
        const matched = itemCategories.some(c => coupon.applicableCategories.includes(c));
        if (!matched) {
            return {
                isValid: false,
                discountAmount: 0,
                deliveryFeeDiscount: 0,
                finalSubtotal: subtotal,
                message: 'Coupon is not applicable to categories in your cart',
                code: 'COUPON_NOT_APPLICABLE'
            };
        }
    }
    if (coupon.applicableFoods && coupon.applicableFoods.length > 0 && itemFoodIds.length > 0) {
        const matched = itemFoodIds.some(f => coupon.applicableFoods.includes(f));
        if (!matched) {
            return {
                isValid: false,
                discountAmount: 0,
                deliveryFeeDiscount: 0,
                finalSubtotal: subtotal,
                message: 'Coupon is not applicable to the selected items',
                code: 'COUPON_NOT_APPLICABLE'
            };
        }
    }
    let discountAmount = 0;
    let deliveryFeeDiscount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
        let calculated = Math.round((subtotal * coupon.discountValue) / 100);
        if (coupon.maximumDiscount && calculated > coupon.maximumDiscount) {
            calculated = coupon.maximumDiscount;
        }
        discountAmount = Math.min(calculated, subtotal);
    }
    else if (coupon.discountType === 'FIXED_AMOUNT') {
        discountAmount = Math.min(coupon.discountValue, subtotal);
    }
    else if (coupon.discountType === 'FREE_DELIVERY') {
        deliveryFeeDiscount = 40;
        discountAmount = 40;
    }
    return {
        isValid: true,
        coupon: {
            _id: coupon._id,
            code: coupon.code,
            description: coupon.description,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            minimumOrderAmount: coupon.minimumOrderAmount,
            maximumDiscount: coupon.maximumDiscount,
            expiryDate: coupon.expiryDate
        },
        discountAmount,
        deliveryFeeDiscount,
        finalSubtotal: Math.max(0, subtotal - discountAmount)
    };
};
/**
 * @desc    Validate coupon code
 * @route   POST /api/coupons/validate
 * @access  Private
 */
router.post('/validate', protect, async (req, res) => {
    try {
        const { code, items, orderAmount, subtotal } = req.body;
        const userId = req.user?._id?.toString() || '';
        if (!code) {
            res.status(400).json({ success: false, message: 'Coupon code is required', code: 'MISSING_CODE' });
            return;
        }
        const targetItems = items || (orderAmount || subtotal || 0);
        const result = await calculateCouponDiscount(code, userId, targetItems);
        if (!result.isValid) {
            res.status(400).json({
                success: false,
                message: result.message || 'Invalid coupon',
                code: result.code || 'COUPON_ERROR'
            });
            return;
        }
        res.json({
            success: true,
            coupon: result.coupon,
            discountAmount: result.discountAmount,
            deliveryFeeDiscount: result.deliveryFeeDiscount,
            finalSubtotal: result.finalSubtotal
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to validate coupon', code: 'COUPON_VALIDATE_ERROR' });
    }
});
/**
 * @desc    Apply coupon (Registers intent for checkout)
 * @route   POST /api/coupons/apply
 * @access  Private
 */
router.post('/apply', protect, async (req, res) => {
    try {
        const { code, items, subtotal } = req.body;
        const userId = req.user?._id?.toString() || '';
        const result = await calculateCouponDiscount(code, userId, items || subtotal || 0);
        if (!result.isValid) {
            res.status(400).json({
                success: false,
                message: result.message || 'Cannot apply coupon',
                code: result.code || 'COUPON_APPLY_ERROR'
            });
            return;
        }
        res.json({
            success: true,
            message: '✓ Coupon applied successfully',
            coupon: result.coupon,
            discountAmount: result.discountAmount,
            deliveryFeeDiscount: result.deliveryFeeDiscount
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to apply coupon', code: 'COUPON_APPLY_FAILED' });
    }
});
/**
 * @desc    Remove applied coupon
 * @route   POST /api/coupons/remove
 * @access  Private
 */
router.post('/remove', protect, async (_req, res) => {
    res.json({
        success: true,
        message: 'Coupon removed'
    });
});
// ─────────────────────────────────────────────────────────────
// ADMIN COUPON CRUD ENDPOINTS
// ─────────────────────────────────────────────────────────────
/**
 * @desc    Get all coupons
 * @route   GET /api/admin/coupons and GET /api/coupons
 * @access  Private (Admin)
 */
const getCouponsHandler = async (_req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.json({ success: true, count: coupons.length, coupons });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch coupons', code: 'COUPONS_FETCH_ERROR' });
    }
};
router.get('/', protect, authorize('admin'), getCouponsHandler);
/**
 * @desc    Create new coupon
 * @route   POST /api/admin/coupons and POST /api/coupons
 * @access  Private (Admin)
 */
const createCouponHandler = async (req, res) => {
    try {
        const { code, description, discountType, discountValue, minimumOrderAmount, maximumDiscount, startDate, expiryDate, usageLimit, perUserLimit, applicableCategories, applicableFoods } = req.body;
        if (!code || !discountType || discountValue === undefined || !expiryDate) {
            res.status(400).json({
                success: false,
                message: 'code, discountType, discountValue, and expiryDate are required',
                code: 'MISSING_FIELDS'
            });
            return;
        }
        const codeUpper = code.trim().toUpperCase();
        const existing = await Coupon.findOne({ code: codeUpper });
        if (existing) {
            res.status(409).json({ success: false, message: 'Coupon code already exists', code: 'DUPLICATE_CODE' });
            return;
        }
        const coupon = await Coupon.create({
            code: codeUpper,
            description: description || '',
            discountType,
            discountValue: Number(discountValue),
            minimumOrderAmount: Number(minimumOrderAmount) || 0,
            maximumDiscount: maximumDiscount ? Number(maximumDiscount) : undefined,
            startDate: startDate ? new Date(startDate) : new Date(),
            expiryDate: new Date(expiryDate),
            usageLimit: Number(usageLimit) || 100,
            perUserLimit: Number(perUserLimit) || 1,
            active: true,
            applicableCategories: applicableCategories || [],
            applicableFoods: applicableFoods || []
        });
        res.status(201).json({ success: true, message: 'Coupon created successfully', coupon });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create coupon', code: 'COUPON_CREATE_ERROR' });
    }
};
router.post('/', protect, authorize('admin'), createCouponHandler);
/**
 * @desc    Update coupon
 * @route   PUT /api/admin/coupons/:id
 * @access  Private (Admin)
 */
router.put('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        if (req.body.code) {
            req.body.code = req.body.code.trim().toUpperCase();
        }
        const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!coupon) {
            res.status(404).json({ success: false, message: 'Coupon not found', code: 'COUPON_NOT_FOUND' });
            return;
        }
        res.json({ success: true, message: 'Coupon updated successfully', coupon });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update coupon', code: 'COUPON_UPDATE_ERROR' });
    }
});
/**
 * @desc    Delete coupon
 * @route   DELETE /api/admin/coupons/:id
 * @access  Private (Admin)
 */
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndDelete(req.params.id);
        if (!coupon) {
            res.status(404).json({ success: false, message: 'Coupon not found', code: 'COUPON_NOT_FOUND' });
            return;
        }
        res.json({ success: true, message: 'Coupon deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete coupon', code: 'COUPON_DELETE_ERROR' });
    }
});
export default router;
//# sourceMappingURL=coupons.js.map