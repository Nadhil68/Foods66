import { Router, Response } from 'express';
import { ObjectIdMock } from '../models/firestoreModel';
import { Order, OrderStatus, IOrderItem } from '../models/Order';
import { Food } from '../models/Food';
import { Coupon } from '../models/Coupon';
import { Delivery } from '../models/Delivery';
import { User } from '../models/User';
import { protect, authorize, AuthRequest } from '../middlewares/auth';
import { validateBody, updateOrderStatusSchema } from '../middlewares/validation';
import { calculateOrderPricing, applyDynamicPrice } from '../services/pricingService';

const router = Router();

// VALID ORDER STATE TRANSITION MAP
export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PLACED: ['PAYMENT_PENDING', 'PAYMENT_CONFIRMED', 'CANCELLED'],
  PAYMENT_PENDING: ['PAID', 'PAYMENT_CONFIRMED', 'CANCELLED', 'FAILED' as any],
  PAID: ['PAYMENT_CONFIRMED', 'PREPARING', 'CANCELLED', 'REFUNDED'],
  PAYMENT_CONFIRMED: ['RESTAURANT_CONFIRMED', 'CANCELLED'],
  RESTAURANT_CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY_FOR_PICKUP'],
  READY_FOR_PICKUP: ['ASSIGNED'],
  ASSIGNED: ['PICKED_UP'],
  PICKED_UP: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'FAILED' as any],
  DELIVERED: [],
  CANCELLED: [],
  REFUNDED: []
};

/**
 * Validate if transitioning from current to target status is permitted
 */
export const isValidOrderTransition = (current: OrderStatus, target: OrderStatus): boolean => {
  if (current === target) return true;
  const allowed = VALID_TRANSITIONS[current] || [];
  return allowed.includes(target);
};

/**
 * Automatic Delivery Partner Assignment Service
 */
export const triggerAutoDeliveryAssignment = async (orderId: string): Promise<boolean> => {
  try {
    const order = await Order.findById(orderId);
    if (!order) return false;

    // Only assign if ready or confirmed and not yet assigned
    if (order.status !== 'READY_FOR_PICKUP' && order.status !== 'PAYMENT_CONFIRMED' && order.status !== 'RESTAURANT_CONFIRMED') {
      return false;
    }

    // Find best available delivery partner (driver)
    const availableDriver = await User.findOneAndUpdate(
      {
        role: 'driver',
        availability: true,
        isSuspended: false,
        activeOrders: { $lt: 3 }
      },
      {
        $inc: { activeOrders: 1 }
      },
      {
        new: true,
        sort: { activeOrders: 1, rating: -1 }
      }
    );

    if (!availableDriver) {
      console.log(`⏳ No delivery partner currently available for order ${orderId}. Order will stay in READY_FOR_PICKUP.`);
      return false;
    }

    // Assign to Order
    order.deliveryPartnerId = availableDriver._id.toString();
    order.deliveryPartnerName = availableDriver.name;
    order.deliveryPartnerPhone = availableDriver.phone || '';
    order.status = 'ASSIGNED';
    order.timeline.push({
      status: 'ASSIGNED',
      timestamp: new Date(),
      note: `Assigned to delivery partner ${availableDriver.name} (${availableDriver.vehicle || 'Bike'})`,
      actor: 'SYSTEM'
    });
    await order.save();

    // Create or Update Delivery Record
    await Delivery.findOneAndUpdate(
      { orderId: order._id.toString() },
      {
        orderId: order._id.toString(),
        deliveryPartnerId: availableDriver._id.toString(),
        deliveryPartnerName: availableDriver.name,
        deliveryPartnerPhone: availableDriver.phone || '',
        status: 'ASSIGNED',
        assignedAt: new Date(),
        eta: new Date(Date.now() + 25 * 60000), // 25 min default ETA
        currentLocation: availableDriver.currentLocation || { type: 'Point', coordinates: [80.2707, 13.0827] },
        $push: {
          timeline: {
            status: 'ASSIGNED',
            timestamp: new Date(),
            note: `Assigned to ${availableDriver.name}`
          }
        }
      },
      { upsert: true, new: true }
    );

    console.log(`🛵 Order ${order._id} automatically assigned to driver ${availableDriver.name} (${availableDriver._id})`);

    // Emit Real-time Socket.IO Events
    try {
      const { io } = await import('../server');
      if (io) {
        // Broadcast to customer order room
        io.to(`tracking_${order._id.toString()}`).emit('delivery:assigned', {
          orderId: order._id.toString(),
          driverId: availableDriver._id.toString(),
          driverName: availableDriver.name,
          driverPhone: availableDriver.phone,
          vehicle: availableDriver.vehicle,
          status: 'ASSIGNED',
          eta: new Date(Date.now() + 25 * 60000)
        });

        io.to(`tracking_${order._id.toString()}`).emit('order:status', {
          orderId: order._id.toString(),
          status: 'ASSIGNED',
          timeline: order.timeline
        });

        // Notify customer
        io.to(order.userId.toString()).emit('notification', {
          title: 'Delivery Partner Assigned 🛵',
          message: `${availableDriver.name} is assigned to pick up your order!`,
          orderId: order._id,
          status: 'ASSIGNED'
        });

        // Notify driver
        io.to(availableDriver._id.toString()).emit('notification', {
          title: 'New Delivery Task! 📦',
          message: `You have been assigned order #${order._id.toString().slice(-6)}`,
          orderId: order._id,
          status: 'ASSIGNED'
        });
      }
    } catch (socketErr) {
      console.warn('Socket broadcast error in auto-assignment:', socketErr);
    }

    return true;
  } catch (error) {
    console.error('Error during auto-assignment:', error);
    return false;
  }
};

