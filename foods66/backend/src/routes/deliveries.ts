import { Router, Response } from 'express';
import { ObjectIdMock } from '../models/firestoreModel';
import { Delivery, DeliveryStatus } from '../models/Delivery';
import { Order } from '../models/Order';
import { User } from '../models/User';
import { protect, authorize, AuthRequest } from '../middlewares/auth';

const router = Router();

/**
 * @desc    Get deliveries (Scoped by role)
 * @route   GET /api/deliveries
 * @access  Private (Driver, Admin, Restaurant)
 */
router.get('/', protect, authorize('driver', 'admin', 'restaurant'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    let filter: any = {};

    if (user?.role === 'driver') {
      filter.deliveryPartnerId = user._id.toString();
    }

    if (req.query.status) {
      filter.status = (req.query.status as string).toUpperCase();
    }

    const deliveries = await Delivery.find(filter).sort({ createdAt: -1 });
    
    // Also fetch associated order summaries
    const orderIds = deliveries.map(d => d.orderId);
    const orders = await Order.find({ _id: { $in: orderIds } }).select('_id items totalPrice deliveryAddress specialInstructions status');
    const orderMap = new Map(orders.map(o => [o._id.toString(), o]));

    const enriched = deliveries.map(d => ({
      ...d.toObject(),
      order: orderMap.get(d.orderId) || null
    }));

    res.json({ success: true, count: enriched.length, deliveries: enriched });
  } catch (error: any) {
    console.error('Error fetching deliveries:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch deliveries', code: 'DELIVERIES_FETCH_ERROR' });
  }
});

/**
 * @desc    Get available unassigned deliveries ready for pickup
 * @route   GET /api/deliveries/available
 * @access  Private (Driver, Admin)
 */
router.get('/available', protect, authorize('driver', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const driverId = req.user?._id?.toString();

    // Find orders that are READY_FOR_PICKUP or ASSIGNED but rejected by this driver
    const availableOrders = await Order.find({
      status: { $in: ['READY_FOR_PICKUP', 'ASSIGNED'] },
      $or: [
        { deliveryPartnerId: { $exists: false } },
        { deliveryPartnerId: null },
        { deliveryPartnerId: driverId }
      ]
    }).sort({ createdAt: 1 });

    res.json({ success: true, count: availableOrders.length, orders: availableOrders, deliveries: availableOrders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch available deliveries', code: 'AVAILABLE_FETCH_ERROR' });
  }
});

/**
 * @desc    Assign delivery partner to an order
 * @route   POST /api/deliveries/assign
 * @access  Private (Admin or Restaurant)
 */
router.post('/assign', protect, authorize('admin', 'restaurant'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId, driverId } = req.body;

    if (!orderId || !driverId) {
      res.status(400).json({ success: false, message: 'Both orderId and driverId are required', code: 'MISSING_PARAMS' });
      return;
    }

    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found', code: 'ORDER_NOT_FOUND' });
      return;
    }

    const driver = await User.findOne({ _id: driverId, role: 'driver' });
    if (!driver) {
      res.status(404).json({ success: false, message: 'Delivery partner not found', code: 'DRIVER_NOT_FOUND' });
      return;
    }

    // Atomic update to assign driver
    order.deliveryPartnerId = driver._id.toString();
    order.deliveryPartnerName = driver.name;
    order.deliveryPartnerPhone = driver.phone || '';
    order.status = 'ASSIGNED';
    order.timeline.push({
      status: 'ASSIGNED',
      timestamp: new Date(),
      note: `Assigned to ${driver.name}`,
      actor: req.user?.role?.toUpperCase() || 'ADMIN'
    });
    await order.save();

    await User.findByIdAndUpdate(driverId, { $inc: { activeOrders: 1 } });

    const delivery = await Delivery.findOneAndUpdate(
      { orderId },
      {
        orderId,
        deliveryPartnerId: driver._id.toString(),
        deliveryPartnerName: driver.name,
        deliveryPartnerPhone: driver.phone || '',
        status: 'ASSIGNED',
        assignedAt: new Date(),
        eta: new Date(Date.now() + 25 * 60000),
        $push: {
          timeline: { status: 'ASSIGNED', timestamp: new Date(), note: `Assigned to ${driver.name}` }
        }
      },
      { upsert: true, new: true }
    );

    // Socket broadcasts
    try {
      const { io } = await import('../server');
      if (io) {
        io.to(`tracking_${orderId}`).emit('delivery:assigned', {
          orderId,
          driverId: driver._id.toString(),
          driverName: driver.name,
          driverPhone: driver.phone,
          status: 'ASSIGNED',
          eta: delivery.eta
        });

        io.to(driver._id.toString()).emit('notification', {
          title: 'New Delivery Assigned 🛵',
          message: `Order #${orderId.slice(-6)} has been assigned to you.`,
          orderId
        });
      }
    } catch {}

    res.status(201).json({ success: true, message: 'Delivery assigned successfully', delivery, order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to assign delivery', code: 'ASSIGN_ERROR' });
  }
});

