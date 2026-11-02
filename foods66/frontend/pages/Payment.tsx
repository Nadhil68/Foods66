import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useCartStore, useNotificationStore } from '../store/useStore';
import { CheckCircle, Clock, CreditCard, Banknote, Loader, ArrowRight, AlertCircle, QrCode } from 'lucide-react';
import { paymentsAPI, ordersAPI } from '../services/apiService';
import { socketService } from '../services/socketService';
import QRCode from 'qrcode';

type PaymentStatus = 'pending' | 'processing' | 'verification_pending' | 'confirmed' | 'failed' | 'cancelled';

const Payment: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearCart } = useCartStore();
  const { showNotification } = useNotificationStore();
  
  const methodFromQuery = (searchParams.get('method') || '').toUpperCase();
  const initialMethod: 'CARD' | 'UPI' | 'COD' = 
    methodFromQuery === 'COD' || methodFromQuery === 'UPI' || methodFromQuery === 'CARD' 
      ? (methodFromQuery as 'CARD' | 'UPI' | 'COD') 
      : 'CARD';

  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'UPI' | 'COD'>(initialMethod);
  const [status, setStatus] = useState<PaymentStatus>(
    initialMethod === 'COD' ? 'confirmed' : 'processing'
  );
  const [countdown, setCountdown] = useState(120);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // 1. Fetch Order & Payment Status from Backend
  useEffect(() => {
    if (!orderId) {
      navigate('/cart');
      return;
    }
    
    const fetchStatus = async () => {
      try {
        const data = await paymentsAPI.getStatus(orderId);
        if (data.success) {
          setOrderDetails(data);
          if (data.paymentMethod) {
            setPaymentMethod(data.paymentMethod as any);
          }
          
          if (data.paymentStatus === 'PAID' || ['PAYMENT_CONFIRMED', 'RESTAURANT_CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(data.status)) {
            setStatus('confirmed');
            clearCart();
          } else if (data.paymentStatus === 'FAILED' || data.status === 'CANCELLED') {
            setStatus('failed');
            setErrorMessage('Payment was not completed or failed.');
          } else if (data.paymentMethod === 'COD') {
            setStatus('confirmed');
            clearCart();
          } else {
            setStatus(prev => prev === 'verification_pending' ? prev : 'processing');
          }
        }
      } catch (err: any) {
        console.warn('Failed to fetch status via payments endpoint, trying orders endpoint:', err);
        try {
          const ordRes = await ordersAPI.getById(orderId);
          if (ordRes.success && ordRes.order) {
            setOrderDetails({ ...ordRes.order, totalPrice: ordRes.order.totalPrice });
            if (ordRes.order.paymentMethod) {
              setPaymentMethod(ordRes.order.paymentMethod);
            }
            if (ordRes.order.paymentStatus === 'PAID' || ordRes.order.paymentMethod === 'COD' || ordRes.order.status === 'PAYMENT_CONFIRMED') {
              setStatus('confirmed');
              clearCart();
            } else if (ordRes.order.paymentStatus === 'FAILED' || ordRes.order.status === 'CANCELLED') {
              setStatus('failed');
            } else {
              setStatus(prev => prev === 'verification_pending' ? prev : 'processing');
            }
          }
        } catch {
          setErrorMessage('Could not load payment information.');
        }
      }
    };
    
    fetchStatus();

    // Socket.IO Listener for real-time payment capture
    socketService.joinTracking(orderId);
    const handleStatusUpdate = (eventData: any) => {
      if (eventData.orderId === orderId && (eventData.paymentStatus === 'PAID' || eventData.status === 'PAYMENT_CONFIRMED')) {
        setStatus('confirmed');
        clearCart();
        showNotification('Payment Verified! 🎉', 'Your order is confirmed and sent to the kitchen.', 'success');
      }
    };

    socketService.onOrderStatus(handleStatusUpdate);
    
    return () => {
      socketService.offOrderStatus(handleStatusUpdate);
      socketService.leaveTracking(orderId);
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [orderId, navigate, clearCart, showNotification]);
  
  // 2. Safe Fallback Polling (Every 3s)
  useEffect(() => {
    if ((status !== 'processing' && status !== 'verification_pending') || !orderId) return;
    
    pollingRef.current = setInterval(async () => {
      try {
        const data = await paymentsAPI.getStatus(orderId);
        if (data.success && (data.paymentStatus === 'PAID' || data.status === 'PAYMENT_CONFIRMED' || data.status === 'PREPARING')) {
          setStatus('confirmed');
          clearCart();
          showNotification('Payment Verified! 🎉', 'Your order has been paid and confirmed.', 'success');
          if (pollingRef.current) clearInterval(pollingRef.current);
        } else if (data.paymentStatus === 'FAILED' || data.status === 'CANCELLED') {
          setStatus('failed');
          setErrorMessage('Payment failed or timed out.');
          if (pollingRef.current) clearInterval(pollingRef.current);
        }
      } catch {
        // Safe polling ignore
      }
    }, 3000);
    
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [status, orderId, clearCart, showNotification]);
  
  // 3. Countdown timer for processing payments
  useEffect(() => {
    if (status !== 'processing' && status !== 'verification_pending') return;
    
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          setStatus('failed');
          setErrorMessage('Payment verification timed out.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [status]);
  
  // 4. Auto-redirect to tracking on confirmation
  useEffect(() => {
    if (status === 'confirmed') {
      clearCart();
      const targetId = orderDetails?.orderId || (orderId && /^[0-9a-fA-F]{24}$/.test(orderId) ? orderId : null);
      if (targetId) {
        const timer = setTimeout(() => {
          navigate(`/tracking/${targetId}`);
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [status, orderId, orderDetails, navigate, clearCart]);

  // 5. Check for success param from Stripe redirect (Must be declared before returns)
  useEffect(() => {
    const rawSearch = window.location.search;
    const rawHash = window.location.hash;
    const urlParams = new URLSearchParams(rawSearch);
    const hashQuery = rawHash.includes('?') ? rawHash.split('?')[1] : '';
    const hashParams = new URLSearchParams(hashQuery);
    
    const isSuccess = searchParams.get('success') === 'true' || 
                      urlParams.get('success') === 'true' || 
                      hashParams.get('success') === 'true';

    if (isSuccess && orderId && (status === 'processing' || status === 'verification_pending')) {
      paymentsAPI.verify(orderId).then((res) => {
        if (res.success) {
          setStatus('confirmed');
          clearCart();
          showNotification('Payment Verified! 🎉', 'Your payment was confirmed.', 'success');
        }
      }).catch((err) => {
        console.warn('Auto-verify error on redirect:', err);
      });
    }
  }, [orderId, status, clearCart, showNotification, searchParams]);

  // 6. Generate QR Code dynamically
  const totalAmount = orderDetails?.totalPrice || 0;
  const merchantUpiId = import.meta.env.VITE_UPI_ID || '';
  const upiUri = `upi://pay?pa=${merchantUpiId}&pn=Foods66&am=${totalAmount}&cu=INR&tr=${orderId}`;

  useEffect(() => {
    if (paymentMethod === 'UPI' && totalAmount > 0 && merchantUpiId) {
      QRCode.toDataURL(upiUri, { width: 220, margin: 2, color: { dark: '#000000', light: '#ffffff' } })
        .then(url => setQrImageUrl(url))
        .catch(err => {
          console.error("QR Code Generation failed", err);
          showNotification('QR Error', 'Unable to generate payment QR. Please try again.', 'error');
        });
    }
  }, [paymentMethod, totalAmount, merchantUpiId, upiUri, showNotification]);
  
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };
  
  const handleSimulatePayment = async () => {
    if (!orderId) return;
    try {
      const res = await paymentsAPI.verify(orderId);
      if (res.success) {
        setStatus('confirmed');
        clearCart();
        showNotification('Payment Verified! 🎉', 'Payment confirmed successfully.', 'success');
      }
    } catch (err: any) {
      showNotification('Verification Error', err.message || 'Could not verify payment', 'error');
    }
  };

  const handleIHavePaid = () => {
    setStatus('verification_pending');
    showNotification('Payment Submitted', 'Waiting for payment verification.', 'info');
  };

  // ── Render Views ───

  // COD View
  if (paymentMethod === 'COD' && status === 'confirmed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 max-w-md w-full text-center border border-green-100 dark:border-gray-800 animate-fadeIn">
          <div className="relative mb-6">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
              <Banknote size={48} className="text-green-600 dark:text-green-400" />
            </div>
          </div>
          
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">Cash on Delivery Confirmed!</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Your order is being sent to the kitchen. Pay when your food arrives.</p>
          
          <div className="bg-gradient-to-br from-gray-50 to-green-50 dark:from-gray-800/60 dark:to-green-900/20 rounded-2xl p-5 mb-6 border border-green-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Order ID</span>
              <span className="font-mono text-xs bg-white dark:bg-gray-800 px-3 py-1 rounded-full border dark:border-gray-700 text-gray-600 dark:text-gray-300">
                #{orderId?.slice(-8)}
              </span>
            </div>
            <div className="border-t border-green-100 dark:border-gray-700 pt-3 flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300 font-medium">Amount to Pay</span>
              <span className="text-2xl font-extrabold text-green-700 dark:text-green-400">₹{totalAmount}</span>
            </div>
          </div>
          
          <button
            onClick={() => navigate(`/tracking/${orderDetails?.orderId || orderId}`)}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            Track Your Order <ArrowRight size={20} />
          </button>
          
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">Redirecting to live tracking in a few seconds...</p>
        </div>
      </div>
    );
  }

  // Payment Confirmed (Stripe Card / UPI)
  if (status === 'confirmed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 max-w-md w-full text-center border border-green-100 dark:border-gray-800 animate-fadeIn">
          <div className="relative mb-6">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle size={56} className="text-green-600 dark:text-green-400" />
            </div>
          </div>
          
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">Payment Verified! 🎉</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Your payment is confirmed. The kitchen is preparing your meal.</p>
          
          <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 mb-6 border border-green-100 dark:border-gray-700">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Order ID</span>
              <span className="font-mono text-xs bg-white dark:bg-gray-800 px-3 py-1 rounded-full border dark:border-gray-700 dark:text-gray-300">#{orderId?.slice(-8)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Total Paid</span>
              <span className="font-bold text-green-700 dark:text-green-400">₹{totalAmount}</span>
            </div>
          </div>
          
          <button
            onClick={() => navigate(`/tracking/${orderDetails?.orderId || orderId}`)}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            Track Your Order <ArrowRight size={20} />
          </button>
          
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">Redirecting to live tracking...</p>
        </div>
      </div>
    );
  }

  // Failed View
  if (status === 'failed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 max-w-md w-full text-center border border-red-100 dark:border-gray-800 animate-fadeIn">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={40} className="text-red-500 dark:text-red-400" />
          </div>
          
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">Payment Failed</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{errorMessage || 'Your payment could not be completed.'}</p>
          
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/cart')}
              className="flex-1 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              Back to Cart
            </button>
            <button
              onClick={() => {
                setStatus('processing');
                setCountdown(120);
              }}
              className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 shadow-lg transition"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Processing View (Stripe / QR)
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 max-w-md w-full text-center border border-orange-100 dark:border-gray-800 animate-fadeIn">
        
        {paymentMethod === 'UPI' ? (
          <>
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="bg-orange-100 dark:bg-orange-900/40 p-2.5 rounded-xl text-orange-600 dark:text-orange-400">
                <QrCode size={24} />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Pay with UPI</h2>
            </div>
            
            <p className="text-3xl font-extrabold text-orange-600 dark:text-orange-400 mb-6">₹{totalAmount.toFixed(2)}</p>

            {!merchantUpiId ? (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6">
                Online UPI payment is currently unavailable.
              </div>
            ) : status === 'verification_pending' ? (
              <div className="py-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Verifying your payment...</h3>
                <p className="text-gray-500 text-sm mt-2">Please wait while we confirm with the bank.</p>
              </div>
            ) : (
              <>
                <div className="bg-white p-3 rounded-2xl shadow-inner border-2 border-orange-100 dark:border-gray-700 inline-block mb-3">
                  {qrImageUrl ? (
                    <img src={qrImageUrl} alt="Foods66 UPI payment QR code" className="w-56 h-56 object-contain mx-auto" />
                  ) : (
                    <div className="w-56 h-56 flex items-center justify-center bg-gray-50 text-gray-400"><Loader className="animate-spin" /></div>
                  )}
                </div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-2 mb-1">Scan using your UPI app</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">Google Pay • PhonePe • Paytm • BHIM</p>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleIHavePaid}
                    className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 transition shadow"
                  >
                    I Have Paid
                  </button>
                  
                  {/* Deep link where supported */}
                  <a
                    href={upiUri}
                    className="w-full py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition block"
                  >
                    Open UPI App
                  </a>
                  
                  <button
                    onClick={() => {
                      ordersAPI.cancel(orderId);
                      navigate('/cart');
                    }}
                    className="w-full py-2 text-sm text-gray-500 hover:text-red-500 transition"
                  >
                    Cancel Payment
                  </button>
                </div>
              </>
            )}

            {/* DEMO MODE VERIFICATION */}
            {import.meta.env.VITE_ENABLE_DEMO_UPI_VERIFICATION === 'true' && status === 'verification_pending' && (
              <div className="mt-8 pt-6 border-t border-dashed border-gray-300">
                <span className="text-xs font-bold text-red-500 mb-2 block tracking-widest">DEVELOPMENT ONLY</span>
                <button
                  onClick={handleSimulatePayment}
                  className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition shadow"
                >
                  DEMO: Simulate Successful Payment
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="bg-orange-100 dark:bg-orange-900/40 p-2.5 rounded-xl text-orange-600 dark:text-orange-400">
                <CreditCard size={24} />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Verifying Payment</h2>
            </div>

            <div className="bg-orange-50 dark:bg-gray-800/60 rounded-2xl p-4 mb-4 border border-orange-100 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Amount</p>
              <p className="text-3xl font-extrabold text-orange-600 dark:text-orange-400">₹{totalAmount}</p>
            </div>

            <div className="flex items-center justify-center gap-2 mb-6 text-sm text-gray-600 dark:text-gray-400">
              <Clock size={16} className="text-orange-500" />
              <span>Verification Window: <strong className="text-orange-600 dark:text-orange-400 font-mono">{formatTime(countdown)}</strong></span>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-orange-600 dark:text-orange-400 font-semibold bg-orange-50/50 dark:bg-orange-950/30 py-3 rounded-xl mb-4">
              <Loader size={16} className="animate-spin" />
              <span>Awaiting webhook confirmation...</span>
            </div>
            
            {/* DEMO MODE VERIFICATION for Card */}
            {import.meta.env.VITE_ENABLE_DEMO_UPI_VERIFICATION === 'true' && (
              <div className="mt-8 pt-6 border-t border-dashed border-gray-300">
                <span className="text-xs font-bold text-red-500 mb-2 block tracking-widest">DEVELOPMENT ONLY</span>
                <button
                  onClick={handleSimulatePayment}
                  className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition shadow"
                >
                  DEMO: Simulate Successful Payment
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Payment;