/**
 * @desc    Get orders (Scoped by User Role & Auth)
 * @route   GET /api/orders
 * @access  Private
 */
router.get('/', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized', code: 'UNAUTHORIZED' });
      return;
    }

    let filter: any = {};

    if (user.role === 'customer') {
      filter.userId = user._id.toString();
    } else if (user.role === 'driver') {
      filter.deliveryPartnerId = user._id.toString();
    } else if (user.role === 'restaurant') {
      // Restaurant can see orders for their restaurant or all active kitchen orders
      filter.status = { $in: ['PAYMENT_CONFIRMED', 'RESTAURANT_CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'] };
    } else if (user.role === 'admin') {
      if (req.query.userId) filter.userId = req.query.userId;
      if (req.query.status) filter.status = (req.query.status as string).toUpperCase();
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, orders });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders', code: 'ORDERS_FETCH_FAILED' });
  }
});

/**
 * @desc    Get single order by ID with ownership verification
 * @route   GET /api/orders/:id
 * @access  Private
 */
router.get('/:id', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const orderId = req.params.id;

    let order = null;
    if (orderId.startsWith('cs_') || orderId.startsWith('mock_sess_')) {
      order = await Order.findOne({ sessionId: orderId });
    } else if (ObjectIdMock.isValid(orderId)) {
      order = await Order.findById(orderId);
    }

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found', code: 'ORDER_NOT_FOUND' });
      return;
    }

    // Role-based access check
    if (user?.role === 'customer' && order.userId !== user._id.toString()) {
      res.status(403).json({ success: false, message: 'Not authorized to view this order', code: 'FORBIDDEN' });
      return;
    }

    // Driver can only see their assigned orders
    if (user?.role === 'driver' && order.deliveryPartnerId !== user._id.toString()) {
      res.status(403).json({ success: false, message: 'Not authorized to view this order', code: 'FORBIDDEN' });
      return;
    }

    res.json({ success: true, order });
  } catch (error: any) {
    console.error('Error fetching order:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch order', code: 'ORDER_FETCH_FAILED' });
  }
});

/**
 * @desc    Create a new order with server-side authoritative pricing & stock deduction
 * @route   POST /api/orders
 * @access  Private
 */
