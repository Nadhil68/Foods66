import React, { useState, useEffect } from 'react';
import {
  Truck, Package, CheckCircle2, Clock, MapPin, Phone, AlertCircle,
  Navigation, Check, X, Shield, ArrowRight, RefreshCw, UserCheck, Banknote
} from 'lucide-react';
import { deliveriesAPI } from '../services/apiService';
import { useNotificationStore } from '../store/useStore';
import { socketService } from '../services/socketService';

const DeliveryDashboard: React.FC = () => {
  const { showNotification } = useNotificationStore();

  const [activeTab, setActiveTab] = useState<'my_deliveries' | 'available'>('my_deliveries');
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const [delRes, availRes] = await Promise.all([
        deliveriesAPI.getAll(),
        deliveriesAPI.getAvailable()
      ]);

      if (delRes.success) setDeliveries(delRes.deliveries || []);
      if (availRes.success) setAvailableOrders(availRes.orders || []);
    } catch (err: any) {
      console.error('Delivery fetch error:', err);
      showNotification('Error', 'Failed to fetch deliveries', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();

    // Socket listener for new assignments
    socketService.connect();
    const handleNotification = (notif: any) => {
      if (notif.title?.includes('Delivery') || notif.title?.includes('Task')) {
        showNotification(notif.title, notif.message, 'info');
        fetchDeliveries();
      }
    };

    socketService.onNotification(handleNotification);
    return () => {
      socketService.offNotification(handleNotification);
    };
  }, []);

  // Action Handlers
  const handleAccept = async (orderId: string) => {
    try {
      setActionLoading(orderId);
      await deliveriesAPI.accept(orderId);
      showNotification('Accepted! 📦', 'Delivery task accepted. Head to the restaurant kitchen.', 'success');
      await fetchDeliveries();
    } catch (err: any) {
      showNotification('Error', err.message || 'Failed to accept delivery', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (orderId: string) => {
    try {
      setActionLoading(orderId);
      await deliveriesAPI.reject(orderId, 'Driver busy or unavailable');
      showNotification('Rejected', 'Task returned to the dispatch queue', 'info');
      await fetchDeliveries();
    } catch (err: any) {
      showNotification('Error', err.message || 'Failed to reject delivery', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePickup = async (orderId: string) => {
    try {
      setActionLoading(orderId);
      await deliveriesAPI.pickup(orderId);
      showNotification('Picked Up! 🛵', 'Order picked up from kitchen.', 'success');
      await fetchDeliveries();
    } catch (err: any) {
      showNotification('Error', err.message || 'Failed to update pickup', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOutForDelivery = async (orderId: string) => {
    try {
      setActionLoading(orderId);
      await deliveriesAPI.outForDelivery(orderId);
      showNotification('Out for Delivery! 🚀', 'Customer notified that you are en route.', 'success');
      await fetchDeliveries();
    } catch (err: any) {
      showNotification('Error', err.message || 'Failed to update status', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelivered = async (orderId: string) => {
    try {
      setActionLoading(orderId);
      await deliveriesAPI.delivered(orderId);
      showNotification('Delivered! 🎉', 'Order marked as completed and closed.', 'success');
      await fetchDeliveries();
    } catch (err: any) {
      showNotification('Error', err.message || 'Failed to complete delivery', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendLocation = (deliveryId: string) => {
    if (!navigator.geolocation) {
      showNotification('GPS Error', 'Geolocation not supported by device', 'error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
          await deliveriesAPI.updateLocation(deliveryId, coords);
          showNotification('GPS Synced 📍', 'Real-time location broadcasted to customer!', 'success');
        } catch {
          showNotification('GPS Error', 'Failed to broadcast location', 'error');
        }
      },
      () => showNotification('GPS Error', 'Please enable location permissions', 'error')
    );
  };

  const activeDeliveries = deliveries.filter(d => ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(d.status));
  const completedDeliveries = deliveries.filter(d => d.status === 'DELIVERED');
  const estimatedEarnings = completedDeliveries.length * 40; // ₹40 per trip

  // Real-time GPS Watch for OUT_FOR_DELIVERY status
  useEffect(() => {
    let watchId: number | null = null;
    let lastUpdate = 0;

    const outForDeliveryOrders = deliveries.filter(d => d.status === 'OUT_FOR_DELIVERY');
    
    if (outForDeliveryOrders.length > 0 && navigator.geolocation) {
      console.log('📍 Starting GPS tracker for active deliveries');
      
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const now = Date.now();
          // Throttle to max once every 3 seconds to save bandwidth
          if (now - lastUpdate > 3000) {
            lastUpdate = now;
            outForDeliveryOrders.forEach(async (delivery) => {
              try {
                const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
                // 1. Emit via Socket for real-time customer tracking
                socketService.emitDriverLocation({
                  orderId: delivery.orderId,
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                  accuracy: pos.coords.accuracy,
                  heading: pos.coords.heading || undefined,
                  speed: pos.coords.speed || undefined,
                  timestamp: pos.timestamp
                });
                
                // 2. Persist to DB occasionally (every 15s instead of 3s)
                // Doing DB save on every GPS ping is too heavy. Let's do it less frequently or leave it to socket to broadcast.
                // For simplicity, we just rely on socket emission which updates DB securely in server.ts
              } catch (err) {
                console.error('Failed to emit GPS', err);
              }
            });
          }
        },
        (err) => console.warn('GPS Watch Error:', err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }

    return () => {
      if (watchId !== null && navigator.geolocation) {
        console.log('🛑 Stopping GPS tracker');
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [deliveries]);

  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-gray-950 pb-24">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-orange-100 dark:bg-orange-950/40 text-orange-600 rounded-xl">
                <Truck size={24} />
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                Delivery Partner Portal
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Manage active dispatches, deliveries, and live routes</p>
          </div>

          <button
            onClick={fetchDeliveries}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 transition shadow-sm"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Queue
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="card p-4 flex flex-col justify-between border-l-4 border-orange-500">
            <span className="text-xs text-gray-500 font-bold uppercase">Active Tasks</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-extrabold text-gray-900 dark:text-white">{activeDeliveries.length}</span>
              <Package size={20} className="text-orange-500" />
            </div>
          </div>

          <div className="card p-4 flex flex-col justify-between border-l-4 border-blue-500">
            <span className="text-xs text-gray-500 font-bold uppercase">Available Pool</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-extrabold text-gray-900 dark:text-white">{availableOrders.length}</span>
              <Clock size={20} className="text-blue-500" />
            </div>
          </div>

          <div className="card p-4 flex flex-col justify-between border-l-4 border-emerald-500">
            <span className="text-xs text-gray-500 font-bold uppercase">Delivered</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-extrabold text-gray-900 dark:text-white">{completedDeliveries.length}</span>
              <CheckCircle2 size={20} className="text-emerald-500" />
            </div>
          </div>

          <div className="card p-4 flex flex-col justify-between border-l-4 border-amber-500">
            <span className="text-xs text-gray-500 font-bold uppercase">Trip Earnings</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-extrabold text-amber-600">₹{estimatedEarnings}</span>
              <Banknote size={20} className="text-amber-500" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 mb-6">
          <button
            onClick={() => setActiveTab('my_deliveries')}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition ${
              activeTab === 'my_deliveries'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            My Assigned Tasks ({deliveries.length})
          </button>
          <button
            onClick={() => setActiveTab('available')}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition ${
              activeTab === 'available'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Available Orders ({availableOrders.length})
          </button>
        </div>

        {/* Deliveries List */}
        {activeTab === 'my_deliveries' ? (
          <div className="space-y-4">
            {deliveries.length === 0 ? (
              <div className="card p-12 text-center">
                <Truck size={48} className="text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">No Assigned Deliveries</h3>
                <p className="text-xs text-gray-500 mt-1">Orders assigned to you by the kitchen will appear here.</p>
              </div>
            ) : (
              deliveries.map((delivery) => {
                const isProcessing = actionLoading === delivery.orderId;
                const order = delivery.order;

                return (
                  <div key={delivery._id} className="card p-5 border border-gray-100 dark:border-gray-800 transition hover:shadow-md">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100 dark:border-gray-800 mb-3">
                      <div>
                        <span className="text-xs font-mono text-gray-400">Order ID: #{delivery.orderId.slice(-8)}</span>
                        <h4 className="font-extrabold text-gray-900 dark:text-white text-base">
                          ₹{order?.totalPrice || 0} • {(order?.items || []).length} items
                        </h4>
                      </div>
                      <span className={`badge text-xs font-bold uppercase px-3 py-1 rounded-full ${
                        delivery.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                        delivery.status === 'OUT_FOR_DELIVERY' ? 'bg-purple-100 text-purple-700' :
                        delivery.status === 'PICKED_UP' ? 'bg-blue-100 text-blue-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {delivery.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Address & Note */}
                    <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1.5 mb-4">
                      {order?.deliveryAddress && (
                        <p className="flex items-start gap-1.5">
                          <MapPin size={14} className="text-orange-500 flex-shrink-0 mt-0.5" />
                          <span><strong>Destination:</strong> {order.deliveryAddress.fullAddress || `${order.deliveryAddress.doorNo}, ${order.deliveryAddress.landmark}`}</span>
                        </p>
                      )}
                      {order?.specialInstructions && (
                        <p className="text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-2 rounded-lg">
                          <strong>Note:</strong> {order.specialInstructions}
                        </p>
                      )}
                    </div>

                    {/* ─── MODULE 3: CONTEXTUAL ACTION BUTTONS ─── */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                      {delivery.status === 'ASSIGNED' && (
                        <>
                          <button
                            onClick={() => handleAccept(delivery.orderId)}
                            disabled={isProcessing}
                            className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition flex items-center justify-center gap-1 shadow-sm"
                          >
                            <Check size={14} /> Accept Task
                          </button>
                          <button
                            onClick={() => handleReject(delivery.orderId)}
                            disabled={isProcessing}
                            className="py-2.5 px-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition flex items-center justify-center gap-1"
                          >
                            <X size={14} /> Reject
                          </button>
                        </>
                      )}

                      {delivery.status === 'ACCEPTED' && (
                        <button
                          onClick={() => handlePickup(delivery.orderId)}
                          disabled={isProcessing}
                          className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition flex items-center justify-center gap-1 shadow-sm"
                        >
                          <Package size={14} /> Confirm Pick Up from Kitchen
                        </button>
                      )}

                      {delivery.status === 'PICKED_UP' && (
                        <button
                          onClick={() => handleOutForDelivery(delivery.orderId)}
                          disabled={isProcessing}
                          className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition flex items-center justify-center gap-1 shadow-sm"
                        >
                          <Truck size={14} /> Start Delivery (Out for Delivery)
                        </button>
                      )}

                      {delivery.status === 'OUT_FOR_DELIVERY' && (
                        <>
                          <button
                            onClick={() => handleDelivered(delivery.orderId)}
                            disabled={isProcessing}
                            className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-1 shadow-sm"
                          >
                            <CheckCircle2 size={14} /> Complete Delivery
                          </button>
                          <button
                            onClick={() => handleSendLocation(delivery._id)}
                            className="py-2.5 px-3.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold hover:bg-gray-200 transition flex items-center gap-1"
                            title="Share Current GPS Location"
                          >
                            <Navigation size={14} className="text-orange-500" /> Sync GPS
                          </button>
                        </>
                      )}

                      {delivery.status === 'DELIVERED' && (
                        <span className="text-xs text-green-600 font-bold flex items-center gap-1 py-1">
                          <CheckCircle2 size={14} /> Completed & Confirmed
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {availableOrders.length === 0 ? (
              <div className="card p-12 text-center">
                <Clock size={48} className="text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">No Orders in Available Queue</h3>
                <p className="text-xs text-gray-500 mt-1">Orders ready for pickup will appear here for driver claiming.</p>
              </div>
            ) : (
              availableOrders.map((order) => (
                <div key={order._id} className="card p-5 border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-mono text-gray-400">Order ID: #{order._id.slice(-8)}</span>
                    <h4 className="font-extrabold text-gray-900 dark:text-white text-base">
                      ₹{order.totalPrice} • {order.items?.length || 0} items
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {order.deliveryAddress?.fullAddress || `${order.deliveryAddress?.doorNo || ''}, ${order.deliveryAddress?.landmark || ''}`}
                    </p>
                  </div>

                  <button
                    onClick={() => handleAccept(order._id)}
                    className="w-full sm:w-auto px-6 py-2.5 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition flex items-center justify-center gap-1 shadow-sm"
                  >
                    <UserCheck size={14} /> Claim Delivery
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryDashboard;
