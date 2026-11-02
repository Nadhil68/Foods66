import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, LogOut, Utensils, Activity, Clock, Heart, Truck,
  Info, Moon, Sun, Home, Search, User as UserIcon, Monitor,
  ChefHat, Bell, BarChart, Package, MapPin,
  Menu as MenuIcon, X, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useAuthStore, useCartStore } from '../store/useStore';
import { DeliveryVehicle } from '../types';

type Theme = 'light' | 'dark' | 'system';

/* ─── Dark-mode hook ─────────────────────────────────────────── */
const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() =>
    (localStorage.getItem('theme') as Theme) ?? 'system'
  );

  useEffect(() => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
    root.classList.toggle('dark', isDark);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return { theme, setTheme };
};

/* ─── Theme cycle button ─────────────────────────────────────── */
const ThemeToggle: React.FC<{ theme: Theme; setTheme: (t: Theme) => void }> = ({ theme, setTheme }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title="Change theme"
        aria-label="Change theme"
      >
        <Icon size={18} className={theme === 'dark' ? 'text-yellow-400' : theme === 'light' ? 'text-orange-500' : 'text-gray-500'} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-11 card p-1.5 w-36 z-50"
          >
            {([
              ['light', <Sun size={14} />, 'Light'],
              ['dark', <Moon size={14} />, 'Dark'],
              ['system', <Monitor size={14} />, 'System'],
            ] as [Theme, React.ReactNode, string][]).map(([t, icon, label]) => (
              <button
                key={t}
                onClick={() => { setTheme(t); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${theme === t
                    ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
              >
                <span className="text-gray-400">{icon}</span>
                {label}
                {theme === t && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Navbar ─────────────────────────────────────────────────── */
const Navbar: React.FC = () => {
  const { user: authUser, logout: authLogout } = useAuth();
  const { user: zustandUser } = useAuthStore();
  const { cart, deliveryVehicle, setDeliveryVehicle } = useCartStore();
  
  // Combine auth state with rich profile data from Zustand
  const user = authUser ? { ...zustandUser, ...authUser, firstName: authUser.name.split(' ')[0] } : null;
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => setMobileOpen(false), [location.pathname]);

  // Close notif dropdown outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleLogout = () => { authLogout(); navigate('/'); };

  const isActive = (path: string) => location.pathname === path;

  const navLink = (to: string, icon: React.ReactNode, label: string) => (
    <Link
      to={to}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200
        ${isActive(to)
          ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20'
          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'}`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );

  /* Role-specific navigation items */
  const roleLinks = () => {
    if (!user) return null;
    if (user.role === 'admin') return (
      <>
        {navLink('/admin-dashboard', <BarChart size={16} />, 'Dashboard')}
        {navLink('/common-foods', <Utensils size={16} />, 'Menu')}
      </>
    );
    if (user.role === 'restaurant') return (
      <>
        {navLink('/restaurant-dashboard', <ChefHat size={16} />, 'Kitchen')}
        {navLink('/common-foods', <Utensils size={16} />, 'Menu')}
      </>
    );
    if (user.role === 'driver') return navLink('/delivery-dashboard', <MapPin size={16} />, 'Deliveries');
    return (
      <>
        {navLink('/common-foods', <Utensils size={16} />, 'Menu')}
        {navLink('/recommended-foods', <Heart size={16} />, 'For You')}
        {navLink('/orders', <Clock size={16} />, 'Orders')}
      </>
    );
  };

  return (
    <>
      {/* ── Top Navbar ─────────────────────────────────── */}
      <nav
        aria-label="Main navigation"
        className={`glass sticky top-0 z-50 transition-all duration-300
          ${scrolled ? 'shadow-lg shadow-black/5 dark:shadow-black/30' : ''}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* ── Logo ─── */}
            <Link to={user ? '/common-foods' : '/'} className="flex items-center gap-2.5 group">
              <div className="bg-gradient-to-br from-orange-500 to-red-500 p-2 rounded-xl shadow-md shadow-orange-500/30 group-hover:shadow-orange-500/50 transition-shadow">
                <ChefHat size={20} className="text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="font-extrabold text-lg tracking-wide text-gray-900 dark:text-white">FOODS66</span>
                <span className="hidden lg:block text-[10px] text-gray-400 font-medium -mt-0.5">Enterprise Platform</span>
              </div>
            </Link>

            {/* ── Desktop Nav ─── */}
            <div className="hidden md:flex items-center gap-1">
              {user ? (
                <>
                  {roleLinks()}
                  {navLink('/about', <Info size={16} />, 'About')}
                </>
              ) : (
                <>
                  {navLink('/about', <Info size={16} />, 'About')}
                </>
              )}
            </div>

            {/* ── Right Actions ─── */}
            <div className="flex items-center gap-2">
              <ThemeToggle theme={theme} setTheme={setTheme} />

              {user ? (
                <>
                  {/* Delivery vehicle picker */}
                  {user.role !== 'admin' && user.role !== 'restaurant' && user.role !== 'driver' && (
                    <div className="hidden lg:flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2 text-xs border border-gray-200 dark:border-gray-700">
                      <Truck size={14} className="text-gray-500 dark:text-gray-400" />
                      <select
                        value={deliveryVehicle}
                        onChange={e => setDeliveryVehicle(e.target.value as DeliveryVehicle)}
                        aria-label="Select delivery vehicle type"
                        className="bg-transparent text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer text-xs font-medium border-none"
                      >
                        {(['Bike', 'Scooter', 'Cycle', 'Walking'] as DeliveryVehicle[]).map(v => (
                          <option key={v} value={v} className="dark:bg-gray-800">{v}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Notifications */}
                  <div className="relative" ref={notifRef}>
                    <button
                      onClick={() => setNotifOpen(!notifOpen)}
                      className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
                      aria-label="Notifications"
                    >
                      <Bell size={18} className="text-gray-600 dark:text-gray-300" />
                      <span className="notif-dot" />
                    </button>
                    <AnimatePresence>
                      {notifOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.95 }}
                          className="absolute right-0 top-12 card p-4 w-72 z-50"
                        >
                          <p className="text-sm font-bold text-gray-900 dark:text-white mb-3">Notifications</p>
                          <div className="space-y-2">
                            {[
                              { icon: '🍔', text: 'Your order is being prepared', time: '2m ago', color: 'bg-orange-50 dark:bg-orange-900/20' },
                              { icon: '🎁', text: 'New offer: 20% off on Biryani!', time: '1h ago', color: 'bg-green-50 dark:bg-green-900/20' },
                              { icon: '⭐', text: 'Rate your last order', time: '2h ago', color: 'bg-blue-50 dark:bg-blue-900/20' },
                            ].map((n, i) => (
                              <div key={i} className={`flex items-start gap-3 p-2.5 rounded-xl ${n.color}`}>
                                <span className="text-lg">{n.icon}</span>
                                <div>
                                  <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{n.text}</p>
                                  <p className="text-[10px] text-gray-400 mt-0.5">{n.time}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Cart */}
                  {user.role !== 'restaurant' && user.role !== 'driver' && (
                    <Link
                      to="/cart"
                      aria-label={`Shopping cart, ${totalItems} items, ₹${totalPrice}`}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 font-semibold text-sm
                        ${totalItems > 0
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md shadow-orange-500/30 hover:shadow-orange-500/50'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                    >
                      <ShoppingCart size={18} className={totalItems > 0 ? 'fill-current' : ''} />
                      {totalItems > 0 && (
                        <>
                          <motion.span
                            key={totalItems}
                            initial={{ scale: 0.6 }}
                            animate={{ scale: 1 }}
                            className="font-extrabold text-sm"
                          >
                            {totalItems}
                          </motion.span>
                          <span className="hidden lg:inline text-xs font-bold opacity-90">
                            · ₹{totalPrice}
                          </span>
                        </>
                      )}
                    </Link>
                  )}

                  {/* Profile (desktop) */}
                  <div className="hidden sm:flex items-center gap-3 border-l border-gray-200 dark:border-gray-700 pl-3">
                    <Link to="/profile" aria-label="View user profile" className="flex items-center gap-2 group">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center ring-2 ring-orange-200 dark:ring-orange-800 group-hover:ring-orange-400 transition">
                        {user.profileImage ? (
                          <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white font-bold text-sm">{user.firstName?.[0]}</span>
                        )}
                      </div>
                      <div className="hidden lg:block text-left">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white leading-tight group-hover:text-orange-600 transition">
                          {user.firstName}
                        </p>
                        {user.healthProfile?.hasIssues && (
                          <span className="flex items-center text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                            <Sparkles size={9} className="mr-0.5" /> Health Mode
                          </span>
                        )}
                      </div>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Logout"
                      aria-label="Log out"
                    >
                      <LogOut size={16} />
                    </button>
                  </div>

                  {/* Mobile hamburger */}
                  <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="md:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Toggle menu"
                  >
                    {mobileOpen ? <X size={20} /> : <MenuIcon size={20} />}
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/signin" className="btn-ghost py-2 px-4 text-sm hidden sm:inline-flex">Sign in</Link>
                  <Link to="/signup" className="btn-primary py-2 px-4 text-sm">Register</Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Mobile slide-down menu ── */}
        <AnimatePresence>
          {mobileOpen && user && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-200 dark:border-gray-800 overflow-hidden"
            >
              <div className="px-4 py-4 space-y-1 bg-white/95 dark:bg-gray-900/95 backdrop-blur">
                <Link to="/common-foods" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${isActive('/common-foods') ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                  <Utensils size={18} /> Menu
                </Link>
                <Link to="/recommended-foods" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${isActive('/recommended-foods') ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                  <Heart size={18} /> Recommendations
                </Link>
                <Link to="/cart" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${isActive('/cart') ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                  <ShoppingCart size={18} /> Cart {totalItems > 0 && <span className="ml-auto bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{totalItems}</span>}
                </Link>
                <Link to="/orders" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${isActive('/orders') ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                  <Clock size={18} /> Order History
                </Link>
                <Link to="/profile" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${isActive('/profile') ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                  <UserIcon size={18} /> Profile
                </Link>
                {user.role === 'admin' && (
                  <Link to="/admin-dashboard" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${isActive('/admin-dashboard') ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                    <BarChart size={18} /> Admin Dashboard
                  </Link>
                )}
                {user.role === 'restaurant' && (
                  <Link to="/restaurant-dashboard" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${isActive('/restaurant-dashboard') ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                    <ChefHat size={18} /> Kitchen Dashboard
                  </Link>
                )}
                {user.role === 'driver' && (
                  <Link to="/delivery-dashboard" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${isActive('/delivery-dashboard') ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                    <MapPin size={18} /> Delivery Dashboard
                  </Link>
                )}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                  >
                    <LogOut size={18} /> Log out
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── Mobile Bottom Navigation ─────────────────── */}
      {user && (
        <div className="md:hidden fixed bottom-0 left-0 w-full z-50 safe-area-bottom">
          <div className="glass border-t border-gray-200 dark:border-gray-800 px-2 pb-safe pt-2 flex justify-around items-center">
            {[
              { to: '/common-foods', icon: <Home size={22} />, label: 'Home' },
              { to: '/recommended-foods', icon: <Sparkles size={22} />, label: 'For You' },
              { to: '/cart', icon: <ShoppingCart size={22} />, label: 'Cart', badge: totalItems },
              { to: '/orders', icon: <Package size={22} />, label: 'Orders' },
              { to: '/profile', icon: <UserIcon size={22} />, label: 'Profile' },
            ].map(({ to, icon, label, badge }) => (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center py-1 px-2.5 relative transition-colors
                  ${isActive(to) ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                <div className="relative">
                  {icon}
                  {badge != null && badge > 0 && (
                    <motion.span
                      key={badge}
                      initial={{ scale: 0.6 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[9px] font-extrabold min-w-[16px] h-4 flex items-center justify-center rounded-full px-0.5"
                    >
                      {badge}
                    </motion.span>
                  )}
                </div>
                <span className="text-[10px] mt-0.5 font-semibold">{label}</span>
                {isActive(to) && (
                  <motion.span
                    layoutId="bottomNavIndicator"
                    className="absolute -bottom-1 w-1 h-1 rounded-full bg-orange-500"
                  />
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