router.post('/', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { items, deliveryAddress, couponCode, paymentMethod = 'COD', specialInstructions } = req.body;
    const idempotencyKey = req.header('X-Idempotency-Key') || req.body.idempotencyKey;
    const userId = req.user?._id?.toString();

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated', code: 'UNAUTHORIZED' });
      return;
    }

    if (idempotencyKey) {
      const existingOrder = await Order.findOne({ idempotencyKey, userId });
      if (existingOrder) {
        res.status(201).json({
          success: true,
          orderId: existingOrder._id,
          order: existingOrder,
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

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'Cart items are required', code: 'INVALID_CART' });
      return;
    }

    if (!deliveryAddress) {
      res.status(400).json({ success: false, message: 'Delivery address is required', code: 'MISSING_ADDRESS' });
      return;
    }

    let calculatedSubtotal = 0;
    const validatedItems: IOrderItem[] = [];
    const itemCategories: string[] = [];
    const itemFoodIds: string[] = [];
    const now = new Date();

    for (const item of items) {
      if (!item.foodId) {
        res.status(400).json({ success: false, message: 'foodId is required for each item', code: 'INVALID_ITEM' });
        return;
      }

      if (!ObjectIdMock.isValid(item.foodId)) {
        res.status(400).json({
          success: false,
          message: `Invalid food item ID: ${item.foodId}.`,
          code: 'INVALID_FOOD_ID'
        });
        return;
      }

      const qty = Number(item.quantity);
      if (!Number.isInteger(qty) || qty <= 0) {
        res.status(400).json({ success: false, message: `Invalid quantity for item ${item.foodId}`, code: 'INVALID_QUANTITY' });
        return;
      }

      const foodDoc = await Food.findById(item.foodId);
      if (!foodDoc) {
        res.status(404).json({ success: false, message: `Food item not found: ${item.foodId}`, code: 'FOOD_NOT_FOUND' });
        return;
      }

      if (!foodDoc.available) {
        res.status(409).json({ success: false, message: `${foodDoc.name} is currently unavailable`, code: 'FOOD_UNAVAILABLE' });
        return;
      }

      if (foodDoc.stock !== undefined && foodDoc.stock < qty) {
        res.status(409).json({
          success: false,
          message: `Insufficient stock for "${foodDoc.name}". Only ${foodDoc.stock} available.`,
          code: 'INSUFFICIENT_STOCK'
        });
        return;
      }

      const unitPrice = applyDynamicPrice(foodDoc.price, now);
      calculatedSubtotal += unitPrice * qty;

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

    // Coupon Validation
    let discountAmount = 0;
    let isFreeDelivery = false;
    let appliedCouponCode: string | undefined = undefined;

    if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
      const codeUpper = couponCode.trim().toUpperCase();
      const coupon = await Coupon.findOne({ code: codeUpper });

      if (coupon && coupon.active && (!coupon.expiryDate || now <= coupon.expiryDate) && calculatedSubtotal >= coupon.minimumOrderAmount) {
        if (coupon.discountType === 'PERCENTAGE') {
          let disc = Math.round((calculatedSubtotal * coupon.discountValue) / 100);
          if (coupon.maximumDiscount && disc > coupon.maximumDiscount) disc = coupon.maximumDiscount;
          discountAmount = Math.min(disc, calculatedSubtotal);
        } else if (coupon.discountType === 'FIXED_AMOUNT') {
          discountAmount = Math.min(coupon.discountValue, calculatedSubtotal);
        } else if (coupon.discountType === 'FREE_DELIVERY') {
          isFreeDelivery = true;
        }
        appliedCouponCode = codeUpper;
      }
    }

    const pricing = calculateOrderPricing({
      subtotal: calculatedSubtotal,
      discountAmount,
      freeDelivery: isFreeDelivery,
    });

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

    const initialStatus = paymentMethod === 'COD' ? 'PAYMENT_CONFIRMED' : 'PAYMENT_PENDING';
    const initialPaymentStatus = paymentMethod === 'COD' ? 'PENDING' : 'PROCESSING';

    const order = await Order.create({
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
        { status: initialStatus, timestamp: new Date(), note: paymentMethod === 'COD' ? 'Order confirmed via Cash on Delivery' : 'Awaiting payment', actor: 'SYSTEM' }
      ],
      specialInstructions: specialInstructions || '',
      idempotencyKey
    });

    // Stock deduction for COD
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
          console.error(`Stock update failed for foodId ${item.foodId}:`, stkErr);
        }
      }
    }

    res.status(201).json({
      success: true,
      orderId: order._id,
      order,
      calculation: pricing
    });

  } catch (error: any) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: error.message || 'Order creation failed', code: 'ORDER_CREATE_FAILED' });
  }
});

/**
 * @desc    Update order status with State Machine Transition Validation
 * @route   PUT /api/orders/:id/status (also supports PUT /api/orders/:id)
 * @access  Private (Restaurant, Driver, Admin)
 */
const updateOrderStatusHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const { id } = req.params;
    const requestedStatus = (req.body.status || '').toUpperCase() as OrderStatus;
    const note = req.body.note || '';

    if (!requestedStatus) {
      res.status(400).json({ success: false, message: 'Target status is required', code: 'MISSING_STATUS' });
      return;
    }

    const order = await Order.findById(id);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found', code: 'ORDER_NOT_FOUND' });
      return;
    }

    const currentStatus = order.status;

    // RBAC Permissions check for transition
    if (user?.role === 'customer') {
      // Customers can only cancel from allowed cancellable states
      if (requestedStatus !== 'CANCELLED') {
        res.status(403).json({ success: false, message: 'Customers can only request order cancellation', code: 'FORBIDDEN' });
        return;
      }
      if (order.userId !== user._id.toString()) {
        res.status(403).json({ success: false, message: 'Not authorized for this order', code: 'FORBIDDEN' });
        return;
      }
    } else if (user?.role === 'restaurant') {
      // Restaurant can only set kitchen-related statuses
      const restaurantAllowed: OrderStatus[] = ['RESTAURANT_CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'CANCELLED'];
      if (!restaurantAllowed.includes(requestedStatus)) {
        res.status(403).json({ success: false, message: 'Restaurant can only update kitchen-related statuses', code: 'FORBIDDEN' });
        return;
      }
    } else if (user?.role === 'driver') {
      // Driver can only set delivery-related statuses for assigned orders
      const driverAllowed: OrderStatus[] = ['PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'];
      if (!driverAllowed.includes(requestedStatus)) {
        res.status(403).json({ success: false, message: 'Driver can only update delivery-related statuses', code: 'FORBIDDEN' });
        return;
      }
      // Driver must be assigned to this order
      if (order.deliveryPartnerId !== user._id.toString()) {
        res.status(403).json({ success: false, message: 'Not assigned to this delivery', code: 'FORBIDDEN' });
        return;
      }
    }
    // Admin has no restrictions

    // STATE MACHINE VALIDATION
    if (!isValidOrderTransition(currentStatus, requestedStatus)) {
      res.status(400).json({
        success: false,
        message: `Invalid state transition: Cannot change order status from "${currentStatus}" to "${requestedStatus}"`,
        code: 'INVALID_STATUS_TRANSITION',
        currentStatus,
        allowedNextStatuses: VALID_TRANSITIONS[currentStatus as OrderStatus] || []
      });
      return;
    }

    // Apply Transition
    order.status = requestedStatus;
    const actorRole = user?.role ? user.role.toUpperCase() : 'SYSTEM';

    order.timeline.push({
      status: requestedStatus,
      timestamp: new Date(),
      note: note || `Order transitioned to ${requestedStatus} by ${actorRole}`,
      actor: actorRole
    });

    // Special logic for DELIVERED: Award Reward Points (1 point per ₹100)
    if (currentStatus !== 'DELIVERED' && requestedStatus === 'DELIVERED') {
      order.paymentStatus = 'PAID';
      const pointsEarned = Math.floor(order.totalPrice / 100);
      if (pointsEarned > 0) {
        await User.findByIdAndUpdate(order.userId, {
          $inc: { rewardPoints: pointsEarned }
        });
      }

      // Free up driver
      if (order.deliveryPartnerId) {
        await User.findByIdAndUpdate(order.deliveryPartnerId, {
          $inc: { activeOrders: -1 }
        });
        await Delivery.findOneAndUpdate(
          { orderId: order._id.toString() },
          { status: 'DELIVERED', deliveredAt: new Date() }
        );
      }
    }

    await order.save();

    // Trigger Automatic Delivery Assignment if reaching READY_FOR_PICKUP
    if (requestedStatus === 'READY_FOR_PICKUP') {
      await triggerAutoDeliveryAssignment(order._id.toString());
    }

    // Emit Real-time Socket.IO events
    try {
      const { io } = await import('../server');
      if (io) {
        io.to(`tracking_${order._id.toString()}`).emit('order:status', {
          orderId: order._id.toString(),
          status: order.status,
          paymentStatus: order.paymentStatus,
          timeline: order.timeline
        });

        io.to(order.userId.toString()).emit('notification', {
          title: `Order Update: ${requestedStatus.replace(/_/g, ' ')}`,
          message: `Your order #${order._id.toString().slice(-6)} is now ${requestedStatus.replace(/_/g, ' ').toLowerCase()}.`,
          orderId: order._id,
          status: order.status
        });
      }
    } catch (socketErr) {
      console.warn('Socket emit error in order update:', socketErr);
    }

    res.json({
      success: true,
      message: `Order status successfully updated to ${requestedStatus}`,
      order
    });

  } catch (error: any) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, message: 'Failed to update order status', code: 'STATUS_UPDATE_ERROR' });
  }
};

router.put('/:id/status', protect, validateBody(updateOrderStatusSchema), updateOrderStatusHandler);
router.put('/:id', protect, validateBody(updateOrderStatusSchema), updateOrderStatusHandler);

/**
 * @desc    Delete order
 * @route   DELETE /api/orders/:id
 * @access  Private (Admin Only)
 */
router.delete('/:id', protect, authorize('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found', code: 'ORDER_NOT_FOUND' });
      return;
    }
    await Delivery.deleteMany({ orderId: req.params.id });
    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to delete order', code: 'DELETE_ORDER_ERROR' });
  }
});

export default router;
