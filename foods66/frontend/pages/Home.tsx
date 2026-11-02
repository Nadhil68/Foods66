import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChefHat, ArrowRight, Sparkles, Shield, Zap, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const HERO_IMAGES = [
  '/images/food/photo-1563379091339-03b21ab4a4f8.webp',
  '/images/food/photo-1601050690597-df0568f70950.webp',
  '/images/food/photo-1603894584373-5ac82b2ae398.webp',
  '/images/food/photo-1512621776951-a57141f2eefd.webp',
];

const FEATURES = [
  { icon: <Sparkles size={20} className="text-orange-500" />, title: 'AI Recommendations', desc: 'Personalized food choices based on your health profile.' },
  { icon: <Shield size={20} className="text-green-500" />, title: 'Health-Aware', desc: 'We take your dietary restrictions and allergies seriously.' },
  { icon: <Zap size={20} className="text-yellow-500" />, title: 'Fast Delivery', desc: 'Hot and fresh food delivered to your door in 25 minutes.' },
  { icon: <Star size={20} className="text-blue-500" />, title: 'Premium Quality', desc: 'Top-rated restaurants and ingredients you can trust.' },
];

const Home: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [heroIndex, setHeroIndex] = React.useState(0);

  useEffect(() => {
    if (!loading && user) {
      navigate('/common-foods', { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const id = setInterval(() => setHeroIndex(i => (i + 1) % HERO_IMAGES.length), 5000);
    return () => clearInterval(id);
  }, []);

  if (loading || user) return null; // Avoid flashing content while redirecting

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* Hero Section */}
      <div className="relative flex-1 flex flex-col justify-center overflow-hidden min-h-[80vh]">
        <AnimatePresence mode="sync">
          <motion.div
            key={heroIndex}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${HERO_IMAGES[heroIndex]}')` }}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-gray-950" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center"
          >
            <div className="bg-gradient-to-br from-orange-500 to-red-600 p-4 rounded-3xl mb-8 shadow-2xl shadow-orange-500/40">
              <ChefHat size={48} className="text-white" />
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6">
              Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">FOODS66</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mb-12 font-medium">
              The enterprise platform for personalized, health-conscious food ordering and delivery.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link
                to="/signup"
                className="btn-primary py-4 px-8 text-lg flex items-center justify-center gap-2 group w-full sm:w-auto"
              >
                Get Started
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/signin"
                className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 py-4 px-8 rounded-xl font-bold text-lg transition-all text-center w-full sm:w-auto"
              >
                Sign In
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white dark:bg-gray-900 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Why choose Foods66?</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-4 max-w-2xl mx-auto">Experience the next generation of food delivery with our AI-powered platform tailored to your specific dietary needs.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-gray-50 dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow"
              >
                <div className="bg-white dark:bg-gray-900 w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-sm">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
