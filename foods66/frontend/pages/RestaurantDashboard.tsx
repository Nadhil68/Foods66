import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import {
  TrendingUp, Users, DollarSign, Package, ChefHat, Clock, Star,
  AlertTriangle, CheckCircle, Flame, RefreshCw, Plus, Minus,
  ArrowUpRight, Zap, Eye, EyeOff, Bell, Settings, Navigation
} from 'lucide-react';
import { useAuthStore, useNotificationStore } from '../store/useStore';
import AdminFoodManagement from '../components/AdminFoodManagement';
import { ordersAPI, analyticsAPI } from '../services/apiService';
import { socketService } from '../services/socketService';

type KitchenOrderStatus = 'PAYMENT_CONFIRMED' | 'RESTAURANT_CONFIRMED' | 'PREPARING' | 'READY_FOR_PICKUP';

const statusConfig: Record<KitchenOrderStatus, { label: string; color: string; bg: string }> = {
  PAYMENT_CONFIRMED: { label: 'New Orders', color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  RESTAURANT_CONFIRMED: { label: 'Accepted', color: 'text-indigo-700 dark:text-indigo-300', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
  PREPARING: { label: 'Cooking / In Kitchen', color: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  READY_FOR_PICKUP: { label: 'Ready for Pickup', color: 'text-green-700 dark:text-green-300', bg: 'bg-green-50 dark:bg-green-900/20' },
};

const INVENTORY = [
  { name: 'Rice (Basmati)', stock: 85, unit: 'kg', threshold: 10, status: 'ok' },
  { name: 'Chicken Breast', stock: 4.2, unit: 'kg', threshold: 5, status: 'low' },
  { name: 'Fresh Paneer', stock: 2.1, unit: 'kg', threshold: 3, status: 'low' },
  { name: 'Cold-Pressed Olive Oil', stock: 12, unit: 'L', threshold: 5, status: 'ok' },
  { name: 'Organic Vegetables', stock: 28, unit: 'kg', threshold: 10, status: 'ok' },
  { name: 'Farm Tomatoes', stock: 3.5, unit: 'kg', threshold: 5, status: 'low' },
];

const RestaurantDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { showNotification } = useNotificationStore();
  const [isLive, setIsLive] = useState(true);
  const [activeTab, setActiveTab] = useState<'kitchen' | 'analytics' | 'inventory' | 'menu'>('kitchen');
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [overview, setOverview] = useState<any>(null);
  const [showRevenue, setShowRevenue] = useState(true);

  const fetchKitchenOrders = async () => {
    try {
      setLoadingOrders(true);
      const res = await ordersAPI.getAll();
      if (res.success && res.orders) {
        // Filter kitchen actionable orders
        const kitchenOrders = res.orders.filter((o: any) =>
          ['PAYMENT_CONFIRMED', 'RESTAURANT_CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'ASSIGNED', 'PICKED_UP'].includes(o.status)
        );
        setOrders(kitchenOrders);
      }
    } catch (err: any) {
      console.error('Kitchen orders fetch error:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await analyticsAPI.getOverview('today');
      if (res.success) setOverview(res.kpis);
    } catch {}
  };

  useEffect(() => {
    fetchKitchenOrders();
    fetchAnalytics();

    // Socket listeners for real-time kitchen updates
    socketService.connect();
    const handleOrderNotification = (notif: any) => {
      showNotification(notif.title || 'Kitchen Alert 🍳', notif.message, 'info');
      fetchKitchenOrders();
    };

    socketService.onNotification(handleOrderNotification);
    return () => {
      socketService.offNotification(handleOrderNotification);
    };
  }, []);

  const advanceKitchenOrder = async (orderId: string, currentStatus: string) => {
    try {
      setActionLoading(orderId);
      let targetStatus = 'RESTAURANT_CONFIRMED';
      let note = 'Restaurant has confirmed your order';

      if (currentStatus === 'RESTAURANT_CONFIRMED') {
        targetStatus = 'PREPARING';
        note = 'Kitchen started preparing food';
      } else if (currentStatus === 'PREPARING') {
        targetStatus = 'READY_FOR_PICKUP';
        note = 'Food is cooked and packed. Ready for driver pickup.';
      }

      await ordersAPI.updateStatus(orderId, targetStatus, note);
      showNotification('Kitchen Updated 🍳', `Order #${orderId.slice(-6)} transitioned to ${targetStatus}`, 'success');
      await fetchKitchenOrders();
    } catch (err: any) {
      showNotification('Update Error', err.message || 'Failed to update order state', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  if (user?.role !== 'restaurant' && user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-2xl">
          <AlertTriangle size={40} className="text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-red-500">Access Denied</h2>
        <p className="text-gray-500 text-sm">Restaurant owners and managers only.</p>
      </div>
    );
  }

  const activeCount = orders.filter(o => ['PAYMENT_CONFIRMED', 'RESTAURANT_CONFIRMED', 'PREPARING'].includes(o.status)).length;
  const readyCount = orders.filter(o => o.status === 'READY_FOR_PICKUP').length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 md:pb-8">
      <div className="page-container">

        {/* ── Header ─── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="section-title flex items-center gap-2">
              <ChefHat size={28} className="text-orange-500" /> Restaurant Kitchen Portal
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Live state transitions, order preparation & dispatch coordination</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 card px-4 py-2.5">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Kitchen</span>
              <button
                onClick={() => setIsLive(!isLive)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none
                  ${isLive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                role="switch" aria-checked={isLive}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-300 ${isLive ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className={`text-sm font-bold ${isLive ? 'text-green-600' : 'text-gray-400'}`}>
                {isLive ? '🟢 ACTIVE' : '⭘ PAUSED'}
              </span>
            </div>
            <button onClick={fetchKitchenOrders} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition" title="Refresh Kitchen">
              <RefreshCw size={18} className={loadingOrders ? 'animate-spin text-orange-500' : 'text-gray-500'} />
            </button>
          </div>
        </div>

        {/* ── KPI strip ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Today's Revenue", value: showRevenue ? `₹${overview?.todayRevenue || 0}` : '₹•••••', icon: <DollarSign size={18} />, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600', change: 'Real-time' },
            { label: 'Active Kitchen Orders', value: activeCount.toString(), icon: <Flame size={18} />, color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600', change: 'In Kitchen' },
            { label: 'Ready for Pickup', value: readyCount.toString(), icon: <Package size={18} />, color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600', change: 'Packed' },
            { label: 'Low Stock Alerts', value: INVENTORY.filter(i => i.status === 'low').length.toString(), icon: <AlertTriangle size={18} />, color: 'bg-red-100 dark:bg-red-900/30 text-red-600', change: 'Alert' },
          ].map((kpi, i) => (
            <div key={i} className="card p-4 flex items-center gap-3">
              <div className={`kpi-icon ${kpi.color}`}>{kpi.icon}</div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{kpi.label}</p>
                <p className="text-xl font-extrabold text-gray-900 dark:text-white">{kpi.value}</p>
                <p className="text-[11px] text-orange-500 font-semibold">{kpi.change}</p>
              </div>
              {i === 0 && (
                <button onClick={() => setShowRevenue(!showRevenue)} className="text-gray-300 hover:text-gray-600 transition flex-shrink-0">
                  {showRevenue ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* ── Tabs ─── */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl mb-6 w-fit overflow-x-auto">
          {(['kitchen', 'analytics', 'inventory', 'menu'] as const).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all duration-200 whitespace-nowrap
                ${activeTab === t
                  ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >
              {t === 'kitchen' ? `🍳 Kitchen Queue (${orders.length})` : t === 'analytics' ? '📊 Performance' : t === 'inventory' ? '📦 Inventory' : '🍽 Menu'}
            </button>
          ))}
        </div>

        {/* ── Kitchen Queue ─── */}
        {activeTab === 'kitchen' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-x-auto min-w-full pb-4">
            {(['PAYMENT_CONFIRMED', 'RESTAURANT_CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'] as KitchenOrderStatus[]).map(statusKey => {
              const cfg = statusConfig[statusKey];
              const columnOrders = orders.filter(o => o.status === statusKey);

              return (
                <div key={statusKey}>
                  <div className={`rounded-2xl p-2 ${cfg.bg} border border-current/10`}>
                    <div className="flex items-center justify-between px-3 py-2 mb-2">
                      <span className={`text-sm font-bold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
                      <span className={`badge ${cfg.bg} ${cfg.color} font-bold`}>{columnOrders.length}</span>
                    </div>
                    <div className="space-y-2 px-1 pb-1">
                      <AnimatePresence>
                        {columnOrders.map(order => (
                          <motion.div
                            key={order._id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="card p-4 shadow-sm"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <span className="font-mono text-xs font-bold text-gray-500 dark:text-gray-400">
                                  #{order._id.slice(-6)}
                                </span>
                                <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 mt-0.5">
                                  ₹{order.totalPrice} • {order.paymentMethod}
                                </p>
                              </div>
                              <span className="text-[10px] text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            {/* Order Items */}
                            <ul className="space-y-1 my-3 bg-gray-50 dark:bg-gray-800/40 p-2.5 rounded-xl">
                              {(order.items || []).map((item: any, i: number) => (
                                <li key={i} className="text-xs text-gray-700 dark:text-gray-300 flex items-center justify-between">
                                  <span className="font-medium">{item.name}</span>
                                  <span className="font-bold text-orange-600">x{item.quantity}</span>
                                </li>
                              ))}
                            </ul>

                            {order.specialInstructions && (
                              <p className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-1.5 rounded-lg mb-3">
                                <strong>Note:</strong> {order.specialInstructions}
                              </p>
                            )}

                            {/* State Transition Actions */}
                            {statusKey === 'PAYMENT_CONFIRMED' && (
                              <button
                                onClick={() => advanceKitchenOrder(order._id, 'PAYMENT_CONFIRMED')}
                                disabled={actionLoading === order._id}
                                className="w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-sm transition flex items-center justify-center gap-1"
                              >
                                ▶ Accept Order
                              </button>
                            )}

                            {statusKey === 'RESTAURANT_CONFIRMED' && (
                              <button
                                onClick={() => advanceKitchenOrder(order._id, 'RESTAURANT_CONFIRMED')}
                                disabled={actionLoading === order._id}
                                className="w-full py-2 bg-orange-500 text-white rounded-xl text-xs font-bold hover:bg-orange-600 shadow-sm transition flex items-center justify-center gap-1"
                              >
                                🍳 Start Preparing
                              </button>
                            )}

                            {statusKey === 'PREPARING' && (
                              <button
                                onClick={() => advanceKitchenOrder(order._id, 'PREPARING')}
                                disabled={actionLoading === order._id}
                                className="w-full py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 shadow-sm transition flex items-center justify-center gap-1"
                              >
                                ✓ Mark Ready for Pickup
                              </button>
                            )}

                            {statusKey === 'READY_FOR_PICKUP' && (
                              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-xl text-green-700 dark:text-green-300 text-xs font-bold flex items-center justify-center gap-1.5">
                                <CheckCircle size={14} />
                                <span>{order.deliveryPartnerName ? `Assigned to ${order.deliveryPartnerName}` : 'Auto-dispatching driver...'}</span>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      {columnOrders.length === 0 && (
                        <div className="text-center py-8 text-gray-400 text-xs">No orders in this stage</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Analytics Tab ─── */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card p-5">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Total Completed Orders</p>
                <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">{overview?.completedOrders || 0}</p>
                <p className="text-xs text-green-600 font-medium mt-1">✓ Processed by kitchen</p>
              </div>
              <div className="card p-5">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Avg Order Value</p>
                <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">₹{overview?.averageOrderValue || 0}</p>
                <p className="text-xs text-blue-600 font-medium mt-1">📊 Real-time average</p>
              </div>
              <div className="card p-5">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Success Rate</p>
                <p className="text-2xl font-extrabold text-green-600 mt-1">{overview?.paymentSuccessRate || 100}%</p>
                <p className="text-xs text-gray-500 mt-1">Payment & Fulfillment</p>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-gray-900 dark:text-white text-base mb-4">Kitchen Throughput Overview</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Orders Today</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{overview?.todayOrders || orders.length}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Active Deliveries</p>
                  <p className="text-xl font-bold text-orange-600 mt-1">{overview?.activeDeliveries || readyCount}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Cancelled Orders</p>
                  <p className="text-xl font-bold text-red-500 mt-1">{overview?.cancelledOrders || 0}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Delivery Success</p>
                  <p className="text-xl font-bold text-emerald-600 mt-1">{overview?.deliverySuccessRate || 100}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Inventory ─── */}
        {activeTab === 'inventory' && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-900 dark:text-white">Kitchen Inventory Levels</h3>
              {INVENTORY.filter(i => i.status === 'low').length > 0 && (
                <span className="badge bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 gap-1">
                  <AlertTriangle size={12} />
                  {INVENTORY.filter(i => i.status === 'low').length} Low Stock Items
                </span>
              )}
            </div>
            <div className="space-y-4">
              {INVENTORY.map((item, i) => (
                <div key={i} className={`p-4 rounded-xl border transition ${item.status === 'low' ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10' : 'border-gray-100 dark:border-gray-800'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${item.status === 'low' ? 'bg-red-500' : 'bg-green-500'}`} />
                      <span className="font-semibold text-gray-900 dark:text-white text-sm">{item.name}</span>
                    </div>
                    <span className={`badge text-xs ${item.status === 'low' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'}`}>
                      {item.stock} {item.unit}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${item.status === 'low' ? 'bg-red-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(100, (item.stock / (item.threshold * 5)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Menu Management ─── */}
        {activeTab === 'menu' && (
          <AdminFoodManagement />
        )}
      </div>
    </div>
  );
};

export default RestaurantDashboard;
