import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Users, DollarSign, ShoppingBag, Truck, Download, Calendar,
  RefreshCw, Tag, Plus, Trash2, Edit2, CheckCircle2, XCircle, AlertCircle,
  BarChart3, PieChart as PieIcon, Activity, Sparkles, Filter
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { analyticsAPI, couponsAPI } from '../services/apiService';
import { useNotificationStore } from '../store/useStore';

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4'];

const AdminBIDashboard: React.FC = () => {
  const { showNotification } = useNotificationStore();

  const [dateRange, setDateRange] = useState<string>('last30days');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'analytics' | 'coupons'>('analytics');

  // Analytics Data States
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [orderAnalytics, setOrderAnalytics] = useState<any>(null);
  const [foodAnalytics, setFoodAnalytics] = useState<any>(null);
  const [customerAnalytics, setCustomerAnalytics] = useState<any>(null);
  const [exportLoading, setExportLoading] = useState(false);

  // Coupon Management States
  const [coupons, setCoupons] = useState<any[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    minimumOrderAmount: 299,
    maximumDiscount: 150,
    usageLimit: 100,
    perUserLimit: 1,
    expiryDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0]
  });

  // Fetch Live Analytics from Backend
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [overRes, revRes, ordRes, foodRes, custRes] = await Promise.all([
        analyticsAPI.getOverview(dateRange, customStart, customEnd),
        analyticsAPI.getRevenue(dateRange, customStart, customEnd),
        analyticsAPI.getOrders(dateRange, customStart, customEnd),
        analyticsAPI.getFoods(dateRange, customStart, customEnd),
        analyticsAPI.getCustomers()
      ]);

      if (overRes.success) setOverview(overRes.kpis);
      if (revRes.success) setRevenueData(revRes.data || []);
      if (ordRes.success) setOrderAnalytics(ordRes);
      if (foodRes.success) setFoodAnalytics(foodRes);
      if (custRes.success) setCustomerAnalytics(custRes);
    } catch (err: any) {
      console.error('Failed to load analytics:', err);
      showNotification('Error', 'Failed to fetch analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Coupons
  const fetchCoupons = async () => {
    try {
      setCouponsLoading(true);
      const res = await couponsAPI.getAll();
      if (res.success) setCoupons(res.coupons || []);
    } catch (err: any) {
      console.error('Failed to fetch coupons:', err);
    } finally {
      setCouponsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchCoupons();
  }, [dateRange]);

  // Export CSV Handler
  const handleExport = async (type: string) => {
    try {
      setExportLoading(true);
      await analyticsAPI.exportReport(type, 'csv', dateRange, customStart, customEnd);
      showNotification('Report Downloaded', `${type.toUpperCase()} report exported successfully.`, 'success');
    } catch (err: any) {
      showNotification('Export Error', 'Failed to export report', 'error');
    } finally {
      setExportLoading(false);
    }
  };

  // Coupon Creation Handler
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await couponsAPI.create(couponForm);
      if (res.success) {
        showNotification('Coupon Created! 🎉', `Coupon ${couponForm.code.toUpperCase()} is now live.`, 'success');
        setShowCouponModal(false);
        setCouponForm({
          code: '',
          description: '',
          discountType: 'PERCENTAGE',
          discountValue: 20,
          minimumOrderAmount: 299,
          maximumDiscount: 150,
          usageLimit: 100,
          perUserLimit: 1,
          expiryDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0]
        });
        await fetchCoupons();
      }
    } catch (err: any) {
      showNotification('Error', err.message || 'Failed to create coupon', 'error');
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await couponsAPI.delete(id);
      showNotification('Deleted', 'Coupon removed', 'info');
      await fetchCoupons();
    } catch (err: any) {
      showNotification('Error', err.message || 'Failed to delete coupon', 'error');
    }
  };

  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-gray-950 pb-24">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-orange-100 dark:bg-orange-950/40 text-orange-600 rounded-xl">
                <BarChart3 size={24} />
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                Enterprise Business Intelligence
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Live Aggregations, State Machine Trends & Financial Reports</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Date Range Selector */}
            <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 shadow-sm">
              <Calendar size={14} className="text-gray-400 ml-2" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-gray-700 dark:text-gray-200 py-1.5 px-2 outline-none cursor-pointer"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last7days">Last 7 Days</option>
                <option value="last30days">Last 30 Days</option>
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => { fetchAnalytics(); fetchCoupons(); }}
              className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-50 shadow-sm"
              title="Refresh Analytics"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin text-orange-500' : ''} />
            </button>

            {/* Export Dropdown */}
            <div className="relative group">
              <button
                disabled={exportLoading}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 shadow-sm transition disabled:opacity-60"
              >
                <Download size={14} /> Export CSV Report
              </button>
              <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1 hidden group-hover:block z-20">
                <button onClick={() => handleExport('sales')} className="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-orange-50 dark:hover:bg-gray-700 font-medium">Sales Report</button>
                <button onClick={() => handleExport('orders')} className="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-orange-50 dark:hover:bg-gray-700 font-medium">Orders Report</button>
                <button onClick={() => handleExport('foods')} className="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-orange-50 dark:hover:bg-gray-700 font-medium">Food Performance</button>
                <button onClick={() => handleExport('coupons')} className="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-orange-50 dark:hover:bg-gray-700 font-medium">Coupons Audit</button>
                <button onClick={() => handleExport('deliveries')} className="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-orange-50 dark:hover:bg-gray-700 font-medium">Delivery Metrics</button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 mb-8">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`pb-3 px-6 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'analytics'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <TrendingUp size={16} /> Analytics & Performance
          </button>
          <button
            onClick={() => setActiveTab('coupons')}
            className={`pb-3 px-6 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'coupons'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Tag size={16} /> Coupon Management ({coupons.length})
          </button>
        </div>

        {activeTab === 'analytics' ? (
          <>
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="card p-5 border-l-4 border-orange-500">
                <span className="text-xs text-gray-500 font-bold uppercase">Total Revenue</span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-2xl font-extrabold text-gray-900 dark:text-white">
                    ₹{overview?.totalRevenue?.toLocaleString() || 0}
                  </span>
                  <DollarSign size={20} className="text-orange-500" />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Today: ₹{overview?.todayRevenue?.toLocaleString() || 0}</p>
              </div>

              <div className="card p-5 border-l-4 border-blue-500">
                <span className="text-xs text-gray-500 font-bold uppercase">Total Orders</span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-2xl font-extrabold text-gray-900 dark:text-white">
                    {overview?.totalOrders || 0}
                  </span>
                  <ShoppingBag size={20} className="text-blue-500" />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Completed: {overview?.completedOrders || 0} • Cancelled: {overview?.cancelledOrders || 0}</p>
              </div>

              <div className="card p-5 border-l-4 border-emerald-500">
                <span className="text-xs text-gray-500 font-bold uppercase">Average Order Value</span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-2xl font-extrabold text-emerald-600">
                    ₹{overview?.averageOrderValue || 0}
                  </span>
                  <TrendingUp size={20} className="text-emerald-500" />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Payment Success: {overview?.paymentSuccessRate || 100}%</p>
              </div>

              <div className="card p-5 border-l-4 border-purple-500">
                <span className="text-xs text-gray-500 font-bold uppercase">Active Deliveries</span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-2xl font-extrabold text-purple-600">
                    {overview?.activeDeliveries || 0}
                  </span>
                  <Truck size={20} className="text-purple-500" />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Delivered: {overview?.deliveredOrders || 0}</p>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Revenue Timeline */}
              <div className="card p-6">
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <TrendingUp size={18} className="text-orange-500" /> Revenue Trajectory
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value: any) => [`₹${value}`, 'Revenue']} />
                      <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2.5} fillOpacity={1} fill="url(#revGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Order Status Distribution */}
              <div className="card p-6">
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <PieIcon size={18} className="text-blue-500" /> Order Status Breakdown
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={orderAnalytics?.statusDistribution || []}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {(orderAnalytics?.statusDistribution || []).map((_entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Top Selling Foods & Customer Segmentation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Top Selling Foods */}
              <div className="card p-6">
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white mb-4">
                  Top Selling Dishes
                </h3>
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {(foodAnalytics?.topFoods || []).map((food: any, i: number) => (
                    <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-gray-900 dark:text-white">{food.name}</span>
                        <span className="text-gray-400 block">{food.category}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-orange-600">{food.orders} sold</span>
                        <span className="text-gray-500 block">₹{food.revenue}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Segmentation */}
              <div className="card p-6">
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Users size={18} className="text-purple-500" /> Customer RFM Segments
                </h3>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={customerAnalytics?.segments || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value: any) => [`${value} Users`, 'Count']} />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* ─── MODULE 4: ADMIN COUPON MANAGEMENT UI ─── */
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Active Promotional Coupons</h3>
              <button
                onClick={() => setShowCouponModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 shadow-sm transition"
              >
                <Plus size={14} /> Create New Coupon
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {coupons.map((c) => (
                <div key={c._id} className="card p-5 border border-gray-100 dark:border-gray-800 relative group">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="font-mono text-base font-extrabold text-orange-600 dark:text-orange-400 tracking-wider">
                        {c.code}
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">{c.description || 'General promo discount'}</p>
                    </div>
                    <span className={`badge text-[10px] uppercase font-bold px-2 py-0.5 rounded ${c.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1 py-2 border-y border-gray-100 dark:border-gray-800">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Discount:</span>
                      <span className="font-bold">{c.discountType === 'PERCENTAGE' ? `${c.discountValue}% (up to ₹${c.maximumDiscount})` : c.discountType === 'FREE_DELIVERY' ? 'Free Delivery (₹40)' : `₹${c.discountValue} Flat`}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Min Order:</span>
                      <span>₹{c.minimumOrderAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Usage:</span>
                      <span>{c.usedCount} / {c.usageLimit} claims</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Expires:</span>
                      <span>{new Date(c.expiryDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => handleDeleteCoupon(c._id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                      title="Delete Coupon"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Create Coupon Modal */}
            {showCouponModal && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-gray-100 dark:border-gray-800">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Create Enterprise Coupon</h3>
                    <button onClick={() => setShowCouponModal(false)} className="text-gray-400 hover:text-gray-600">
                      <XCircle size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
                    <div>
                      <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Coupon Code (Uppercase)</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. FESTIVE30"
                        value={couponForm.code}
                        onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                        className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-mono font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Discount Type</label>
                        <select
                          value={couponForm.discountType}
                          onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })}
                          className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="PERCENTAGE">PERCENTAGE (%)</option>
                          <option value="FIXED_AMOUNT">FIXED_AMOUNT (₹)</option>
                          <option value="FREE_DELIVERY">FREE_DELIVERY</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Discount Value</label>
                        <input
                          type="number"
                          required
                          value={couponForm.discountValue}
                          onChange={(e) => setCouponForm({ ...couponForm, discountValue: Number(e.target.value) })}
                          className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Min Order (₹)</label>
                        <input
                          type="number"
                          value={couponForm.minimumOrderAmount}
                          onChange={(e) => setCouponForm({ ...couponForm, minimumOrderAmount: Number(e.target.value) })}
                          className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Max Discount Cap (₹)</label>
                        <input
                          type="number"
                          value={couponForm.maximumDiscount}
                          onChange={(e) => setCouponForm({ ...couponForm, maximumDiscount: Number(e.target.value) })}
                          className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Usage Limit</label>
                        <input
                          type="number"
                          value={couponForm.usageLimit}
                          onChange={(e) => setCouponForm({ ...couponForm, usageLimit: Number(e.target.value) })}
                          className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Expiry Date</label>
                        <input
                          type="date"
                          required
                          value={couponForm.expiryDate}
                          onChange={(e) => setCouponForm({ ...couponForm, expiryDate: e.target.value })}
                          className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>

                    <div className="pt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowCouponModal(false)}
                        className="flex-1 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl font-bold hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 shadow-sm transition"
                      >
                        Create Coupon
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBIDashboard;
