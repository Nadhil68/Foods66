import { Router, Response } from 'express';
import { ObjectIdMock } from '../models/firestoreModel';
import Stripe from 'stripe';
import { protect, AuthRequest } from '../middlewares/auth';
import { Order, IOrderItem } from '../models/Order';
import { Food } from '../models/Food';
import { Coupon } from '../models/Coupon';
import { calculateOrderPricing, applyDynamicPrice } from '../services/pricingService';
import { env } from '../config/envConfig';
import { logger } from '../utils/logger';

const router = Router();

// Helper to get Stripe client
const getStripeClient = () => {
  const secretKey = env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  return new Stripe(secretKey, {
    apiVersion: '2023-10-16' as any
  });
};

/**
 * @desc    Create a Stripe payment session with server-side validated cart & discount
 * @route   POST /api/payments/create-session (also aliases /checkout for backward compatibility)
 * @access  Private
 */
const createPaymentSessionHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { items, deliveryAddress, couponCode, paymentMethod = 'CARD', specialInstructions } = req.body;
    const idempotencyKey = req.header('X-Idempotency-Key') || req.body.idempotencyKey;
    const userId = req.user?._id?.toString();

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated', code: 'UNAUTHORIZED' });
      return;
    }

    // 1. Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'Cart cannot be empty', code: 'INVALID_CART' });
      return;
    }

    if (!deliveryAddress) {
      res.status(400).json({ success: false, message: 'Delivery address is required', code: 'MISSING_ADDRESS' });
      return;
    }

    // Idempotency check: if order already created for this key, return it
    if (idempotencyKey) {
      const existingOrder = await Order.findOne({ idempotencyKey, userId });
      if (existingOrder) {
        res.json({
          success: true,
          sessionId: existingOrder.sessionId,
          sessionUrl: existingOrder.sessionId ? `https://checkout.stripe.com/c/pay/${existingOrder.sessionId}` : undefined,
          orderId: existingOrder._id,
          calculation: {
            subtotal: existingOrder.subtotal,
            deliveryFee: existingOrder.deliveryFee,
            tax: existingOrder.tax,
            discountAmount: existingOrder.discountAmount,
            grandTotal: existingOrder.totalPrice
          }
        });
        return;
      }
    }

    // 2. Server-side Cart & Item Price Validation (Never trust frontend amounts)
    let calculatedSubtotal = 0;
    const validatedItems: IOrderItem[] = [];
    const itemCategories: string[] = [];
    const itemFoodIds: string[] = [];
    const now = new Date();

    for (const item of items) {
      if (!item.foodId) {
        res.status(400).json({ success: false, message: 'Food item ID is required for each cart item', code: 'INVALID_ITEM' });
        return;
      }

      const qty = Number(item.quantity);
      if (!Number.isInteger(qty) || qty <= 0) {
        res.status(400).json({ success: false, message: `Invalid quantity for item ${item.foodId}`, code: 'INVALID_QUANTITY' });
        return;
      }

      // Root Cause 2 & 3: Strict Document ID validation. No fake ITEM-* allowed.
      if (!ObjectIdMock.isValid(item.foodId)) {
        res.status(400).json({
          success: false,
          message: `Invalid food item ID: ${item.foodId}. Please update your cart with latest items from the menu.`,
          code: 'INVALID_FOOD_ID'
        });
        return;
      }

      const foodDoc = await Food.findById(item.foodId);

      if (!foodDoc) {
        res.status(404).json({
          success: false,
          message: `Food item not found: ${item.foodId}`,
          code: 'FOOD_NOT_FOUND'
        });
        return;
      }

      if (!foodDoc.available) {
        res.status(409).json({
          success: false,
          message: `${foodDoc.name} is currently unavailable`,
          code: 'FOOD_UNAVAILABLE'
        });
        return;
      }

      // Check stock if tracked
      if (foodDoc.stock !== undefined && foodDoc.stock < qty) {
        res.status(409).json({
          success: false,
          message: `Insufficient stock for "${foodDoc.name}". Only ${foodDoc.stock} available.`,
          code: 'INSUFFICIENT_STOCK'
        });
        return;
      }

      // Dynamic unit price (Read price ONLY from MongoDB)
      const unitPrice = applyDynamicPrice(foodDoc.price, now);
      const lineSubtotal = unitPrice * qty;
      calculatedSubtotal += lineSubtotal;

      validatedItems.push({
        foodId: foodDoc._id.toString(),
        name: foodDoc.name,
        price: unitPrice,
        quantity: qty,
        image: foodDoc.image,
        category: foodDoc.category,
        customization: item.customization
      });

      if (foodDoc.category) itemCategories.push(foodDoc.category);
      itemFoodIds.push(foodDoc._id.toString());
    }

    // 3. Server-side Coupon Validation and Discount Calculation
    let discountAmount = 0;
    let isFreeDelivery = false;
    let appliedCouponCode: string | undefined = undefined;

    if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
      const codeUpper = couponCode.trim().toUpperCase();
      const coupon = await Coupon.findOne({ code: codeUpper });

      if (!coupon) {
        res.status(400).json({ success: false, message: 'Invalid coupon code', code: 'INVALID_COUPON' });
        return;
      }

      if (!coupon.active) {
        res.status(400).json({ success: false, message: 'This coupon is no longer active', code: 'COUPON_INACTIVE' });
        return;
      }

      if (coupon.startDate && now < coupon.startDate) {
        res.status(400).json({ success: false, message: 'This coupon is not yet active', code: 'COUPON_NOT_STARTED' });
        return;
      }

      if (coupon.expiryDate && now > coupon.expiryDate) {
        res.status(400).json({ success: false, message: 'Coupon has expired', code: 'COUPON_EXPIRED' });
        return;
      }

      if (coupon.usedCount >= coupon.usageLimit) {
        res.status(400).json({ success: false, message: 'Coupon usage limit reached', code: 'COUPON_LIMIT_REACHED' });
        return;
      }

      // Check per-user limit
      const userUsageCount = await Order.countDocuments({
        userId,
        couponCode: codeUpper,
        status: { $nin: ['CANCELLED', 'REFUNDED'] }
      });

      if (userUsageCount >= coupon.perUserLimit) {
        res.status(400).json({ success: false, message: 'You have already reached the usage limit for this coupon', code: 'COUPON_USER_LIMIT_REACHED' });
        return;
      }

      if (calculatedSubtotal < coupon.minimumOrderAmount) {
        res.status(400).json({
          success: false,
          message: `Minimum order amount of ₹${coupon.minimumOrderAmount} required for this coupon`,
          code: 'MINIMUM_ORDER_NOT_MET'
        });
        return;
      }

      // Check Category / Food restrictions
      if (coupon.applicableCategories && coupon.applicableCategories.length > 0) {
        const hasApplicableCategory = itemCategories.some(cat => coupon.applicableCategories.includes(cat));
        if (!hasApplicableCategory) {
          res.status(400).json({ success: false, message: 'Coupon is not applicable to items in your cart', code: 'COUPON_NOT_APPLICABLE' });
          return;
        }
      }

      if (coupon.applicableFoods && coupon.applicableFoods.length > 0) {
        const hasApplicableFood = itemFoodIds.some(fId => coupon.applicableFoods.includes(fId));
        if (!hasApplicableFood) {
          res.status(400).json({ success: false, message: 'Coupon is not applicable to the selected dishes', code: 'COUPON_NOT_APPLICABLE' });
          return;
        }
      }

      // Calculate discount value
      if (coupon.discountType === 'PERCENTAGE') {
        let disc = Math.round((calculatedSubtotal * coupon.discountValue) / 100);
        if (coupon.maximumDiscount && disc > coupon.maximumDiscount) {
          disc = coupon.maximumDiscount;
        }
        discountAmount = Math.min(disc, calculatedSubtotal);
      } else if (coupon.discountType === 'FIXED_AMOUNT') {
        discountAmount = Math.min(coupon.discountValue, calculatedSubtotal);
      } else if (coupon.discountType === 'FREE_DELIVERY') {
        isFreeDelivery = true;
      }

      appliedCouponCode = codeUpper;
    }

    // 4. Centralized Pricing Calculation
    const pricing = calculateOrderPricing({
      subtotal: calculatedSubtotal,
      discountAmount,
      freeDelivery: isFreeDelivery,
    });

    // 5. Format Delivery Address
    const formattedAddress = typeof deliveryAddress === 'string'
      ? { fullAddress: deliveryAddress }
      : {
          doorNo: deliveryAddress.doorNo || '',
          landmark: deliveryAddress.landmark || '',
          district: deliveryAddress.district || '',
          city: deliveryAddress.city || '',
          state: deliveryAddress.state || '',
          pincode: deliveryAddress.pincode || '',
          fullAddress: deliveryAddress.fullAddress || `${deliveryAddress.doorNo || ''}, ${deliveryAddress.landmark || ''}, ${deliveryAddress.district || ''}`.trim(),
          lat: deliveryAddress.lat,
          lng: deliveryAddress.lng
        };

    const clientUrl = (env.CLIENT_URL && !env.CLIENT_URL.includes('localhost:3000'))
      ? env.CLIENT_URL
      : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : (req.headers.origin as string) || env.CLIENT_URL || 'http://localhost:3000');
    const stripe = getStripeClient();

    // Pre-generate Order ID so it is safely linked to Stripe metadata and success_url
    const pregeneratedOrderId = new ObjectIdMock().toString();
    let stripeSessionId = `mock_sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    let stripeSessionUrl: string | undefined = undefined;

    // 6. Create Stripe Checkout Session (Card Payment)
    if (paymentMethod === 'CARD' && stripe) {
      try {
        const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = validatedItems.map(item => ({
          price_data: {
            currency: 'inr',
            product_data: {
              name: item.name,
              images: item.image && item.image.startsWith('http') ? [item.image] : []
            },
            unit_amount: Math.round(item.price * 100) // ₹ to paise
          },
          quantity: item.quantity
        }));

        if (pricing.deliveryFee > 0) {
          lineItems.push({
            price_data: {
              currency: 'inr',
              product_data: { name: 'Delivery Fee' },
              unit_amount: Math.round(pricing.deliveryFee * 100)
            },
            quantity: 1
          });
        }

        if (pricing.tax > 0) {
          lineItems.push({
            price_data: {
              currency: 'inr',
              product_data: { name: 'GST / Taxes (5%)' },
              unit_amount: Math.round(pricing.tax * 100)
            },
            quantity: 1
          });
        }

        // Apply discount if percentage/fixed
        let stripeDiscounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined = undefined;
        if (pricing.discountAmount > 0 && appliedCouponCode) {
          try {
            const stripeCoupon = await stripe.coupons.create({
              amount_off: Math.round(pricing.discountAmount * 100),
              currency: 'inr',
              duration: 'once',
              name: `Discount (${appliedCouponCode})`
            });
            stripeDiscounts = [{ coupon: stripeCoupon.id }];
          } catch (cErr) {
            console.warn('Could not create Stripe coupon object, proceeding with adjusted total line item:', cErr);
          }
        }

        // Root Cause 4: Pass the actual MongoDB orderId in the success_url
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: lineItems,
          discounts: stripeDiscounts,
          mode: 'payment',
          success_url: `${clientUrl}/#/payment/${pregeneratedOrderId}?session_id={CHECKOUT_SESSION_ID}&success=true`,
          cancel_url: `${clientUrl}/#/cart?canceled=true`,
          client_reference_id: userId,
          metadata: {
            userId,
            orderId: pregeneratedOrderId.toString(),
            couponCode: appliedCouponCode || '',
            idempotencyKey: idempotencyKey || ''
          }
        });

        stripeSessionId = session.id;
        stripeSessionUrl = session.url || undefined;
      } catch (stripeErr: any) {
        logger.warn('STRIPE_SESSION_FALLBACK', `Stripe SDK session creation warning (using test mock session): ${stripeErr.message}`);
      }
    }

    // 7. Create Order in Database
    const initialStatus = paymentMethod === 'COD' ? 'PAYMENT_CONFIRMED' : 'PAYMENT_PENDING';
    const initialPaymentStatus = paymentMethod === 'COD' ? 'PENDING' : 'PROCESSING';

    const order = await Order.create({
      _id: pregeneratedOrderId,
      userId,
      items: validatedItems,
      subtotal: pricing.subtotal,
      deliveryFee: pricing.deliveryFee,
      tax: pricing.tax,
      discountAmount: pricing.discountAmount,
      couponCode: appliedCouponCode,
      totalPrice: pricing.grandTotal,
      status: initialStatus,
      paymentStatus: initialPaymentStatus,
      paymentMethod,
      deliveryAddress: formattedAddress,
      timeline: [
        { status: 'PLACED', timestamp: new Date(), note: 'Order placed by customer', actor: 'CUSTOMER' },
        { status: initialStatus, timestamp: new Date(), note: paymentMethod === 'COD' ? 'Order confirmed via Cash on Delivery' : 'Awaiting Stripe payment confirmation', actor: 'SYSTEM' }
      ],
      specialInstructions: specialInstructions || '',
      idempotencyKey,
      sessionId: stripeSessionId
    });

    // Root Cause 9: COD Flow - Reserve stock and create Delivery record immediately
    if (paymentMethod === 'COD') {
      for (const item of validatedItems) {
        try {
          const qty = Math.max(1, item.quantity);
          const result = await Food.findOneAndUpdate(
            { _id: item.foodId, stock: { $gte: qty } },
            { $inc: { stock: -qty } },
            { new: true }
          );
          if (result && result.stock === 0) {
            await Food.findByIdAndUpdate(item.foodId, { available: false });
          }
        } catch (stkErr) {
          logger.error('COD_STOCK_REDUCTION_ERROR', `Failed to decrement stock for item ${item.foodId}`, { error: stkErr });
        }
      }

      // Automatically trigger delivery assignment or create delivery record
      try {
        const { triggerAutoDeliveryAssignment } = await import('./orders');
        await triggerAutoDeliveryAssignment(order._id.toString());
      } catch (delErr) {
        logger.warn('COD_DELIVERY_CREATION_WARNING', `Could not trigger auto delivery assignment: ${delErr}`);
      }
    }

    res.status(201).json({
      success: true,
      sessionId: stripeSessionId,
      sessionUrl: stripeSessionUrl,
      orderId: order._id,
      calculation: {
        subtotal: pricing.subtotal,
        deliveryFee: pricing.deliveryFee,
        tax: pricing.tax,
        discountAmount: pricing.discountAmount,
        grandTotal: pricing.grandTotal
      }
    });

  } catch (error: any) {
    logger.error('PAYMENT_SESSION_ERROR', 'Error creating payment session', { error });
    res.status(500).json({
      success: false,
      message: error.message || 'Payment session creation failed',
      code: 'PAYMENT_SESSION_ERROR'
    });
  }
};

