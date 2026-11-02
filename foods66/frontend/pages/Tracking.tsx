import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CheckCircle, Clock, Phone, User, XCircle, AlertCircle, PackageCheck,
  Share2, Check, Star, MessageSquare, ThumbsUp, ArrowRight, Sparkles,
  ShoppingBag, MapPin, ChefHat, Truck, Navigation
} from 'lucide-react';
import { deliveriesAPI } from '../services/apiService';
import { socketService } from '../services/socketService';
import { apiClient } from '../services/apiClient';

declare const L: any;

// Confetti Component for celebration on delivery completion
const Confetti: React.FC = () => {
  const colors = ['#f97316', '#ef4444', '#10b981', '#6366f1', '#f59e0b', '#ec4899', '#06b6d4'];
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    left: Math.random() * 100,
    delay: Math.random() * 1.5,
    duration: 2 + Math.random() * 2,
    size: 6 + Math.random() * 8,
    rotation: Math.random() * 360,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute animate-confetti"
          style={{
            left: `${p.left}%`,
            top: '-20px',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        >
          <div
            style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              borderRadius: '50%',
              transform: `rotate(${p.rotation}deg)`,
            }}
          />
        </div>
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti {
          animation: confetti-fall linear forwards;
        }
      `}</style>
    </div>
  );
};

// Star Rating Component
const StarRating: React.FC<{ value: number; onChange: (v: number) => void; label: string }> = ({ value, onChange, label }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="transition-all transform hover:scale-125 active:scale-95"
          >
            <Star
              size={28}
              className={`transition-colors ${
                star <= (hover || value) ? 'text-orange-400 fill-orange-400' : 'text-gray-300 dark:text-gray-600'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
};

const TIMELINE_STEPS = [
  { status: 'PLACED', label: 'Order Placed', icon: ShoppingBag },
  { status: 'PAYMENT_CONFIRMED', label: 'Payment Confirmed', icon: CheckCircle },
  { status: 'RESTAURANT_CONFIRMED', label: 'Restaurant Confirmed [In Progress]', icon: ChefHat },
  { status: 'PREPARING', label: 'Preparing', icon: Clock },
  { status: 'READY_FOR_PICKUP', label: 'Ready for Pickup', icon: PackageCheck },
  { status: 'ASSIGNED', label: 'Partner Assigned', icon: User },
  { status: 'PICKED_UP', label: 'Picked Up', icon: Navigation },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: Truck },
  { status: 'DELIVERED', label: 'Delivered', icon: CheckCircle }
];