/**
 * @desc    Delivery Partner Accepts Assigned Delivery
 * @route   POST /api/deliveries/accept
 * @access  Private (Driver)
 */
router.post('/accept', protect, authorize('driver'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.body;
    const driverId = req.user?._id?.toString();

    const delivery = await Delivery.findOne({ orderId, deliveryPartnerId: driverId });
    if (!delivery) {
      res.status(404).json({ success: false, message: 'Delivery assignment not found for this driver', code: 'DELIVERY_NOT_FOUND' });
      return;
    }

    delivery.status = 'ACCEPTED';
    delivery.acceptedAt = new Date();
    delivery.timeline.push({ status: 'ACCEPTED', timestamp: new Date(), note: 'Accepted by driver' });
    await delivery.save();

    const order = await Order.findById(orderId);
    if (order) {
      order.timeline.push({ status: 'ASSIGNED', timestamp: new Date(), note: 'Delivery accepted by partner', actor: 'DELIVERY_PARTNER' });
      await order.save();
    }

    res.json({ success: true, message: 'Delivery accepted', delivery });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to accept delivery', code: 'ACCEPT_ERROR' });
  }
});

/**
 * @desc    Delivery Partner Rejects Assigned Delivery
 * @route   POST /api/deliveries/reject
 * @access  Private (Driver)
 */
router.post('/reject', protect, authorize('driver'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId, reason } = req.body;
    const driverId = req.user?._id?.toString();

    const delivery = await Delivery.findOne({ orderId, deliveryPartnerId: driverId });
    if (!delivery) {
      res.status(404).json({ success: false, message: 'Delivery not found', code: 'DELIVERY_NOT_FOUND' });
      return;
    }

    delivery.status = 'REJECTED';
    delivery.rejectedBy = [...(delivery.rejectedBy || []), driverId as string];
    delivery.deliveryPartnerId = undefined;
    delivery.timeline.push({ status: 'REJECTED', timestamp: new Date(), note: reason || 'Rejected by driver' });
    await delivery.save();

    // Decrement driver active orders
    await User.findByIdAndUpdate(driverId, { $inc: { activeOrders: -1 } });

    // Reset order to READY_FOR_PICKUP to allow re-assignment
    const order = await Order.findById(orderId);
    if (order) {
      order.status = 'READY_FOR_PICKUP';
      order.deliveryPartnerId = undefined;
      order.deliveryPartnerName = undefined;
      order.timeline.push({ status: 'READY_FOR_PICKUP', timestamp: new Date(), note: 'Driver rejected. Re-queued for assignment.', actor: 'SYSTEM' });
      await order.save();
    }

    res.json({ success: true, message: 'Delivery rejected and re-queued for assignment' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to reject delivery', code: 'REJECT_ERROR' });
  }
});

/**
 * @desc    Delivery Partner Picks Up Order from Kitchen
 * @route   POST /api/deliveries/pickup
 * @access  Private (Driver)
 */