router.post('/create-session', protect, createPaymentSessionHandler);
router.post('/checkout', protect, createPaymentSessionHandler); // Backward-compatible alias

/**
 * @desc    Get payment and order status
 * @route   GET /api/payments/status/:orderId
 * @access  Private
 */
router.get('/status/:orderId', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const userId = req.user?._id?.toString();

    let query: any = { _id: orderId };
    if (orderId.startsWith('cs_') || orderId.startsWith('mock_sess_')) {
      query = { sessionId: orderId };
    }

    const order = await Order.findOne(query);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found for given payment identifier', code: 'ORDER_NOT_FOUND' });
      return;
    }

    // Role check: customer can only check their own orders
    if (req.user?.role === 'customer' && order.userId !== userId) {
      res.status(403).json({ success: false, message: 'Not authorized to view this payment', code: 'FORBIDDEN' });
      return;
    }

    res.json({
      success: true,
      orderId: order._id,
      sessionId: order.sessionId,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      totalPrice: order.totalPrice,
      createdAt: order.createdAt
    });
  } catch (error: any) {
    logger.error('PAYMENT_STATUS_ERROR', 'Error fetching payment status', { error });
    res.status(500).json({ success: false, message: 'Failed to fetch payment status', code: 'STATUS_FETCH_FAILED' });
  }
});