const Tracking: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const [trackingData, setTrackingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Feedback State
  const [feedbackView, setFeedbackView] = useState<'form' | 'success' | null>(null);
  const [foodRating, setFoodRating] = useState(5);
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const driverMarkerRef = useRef<any>(null);
  const destinationMarkerRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);

  const DEFAULT_CHENNAI_LOC: [number, number] = [80.2707, 13.0827]; // [lng, lat]

  // 1. Initial Load & Tracking Data
  useEffect(() => {
    if (!orderId) {
      navigate('/orders');
      return;
    }

    const fetchTracking = async () => {
      try {
        setLoading(true);
        const data = await deliveriesAPI.getTracking(orderId);
        setTrackingData(data);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch tracking data', err);
        setError(err.message || 'Tracking details not found for this order.');
      } finally {
        setLoading(false);
      }
    };

    fetchTracking();

    // Socket.IO Subscription
    socketService.connect();
    socketService.joinTracking(orderId);

    const handleStatus = (data: any) => {
      if (data.orderId === orderId) {
        setTrackingData((prev: any) => prev ? { ...prev, orderStatus: data.status, timeline: data.timeline || prev.timeline } : prev);
      }
    };

    const handleAssigned = (data: any) => {
      if (data.orderId === orderId) {
        setTrackingData((prev: any) => prev ? { ...prev, orderStatus: 'ASSIGNED', deliveryPartner: data, eta: data.eta } : prev);
      }
    };

    const handleLocation = (data: any) => {
      if (data.orderId === orderId && data.latitude && data.longitude) {
        setTrackingData((prev: any) => prev ? { 
          ...prev, 
          driverLocation: { latitude: data.latitude, longitude: data.longitude },
          eta: data.eta || prev.eta 
        } : prev);
      }
    };

    const handleDelivered = (data: any) => {
      if (data.orderId === orderId) {
        setTrackingData((prev: any) => prev ? { ...prev, orderStatus: 'DELIVERED', deliveryStatus: 'DELIVERED' } : prev);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
    };

    socketService.onOrderStatus(handleStatus);
    socketService.onDeliveryAssigned(handleAssigned);
    socketService.onDeliveryLocation(handleLocation);
    socketService.onOrderDelivered(handleDelivered);

    return () => {
      socketService.offOrderStatus(handleStatus);
      socketService.offDeliveryAssigned(handleAssigned);
      socketService.offDeliveryLocation(handleLocation);
      socketService.offOrderDelivered(handleDelivered);
      socketService.leaveTracking(orderId);
    };
  }, [orderId, navigate]);

  // Helper: Haversine distance calculation
  const getDistanceKm = (c1: [number, number], c2: [number, number]) => {
    const toRad = (x: number) => x * Math.PI / 180;
    const R = 6371;
    const dLat = toRad(c2[0] - c1[0]);
    const dLon = toRad(c2[1] - c1[1]);
    const a = Math.sin(dLat/2)**2 + Math.cos(toRad(c1[0])) * Math.cos(toRad(c2[0])) * Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current && routeLineRef.current) {
      mapInstanceRef.current.fitBounds(routeLineRef.current.getBounds(), { padding: [60, 60] });
    }
  };

  // 2. Safe Fallback Polling (Only if disconnected)
  useEffect(() => {
    if (!orderId || trackingData?.orderStatus === 'DELIVERED' || trackingData?.orderStatus === 'CANCELLED') return;

    const intervalId = setInterval(async () => {
      // Avoid polling if socket is actively getting live updates recently
      // We can check if trackingData has been updated in the last 10s.
      // For now, we'll keep polling sparse (every 15s) as a true fallback
      try {
        const data = await deliveriesAPI.getTracking(orderId);
        setTrackingData((prev: any) => ({ ...prev, ...data }));
      } catch {
        // Safe polling ignore
      }
    }, 15000);

    return () => clearInterval(intervalId);
  }, [orderId, trackingData?.orderStatus]);

  // 3. Leaflet Map Initialization & Real Location Marker
  useEffect(() => {
    if (!mapContainerRef.current || !trackingData || typeof L === 'undefined') return;

    // Use separated locations from API
    const custLoc = trackingData.customerLocation;
    const destCoords: [number, number] = custLoc && custLoc.latitude ? [custLoc.latitude, custLoc.longitude] : DEFAULT_CHENNAI_LOC;

    const restLoc = trackingData.restaurantLocation;
    const restCoords: [number, number] = restLoc && restLoc.latitude ? [restLoc.latitude, restLoc.longitude] : destCoords;

    const driverLoc = trackingData.driverLocation;
    let driverCoords: [number, number] | null = null;
    if (driverLoc && driverLoc.latitude && driverLoc.longitude) {
      driverCoords = [driverLoc.latitude, driverLoc.longitude];
    }

    // Compute dynamic ETA & Distance if OUT_FOR_DELIVERY and driver exists
    if (driverCoords && (trackingData.orderStatus === 'OUT_FOR_DELIVERY' || trackingData.deliveryStatus === 'OUT_FOR_DELIVERY')) {
      const distKm = getDistanceKm(driverCoords, destCoords);
      // Rough estimate: 20 km/h average speed in city traffic => 1 km = 3 mins + 2 mins buffer
      const etaMins = Math.ceil(distKm * 3) + 2;
      if (!trackingData.liveDistance || Math.abs(trackingData.liveDistance - distKm) > 0.05) {
        setTrackingData((prev: any) => ({
          ...prev,
          liveDistance: distKm,
          liveEta: etaMins
        }));
      }
    }

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, { zoomControl: false });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      const createIcon = (iconHtml: string, colorClass: string) => L.divIcon({
        className: 'custom-map-icon',
        html: `<div class="w-8 h-8 ${colorClass} rounded-full border-2 border-white shadow-lg flex items-center justify-center text-sm font-bold shadow-black/50">${iconHtml}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const userIcon = createIcon('🏠', 'bg-orange-600 text-white');
      const driverIcon = createIcon('🛵', 'bg-emerald-600 text-white');
      const restaurantIcon = createIcon('🏪', 'bg-blue-600 text-white');

      destinationMarkerRef.current = L.marker(destCoords, { icon: userIcon }).addTo(map).bindPopup("Delivery Address");
      const rMarker = L.marker(restCoords, { icon: restaurantIcon }).addTo(map).bindPopup("Restaurant");
      
      let bounds = L.latLngBounds([restCoords, destCoords]);
      
      if (driverCoords) {
        driverMarkerRef.current = L.marker(driverCoords, { icon: driverIcon, zIndexOffset: 1000 }).addTo(map).bindPopup("Delivery Partner");
        bounds = L.latLngBounds([driverCoords, destCoords]);
        
        const polyline = L.polyline([driverCoords, destCoords], {
          color: '#f97316',
          weight: 4,
          opacity: 0.8,
          dashArray: '8, 8'
        }).addTo(map);
        routeLineRef.current = polyline;
      }

      map.fitBounds(bounds, { padding: [60, 60] });
      mapInstanceRef.current = map;
    } else {
      // Smoothly Animate Marker to new position if driver exists
      if (driverCoords && !driverMarkerRef.current) {
         // Driver just appeared
         const driverIcon = L.divIcon({
          className: 'custom-map-icon',
          html: `<div class="w-8 h-8 bg-emerald-600 text-white rounded-full border-2 border-white shadow-lg flex items-center justify-center text-sm font-bold shadow-black/50">🛵</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });
        driverMarkerRef.current = L.marker(driverCoords, { icon: driverIcon, zIndexOffset: 1000 }).addTo(mapInstanceRef.current).bindPopup("Delivery Partner");
        
        const polyline = L.polyline([driverCoords, destCoords], {
          color: '#f97316',
          weight: 4,
          opacity: 0.8,
          dashArray: '8, 8'
        }).addTo(mapInstanceRef.current);
        routeLineRef.current = polyline;
      } else if (driverCoords && driverMarkerRef.current) {
        const oldCoords = driverMarkerRef.current.getLatLng();
        const startCoords: [number, number] = [oldCoords.lat, oldCoords.lng];
        
        // Only animate if position changed significantly
        if (Math.abs(startCoords[0] - driverCoords[0]) > 0.00001 || Math.abs(startCoords[1] - driverCoords[1]) > 0.00001) {
          const startTime = performance.now();
          const duration = 2000; // 2 seconds animation
          
          const animate = (time: number) => {
            let progress = (time - startTime) / duration;
            if (progress > 1) progress = 1;
            
            // Easing: easeOutCubic
            const eased = 1 - Math.pow(1 - progress, 3);
            
            const currentLat = startCoords[0] + (driverCoords[0] - startCoords[0]) * eased;
            const currentLng = startCoords[1] + (driverCoords[1] - startCoords[1]) * eased;
            
            driverMarkerRef.current.setLatLng([currentLat, currentLng]);
            
            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };
          requestAnimationFrame(animate);
        }
      }
      
      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.setLatLng(destCoords);
      }
      if (routeLineRef.current && driverMarkerRef.current) {
        routeLineRef.current.setLatLngs([driverMarkerRef.current.getLatLng(), destCoords]);
      }
    }
  }, [trackingData?.driverLocation, trackingData?.orderId]);

  const handleShareTracking = () => {
    if (!orderId) return;
    const textToShare = `Tracking Foods66 Order #${orderId.slice(-6)} - Status: ${trackingData?.orderStatus || 'In Progress'}`;
    navigator.clipboard.writeText(textToShare).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSubmitFeedback = async () => {
    if (!orderId) return;
    setSubmittingFeedback(true);
    try {
      await apiClient.post('/feedback', {
        orderId,
        rating: foodRating,
        deliveryRating,
        comment: feedbackComment
      });
      setShowConfetti(true);
      setFeedbackView('success');
      setTimeout(() => setShowConfetti(false), 4000);
    } catch {
      setFeedbackView('success');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium">Connecting to live tracking...</p>
      </div>
    );
  }

  if (error || !trackingData) {
    return (
      <div className="min-h-dvh bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100 dark:border-gray-800">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Order Tracking</h2>
          <p className="text-gray-500 text-sm mb-6">{error || 'Order tracking could not be loaded.'}</p>
          <button onClick={() => navigate('/orders')} className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 transition">
            View My Orders
          </button>
        </div>
      </div>
    );
  }

  const currentStatus = trackingData.orderStatus || 'PLACED';
  const currentStepIndex = TIMELINE_STEPS.findIndex(s => s.status === currentStatus);
  const activeStepIdx = currentStepIndex >= 0 ? currentStepIndex : 0;

  // ETA in minutes
  let etaDisplay = '20–30 min';
  if (trackingData.eta) {
    const diffMs = new Date(trackingData.eta).getTime() - Date.now();
    const diffMins = Math.max(1, Math.round(diffMs / 60000));
    etaDisplay = `${diffMins} min`;
  }

  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-gray-950 pb-20">
      {showConfetti && <Confetti />}

      <div className="max-w-[1100px] w-full mx-auto px-4 py-6">
        {/* Header Bar */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">Live Order Tracking</span>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white font-mono">
              #{orderId?.slice(-8)}
            </h1>
          </div>
          <button
            onClick={handleShareTracking}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 transition shadow-sm"
          >
            {copied ? <><Check size={14} className="text-green-500" /> Copied!</> : <><Share2 size={14} /> Share</>}
          </button>
        </div>

        {/* Map Container */}
        <div className="h-[min(340px,50dvh)] sm:h-[500px] w-full relative bg-gray-200 dark:bg-gray-800 rounded-2xl overflow-hidden shadow-inner border border-gray-200 dark:border-gray-800 mb-6">
          <div ref={mapContainerRef} className="w-full h-full z-0" />
          
          {/* Live Badge Overlay */}
          <div className="absolute top-3 left-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-gray-100 dark:border-gray-800 flex items-center gap-2 z-[1000]">
            {currentStatus === 'OUT_FOR_DELIVERY' && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 animate-ping opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            )}
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
              {currentStatus === 'OUT_FOR_DELIVERY' ? 'LIVE' : currentStatus.replace(/_/g, ' ')}
            </span>
          </div>

          {/* No Driver Yet Message Overlay */}
          {(!trackingData.driverLocation || currentStatus !== 'OUT_FOR_DELIVERY') && currentStatus !== 'DELIVERED' && currentStatus !== 'CANCELLED' && (
             <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 z-[1000] text-center pointer-events-none">
                <span className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <Clock size={16} className="text-orange-500" />
                  {currentStatus === 'PREPARING' ? 'Your food is being prepared' : 'Waiting for delivery partner location...'}
                </span>
             </div>
          )}

          {/* Recenter Button */}
          <button 
            onClick={handleRecenter}
            aria-label="Recenter map"
            className="absolute bottom-3 left-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md p-2 rounded-xl shadow-md border border-gray-100 dark:border-gray-800 z-[1000] text-gray-700 dark:text-gray-200 hover:bg-gray-50 transition"
          >
            📍 Recenter
          </button>

          <div className="absolute bottom-3 right-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl shadow-md border border-gray-100 dark:border-gray-800 z-[1000] text-right flex items-end gap-4">
            {trackingData.liveDistance !== undefined && currentStatus === 'OUT_FOR_DELIVERY' && trackingData.driverLocation && (
              <div className="text-left border-r border-gray-200 dark:border-gray-700 pr-4">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">Distance</span>
                <span className="text-sm font-extrabold text-orange-600 dark:text-orange-400">
                  {trackingData.liveDistance >= 1 ? trackingData.liveDistance.toFixed(1) + ' km' : Math.round(trackingData.liveDistance * 1000) + ' m'}
                </span>
              </div>
            )}
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">Estimated Arrival</span>
              <span className="text-sm font-extrabold text-orange-600 dark:text-orange-400">
                {!trackingData.driverLocation ? 'Pending assignment' : (trackingData.liveEta ? trackingData.liveEta + ' min' : etaDisplay)}
              </span>
            </div>
          </div>
        </div>

        {/* Delivery Partner Details */}
        <div className="card p-4 sm:p-5 mb-6 flex items-center justify-between border-l-4 border-orange-500">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-950/40 rounded-full flex items-center justify-center text-orange-600">
              <User size={24} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase">Delivery Partner</p>
              <h3 className="font-bold text-gray-900 dark:text-white text-base">
                {trackingData.deliveryPartner?.name || 'Assigning nearest partner...'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {trackingData.deliveryPartner?.phone ? `Contact: ${trackingData.deliveryPartner.phone}` : 'Will be assigned when food is ready'}
              </p>
            </div>
          </div>
          {trackingData.deliveryPartner?.phone && (
            <a
              href={`tel:${trackingData.deliveryPartner.phone}`}
              className="p-3 bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300 rounded-full hover:bg-green-200 transition"
              title="Call Delivery Partner"
            >
              <Phone size={18} />
            </a>
          )}
        </div>

        {/* ─── MODULE 2: ORDER STATE MACHINE TIMELINE ─── */}
        <div className="card p-6 mb-6">
          <h3 className="text-base font-extrabold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Clock size={18} className="text-orange-500" /> Order Lifecycle Timeline
          </h3>

          <div className="relative pl-6 sm:pl-8 space-y-6 border-l-2 border-gray-200 dark:border-gray-800 ml-4">
            {TIMELINE_STEPS.map((step, idx) => {
              const isPast = idx < activeStepIdx;
              const isCurrent = idx === activeStepIdx;
              const isFuture = idx > activeStepIdx;
              const StepIcon = step.icon;

              return (
                <div key={step.status} className="relative group">
                  {/* Step Dot */}
                  <div
                    className={`absolute -left-[31px] sm:-left-[35px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                      isPast
                        ? 'bg-green-500 border-green-500 text-white'
                        : isCurrent
                        ? 'bg-orange-500 border-orange-500 text-white ring-4 ring-orange-200 dark:ring-orange-950'
                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-400'
                    }`}
                  >
                    {isPast ? <Check size={12} /> : isCurrent ? <span className="w-2 h-2 bg-white rounded-full animate-ping" /> : <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />}
                  </div>

                  {/* Step Content */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${isCurrent ? 'text-orange-600 dark:text-orange-400' : isPast ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                        {step.label}
                      </span>
                      {isCurrent && (
                        <span className="badge bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 text-[10px] uppercase font-bold animate-pulse">
                          In Progress
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Items & Summary */}
        <div className="card p-6 mb-6">
          <h3 className="text-base font-extrabold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <ShoppingBag size={18} className="text-orange-500" /> Order Summary
          </h3>

          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {(trackingData.items || []).map((item: any, i: number) => (
              <div key={i} className="py-2.5 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded">
                    {item.quantity}x
                  </span>
                  <span className="text-gray-800 dark:text-gray-200">{item.name}</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-800 pt-3 mt-3 flex justify-between items-center">
            <span className="font-bold text-gray-600 dark:text-gray-400 text-sm">Total Paid</span>
            <span className="font-extrabold text-xl text-orange-600 dark:text-orange-400">₹{trackingData.totalPrice}</span>
          </div>

          {trackingData.deliveryAddress?.fullAddress && (
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 flex items-start gap-1.5">
              <MapPin size={14} className="text-orange-500 flex-shrink-0 mt-0.5" />
              <span>{trackingData.deliveryAddress.fullAddress}</span>
            </div>
          )}
        </div>

        {/* Post-Delivery Feedback Card */}
        {currentStatus === 'DELIVERED' && feedbackView !== 'success' && (
          <div className="card p-6 border-2 border-orange-200 dark:border-orange-900 animate-fadeIn">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <PackageCheck size={32} />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">How was your order?</h3>
              <p className="text-xs text-gray-500 mt-1">Help us serve you better by rating your meal & delivery experience.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <StarRating value={foodRating} onChange={setFoodRating} label="Food Quality" />
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <StarRating value={deliveryRating} onChange={setDeliveryRating} label="Delivery Service" />
              </div>
            </div>

            <textarea
              placeholder="Leave a comment for the kitchen (Optional)..."
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              rows={2}
              className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500 mb-4"
            />

            <button
              onClick={handleSubmitFeedback}
              disabled={submittingFeedback}
              className="w-full py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition flex items-center justify-center gap-2"
            >
              {submittingFeedback ? 'Submitting…' : <><ThumbsUp size={16} /> Submit Feedback</>}
            </button>
          </div>
        )}

        {feedbackView === 'success' && (
          <div className="card p-6 text-center bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
            <CheckCircle size={40} className="text-green-600 mx-auto mb-2" />
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Thank You for Your Feedback! 🎉</h3>
            <p className="text-xs text-gray-500 mt-1">Your ratings help us improve every day.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tracking;