router.post('/pickup', protect, authorize('driver'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.body;
    const driverId = req.user?._id?.toString();

    const delivery = await Delivery.findOne({ orderId, deliveryPartnerId: driverId });
    if (!delivery) {
      res.status(404).json({ success: false, message: 'Delivery assignment not found', code: 'DELIVERY_NOT_FOUND' });
      return;
    }

    delivery.status = 'PICKED_UP';
    delivery.pickedUpAt = new Date();
    delivery.timeline.push({ status: 'PICKED_UP', timestamp: new Date(), note: 'Picked up from kitchen' });
    await delivery.save();

    const order = await Order.findById(orderId);
    if (order) {
      order.status = 'PICKED_UP';
      order.timeline.push({ status: 'PICKED_UP', timestamp: new Date(), note: 'Order picked up from restaurant', actor: 'DELIVERY_PARTNER' });
      await order.save();

      // Emit Socket.IO Events
      try {
        const { io } = await import('../server');
        if (io) {
          io.to(`tracking_${orderId}`).emit('delivery:picked_up', {
            orderId,
            status: 'PICKED_UP',
            pickedUpAt: delivery.pickedUpAt
          });
          io.to(`tracking_${orderId}`).emit('order:status', {
            orderId,
            status: 'PICKED_UP',
            timeline: order.timeline
          });
          io.to(order.userId.toString()).emit('notification', {
            title: 'Order Picked Up! 🛵',
            message: 'Your food has been picked up and will be on the way shortly.',
            orderId
          });
        }
      } catch {}
    }

    res.json({ success: true, message: 'Order marked as picked up', delivery, order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to mark pickup', code: 'PICKUP_ERROR' });
  }
});

/**
 * @desc    Delivery Partner Starts Transit / Out For Delivery
 * @route   POST /api/deliveries/out-for-delivery
 * @access  Private (Driver)
 */
router.post('/out-for-delivery', protect, authorize('driver'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.body;
    const driverId = req.user?._id?.toString();

    const delivery = await Delivery.findOne({ orderId, deliveryPartnerId: driverId });
    if (!delivery) {
      res.status(404).json({ success: false, message: 'Delivery assignment not found', code: 'DELIVERY_NOT_FOUND' });
      return;
    }

    delivery.status = 'OUT_FOR_DELIVERY';
    delivery.timeline.push({ status: 'OUT_FOR_DELIVERY', timestamp: new Date(), note: 'Out for delivery to customer' });
    await delivery.save();

    const order = await Order.findById(orderId);
    if (order) {
      order.status = 'OUT_FOR_DELIVERY';
      order.timeline.push({ status: 'OUT_FOR_DELIVERY', timestamp: new Date(), note: 'Delivery partner is on the way', actor: 'DELIVERY_PARTNER' });
      await order.save();

      // Emit Socket.IO Events
      try {
        const { io } = await import('../server');
        if (io) {
          io.to(`tracking_${orderId}`).emit('delivery:out_for_delivery', {
            orderId,
            status: 'OUT_FOR_DELIVERY',
            currentLocation: delivery.currentLocation?.coordinates
          });
          io.to(`tracking_${orderId}`).emit('order:status', {
            orderId,
            status: 'OUT_FOR_DELIVERY',
            timeline: order.timeline
          });
          io.to(order.userId.toString()).emit('notification', {
            title: 'Out for Delivery! 🚀',
            message: 'Your delicious meal is on its way to your doorstep!',
            orderId
          });
        }
      } catch {}
    }

    res.json({ success: true, message: 'Order is out for delivery', delivery, order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to start delivery', code: 'OUT_FOR_DELIVERY_ERROR' });
  }
});

/**
 * @desc    Delivery Partner Marks Order as Delivered
 * @route   POST /api/deliveries/delivered
 * @access  Private (Driver)
 */
router.post('/delivered', protect, authorize('driver'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.body;
    const driverId = req.user?._id?.toString();

    const delivery = await Delivery.findOne({ orderId, deliveryPartnerId: driverId });
    if (!delivery) {
      res.status(404).json({ success: false, message: 'Delivery assignment not found', code: 'DELIVERY_NOT_FOUND' });
      return;
    }

    delivery.status = 'DELIVERED';
    delivery.deliveredAt = new Date();
    delivery.timeline.push({ status: 'DELIVERED', timestamp: new Date(), note: 'Delivered to customer' });
    await delivery.save();

    // Decrement driver active orders
    await User.findByIdAndUpdate(driverId, { $inc: { activeOrders: -1 } });

    const order = await Order.findById(orderId);
    if (order) {
      order.status = 'DELIVERED';
      order.paymentStatus = 'PAID';
      order.timeline.push({ status: 'DELIVERED', timestamp: new Date(), note: 'Order handed to customer', actor: 'DELIVERY_PARTNER' });

      // Award loyalty points
      const pointsEarned = Math.floor(order.totalPrice / 100);
      if (pointsEarned > 0) {
        await User.findByIdAndUpdate(order.userId, { $inc: { rewardPoints: pointsEarned } });
      }

      await order.save();

      // Emit Socket.IO Events
      try {
        const { io } = await import('../server');
        if (io) {
          io.to(`tracking_${orderId}`).emit('order:delivered', {
            orderId,
            status: 'DELIVERED',
            deliveredAt: delivery.deliveredAt
          });
          io.to(`tracking_${orderId}`).emit('order:status', {
            orderId,
            status: 'DELIVERED',
            timeline: order.timeline
          });
          io.to(order.userId.toString()).emit('notification', {
            title: 'Order Delivered! 🎉',
            message: 'Your meal has been delivered. Enjoy your food!',
            orderId
          });
        }
      } catch {}
    }

    res.json({ success: true, message: 'Delivery completed successfully', delivery, order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to complete delivery', code: 'DELIVERED_ERROR' });
  }
});

/**
 * @desc    Update driver GPS Location & emit real-time location event
 * @route   PUT /api/deliveries/:id/location (or PUT /api/deliveries/:id)
 * @access  Private (Driver)
 */
router.put('/:id/location', protect, authorize('driver'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { coordinates } = req.body; // [longitude, latitude]
    const driverId = req.user?._id?.toString();

    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      res.status(400).json({ success: false, message: 'Valid coordinates [lng, lat] required', code: 'INVALID_COORDINATES' });
      return;
    }

    const delivery = await Delivery.findOne({ _id: req.params.id, deliveryPartnerId: driverId });
    if (!delivery) {
      res.status(404).json({ success: false, message: 'Delivery not found', code: 'DELIVERY_NOT_FOUND' });
      return;
    }

    delivery.currentLocation = {
      type: 'Point',
      coordinates: [Number(coordinates[0]), Number(coordinates[1])]
    };
    await delivery.save();

    // Also update driver User doc
    await User.findByIdAndUpdate(driverId, {
      currentLocation: delivery.currentLocation
    });

    // Broadcast location to tracking room
    try {
      const { io } = await import('../server');
      if (io) {
        io.to(`tracking_${delivery.orderId}`).emit('delivery:location', {
          orderId: delivery.orderId,
          coordinates: delivery.currentLocation.coordinates,
          status: delivery.status,
          eta: delivery.eta
        });
      }
    } catch {}

    res.json({ success: true, currentLocation: delivery.currentLocation.coordinates });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update location', code: 'LOCATION_UPDATE_ERROR' });
  }
});

/**
 * @desc    Get tracking details for a specific order
 * @route   GET /api/deliveries/tracking/:orderId
 * @access  Private
 */
router.get('/tracking/:orderId', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const user = req.user;

    let order = null;
    if (ObjectIdMock.isValid(orderId)) {
      order = await Order.findById(orderId);
    } else if (orderId.startsWith('cs_') || orderId.startsWith('mock_sess_')) {
      order = await Order.findOne({ sessionId: orderId });
    }

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found for given tracking identifier', code: 'ORDER_NOT_FOUND' });
      return;
    }

    // Role check: customer can only track their own order
    if (user?.role === 'customer' && order.userId !== user._id.toString()) {
      res.status(403).json({ success: false, message: 'Not authorized to track this order', code: 'FORBIDDEN' });
      return;
    }

    // Driver check: if driver, only allowed if assigned to this order or order is available for pickup
    if (user?.role === 'driver' && order.deliveryPartnerId && order.deliveryPartnerId !== user._id.toString()) {
      res.status(403).json({ success: false, message: 'Not authorized to view another driver’s delivery', code: 'FORBIDDEN' });
      return;
    }

    const delivery = await Delivery.findOne({ orderId: order._id.toString() });

    const hasDriver = !!(delivery?.deliveryPartnerName || order.deliveryPartnerName);

    res.json({
      success: true,
      orderId: order._id,
      orderStatus: order.status,
      paymentStatus: order.paymentStatus,
      totalPrice: order.totalPrice,
      items: order.items,
      deliveryAddress: order.deliveryAddress,
      timeline: order.timeline,
      deliveryPartner: hasDriver ? {
        id: order.deliveryPartnerId || delivery?.deliveryPartnerId,
        name: order.deliveryPartnerName || delivery?.deliveryPartnerName || 'Assigned Driver',
        phone: order.deliveryPartnerPhone || delivery?.deliveryPartnerPhone || '9876543212'
      } : null,
      restaurantLocation: {
        latitude: delivery?.pickupLocation?.coordinates?.[1] || 13.0827,
        longitude: delivery?.pickupLocation?.coordinates?.[0] || 80.2707
      },
      customerLocation: {
        latitude: order.deliveryAddress?.lat || 13.0827,
        longitude: order.deliveryAddress?.lng || 80.2707
      },
      driverLocation: delivery?.currentLocation?.coordinates?.length === 2 ? {
        latitude: delivery.currentLocation.coordinates[1],
        longitude: delivery.currentLocation.coordinates[0]
      } : null,
      eta: delivery?.eta || null,
      deliveryStatus: delivery?.status || (['DELIVERED', 'CANCELLED'].includes(order.status) ? order.status : 'UNASSIGNED')
    });
  } catch (error: any) {
    console.error('Error fetching tracking:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tracking data', code: 'TRACKING_FETCH_ERROR' });
  }
});

/**
 * @desc    Get single delivery by ID
 * @route   GET /api/deliveries/:id
 * @access  Private
 */
router.get('/:id', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) {
      res.status(404).json({ success: false, message: 'Delivery not found', code: 'DELIVERY_NOT_FOUND' });
      return;
    }

    const order = await Order.findById(delivery.orderId);

    // Scoped access: driver can only see assigned delivery, customer can only see own order's delivery
    const user = req.user;
    if (user?.role === 'driver' && delivery.deliveryPartnerId !== user._id.toString()) {
      res.status(403).json({ success: false, message: 'Not authorized to view this delivery', code: 'FORBIDDEN' });
      return;
    }
    if (user?.role === 'customer' && order && order.userId !== user._id.toString()) {
      res.status(403).json({ success: false, message: 'Not authorized to view this delivery', code: 'FORBIDDEN' });
      return;
    }

    res.json({ success: true, delivery, order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch delivery', code: 'DELIVERY_FETCH_ERROR' });
  }
});

export default router;
