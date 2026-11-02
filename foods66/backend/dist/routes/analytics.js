import { Router } from 'express';
import { Order } from '../models/Order';
import { User } from '../models/User';
import { Food } from '../models/Food';
import { Delivery } from '../models/Delivery';
import { Coupon } from '../models/Coupon';
import { protect, authorize } from '../middlewares/auth';
import { jsonToCSV } from '../utils/exportUtils';
const router = Router();
/**
 * Helper to compute date boundaries with consistent timezone handling
 */
export const getDateFilterRange = (rangeType, customStart, customEnd) => {
    const now = new Date();
    let start = new Date(now);
    let end = new Date(now);
    switch (rangeType) {
        case 'today': {
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            break;
        }
        case 'yesterday': {
            start.setDate(start.getDate() - 1);
            start.setHours(0, 0, 0, 0);
            end.setDate(end.getDate() - 1);
            end.setHours(23, 59, 59, 999);
            break;
        }
        case 'last7days':
        case 'week': {
            start.setDate(start.getDate() - 7);
            start.setHours(0, 0, 0, 0);
            break;
        }
        case 'last30days':
        case '30days': {
            start.setDate(start.getDate() - 30);
            start.setHours(0, 0, 0, 0);
            break;
        }
        case 'thisMonth': {
            start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
            break;
        }
        case 'lastMonth': {
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
            end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
            break;
        }
        case 'custom': {
            if (customStart)
                start = new Date(customStart);
            if (customEnd) {
                end = new Date(customEnd);
                end.setHours(23, 59, 59, 999);
            }
            break;
        }
        default: {
            // Default: Last 30 days
            start.setDate(start.getDate() - 30);
            start.setHours(0, 0, 0, 0);
            break;
        }
    }
    return { start, end };
};
// Match filter for valid revenue (PAID orders, excluding cancelled, failed, refunded)
const REVENUE_ORDER_MATCH = {
    paymentStatus: 'PAID',
    status: { $nin: ['CANCELLED', 'REFUNDED', 'FAILED'] }
};
/**
 * @desc    Overview Analytics KPI Metrics (Real MongoDB Aggregations)
 * @route   GET /api/analytics/overview
 * @access  Private (Admin, Restaurant)
 */