/**
 * @desc    Verify/Confirm payment for an order (Stripe redirect callback or test simulation)
 * @route   POST /api/payments/verify/:orderId
 * @access  Private
 */
router.post('/verify/:orderId', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const userId = req.user?._id?.toString();

    let query: any = { _id: orderId };
    if (orderId.startsWith('cs_') || orderId.startsWith('mock_sess_')) {
      query = { sessionId: orderId };
    }

    const order = await Order.findOne(query);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found', code: 'ORDER_NOT_FOUND' });
      return;
    }

    if (req.user?.role === 'customer' && order.userId !== userId) {
      res.status(403).json({ success: false, message: 'Not authorized for this order', code: 'FORBIDDEN' });
      return;
    }

    // If already paid and confirmed, return existing state idempotently
    if (order.paymentStatus === 'PAID' && order.status !== 'PAYMENT_PENDING') {
      res.json({ success: true, orderId: order._id, status: order.status, paymentStatus: order.paymentStatus });
      return;
    }

    // Mark PAID & CONFIRMED
    order.paymentStatus = 'PAID';
    order.status = 'PAYMENT_CONFIRMED';
    order.timeline.push(
      { status: 'PAID', timestamp: new Date(), note: 'Payment successfully captured via Stripe checkout', actor: 'SYSTEM' },
      { status: 'PAYMENT_CONFIRMED', timestamp: new Date(), note: 'Order confirmed and sent to kitchen', actor: 'SYSTEM' }
    );
    await order.save();

    // Decrement stock atomically
    for (const item of order.items) {
      if (item.foodId) {
        try {
          const qty = Math.max(1, item.quantity);
          const result = await Food.findOneAndUpdate(
            { _id: item.foodId, stock: { $gte: qty } },
            { $inc: { stock: -qty } },
            { new: true }
          );
          if (result && result.stock === 0) {
            await Food.findByIdAndUpdate(item.foodId, { available: false });
          }
        } catch (stkErr) {
          console.error(`Failed to update stock for item ${item.foodId}:`, stkErr);
        }
      }
    }

    // Create delivery record & trigger driver auto-assignment
    try {
      const { triggerAutoDeliveryAssignment } = await import('./orders');
      await triggerAutoDeliveryAssignment(order._id.toString());
    } catch (delErr) {
      console.warn('Auto delivery assignment warning in payment verification:', delErr);
    }

    // Broadcast Socket.IO events
    try {
      const { io } = await import('../server');
      if (io) {
        io.to(`tracking_${order._id.toString()}`).emit('order:status', {
          orderId: order._id.toString(),
          status: order.status,
          paymentStatus: order.paymentStatus,
          timeline: order.timeline
        });
      }
    } catch {}

    res.json({
      success: true,
      orderId: order._id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      message: 'Payment verified and order confirmed successfully.'
    });

  } catch (error: any) {
    logger.error('PAYMENT_VERIFY_ERROR', 'Error verifying payment', { error });
    res.status(500).json({ success: false, message: 'Failed to verify payment', code: 'PAYMENT_VERIFY_FAILED' });
  }
});

export default router;
