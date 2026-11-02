import { Router } from 'express';
import Stripe from 'stripe';
import { Order } from '../models/Order';
import { Food } from '../models/Food';
import { Coupon } from '../models/Coupon';
import { env } from '../config/envConfig';
import { logger } from '../utils/logger';
const router = Router();
/**
 * Handle Stripe Webhooks with Idempotency & Lifecycle automation
 */
export const handleStripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const secretKey = process.env.STRIPE_SECRET_KEY;
    let event;
    if (endpointSecret && secretKey && sig) {
        const stripe = new Stripe(secretKey, { apiVersion: '2023-10-16' });
        try {
            // req.body is raw Buffer parsed by express.raw()
            event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        }
        catch (err) {
            logger.security('WEBHOOK_SIGNATURE_FAILED', `Webhook Signature Verification Error: ${err.message}`);
            res.status(400).send(`Webhook Error: ${err.message}`);
            return;
        }
    }
    else {
        // SECURITY: Reject unsigned webhooks in production.
        // The fallback that accepts any JSON body is only for local dev/test.
        if (env.isProduction) {
            logger.security('WEBHOOK_UNSIGNED_REJECTED', 'Rejected unsigned webhook in production', {
                ip: req.ip,
                hasSig: !!sig,
                hasSecret: !!endpointSecret,
            });
            res.status(403).json({ error: 'Webhook signature verification required in production' });
            return;
        }
        // Development-only fallback for testing without Stripe CLI
        try {
            const rawText = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body);
            event = JSON.parse(rawText);
            console.warn('⚠️  DEV MODE: Processing unsigned webhook payload');
        }
        catch (e) {
            res.status(400).json({ error: 'Invalid webhook payload JSON' });
            return;
        }
    }
    try {
        const eventType = event.type;
        console.log(`📥 Received Stripe Webhook Event: ${eventType}`);
        if (eventType === 'checkout.session.completed' || eventType === 'payment_intent.succeeded') {
            const session = event.data.object;
            const sessionId = session.id;
            const paymentIntentId = session.payment_intent || session.id;
            // Find order by sessionId or stripePaymentIntentId
            const order = await Order.findOne({
                $or: [
                    { sessionId },
                    { stripePaymentIntentId: paymentIntentId },
                    { _id: session.metadata?.orderId }
                ]
            });
            if (!order) {
                console.warn(`Order not found for Stripe session: ${sessionId}`);
                res.status(200).json({ received: true, note: 'Order not found, ignored' });
                return;
            }
            // IDEMPOTENCY CHECK:
            // If already marked as PAID, PAYMENT_CONFIRMED, PREPARING, etc. do NOT re-run side effects
            if (order.paymentStatus === 'PAID' || ['PAID', 'PAYMENT_CONFIRMED', 'RESTAURANT_CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status)) {
                console.log(`⚡ Idempotent skip: Order ${order._id} is already processed with status ${order.status}`);
                res.status(200).json({ received: true, skipped: true });
                return;
            }
            // 1. Mark Order Paid & Confirmed
            order.paymentStatus = 'PAID';
            order.status = 'PAYMENT_CONFIRMED';
            if (paymentIntentId)
                order.stripePaymentIntentId = paymentIntentId;
            order.timeline.push({ status: 'PAID', timestamp: new Date(), note: 'Payment successfully captured via Stripe', actor: 'SYSTEM' }, { status: 'PAYMENT_CONFIRMED', timestamp: new Date(), note: 'Order payment confirmed and sent to restaurant kitchen', actor: 'SYSTEM' });
            await order.save();
            // 2. Decrement Food stock atomically with $gte guard (prevents negative stock)
            for (const item of order.items) {
                if (item.foodId) {
                    try {
                        const qty = Math.max(1, item.quantity);
                        const result = await Food.findOneAndUpdate({ _id: item.foodId, stock: { $gte: qty } }, { $inc: { stock: -qty } }, { new: true });
                        if (!result) {
                            logger.warn('STOCK_INSUFFICIENT', `Stock insufficient or item not found for foodId=${item.foodId}, qty=${qty}`);
                        }
                        else if (result.stock === 0) {
                            // Auto-disable item when stock reaches zero
                            await Food.findByIdAndUpdate(item.foodId, { available: false });
                            logger.info('STOCK_DEPLETED', `Food ${item.foodId} auto-disabled (stock=0)`);
                        }
                    }
                    catch (stkErr) {
                        logger.error('STOCK_DECREMENT_FAILED', `Failed to decrement stock for item ${item.foodId}`, { error: stkErr });
                    }
                }
            }
            // 3. Increment Coupon usedCount atomically if coupon was used
            if (order.couponCode) {
                try {
                    await Coupon.findOneAndUpdate({ code: order.couponCode }, {
                        $inc: { usedCount: 1 },
                        $push: {
                            usedBy: {
                                userId: order.userId,
                                orderId: order._id.toString(),
                                usedAt: new Date(),
                                discountAmount: order.discountAmount
                            }
                        }
                    });
                }
                catch (cErr) {
                    console.error(`Failed to update coupon usage for ${order.couponCode}:`, cErr);
                }
            }
            // 4. Create Delivery Record for Tracking purposes
            try {
                // Create unassigned Delivery record so tracking never 404s
                const { Delivery } = await import('../models/Delivery');
                const existingDelivery = await Delivery.findOne({ orderId: order._id.toString() });
                if (!existingDelivery) {
                    await Delivery.create({
                        orderId: order._id.toString(),
                        status: 'AVAILABLE',
                        timeline: [{ status: 'AVAILABLE', timestamp: new Date(), note: 'Order awaiting restaurant confirmation and kitchen prep' }]
                    });
                }
            }
            catch (delErr) {
                console.error(`Failed to create delivery record for order ${order._id}:`, delErr);
            }
            console.log(`✅ Order ${order._id} successfully confirmed & paid via Webhook`);
            // 5. Emit Real-Time Socket.IO Events
            try {
                const { io } = await import('../server');
                if (io) {
                    // Notify customer user room
                    io.to(order.userId.toString()).emit('notification', {
                        title: 'Payment Successful! 🎉',
                        message: `Order #${order._id.toString().slice(-6)} has been paid and confirmed by the kitchen!`,
                        orderId: order._id,
                        status: order.status
                    });
                    // Broadcast to order tracking room
                    io.to(`tracking_${order._id.toString()}`).emit('order:status', {
                        orderId: order._id.toString(),
                        status: order.status,
                        paymentStatus: order.paymentStatus,
                        timeline: order.timeline
                    });
                }
            }
            catch (socketErr) {
                console.warn('Socket notification error:', socketErr);
            }
        }
        else if (eventType === 'payment_intent.payment_failed' || eventType === 'checkout.session.expired') {
            const session = event.data.object;
            const sessionId = session.id;
            const order = await Order.findOne({
                $or: [{ sessionId }, { stripePaymentIntentId: session.id }]
            });
            if (order && order.paymentStatus !== 'PAID') {
                order.paymentStatus = 'FAILED';
                order.status = 'CANCELLED';
                order.timeline.push({
                    status: 'CANCELLED',
                    timestamp: new Date(),
                    note: eventType === 'checkout.session.expired' ? 'Checkout session expired' : 'Payment capture failed',
                    actor: 'SYSTEM'
                });
                await order.save();
                console.log(`⚠️ Order ${order._id} marked CANCELLED due to ${eventType}`);
                try {
                    const { io } = await import('../server');
                    if (io) {
                        io.to(`tracking_${order._id.toString()}`).emit('order:status', {
                            orderId: order._id.toString(),
                            status: 'CANCELLED',
                            paymentStatus: 'FAILED',
                            timeline: order.timeline
                        });
                    }
                }
                catch { }
            }
        }
        res.status(200).json({ received: true });
    }
    catch (error) {
        logger.error('WEBHOOK_PROCESSING_FAILED', 'Webhook processing failure', { error });
        res.status(500).json({ error: 'Webhook processing failed' });
    }
};
router.post('/payment', handleStripeWebhook);
router.post('/', handleStripeWebhook);
export default router;
//# sourceMappingURL=webhooks.js.map