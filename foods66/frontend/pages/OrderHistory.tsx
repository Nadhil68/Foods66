import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore, useCartStore, useNotificationStore } from '../store/useStore';
import { Package, Calendar, MapPin, ArrowRight, XCircle, AlertCircle, Filter, ArrowUpDown, Search, FileText, RefreshCw, RotateCcw, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../services/apiService';

const OrderHistory: React.FC = () => {
  const { user } = useAuthStore();
  const { addToCart } = useCartStore();
  const { showNotification } = useNotificationStore();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  
  // Filter & Sort State
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await ordersAPI.getAll();
      if (res.success && res.orders) {
        setOrders(res.orders);
      }
    } catch (err: any) {
      console.error('Failed to fetch orders:', err);
      showNotification('Error', 'Failed to load order history', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  };

  const confirmCancel = async () => {
    if (!orderToCancel) return;
    try {
      await ordersAPI.cancel(orderToCancel, 'Cancelled by user from order history');
      showNotification('Cancelled', 'Order cancelled successfully', 'warning');
      setOrderToCancel(null);
      await fetchOrders();
    } catch (err: any) {
      showNotification('Cancel Error', err.message || 'Cannot cancel order at this stage', 'error');
    }
  };

  const handleReorder = (items: any[]) => {
    items.forEach(item => {
      addToCart({
        id: item.foodId || item._id,
        _id: item.foodId || item._id,
        name: item.name,
        description: '',
        price: item.price,
        category: item.category || ('Veg' as any),
        image: item.image || '',
        isVegetarian: true
      }, item.quantity, item.customization);
    });
    showNotification('Added to Cart! 🛒', 'Items added back to your cart.', 'success');
    navigate('/cart');
  };

  const clearFilters = () => {
    setFilterStatus('All');
    setSearchTerm('');
    setSortOrder('newest');
  };

  // Process Orders: Search -> Filter -> Sort
  const processedOrders = useMemo(() => {
    let result = [...orders];

    // 1. Search (ID or Item Name)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(order => 
        (order._id && order._id.toLowerCase().includes(term)) || 
        (order.items && order.items.some((item: any) => item.name.toLowerCase().includes(term)))
      );
    }

    // 2. Filter Status
    if (filterStatus !== 'All') {
      result = result.filter(order => order.status === filterStatus);
    }

    // 3. Sort
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.date).getTime();
      const dateB = new Date(b.createdAt || b.date).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [orders, filterStatus, sortOrder, searchTerm]);

  const hasActiveFilters = filterStatus !== 'All' || searchTerm !== '' || sortOrder !== 'newest';

  if (loading) {
    return (
      <div className="min-h-dvh bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium">Loading your orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div 
        className="min-h-dvh bg-cover md:bg-fixed bg-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=2070')" }}
      >
        <div className="min-h-dvh flex flex-col items-center justify-center bg-white/90 dark:bg-gray-950/90 backdrop-blur-md px-4">
          <Package size={64} className="text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-2">No Orders Yet</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">You haven't placed any orders yet.</p>
          <button onClick={() => navigate('/common-foods')} className="bg-orange-600 text-white px-6 py-2.5 rounded-full font-bold hover:bg-orange-700 transition shadow-lg">
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-dvh bg-cover md:bg-fixed bg-center"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=2070')" }}
    >
      <div className="min-h-dvh bg-white/85 dark:bg-gray-950/85 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 py-8 pb-24">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Order History</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Live tracking and order lifecycle records</p>
            </div>
            
            {/* Filter & Sort Controls */}
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto bg-white dark:bg-gray-900 p-2 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
              {/* Search Input */}
              <div className="relative flex-grow sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Search size={16} />
                </div>
                <input 
                  type="text"
                  placeholder="Search ID or Dish..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                {/* Status Filter */}
                <div className="relative flex-1 sm:w-40">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-200 outline-none cursor-pointer"
                  >
                    <option value="All">All Statuses</option>
                    <option value="PAYMENT_PENDING">Payment Pending</option>
                    <option value="PAYMENT_CONFIRMED">Payment Confirmed</option>
                    <option value="RESTAURANT_CONFIRMED">Restaurant Confirmed</option>
                    <option value="PREPARING">Preparing</option>
                    <option value="READY_FOR_PICKUP">Ready for Pickup</option>
                    <option value="ASSIGNED">Assigned</option>
                    <option value="PICKED_UP">Picked Up</option>
                    <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                {/* Date Sort */}
                <div className="relative flex-1 sm:w-36">
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-200 outline-none cursor-pointer"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
              </div>
              
              {/* Clear Filters */}
              {hasActiveFilters && (
                <button 
                  onClick={clearFilters}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                  title="Clear Filters"
                >
                  <RotateCcw size={16} />
                </button>
              )}
            </div>
          </div>
          
          <div className="space-y-6">
            {processedOrders.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                <Search size={36} className="text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 font-medium text-sm">No orders matching your search or filters.</p>
                <button onClick={clearFilters} className="mt-3 text-orange-600 font-bold hover:underline text-xs">
                  Reset Filters
                </button>
              </div>
            ) : (
              processedOrders.map((order) => {
                const isCancellable = ['PLACED', 'PAYMENT_PENDING', 'PAID', 'PAYMENT_CONFIRMED', 'RESTAURANT_CONFIRMED', 'PREPARING'].includes(order.status);
                const isActiveOrder = !['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(order.status);

                return (
                  <div key={order._id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-md transition">
                    {/* Order Header */}
                    <div className="bg-gray-50 dark:bg-gray-800/60 p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-mono bg-white dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold">
                          #{order._id.slice(-8)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={13} /> {formatDate(order.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide ${
                          order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                          order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                          'bg-orange-100 text-orange-700 animate-pulse'
                        }`}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                        <span className="font-extrabold text-lg text-gray-900 dark:text-white">₹{order.totalPrice}</span>
                      </div>
                    </div>

                    {/* Order Content */}
                    <div className="p-5">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Items List */}
                        <div className="md:col-span-2 space-y-2">
                          <h4 className="font-bold text-gray-800 dark:text-gray-200 text-xs uppercase tracking-wider mb-2">Items Ordered</h4>
                          {(order.items || []).map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/40 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 font-bold px-2 py-0.5 rounded">
                                  {item.quantity}x
                                </span>
                                <span className="font-medium text-gray-800 dark:text-gray-200">{item.name}</span>
                              </div>
                              <span className="font-semibold text-gray-900 dark:text-white">₹{item.price * item.quantity}</span>
                            </div>
                          ))}

                          {order.specialInstructions && (
                            <div className="mt-3 bg-amber-50 dark:bg-amber-950/20 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300">
                              <strong>Note:</strong> {order.specialInstructions}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="bg-gray-50 dark:bg-gray-800/40 rounded-xl p-4 flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-gray-800 dark:text-gray-200 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <Truck size={14} className="text-orange-500" /> Delivery
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {order.deliveryPartnerName ? `Driver: ${order.deliveryPartnerName}` : 'Driver will be assigned soon'}
                            </p>
                          </div>

                          <div className="mt-4 space-y-2">
                            {isActiveOrder && (
                              <button
                                onClick={() => navigate(`/tracking/${order._id}`)}
                                className="w-full flex items-center justify-center gap-1 bg-orange-600 text-white rounded-xl py-2.5 text-xs font-bold hover:bg-orange-700 shadow-sm transition"
                              >
                                Track Order <ArrowRight size={14} />
                              </button>
                            )}

                            {isCancellable && (
                              <button
                                onClick={() => setOrderToCancel(order._id)}
                                className="w-full flex items-center justify-center gap-1 text-red-600 border border-red-200 dark:border-red-800 rounded-xl py-2 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-950/20 transition"
                              >
                                <XCircle size={14} /> Cancel Order
                              </button>
                            )}

                            {order.status === 'DELIVERED' && (
                              <button
                                onClick={() => handleReorder(order.items)}
                                className="w-full flex items-center justify-center gap-1 text-emerald-600 border border-emerald-200 dark:border-emerald-800 rounded-xl py-2 text-xs font-bold hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition"
                              >
                                <RefreshCw size={14} /> Order Again
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Cancellation Modal */}
          {orderToCancel && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-gray-800 text-center">
                <AlertCircle size={36} className="text-red-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Cancel Order?</h3>
                <p className="text-xs text-gray-500 mt-1 mb-6">Are you sure you want to cancel this order? This action cannot be undone.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setOrderToCancel(null)}
                    className="flex-1 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50"
                  >
                    No, Keep
                  </button>
                  <button
                    onClick={confirmCancel}
                    className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 shadow-sm"
                  >
                    Yes, Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderHistory;