import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Eye, EyeOff, ChefHat, Sparkles, Star, Shield, Zap } from 'lucide-react';

const HERO_IMAGES = [
  '/images/food/photo-1563379091339-03b21ab4a4f8.webp',
  '/images/food/photo-1601050690597-df0568f70950.webp',
  '/images/food/photo-1603894584373-5ac82b2ae398.webp',
  '/images/food/photo-1512621776951-a57141f2eefd.webp',
];

const FEATURES = [
  { icon: <Sparkles size={16} />, label: 'AI-Powered Recommendations' },
  { icon: <Shield size={16} />, label: 'Health-Aware Ordering' },
  { icon: <Zap size={16} />, label: '25-Minute Delivery' },
  { icon: <Star size={16} />, label: '1000+ Dishes' },
];

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);

  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Read state from navigate (e.g. from ProtectedRoute or Register success)
  const state = location.state as { registered?: boolean; email?: string; from?: { pathname: string } } | null;
  const from = state?.from?.pathname || '/menu';

  useEffect(() => {
    if (state?.email) setEmail(state.email);
    if (user) navigate(from, { replace: true });
  }, [state, user, navigate, from]);

  // Rotate hero images
  useEffect(() => {
    const id = setInterval(() => setHeroIndex(i => (i + 1) % HERO_IMAGES.length), 4000);
    return () => clearInterval(id);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await login({ email, password });
      // Navigation is handled by the useEffect above when user state updates
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please check your email and password.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left: Hero Panel (desktop) ─────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Rotating background image */}
        <AnimatePresence mode="sync">
          <motion.div
            key={heroIndex}
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${HERO_IMAGES[heroIndex]}')` }}
          />
        </AnimatePresence>

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/90 via-red-900/75 to-black/80" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-white/15 backdrop-blur p-3 rounded-2xl border border-white/20">
              <ChefHat size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-wide">FOODS66</h1>
              <p className="text-orange-300 text-xs font-medium">Enterprise Food Platform</p>
            </div>
          </div>

          {/* Hero copy */}
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl font-extrabold text-white leading-tight mb-4"
            >
              Delicious food,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
                made personal.
              </span>
            </motion.h2>
            <p className="text-gray-300 text-lg mb-8 max-w-sm leading-relaxed">
              AI-powered recommendations tailored to your taste, health, and lifestyle.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-3">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-medium px-3 py-2 rounded-full"
                >
                  <span className="text-orange-300">{f.icon}</span>
                  {f.label}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Image dots */}
          <div className="flex gap-2">
            {HERO_IMAGES.map((_, i) => (
              <button
                key={i}
                onClick={() => setHeroIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === heroIndex ? 'w-6 bg-orange-400' : 'w-1.5 bg-white/40'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: Login Form ───────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-950 relative overflow-hidden">
        {/* Background food image (mobile only) */}
        <div
          className="absolute inset-0 bg-cover bg-center lg:hidden"
          style={{ backgroundImage: `url('${HERO_IMAGES[heroIndex]}')` }}
        />
        <div className="absolute inset-0 bg-gray-950/75 lg:hidden backdrop-blur-sm" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="bg-orange-600 p-2.5 rounded-xl">
              <ChefHat size={22} className="text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-white">FOODS66</h1>
          </div>

          <div className="glass rounded-3xl p-8 lg:shadow-2xl">
            <div className="mb-8">
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                Welcome back 👋
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                Sign in to continue your food journey
              </p>
            </div>

            {/* Registration success banner */}
            <AnimatePresence>
              {state?.registered && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-6 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-xl p-4 flex items-center gap-3"
                >
                  <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-green-800 dark:text-green-300">Registration Successful!</p>
                    <p className="text-xs text-green-700 dark:text-green-400">Your profile is ready. Sign in below.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form className="space-y-5" onSubmit={handleLogin}>
              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-red-600 text-sm bg-red-50 dark:bg-red-900/30 p-3 rounded-xl border border-red-200 dark:border-red-700 text-center font-medium"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="input"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="input pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 px-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-3 text-base relative overflow-hidden"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </span>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
              Don't have an account?{' '}
              <Link to="/signup" className="font-semibold text-orange-600 hover:text-orange-500 transition-colors">
                Create one free
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
