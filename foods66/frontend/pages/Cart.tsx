import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useCartStore, useNotificationStore } from '../store/useStore';
import {
  Trash2, ShoppingBag, MapPin, AlertCircle, FileText, Undo, X,
  Activity, Flame, Dumbbell, Wheat, Loader, Navigation, CheckCircle,
  XCircle, Shield, Truck, ShieldCheck, Tag, Check, RefreshCw
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { CartItem } from '../types';
import { PLACEHOLDER_IMAGE, getRelevantFoodImage } from '../constants';
import { getImageUrl } from '../services/apiClient';
import { paymentsAPI, ordersAPI, couponsAPI } from '../services/apiService';
import { isFoodUnhealthyForUser } from '../utils/healthLogic';
import QuantitySelector from '../components/QuantitySelector';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

const Cart: React.FC = () => {
  const { user } = useAuthStore();
  const { cart, removeFromCart, updateQuantity, clearCart, reorder, removeInvalidItems, validateCartWithServer } = useCartStore();
  const { showNotification } = useNotificationStore();
  const navigate = useNavigate();

  const [altAddress, setAltAddress] = useState('');
  const [useAltAddress, setUseAltAddress] = useState(false);
  const [showHealthWarning, setShowHealthWarning] = useState(false);
  const [unhealthyItems, setUnhealthyItems] = useState<{ item: CartItem; reason: string }[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'processing' | 'confirmed' | 'failed'>('idle');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'COD' | 'UPI'>('CARD');
  const [locationLoading, setLocationLoading] = useState(false);

  // Coupon State
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [couponDeliveryDiscount, setCouponDeliveryDiscount] = useState<number>(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Undo State
  const [undoState, setUndoState] = useState<{ show: boolean; items: CartItem[] }>({ show: false, items: [] });
  const [undoTimer, setUndoTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Stale item detection
  const staleItems = cart.filter(item => {
    const id = item._id || item.id;
    return !id || id.startsWith('ITEM-') || !/^[0-9a-fA-F]{24}$/.test(id);
  });
  const hasStaleItems = staleItems.length > 0;

  useEffect(() => {
    validateCartWithServer();
  }, []);

  useEffect(() => {
    return () => {
      if (undoTimer) clearTimeout(undoTimer);
    };
  }, [undoTimer]);

  // Handle Location Detection
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      showNotification('Error', 'Geolocation is not supported by your browser', 'error');
      return;
    }
    setLocationLoading(true);
    setUseAltAddress(true);

    const fillFromCoords = async (latitude: number, longitude: number) => {
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Nominatim failed');
        const data = await res.json();
        const addr = data.address || {};
        const parts = [
          addr.house_number,
          addr.road || addr.suburb || addr.neighbourhood,
          addr.city || addr.town || addr.county || addr.state_district,
          addr.state,
          addr.postcode
        ].filter(Boolean);
        setAltAddress(parts.join(', '));
        showNotification('Location Found', 'Current location filled in alternative address!', 'success');
      } catch {
        showNotification('Error', 'Failed to resolve address. Please enter manually.', 'error');
      } finally {
        setLocationLoading(false);
      }
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await fillFromCoords(position.coords.latitude, position.coords.longitude);
      },
      () => {
        setLocationLoading(false);
        showNotification('Location Notice', 'Could not detect GPS. Please enter manually.', 'info');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const standardDeliveryFee = 40;
  const deliveryFee = Math.max(0, standardDeliveryFee - couponDeliveryDiscount);
  const taxableAmount = Math.max(0, subtotal - couponDiscount);
  const taxes = Math.round(taxableAmount * 0.05);
  const grandTotal = Math.max(0, taxableAmount + deliveryFee + taxes);

  const totalCalories = cart.reduce((acc, item) => acc + (item.calories || 0) * item.quantity, 0);
  const totalProtein = cart.reduce((acc, item) => acc + (item.protein || 0) * item.quantity, 0);
  const totalCarbs = cart.reduce((acc, item) => acc + (item.carbs || 0) * item.quantity, 0);
  const RDI = { calories: 2000, protein: 50, carbs: 275 };
  const getPercent = (value: number, total: number) => Math.min(100, Math.round((value / total) * 100));

  // Apply Coupon Handler
  const handleApplyCoupon = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setCouponLoading(true);
    setCouponError(null);

    try {
      const itemsPayload = cart.map(i => ({ foodId: i._id || i.id, quantity: i.quantity }));
      const res = await couponsAPI.apply(code, itemsPayload, subtotal);

      if (res.success && res.coupon) {
        setAppliedCoupon(res.coupon);
        setCouponDiscount(res.discountAmount || 0);
        setCouponDeliveryDiscount(res.deliveryFeeDiscount || 0);
        showNotification('Coupon Applied! 🎉', `Saved ₹${res.discountAmount || res.deliveryFeeDiscount || 0} with ${code}`, 'success');
      } else {
        setCouponError(res.message || 'Invalid coupon');
      }
    } catch (err: any) {
      const msg = err.message || 'Coupon could not be applied';
      setCouponError(msg);
      showNotification('Coupon Error', msg, 'error');
    } finally {
      setCouponLoading(false);
    }
  };

  // Remove Coupon Handler
  const handleRemoveCoupon = async () => {
    try {
      await couponsAPI.remove();
      setAppliedCoupon(null);
      setCouponDiscount(0);
      setCouponDeliveryDiscount(0);
      setCouponInput('');
      setCouponError(null);
      showNotification('Coupon Removed', 'Coupon discount removed', 'info');
    } catch {
      setAppliedCoupon(null);
      setCouponDiscount(0);
      setCouponDeliveryDiscount(0);
    }
  };

  const handleRemoveItem = (itemToRemove: CartItem) => {
    const items = cart.filter(i => i.id === itemToRemove.id);
    if (undoTimer) clearTimeout(undoTimer);
    removeFromCart(itemToRemove.id);
    setUndoState({ show: true, items });
    const timer = setTimeout(() => {
      setUndoState({ show: false, items: [] });
    }, 5000);
    setUndoTimer(timer);
  };

  const handleUndo = () => {
    if (undoState.items.length > 0) {
      reorder(undoState.items);
      setUndoState({ show: false, items: [] });
      if (undoTimer) clearTimeout(undoTimer);
    }
  };

  const handleCheckoutClick = () => {
    if (hasStaleItems) {
      showNotification('Outdated Items in Cart', 'This food item is outdated. Please remove it and add the latest item from the menu.', 'error');
      return;
    }

    const address = useAltAddress
      ? altAddress
      : `${user?.address?.doorNo || '12A'}, ${user?.address?.landmark || 'Anna Nagar'}, ${user?.address?.district || 'Chennai'}`;

    if (!address || address.trim() === '') {
      showNotification('Address Missing', 'Please enter a valid delivery address', 'error');
      return;
    }

    if (user?.healthProfile) {
      const riskyItems = cart.map(item => {
        const evaluation = isFoodUnhealthyForUser(item, user.healthProfile);
        return { item, evaluation };
      }).filter(x => x.evaluation.isUnhealthy);

      if (riskyItems.length > 0) {
        setUnhealthyItems(riskyItems.map(x => ({ item: x.item, reason: x.evaluation.reason || '' })));
        setShowHealthWarning(true);
        return;
      }
    }

    confirmOrder();
  };

  const confirmOrder = async () => {
    const address = useAltAddress
      ? altAddress
      : `${user?.address?.doorNo || '12A'}, ${user?.address?.landmark || 'Anna Nagar'}, ${user?.address?.district || 'Chennai'}`;

    if (checkoutStatus === 'processing') return;
    setCheckoutStatus('processing');
    setCheckoutError(null);

    try {
      const idempotencyKey = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
      const payload = {
        items: cart.map(item => ({
          foodId: item._id || item.id,
          quantity: item.quantity,
          customization: item.customization
        })),
        deliveryAddress: address,
        couponCode: appliedCoupon?.code,
        paymentMethod,
        specialInstructions
      };

      if (paymentMethod === 'COD' || paymentMethod === 'UPI') {
        const res = await ordersAPI.create(payload, idempotencyKey);
        
        if (res.success && res.orderId) {
          setCheckoutStatus('confirmed');
          clearCart();
          if (paymentMethod === 'COD') {
            showNotification('Order Placed!', 'Your order has been confirmed with Cash on Delivery.', 'success');
            setTimeout(() => {
              navigate(`/tracking/${res.orderId}`);
            }, 1000);
          } else {
            showNotification('Order Placed!', 'Redirecting to UPI Payment...', 'success');
            setTimeout(() => {
              navigate(`/payment/${res.orderId}?method=UPI`);
            }, 1000);
          }
        } else {
          throw new Error(`${paymentMethod} order creation failed`);
        }
      } else if (paymentMethod === 'CARD') {
        const res = await paymentsAPI.createSession(payload, idempotencyKey);

        if (res.success && res.orderId) {
          if (res.sessionUrl) {
            // Direct Stripe Hosted URL
            setCheckoutStatus('confirmed');
            showNotification('Redirecting to Stripe...', 'Securing your checkout.', 'info');
            clearCart();
            window.location.href = res.sessionUrl;
          } else if (res.sessionId) {
            // Stripe SDK Redirect
            setCheckoutStatus('confirmed');
            showNotification('Redirecting...', 'Connecting to Stripe Checkout.', 'info');
            clearCart();
            
            try {
              const stripe = await stripePromise;
              if (stripe) {
                const { error } = await (stripe as any).redirectToCheckout({ sessionId: res.sessionId });
                if (error) throw error;
              } else {
                throw new Error("Stripe SDK not loaded");
              }
            } catch (stripeErr) {
              console.warn("Stripe redirect failed, falling back to local success page:", stripeErr);
              setTimeout(() => {
                navigate(`/payment/${res.orderId}?session_id=${res.sessionId}&success=true`);
              }, 1000);
            }
          }
        } else {
          throw new Error('Stripe session creation failed');
        }
      } else {
        throw new Error('Invalid payment method');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      setCheckoutStatus('failed');
      const msg = error.response?.data?.message || 'Unable to place your order. Please try again.';
      setCheckoutError(msg);
      showNotification('Checkout Failed', msg, 'error');
    }
  };

  if (cart.length === 0) {
    return (
      <div
        className="min-h-dvh bg-cover md:bg-fixed bg-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=2074')" }}
      >
        <div className="min-h-dvh flex flex-col items-center justify-center bg-white/90 dark:bg-gray-950/90 backdrop-blur-md px-4">
          <ShoppingBag size={64} className="text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-2">Your Cart is Empty</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Looks like you haven't made your choice yet.</p>
          <button onClick={() => navigate('/common-foods')} className="bg-orange-600 text-white px-6 py-3 rounded-full font-bold hover:bg-orange-700 transition shadow-lg">
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-dvh bg-cover md:bg-fixed bg-center"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=2074')" }}
    >
      <div className="min-h-dvh bg-white/90 dark:bg-gray-950/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-8 pb-32">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-8">Checkout</h1>

          {/* Stale Items Banner */}
          {hasStaleItems && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="font-bold text-red-900 dark:text-red-300 text-sm">Outdated Menu Items Detected</h4>
                  <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">
                    {staleItems.length} item(s) in your cart are from an older menu version. Please clean your cart to order fresh dishes from the kitchen.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={removeInvalidItems}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Trash2 size={14} /> Remove Invalid Items
                </button>
                <button
                  onClick={() => navigate('/common-foods')}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap"
                >
                  <RefreshCw size={14} /> Refresh Menu
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Cart Items ({cart.length})</h2>
              {cart.map((item, idx) => (
                <div key={`${item.id}-${idx}`} className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center transition-all hover:shadow-md">
                  <img
                    src={getImageUrl(item.image) || getRelevantFoodImage(item.name) || PLACEHOLDER_IMAGE}
                    alt={item.name}
                    loading="lazy"
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover mr-4 bg-gray-100 dark:bg-gray-800 flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getRelevantFoodImage(item.name) || PLACEHOLDER_IMAGE;
                    }}
                  />
                  <div className="flex-grow min-w-0">
                    <h3 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white mb-1 line-clamp-2 break-words">{item.name}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Quantity: {item.quantity}</span>
                      <QuantitySelector
                        quantity={item.quantity}
                        onIncrease={() => updateQuantity(item._id || item.id, item.quantity + 1)}
                        onDecrease={() => updateQuantity(item._id || item.id, Math.max(1, item.quantity - 1))}
                        size="sm"
                        className="scale-90 origin-left"
                      />
                      <span className="font-bold text-orange-600 dark:text-orange-400 ml-auto">₹{item.price} × {item.quantity} = ₹{item.price * item.quantity}</span>
                    </div>
                    {item.customization && (
                      <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 inline-block px-2 py-1 rounded mt-1">
                        {item.customization.temperature}, {item.customization.powderLevel} Strength, {item.customization.sugarSpoons} spoon(s) sugar
                      </div>
                    )}
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleRemoveItem(item)} 
                    className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition flex-shrink-0" 
                    aria-label={`Remove ${item.name} from cart`}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}

              {/* Nutritional Breakdown */}
              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-orange-100 dark:border-orange-900/30 mt-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Activity size={100} className="text-orange-500" />
                </div>

                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center relative z-10">
                  <Activity size={20} className="mr-2 text-orange-600" /> Nutritional Breakdown
                </h3>

                <div className="space-y-4 relative z-10">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center font-semibold text-gray-700 dark:text-gray-200"><Flame size={14} className="mr-1 text-orange-500" /> Calories</span>
                      <span className="text-gray-600 dark:text-gray-300"><span className="font-bold text-gray-900 dark:text-white">{totalCalories}</span> / {RDI.calories} kcal ({getPercent(totalCalories, RDI.calories)}%)</span>
                    </div>
                    <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${totalCalories > RDI.calories ? 'bg-red-500' : 'bg-orange-500'}`}
                        style={{ width: `${getPercent(totalCalories, RDI.calories)}%` }}
                      ></div>
                    </div>
                    {totalCalories > RDI.calories && <p className="text-[11px] text-red-500 dark:text-red-400 mt-1 font-medium">⚠ Exceeds daily recommended intake</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="flex items-center font-semibold text-gray-700 dark:text-gray-200"><Dumbbell size={14} className="mr-1 text-blue-500" /> Protein</span>
                        <span className="text-gray-600 dark:text-gray-300"><span className="font-bold text-gray-900 dark:text-white">{totalProtein}g</span> ({getPercent(totalProtein, RDI.protein)}%)</span>
                      </div>
                      <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${getPercent(totalProtein, RDI.protein)}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="flex items-center font-semibold text-gray-700 dark:text-gray-200"><Wheat size={14} className="mr-1 text-yellow-500" /> Carbs</span>
                        <span className="text-gray-600 dark:text-gray-300"><span className="font-bold text-gray-900 dark:text-white">{totalCarbs}g</span> ({getPercent(totalCarbs, RDI.carbs)}%)</span>
                      </div>
                      <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${totalCarbs > RDI.carbs ? 'bg-red-400' : 'bg-yellow-500'}`} style={{ width: `${getPercent(totalCarbs, RDI.carbs)}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary & Coupon UI */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 sticky top-24">
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-4">Order Summary</h2>
                
                {/* Pricing Summary */}
                <div className="flex justify-between mb-2 text-gray-600 dark:text-gray-400 text-sm">
                  <span>Subtotal ({cart.reduce((a, i) => a + i.quantity, 0)} items)</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">₹{subtotal}</span>
                </div>

                {couponDiscount > 0 && (
                  <div className="flex justify-between mb-2 text-green-600 dark:text-green-400 text-sm font-semibold">
                    <span className="flex items-center gap-1"><Tag size={13} /> Coupon Discount</span>
                    <span>-₹{couponDiscount}</span>
                  </div>
                )}

                <div className="flex justify-between mb-2 text-gray-600 dark:text-gray-400 text-sm">
                  <span>Delivery Fee</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {deliveryFee === 0 ? <span className="text-green-600 font-bold">FREE</span> : `₹${deliveryFee}`}
                  </span>
                </div>

                <div className="flex justify-between mb-4 text-gray-600 dark:text-gray-400 text-sm">
                  <span>GST (Goods and Services Tax - 5%)</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">₹{taxes}</span>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-between items-baseline mb-4">
                  <span className="font-extrabold text-lg text-gray-900 dark:text-white">Total</span>
                  <span className="font-extrabold text-2xl text-orange-600 dark:text-orange-400">₹{grandTotal}</span>
                </div>

                {/* ─── MODULE 4: COUPON & DISCOUNT UI ─── */}
                <div className="mb-6 p-3.5 bg-orange-50/60 dark:bg-orange-950/20 rounded-xl border border-orange-200/60 dark:border-orange-800/40">
                  <label htmlFor="coupon-code" className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider mb-2 flex items-center gap-1.5 cursor-pointer">
                    <Tag size={14} className="text-orange-500" /> Coupon Code
                  </label>

                  {!appliedCoupon ? (
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <input
                        id="coupon-code"
                        name="couponCode"
                        type="text"
                        placeholder="e.g. WELCOME50"
                        value={couponInput}
                        onChange={(e) => {
                          setCouponInput(e.target.value.toUpperCase());
                          if (couponError) setCouponError(null);
                        }}
                        disabled={couponLoading}
                        className="flex-1 px-3 py-2 text-xs font-mono font-bold uppercase bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 dark:text-white"
                      />
                      <button
                        type="submit"
                        disabled={couponLoading || !couponInput.trim()}
                        aria-label="Apply coupon code"
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg text-xs font-bold hover:bg-orange-700 disabled:opacity-50 transition shadow-sm flex items-center justify-center min-w-[70px]"
                      >
                        {couponLoading ? <Loader size={12} className="animate-spin" /> : 'Apply'}
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between bg-green-100/70 dark:bg-green-900/30 p-2.5 rounded-lg border border-green-300 dark:border-green-800">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-green-800 dark:text-green-300 font-mono">
                            ✓ {appliedCoupon.code} Applied
                          </p>
                          <p className="text-[11px] text-green-700 dark:text-green-400">
                            Discount: ₹{couponDiscount || couponDeliveryDiscount}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        aria-label="Remove applied coupon"
                        className="text-xs font-bold text-red-600 hover:text-red-700 px-2 py-1 bg-white/80 dark:bg-gray-800 rounded border border-red-200 transition"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  {couponError && (
                    <p className="text-[11px] text-red-600 dark:text-red-400 mt-2 font-medium flex items-center gap-1">
                      <AlertCircle size={12} /> {couponError}
                    </p>
                  )}
                </div>

                {/* Delivery ETA */}
                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg mb-6">
                  <Truck size={16} className="flex-shrink-0" />
                  <span className="font-semibold">Expected delivery: 25–35 min</span>
                </div>

                {/* Address Selection */}
                <div className="mb-6">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center"><MapPin size={16} className="mr-2 text-orange-500" /> Delivery Address</h3>
                  <div className="space-y-2">
                    <label
                      htmlFor="address-registered"
                      className={`flex items-start p-3.5 border-2 rounded-xl transition-all min-h-[56px] cursor-pointer ${
                      !useAltAddress 
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10 ring-1 ring-orange-200 dark:ring-orange-800' 
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                      onClick={() => setUseAltAddress(false)}
                    >
                      <input 
                        type="radio" 
                        id="address-registered"
                        name="deliveryAddressSelection" 
                        className="mt-0.5 w-5 h-5 text-orange-600 focus:ring-orange-500 flex-shrink-0 cursor-pointer" 
                        checked={!useAltAddress} 
                        onChange={() => setUseAltAddress(false)} 
                      />
                      <div className="ml-3 text-sm">
                        <span className="font-bold block text-gray-900 dark:text-white">Registered Address</span>
                        <span className="text-gray-500 dark:text-gray-400">{user?.address?.doorNo || '12A'}, {user?.address?.landmark || 'Anna Nagar'}, {user?.address?.district || 'Chennai'}</span>
                      </div>
                    </label>

                    <div
                      className={`flex items-start p-3.5 border-2 rounded-xl transition-all min-h-[56px] cursor-pointer ${
                      useAltAddress 
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10 ring-1 ring-orange-200 dark:ring-orange-800' 
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                      onClick={() => setUseAltAddress(true)}
                    >
                      <input 
                        type="radio" 
                        id="address-alternative"
                        name="deliveryAddressSelection" 
                        className="mt-0.5 w-5 h-5 text-orange-600 focus:ring-orange-500 flex-shrink-0 cursor-pointer" 
                        checked={useAltAddress} 
                        onChange={() => setUseAltAddress(true)} 
                      />
                      <div className="ml-3 text-sm w-full">
                        <label htmlFor="address-alternative" className="font-bold block text-gray-900 dark:text-white cursor-pointer">
                          Alternative Address
                        </label>
                        {useAltAddress && (
                          <>
                            <label htmlFor="alt-address-input" className="sr-only">Enter alternative delivery address</label>
                            <textarea 
                              id="alt-address-input"
                              name="altAddress"
                              className="w-full mt-2 p-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg text-xs focus:ring-2 focus:ring-orange-500 outline-none" 
                              placeholder="Enter new address..." 
                              value={altAddress} 
                              onChange={(e) => setAltAddress(e.target.value)} 
                              onClick={(e) => e.stopPropagation()}
                              rows={3} 
                            />
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleGetLocation(); }}
                              disabled={locationLoading}
                              aria-label="Detect and use current location"
                              className="mt-2 w-full py-2 border-2 border-orange-500 text-orange-600 dark:text-orange-400 rounded-lg text-xs font-bold flex justify-center items-center gap-1.5 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition disabled:opacity-60"
                            >
                              {locationLoading
                                ? <><Loader size={13} className="animate-spin" /> Detecting location...</>
                                : <><Navigation size={13} /> Use Current Location</>
                              }
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>


                {/* Payment Method */}
                <div className="mb-6">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center"><Shield size={16} className="mr-2 text-orange-500" /> Payment Method</h3>
                  <div className="space-y-2">
                    <label
                      htmlFor="payment-card"
                      className={`flex items-center gap-3 p-3 border-2 rounded-xl transition cursor-pointer ${paymentMethod === 'CARD' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10 ring-1 ring-orange-200' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                      onClick={() => setPaymentMethod('CARD')}
                    >
                      <input 
                        type="radio" 
                        id="payment-card"
                        name="paymentMethod" 
                        value="CARD"
                        checked={paymentMethod === 'CARD'} 
                        onChange={() => setPaymentMethod('CARD')} 
                        className="text-orange-600 focus:ring-orange-500 w-5 h-5 cursor-pointer" 
                      />
                      <div>
                        <span className="font-bold text-gray-800 dark:text-white block">Credit / Debit Card</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Secure online payment with Webhook sync</span>
                      </div>
                    </label>
                    <label
                      htmlFor="payment-upi"
                      className={`flex items-center gap-3 p-3 border-2 rounded-xl transition cursor-pointer ${paymentMethod === 'UPI' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10 ring-1 ring-orange-200' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                      onClick={() => setPaymentMethod('UPI')}
                    >
                      <input 
                        type="radio" 
                        id="payment-upi"
                        name="paymentMethod" 
                        value="UPI"
                        checked={paymentMethod === 'UPI'} 
                        onChange={() => setPaymentMethod('UPI')} 
                        className="text-orange-600 focus:ring-orange-500 w-5 h-5 cursor-pointer" 
                      />
                      <div>
                        <span className="font-bold text-gray-800 dark:text-white block">UPI / Online Payment</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Scan QR and pay using UPI</span>
                      </div>
                    </label>
                    <label
                      htmlFor="payment-cod"
                      className={`flex items-center gap-3 p-3 border-2 rounded-xl transition cursor-pointer ${paymentMethod === 'COD' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10 ring-1 ring-orange-200' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                      onClick={() => setPaymentMethod('COD')}
                    >
                      <input 
                        type="radio" 
                        id="payment-cod"
                        name="paymentMethod" 
                        value="COD"
                        checked={paymentMethod === 'COD'} 
                        onChange={() => setPaymentMethod('COD')} 
                        className="text-orange-600 focus:ring-orange-500 w-5 h-5 cursor-pointer" 
                      />
                      <div>
                        <span className="font-bold text-gray-800 dark:text-white block">Cash on Delivery (COD)</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Pay when order arrives</span>
                      </div>
                    </label>
                  </div>
                </div>


                {/* Special Instructions */}
                <div className="mb-6">
                  <label htmlFor="delivery-instructions" className="font-bold text-gray-900 dark:text-white mb-2 flex items-center cursor-pointer">
                    <FileText size={16} className="mr-2 text-orange-500" /> Delivery Instructions
                  </label>
                  <textarea
                    id="delivery-instructions"
                    name="deliveryInstructions"
                    maxLength={500}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none resize-none transition"
                    placeholder="E.g., Less spicy, leave at door, call upon arrival..."
                    rows={2}
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                  />
                  <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                    <span>Special food preparation or delivery notes</span>
                    <span>{specialInstructions.length} / 500</span>
                  </div>
                </div>

                {/* Inline Validation Notice if button is disabled */}
                {hasStaleItems && (
                  <p className="text-xs text-red-600 dark:text-red-400 mb-3 font-semibold text-center flex items-center justify-center gap-1">
                    <AlertCircle size={14} /> Remove outdated items above to proceed.
                  </p>
                )}

                {/* Desktop CTA */}
                <button
                  type="submit"
                  onClick={handleCheckoutClick}
                  disabled={hasStaleItems || checkoutStatus === 'processing'}
                  aria-label={hasStaleItems ? "Outdated items in cart, please remove them" : checkoutStatus === 'processing' ? "Processing payment" : `Proceed to payment for ₹${grandTotal}`}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-xl font-extrabold hover:shadow-xl hover:shadow-orange-500/30 shadow-lg transform active:scale-[0.98] transition-all text-base disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {hasStaleItems ? (
                    'Remove Outdated Items to Checkout'
                  ) : checkoutStatus === 'processing' ? (
                    <><Loader size={18} className="animate-spin" /> {paymentMethod === 'CARD' ? 'Processing Card Payment...' : paymentMethod === 'UPI' ? 'Preparing UPI Payment...' : 'Placing COD Order...'}</>
                  ) : (
                    paymentMethod === 'CARD' ? `💳 Proceed to Card Payment — ₹${grandTotal}` : paymentMethod === 'UPI' ? `📱 Pay with UPI — ₹${grandTotal}` : `🛵 Place COD Order — ₹${grandTotal}`
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Modal Overlays for processing states */}
          {checkoutStatus !== 'idle' && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity">
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full max-h-[90dvh] overflow-y-auto shadow-2xl transform scale-100 transition-transform">
                {checkoutStatus === 'processing' && (
                  <div className="flex flex-col items-center py-8">
                    <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mb-6"></div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Creating Payment...</h3>
                    <p className="text-gray-500 text-sm">Please do not close this window.</p>
                  </div>
                )}

                {checkoutStatus === 'confirmed' && (
                  <div className="flex flex-col items-center py-8">
                    <div className="bg-green-100 p-4 rounded-full mb-4">
                      <ShieldCheck size={48} className="text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Connecting to Secure Payment...</h3>
                    <p className="text-gray-500 text-sm text-center">Redirecting to checkout.</p>
                  </div>
                )}
                
                {checkoutStatus === 'failed' && (
                  <div className="flex flex-col items-center py-8">
                    <div className="bg-red-100 p-4 rounded-full mb-4">
                      <XCircle size={48} className="text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Payment Encountered an Issue</h3>
                    <p className="text-gray-500 text-sm mb-6 text-center px-4">
                      {checkoutError || "We couldn't initialize your payment in time."}
                    </p>
                    <div className="flex gap-3 w-full">
                      <button
                        onClick={() => { setCheckoutStatus('idle'); }}
                        className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50 transition"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => { setCheckoutStatus('idle'); confirmOrder(); }}
                        className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 shadow-lg transition"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Health Warning Dialog */}
          {showHealthWarning && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[90dvh] overflow-y-auto border border-red-100 transform transition-all scale-100">
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="bg-red-100 p-3 rounded-full mb-4">
                    <AlertCircle size={32} className="text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Health Profile Advisory</h3>
                  <div className="text-gray-600 mt-2 space-y-1 text-sm w-full">
                    <p>Your cart contains {unhealthyItems.length} item(s) that conflict with your health advisory:</p>
                    <ul className="text-left bg-red-50 p-3 rounded-lg mt-3 space-y-2 max-h-40 overflow-y-auto w-full">
                      {unhealthyItems.map((ui, idx) => (
                        <li key={idx} className="text-xs">
                          <strong className="text-red-800">{ui.item.name}:</strong> <span className="text-red-600">{ui.reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowHealthWarning(false)}
                    aria-label="Review and adjust cart items"
                    className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50 transition"
                  >
                    Review Cart
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowHealthWarning(false);
                      confirmOrder();
                    }}
                    aria-label="Acknowledge health advisory and proceed to checkout"
                    className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg hover:shadow-red-500/30 transition"
                  >
                    Acknowledge & Proceed
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Undo Snackbar */}
          {undoState.show && (
            <div className="fixed bottom-40 lg:bottom-10 left-0 right-0 mx-auto w-max max-w-[calc(100vw-2rem)] bg-gray-900 text-white px-4 sm:px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-3 sm:gap-4 animate-fadeIn">
              <span className="text-sm font-medium">Item removed from cart</span>
              <button
                type="button"
                onClick={handleUndo}
                aria-label="Undo item removal from cart"
                className="text-orange-400 font-bold text-sm flex items-center hover:text-orange-300 transition"
              >
                <Undo size={16} className="mr-1" /> Undo
              </button>
              <button 
                type="button"
                onClick={() => setUndoState(prev => ({ ...prev, show: false }))} 
                aria-label="Dismiss notification"
                className="ml-2 text-gray-500 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Sticky Mobile CTA Bar */}
        <div className="lg:hidden fixed bottom-[calc(3.6rem+env(safe-area-inset-bottom))] md:bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.1)] pb-safe md:pb-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 dark:text-gray-400">Total</span>
              <span className="font-extrabold text-xl text-orange-600 dark:text-orange-400">₹{grandTotal}</span>
            </div>
            <button
              type="button"
              onClick={handleCheckoutClick}
              disabled={hasStaleItems || checkoutStatus === 'processing'}
              aria-label={hasStaleItems ? "Outdated items in cart" : checkoutStatus === 'processing' ? "Processing payment" : `Pay ₹${grandTotal} and place order`}
              className="flex-1 max-w-xs bg-gradient-to-r from-orange-500 to-red-500 text-white py-3.5 rounded-xl font-extrabold shadow-lg hover:shadow-orange-500/30 active:scale-[0.98] transition-all text-sm disabled:opacity-60"
            >
              {hasStaleItems ? 'Remove Outdated Items' : checkoutStatus === 'processing' ? 'Processing...' : `Pay ₹${grandTotal} — Place Order`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
