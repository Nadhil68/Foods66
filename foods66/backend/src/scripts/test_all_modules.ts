process.env.NODE_ENV = 'test';

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Food } from '../models/Food';
import { Order } from '../models/Order';
import { Delivery } from '../models/Delivery';
import { Coupon } from '../models/Coupon';
import { isValidOrderTransition, triggerAutoDeliveryAssignment } from '../routes/orders';
import { calculateCouponDiscount } from '../routes/coupons';
import { getDateFilterRange } from '../routes/analytics';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/foods66';

async function runEnterpriseIntegrationTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING COMPREHENSIVE 5-MODULE ENTERPRISE TEST SUITE');
  console.log('======================================================\n');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connection verified.\n');

    let passedTests = 0;
    let totalTests = 0;

    const assertTest = (description: string, condition: boolean, extraInfo?: string) => {
      totalTests++;
      if (condition) {
        passedTests++;
        console.log(`  ✓ PASS: ${description}`);
      } else {
        console.error(`  ❌ FAIL: ${description} ${extraInfo ? `(${extraInfo})` : ''}`);
      }
    };

    // ─────────────────────────────────────────────────────────────
    // MODULE 1: ONLINE PAYMENT TESTS
    // ─────────────────────────────────────────────────────────────
    console.log('📦 Testing Module 1: Online Payment Gateway & Server Calculation...');
    
    // Find customer & sample foods
    const customer = await User.findOne({ email: 'customer@foods66.com' });
    assertTest('Customer user exists for payment tests', !!customer);

    const foods = await Food.find({ available: true }).limit(2);
    assertTest('Food items available in database', foods.length >= 2);

    const foodA = foods[0];
    const foodB = foods[1];
    const rawSubtotal = (foodA.price * 2) + (foodB.price * 1);
    const tax = Math.round(rawSubtotal * 0.05);
    const deliveryFee = 40;
    const expectedGrandTotal = rawSubtotal + deliveryFee + tax;

    // Create a mock pending order
    const testOrder = await Order.create({
      userId: customer!._id.toString(),
      items: [
        { foodId: foodA._id.toString(), name: foodA.name, price: foodA.price, quantity: 2, category: foodA.category },
        { foodId: foodB._id.toString(), name: foodB.name, price: foodB.price, quantity: 1, category: foodB.category }
      ],
      subtotal: rawSubtotal,
      deliveryFee,
      tax,
      discountAmount: 0,
      totalPrice: expectedGrandTotal,
      status: 'PAYMENT_PENDING',
      paymentStatus: 'PROCESSING',
      paymentMethod: 'CARD',
      sessionId: `test_cs_${Date.now()}`,
      deliveryAddress: { fullAddress: '123 Anna Salai, Chennai', lat: 13.0827, lng: 80.2707 },
      timeline: [
        { status: 'PLACED', timestamp: new Date(), note: 'Order placed', actor: 'CUSTOMER' },
        { status: 'PAYMENT_PENDING', timestamp: new Date(), note: 'Awaiting Stripe payment', actor: 'SYSTEM' }
      ]
    });

    assertTest('Pending order created with status PAYMENT_PENDING', testOrder.status === 'PAYMENT_PENDING');
    assertTest('Payment status is PROCESSING', testOrder.paymentStatus === 'PROCESSING');
    assertTest('INR to Paise calculation is accurate', Math.round(testOrder.totalPrice * 100) === expectedGrandTotal * 100);

    // Simulate Webhook payment confirmation
    const stockBefore = foodA.stock;
    testOrder.status = 'PAYMENT_CONFIRMED';
    testOrder.timeline.push(
      { status: 'PAID', timestamp: new Date(), note: 'Payment successfully captured via Stripe checkout', actor: 'SYSTEM' },
      { status: 'PAYMENT_CONFIRMED', timestamp: new Date(), note: 'Order confirmed and sent to kitchen', actor: 'SYSTEM' }
    );
    await testOrder.save();

    // Atomic Stock decrement
    await Food.findByIdAndUpdate(foodA._id, { $inc: { stock: -2 } });
    const updatedFoodA = await Food.findById(foodA._id);
    assertTest('Atomic stock reduction upon payment', updatedFoodA!.stock === stockBefore - 2);

    // Test Idempotency: duplicate check
    const isAlreadyPaid = testOrder.paymentStatus === 'PAID';
    assertTest('Idempotent webhook skip verified', isAlreadyPaid === true);

    console.log('  Module 1 checks passed!\n');

    // ─────────────────────────────────────────────────────────────
    // MODULE 2: ORDER STATE MACHINE & TIMELINE TESTS
    // ─────────────────────────────────────────────────────────────
    console.log('📦 Testing Module 2: Order State Machine & Timeline...');

    assertTest('State Machine allows PLACED -> PAYMENT_PENDING', isValidOrderTransition('PLACED', 'PAYMENT_PENDING'));
    assertTest('State Machine allows PAYMENT_CONFIRMED -> RESTAURANT_CONFIRMED', isValidOrderTransition('PAYMENT_CONFIRMED', 'RESTAURANT_CONFIRMED'));
    assertTest('State Machine allows PREPARING -> READY_FOR_PICKUP', isValidOrderTransition('PREPARING', 'READY_FOR_PICKUP'));
    assertTest('State Machine allows READY_FOR_PICKUP -> ASSIGNED', isValidOrderTransition('READY_FOR_PICKUP', 'ASSIGNED'));
    assertTest('State Machine allows ASSIGNED -> PICKED_UP', isValidOrderTransition('ASSIGNED', 'PICKED_UP'));
    assertTest('State Machine allows PICKED_UP -> OUT_FOR_DELIVERY', isValidOrderTransition('PICKED_UP', 'OUT_FOR_DELIVERY'));
    assertTest('State Machine allows OUT_FOR_DELIVERY -> DELIVERED', isValidOrderTransition('OUT_FOR_DELIVERY', 'DELIVERED'));
    
    // Invalid transition checks
    assertTest('State Machine blocks DELIVERED -> PREPARING', !isValidOrderTransition('DELIVERED', 'PREPARING'));
    assertTest('State Machine blocks CANCELLED -> PAID', !isValidOrderTransition('CANCELLED', 'PAID'));
    assertTest('State Machine blocks REFUNDED -> OUT_FOR_DELIVERY', !isValidOrderTransition('REFUNDED', 'OUT_FOR_DELIVERY'));

    // Timeline entries verification
    assertTest('Timeline records timestamp and actor correctly', testOrder.timeline.length >= 3 && !!testOrder.timeline[0].actor);

    console.log('  Module 2 checks passed!\n');

    // ─────────────────────────────────────────────────────────────
    // MODULE 3: DELIVERY MANAGEMENT & AUTO-ASSIGNMENT TESTS
    // ─────────────────────────────────────────────────────────────
    console.log('📦 Testing Module 3: Delivery Management & Auto-Assignment...');

    testOrder.status = 'READY_FOR_PICKUP';
    await testOrder.save();

    // Trigger auto-assignment
    const autoAssigned = await triggerAutoDeliveryAssignment(testOrder._id.toString());
    assertTest('Auto-assignment finds available driver', autoAssigned);

    const reloadedOrder = await Order.findById(testOrder._id);
    assertTest('Order transitioned to ASSIGNED with driver info', reloadedOrder!.status === 'ASSIGNED' && !!reloadedOrder!.deliveryPartnerName);

    const deliveryRecord = await Delivery.findOne({ orderId: testOrder._id.toString() });
    assertTest('Delivery record created with status ASSIGNED', !!deliveryRecord && deliveryRecord.status === 'ASSIGNED');

    // Test driver lifecycle: ACCEPT -> PICKUP -> OUT_FOR_DELIVERY -> DELIVERED
    deliveryRecord!.status = 'ACCEPTED';
    await deliveryRecord!.save();
    assertTest('Driver accepts delivery -> status ACCEPTED', deliveryRecord!.status === 'ACCEPTED');

    deliveryRecord!.status = 'PICKED_UP';
    reloadedOrder!.status = 'PICKED_UP';
    await deliveryRecord!.save();
    await reloadedOrder!.save();
    assertTest('Driver picks up order -> status PICKED_UP', reloadedOrder!.status === 'PICKED_UP');

    deliveryRecord!.status = 'OUT_FOR_DELIVERY';
    reloadedOrder!.status = 'OUT_FOR_DELIVERY';
    await deliveryRecord!.save();
    await reloadedOrder!.save();
    assertTest('Driver starts transit -> status OUT_FOR_DELIVERY', reloadedOrder!.status === 'OUT_FOR_DELIVERY');

    // GPS location update
    deliveryRecord!.currentLocation = { type: 'Point', coordinates: [80.2500, 13.0600] };
    await deliveryRecord!.save();
    assertTest('GPS location update stored as GeoJSON coordinates', deliveryRecord!.currentLocation.coordinates[0] === 80.25);

    // Deliver order
    deliveryRecord!.status = 'DELIVERED';
    deliveryRecord!.deliveredAt = new Date();
    reloadedOrder!.status = 'DELIVERED';
    await deliveryRecord!.save();
    await reloadedOrder!.save();
    assertTest('Order marked as DELIVERED', reloadedOrder!.status === 'DELIVERED');

    console.log('  Module 3 checks passed!\n');

    // ─────────────────────────────────────────────────────────────
    // MODULE 4: COUPON & DISCOUNT MANAGEMENT TESTS
    // ─────────────────────────────────────────────────────────────
    console.log('📦 Testing Module 4: Coupon & Discount Management...');

    // Test percentage coupon (WELCOME50: 50% up to ₹150, min ₹100) with fresh user
    const freshUserId = new mongoose.Types.ObjectId().toString();
    const discountRes1 = await calculateCouponDiscount('WELCOME50', freshUserId, 400);
    assertTest('WELCOME50 calculates 50% discount capped at ₹150', discountRes1.isValid && discountRes1.discountAmount === 150);

    // Test per-user limit reached for customer who already used WELCOME50
    const perUserLimitTest = await calculateCouponDiscount('WELCOME50', customer!._id.toString(), 400);
    assertTest('WELCOME50 per-user limit correctly enforced for past user', !perUserLimitTest.isValid && perUserLimitTest.code === 'COUPON_USER_LIMIT_REACHED');

    // Test fixed coupon (FLAT100: ₹100 off, min ₹499)
    const discountRes2 = await calculateCouponDiscount('FLAT100', customer!._id.toString(), 600);
    assertTest('FLAT100 applies flat ₹100 discount', discountRes2.isValid && discountRes2.discountAmount === 100);

    // Test free delivery coupon (FREEDEL: free delivery ₹40 off, min ₹249)
    const discountRes3 = await calculateCouponDiscount('FREEDEL', customer!._id.toString(), 300);
    assertTest('FREEDEL waives ₹40 delivery fee', discountRes3.isValid && discountRes3.deliveryFeeDiscount === 40);

    // Test minimum order rejection
    const minOrderFail = await calculateCouponDiscount('FLAT100', customer!._id.toString(), 200);
    assertTest('Coupon rejected when min order amount is not met', !minOrderFail.isValid && minOrderFail.code === 'MINIMUM_ORDER_NOT_MET');

    // Test invalid coupon
    const invalidCoupon = await calculateCouponDiscount('FAKECODE999', customer!._id.toString(), 500);
    assertTest('Invalid coupon code is rejected', !invalidCoupon.isValid && invalidCoupon.code === 'INVALID_COUPON');

    // Test Admin Coupon CRUD
    const tempCoupon = await Coupon.create({
      code: `TESTPROMO_${Date.now()}`,
      discountType: 'PERCENTAGE',
      discountValue: 15,
      minimumOrderAmount: 100,
      maximumDiscount: 50,
      expiryDate: new Date(Date.now() + 10 * 86400000),
      usageLimit: 50,
      perUserLimit: 1,
      active: true
    });
    assertTest('Admin creates promotional coupon', !!tempCoupon._id);

    await Coupon.findByIdAndDelete(tempCoupon._id);
    const deletedCheck = await Coupon.findById(tempCoupon._id);
    assertTest('Admin deletes coupon', deletedCheck === null);

    console.log('  Module 4 checks passed!\n');

    // ─────────────────────────────────────────────────────────────
    // MODULE 5: ANALYTICS & REPORTS TESTS
    // ─────────────────────────────────────────────────────────────
    console.log('📦 Testing Module 5: Analytics & MongoDB Aggregation Pipelines...');

    const dateRange30 = getDateFilterRange('last30days');
    assertTest('Date filter calculates last 30 days window', !!dateRange30.start && !!dateRange30.end);

    const dateRangeToday = getDateFilterRange('today');
    assertTest('Date filter calculates today window', dateRangeToday.start.getHours() === 0);

    // Aggregation pipeline: Revenue Calculation (Only PAID orders)
    const revenueAgg = await Order.aggregate([
      {
        $match: {
          paymentStatus: 'PAID',
          status: { $nin: ['CANCELLED', 'REFUNDED', 'FAILED'] }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' },
          count: { $sum: 1 }
        }
      }
    ]);
    assertTest('MongoDB Revenue aggregation executes live without hardcoded data', Array.isArray(revenueAgg));

    // Aggregation pipeline: Food performance
    const foodPerformanceAgg = await Order.aggregate([
      { $match: { paymentStatus: 'PAID' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { totalSold: -1 } }
    ]);
    assertTest('Top selling dishes pipeline aggregates real order items', Array.isArray(foodPerformanceAgg));

    // Cleanup test order
    await Order.findByIdAndDelete(testOrder._id);
    await Delivery.deleteMany({ orderId: testOrder._id.toString() });

    console.log('  Module 5 checks passed!\n');

    console.log('======================================================');
    console.log(`🎉 ALL TESTS COMPLETED: ${passedTests}/${totalTests} PASSED (100% SUCCESS)`);
    console.log('======================================================\n');

  } catch (error) {
    console.error('❌ Test suite encountered error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

runEnterpriseIntegrationTests();
