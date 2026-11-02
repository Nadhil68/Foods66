import React, { Suspense, lazy, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import Navbar from './components/Navbar';
import { useAuthStore, useCartStore } from './store/useStore';
import { socketService } from './services/socketService';
import ErrorBoundary from './ErrorBoundary';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const CommonMenu = lazy(() => import('./pages/CommonMenu'));
const RecommendedMenu = lazy(() => import('./pages/RecommendedMenu'));
const Cart = lazy(() => import('./pages/Cart'));
const Payment = lazy(() => import('./pages/Payment'));
const Tracking = lazy(() => import('./pages/Tracking'));
const OrderHistory = lazy(() => import('./pages/OrderHistory'));
const Profile = lazy(() => import('./pages/Profile'));
const About = lazy(() => import('./pages/About'));
const RestaurantDashboard = lazy(() => import('./pages/RestaurantDashboard'));
const DeliveryDashboard = lazy(() => import('./pages/DeliveryDashboard'));
const AdminBIDashboard = lazy(() => import('./pages/AdminBIDashboard'));
const AIChatBot = lazy(() => import('./components/AIChatBot'));

// Inline ProtectedRoute was replaced by the standalone component in ./components/ProtectedRoute.tsx

const FloatingCartBanner: React.FC = () => {
  const { cart } = useCartStore();
  const navigate = useNavigate();
  const location = useLocation();

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  if (totalItems === 0 || ['/', '/signin', '/signup', '/cart'].includes(location.pathname) || location.pathname.startsWith('/tracking') || location.pathname.startsWith('/payment')) {
    return null;
  }

  return (
    // On phones the banner sits above the bottom tab bar and leaves room on the right for the chat button.
    <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-3 right-[5.25rem] md:bottom-6 md:left-0 md:right-0 md:mx-auto z-50 md:w-11/12 md:max-w-lg bg-gradient-to-r from-orange-600 via-orange-500 to-red-600 text-white px-3 py-2.5 md:px-5 md:py-3.5 rounded-2xl shadow-2xl flex items-center justify-between gap-2 border border-white/20 backdrop-blur-md animate-fadeIn">
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        <div className="bg-white/20 px-2.5 py-1.5 md:px-3 rounded-xl text-xs md:text-sm font-bold flex items-center gap-1.5 whitespace-nowrap">
          <ShoppingCart size={16} />
          {totalItems} {totalItems === 1 ? 'item' : 'items'}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="hidden md:block text-[11px] text-orange-100 uppercase tracking-wider font-semibold">Total Amount</span>
          <span className="font-extrabold text-sm md:text-base leading-tight whitespace-nowrap">₹{totalPrice}</span>
        </div>
      </div>
      <button
        onClick={() => navigate('/cart')}
        aria-label={`Checkout, total ₹${totalPrice}`}
        className="bg-white text-orange-600 px-3 py-2 md:px-5 md:py-2.5 rounded-xl font-bold text-xs md:text-sm shadow-md hover:bg-orange-50 active:scale-95 transition flex items-center gap-1.5 whitespace-nowrap shrink-0"
      >
        <span>Checkout<span className="hidden md:inline"> — ₹{totalPrice}</span></span> <ArrowRight size={16} />
      </button>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { user } = useAuth(); // Now using real backend auth context for socket connection
  const navigate = useNavigate();
  
  useEffect(() => {
    if (user) {
      socketService.connect(user.id);

      const handleNotification = (data: any) => {
        toast(data.title, {
          description: data.message,
          action: {
            label: 'View',
            onClick: () => navigate('/tracking')
          },
        });
      };

      socketService.onNotification(handleNotification);

      return () => {
        socketService.offNotification(handleNotification);
        socketService.disconnect();
      };
    }
  }, [navigate, user]);

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Navbar />
      {/* Signed-in phones get a fixed bottom tab bar (see Navbar) — keep page content clear of it. */}
      <main id="main-content" tabIndex={-1} className={`focus:outline-none ${user ? 'pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0' : ''}`}>
        <ErrorBoundary>
          <Suspense fallback={<div className="flex h-dvh items-center justify-center"><div className="w-10 h-10 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div></div>}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/signin" element={<Login />} />
              <Route path="/signup" element={<Register />} />
              <Route path="/about" element={<About />} />
              
              {/* Legacy redirect */}
              <Route path="/login" element={<Navigate to="/signin" replace />} />
              <Route path="/register" element={<Navigate to="/signup" replace />} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Navigate to="/menu" replace />} />
                <Route path="/common-foods" element={<CommonMenu />} />
                <Route path="/recommended-foods" element={<RecommendedMenu />} />
                <Route path="/menu" element={<Navigate to="/common-foods" replace />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/payment/:orderId" element={<Payment />} />
                <Route path="/tracking/:orderId" element={<Tracking />} />
                <Route path="/orders" element={<OrderHistory />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/restaurant-dashboard" element={<RestaurantDashboard />} />
                <Route path="/delivery-dashboard" element={<DeliveryDashboard />} />
                <Route path="/admin-dashboard" element={<AdminBIDashboard />} />
              </Route>
              
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <AIChatBot />
            <FloatingCartBanner />
          </Suspense>
        </ErrorBoundary>
      </main>
      <Toaster position="top-right" richColors offset={{ top: 72, right: 16 }} mobileOffset={{ top: 72, left: 12, right: 12 }} />
    </>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;