const overviewAnalyticsHandler = async (req, res) => {
    try {
        const { range, startDate, endDate } = req.query;
        const { start, end } = getDateFilterRange(range, startDate, endDate);
        // Today & Month markers for quick KPI comparison
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const [filteredRevenueAgg, todayRevenueAgg, monthRevenueAgg, totalOrdersCount, todayOrdersCount, completedOrdersCount, cancelledOrdersCount, activeDeliveriesCount, deliveredDeliveriesCount, allPaymentAttemptsCount, paidPaymentsCount, couponsUsedAgg, totalUsersCount] = await Promise.all([
            // 1. Filtered Period Revenue & Orders
            Order.aggregate([
                { $match: { createdAt: { $gte: start, $lte: end }, ...REVENUE_ORDER_MATCH } },
                { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' }, count: { $sum: 1 } } }
            ]),
            // 2. Today's Revenue
            Order.aggregate([
                { $match: { createdAt: { $gte: todayStart }, ...REVENUE_ORDER_MATCH } },
                { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' }, count: { $sum: 1 } } }
            ]),
            // 3. Monthly Revenue
            Order.aggregate([
                { $match: { createdAt: { $gte: monthStart }, ...REVENUE_ORDER_MATCH } },
                { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' }, count: { $sum: 1 } } }
            ]),
            // 4. Total orders in range
            Order.countDocuments({ createdAt: { $gte: start, $lte: end } }),
            // 5. Today's orders
            Order.countDocuments({ createdAt: { $gte: todayStart } }),
            // 6. Completed orders
            Order.countDocuments({ createdAt: { $gte: start, $lte: end }, status: 'DELIVERED' }),
            // 7. Cancelled orders
            Order.countDocuments({ createdAt: { $gte: start, $lte: end }, status: 'CANCELLED' }),
            // 8. Active deliveries
            Delivery.countDocuments({ status: { $in: ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'OUT_FOR_DELIVERY'] } }),
            // 9. Delivered deliveries
            Delivery.countDocuments({ createdAt: { $gte: start, $lte: end }, status: 'DELIVERED' }),
            // 10. Total payment attempts
            Order.countDocuments({ createdAt: { $gte: start, $lte: end }, paymentMethod: 'CARD' }),
            // 11. Successful paid orders
            Order.countDocuments({ createdAt: { $gte: start, $lte: end }, paymentStatus: 'PAID' }),
            // 12. Coupon usage stats
            Coupon.aggregate([
                { $unwind: '$usedBy' },
                { $match: { 'usedBy.usedAt': { $gte: start, $lte: end } } },
                { $group: { _id: null, totalCount: { $sum: 1 }, totalDiscount: { $sum: '$usedBy.discountAmount' } } }
            ]),
            // 13. Total Users
            User.countDocuments()
        ]);
        const totalRevenue = filteredRevenueAgg[0]?.totalRevenue || 0;
        const paidOrderCount = filteredRevenueAgg[0]?.count || 0;
        const todayRevenue = todayRevenueAgg[0]?.totalRevenue || 0;
        const monthlyRevenue = monthRevenueAgg[0]?.totalRevenue || 0;
        const averageOrderValue = paidOrderCount > 0 ? Math.round(totalRevenue / paidOrderCount) : 0;
        const paymentSuccessRate = allPaymentAttemptsCount > 0
            ? Number(((paidPaymentsCount / allPaymentAttemptsCount) * 100).toFixed(1))
            : 100;
        const dispatchedCount = completedOrdersCount + activeDeliveriesCount;
        const deliverySuccessRate = dispatchedCount > 0
            ? Number(((completedOrdersCount / dispatchedCount) * 100).toFixed(1))
            : 100;
        res.json({
            success: true,
            range: { start, end },
            kpis: {
                totalRevenue,
                todayRevenue,
                monthlyRevenue,
                totalOrders: totalOrdersCount,
                todayOrders: todayOrdersCount,
                completedOrders: completedOrdersCount,
                cancelledOrders: cancelledOrdersCount,
                averageOrderValue,
                activeDeliveries: activeDeliveriesCount,
                deliveredOrders: deliveredDeliveriesCount,
                couponUsageCount: couponsUsedAgg[0]?.totalCount || 0,
                couponDiscountTotal: couponsUsedAgg[0]?.totalDiscount || 0,
                paymentSuccessRate,
                deliverySuccessRate,
                totalUsers: totalUsersCount
            }
        });
    }
    catch (error) {
        console.error('Overview analytics error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch analytics overview', code: 'ANALYTICS_OVERVIEW_ERROR' });
    }
};
router.get('/overview', protect, authorize('admin', 'restaurant'), overviewAnalyticsHandler);
router.get('/live', protect, authorize('admin', 'restaurant'), overviewAnalyticsHandler);
/**
 * @desc    Revenue Time Series Analytics
 * @route   GET /api/analytics/revenue
 * @access  Private (Admin)
 */
router.get('/revenue', protect, authorize('admin'), async (req, res) => {
    try {
        const { range, startDate, endDate } = req.query;
        const { start, end } = getDateFilterRange(range, startDate, endDate);
        const revenueTimeline = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end },
                    ...REVENUE_ORDER_MATCH
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    revenue: { $sum: '$totalPrice' },
                    orders: { $sum: 1 },
                    discountGiven: { $sum: '$discountAmount' }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        res.json({
            success: true,
            data: revenueTimeline.map(r => ({
                date: r._id,
                revenue: r.revenue,
                orders: r.orders,
                discountGiven: r.discountGiven
            }))
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch revenue analytics', code: 'REVENUE_ANALYTICS_ERROR' });
    }
});
/**
 * @desc    Order Trends & Status Distribution
 * @route   GET /api/analytics/orders
 * @access  Private (Admin, Restaurant)
 */
router.get('/orders', protect, authorize('admin', 'restaurant'), async (req, res) => {
    try {
        const { range, startDate, endDate } = req.query;
        const { start, end } = getDateFilterRange(range, startDate, endDate);
        const [statusDistribution, hourlyOrders, orderTrends] = await Promise.all([
            // Status Distribution
            Order.aggregate([
                { $match: { createdAt: { $gte: start, $lte: end } } },
                { $group: { _id: '$status', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            // Hourly distribution
            Order.aggregate([
                { $match: { createdAt: { $gte: start, $lte: end } } },
                {
                    $group: {
                        _id: { $hour: '$createdAt' },
                        orders: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            // Daily order trend
            Order.aggregate([
                { $match: { createdAt: { $gte: start, $lte: end } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ])
        ]);
        res.json({
            success: true,
            statusDistribution: statusDistribution.map(s => ({ status: s._id, count: s.count })),
            hourlyOrders: hourlyOrders.map(h => ({ hour: `${h._id}:00`, orders: h.orders })),
            orderTrends: orderTrends.map(t => ({ date: t._id, orders: t.count }))
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch order analytics', code: 'ORDER_ANALYTICS_ERROR' });
    }
});
/**
 * @desc    Top Selling Foods & Category Breakdown
 * @route   GET /api/analytics/foods
 * @access  Private (Admin, Restaurant)
 */
router.get('/foods', protect, authorize('admin', 'restaurant'), async (req, res) => {
    try {
        const { range, startDate, endDate } = req.query;
        const { start, end } = getDateFilterRange(range, startDate, endDate);
        const [topSellingFoods, categoryDistribution] = await Promise.all([
            // Top Selling Dishes
            Order.aggregate([
                { $match: { createdAt: { $gte: start, $lte: end }, ...REVENUE_ORDER_MATCH } },
                { $unwind: '$items' },
                {
                    $group: {
                        _id: '$items.name',
                        totalSold: { $sum: '$items.quantity' },
                        totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                        category: { $first: '$items.category' }
                    }
                },
                { $sort: { totalSold: -1 } },
                { $limit: 10 }
            ]),
            // Category Breakdown
            Food.aggregate([
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ])
        ]);
        res.json({
            success: true,
            topFoods: topSellingFoods.map(f => ({
                name: f._id,
                category: f.category || 'General',
                orders: f.totalSold,
                revenue: f.totalRevenue
            })),
            categoryDistribution: categoryDistribution.map(c => ({ category: c._id, count: c.count }))
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch food analytics', code: 'FOOD_ANALYTICS_ERROR' });
    }
});
/**
 * @desc    Customer RFM Segmentation & Behavior Analytics
 * @route   GET /api/analytics/customers
 * @access  Private (Admin)
 */
router.get('/customers', protect, authorize('admin'), async (req, res) => {
    try {
        const segments = await Order.aggregate([
            { $match: REVENUE_ORDER_MATCH },
            {
                $group: {
                    _id: '$userId',
                    orderCount: { $sum: 1 },
                    totalSpend: { $sum: '$totalPrice' },
                    lastOrderDate: { $max: '$createdAt' }
                }
            },
            {
                $addFields: {
                    segment: {
                        $switch: {
                            branches: [
                                { case: { $gte: ['$totalSpend', 5000] }, then: 'Whales' },
                                { case: { $gte: ['$orderCount', 5] }, then: 'Regulars' },
                                { case: { $gte: [{ $subtract: [new Date(), '$lastOrderDate'] }, 1000 * 60 * 60 * 24 * 30] }, then: 'Churn Risk' }
                            ],
                            default: 'New'
                        }
                    }
                }
            },
            {
                $group: {
                    _id: '$segment',
                    count: { $sum: 1 },
                    totalRevenue: { $sum: '$totalSpend' }
                }
            }
        ]);
        const totalCustomers = await User.countDocuments({ role: 'customer' });
        res.json({
            success: true,
            totalCustomers,
            segments: segments.map(s => ({
                name: s._id,
                count: s.count,
                revenue: s.totalRevenue
            }))
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch customer analytics', code: 'CUSTOMER_ANALYTICS_ERROR' });
    }
});
/**
 * @desc    Delivery Performance & Driver Analytics
 * @route   GET /api/analytics/delivery
 * @access  Private (Admin)
 */
router.get('/delivery', protect, authorize('admin'), async (req, res) => {
    try {
        const [deliveryStatusDist, driverPerformance] = await Promise.all([
            Delivery.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            User.find({ role: 'driver' }).select('name phone vehicle availability activeOrders rating')
        ]);
        res.json({
            success: true,
            deliveryStatusDist: deliveryStatusDist.map(d => ({ status: d._id, count: d.count })),
            drivers: driverPerformance
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch delivery analytics', code: 'DELIVERY_ANALYTICS_ERROR' });
    }
});
/**
 * @desc    Export Reports (CSV or structured JSON/PDF ready)
 * @route   GET /api/analytics/export
 * @access  Private (Admin)
 */
router.get('/export', protect, authorize('admin'), async (req, res) => {
    try {
        const { type = 'sales', format = 'csv', range, startDate, endDate } = req.query;
        const { start, end } = getDateFilterRange(range, startDate, endDate);
        let rows = [];
        let filename = `foods66_${type}_report_${Date.now()}`;
        if (type === 'sales') {
            const orders = await Order.find({
                createdAt: { $gte: start, $lte: end },
                ...REVENUE_ORDER_MATCH
            }).sort({ createdAt: -1 }).lean();
            rows = orders.map(o => ({
                OrderID: o._id.toString(),
                Date: o.createdAt?.toISOString().split('T')[0] || '',
                Customer: o.userId,
                Subtotal: o.subtotal,
                DeliveryFee: o.deliveryFee,
                Tax: o.tax,
                Discount: o.discountAmount,
                Coupon: o.couponCode || 'None',
                Total: o.totalPrice,
                PaymentMethod: o.paymentMethod,
                Status: o.status
            }));
        }
        else if (type === 'orders') {
            const orders = await Order.find({ createdAt: { $gte: start, $lte: end } }).sort({ createdAt: -1 }).lean();
            rows = orders.map(o => ({
                OrderID: o._id.toString(),
                Date: o.createdAt?.toISOString().split('T')[0] || '',
                ItemsCount: o.items.length,
                TotalAmount: o.totalPrice,
                Status: o.status,
                PaymentStatus: o.paymentStatus,
                Driver: o.deliveryPartnerName || 'None'
            }));
        }
        else if (type === 'foods') {
            const foods = await Food.find().lean();
            rows = foods.map(f => ({
                FoodID: f._id.toString(),
                Name: f.name,
                Category: f.category,
                Price: f.price,
                Available: f.available ? 'Yes' : 'No',
                Stock: f.stock
            }));
        }
        else if (type === 'coupons') {
            const coupons = await Coupon.find().lean();
            rows = coupons.map(c => ({
                Code: c.code,
                DiscountType: c.discountType,
                DiscountValue: c.discountValue,
                MinOrder: c.minimumOrderAmount,
                UsedCount: c.usedCount,
                UsageLimit: c.usageLimit,
                Active: c.active ? 'Yes' : 'No',
                ExpiryDate: c.expiryDate?.toISOString().split('T')[0] || ''
            }));
        }
        else if (type === 'deliveries') {
            const deliveries = await Delivery.find({ createdAt: { $gte: start, $lte: end } }).sort({ createdAt: -1 }).lean();
            rows = deliveries.map(d => ({
                DeliveryID: d._id.toString(),
                OrderID: d.orderId,
                Driver: d.deliveryPartnerName || 'Unassigned',
                Status: d.status,
                AssignedAt: d.assignedAt?.toISOString() || '',
                DeliveredAt: d.deliveredAt?.toISOString() || ''
            }));
        }
        if (format === 'csv') {
            const csvContent = jsonToCSV(rows);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
            res.send(csvContent);
            return;
        }
        // Return structured report format for PDF generator
        res.json({
            success: true,
            reportType: type,
            generatedAt: new Date(),
            count: rows.length,
            data: rows
        });
    }
    catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ success: false, message: 'Failed to export report', code: 'EXPORT_ERROR' });
    }
});
export default router;
//# sourceMappingURL=analytics.js.map