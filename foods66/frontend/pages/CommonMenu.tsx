import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAppStore } from '../store/useStore';
import { useAuthStore } from '../store/useStore';
import { useCartStore } from '../store/useStore';
import { useNotificationStore } from '../store/useStore';

import { FoodItem, FoodCategory, CoffeeCustomization, DietaryTag } from '../types';
import { checkFoodSafety } from '../services/geminiService';
import { foodsAPI } from '../services/apiService';
import { AlertTriangle, Coffee, X, ChevronLeft, ChevronRight, Utensils, Heart, Search, RotateCcw, ArrowUpDown, Mic, MicOff, Filter, ListFilter, Shield, Clock, Star, ChevronDown, Loader2 } from 'lucide-react';
import FoodCard from '../components/FoodCard';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FixedSizeList as List } from 'react-window';
import { AutoSizer } from 'react-virtualized-auto-sizer';

const Row = React.memo(({ index, style, data }: any) => {
  const { items, columnCount, handleAddToCart, handleUpdateQuantity } = data;
  const startIndex = index * columnCount;
  const rowItems = items.slice(startIndex, startIndex + columnCount);

  return (
    <div style={style} className="flex gap-6 pr-4 pb-6">
      {rowItems.map((item: any) => (
        <div key={item.id} className="h-full" style={{ width: `calc((100% - ${(columnCount - 1) * 24}px) / ${columnCount})` }}>
          <FoodCard 
            item={item} 
            onAdd={(qty: number) => handleAddToCart(item, qty)} 
            onUpdateQuantity={handleUpdateQuantity}
            recommended={false} 
          />
        </div>
      ))}
    </div>
  );
});

const CommonMenu: React.FC = () => {
  const { user } = useAuthStore();
  const { cart, addToCart, updateQuantity, removeFromCart, validateCartWithServer } = useCartStore();
  const { showNotification } = useNotificationStore();
  const navigate = useNavigate();

  // Backend Foods State
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loadingFoods, setLoadingFoods] = useState(true);
  
  // Navigation State
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [activeDietaryTag, setActiveDietaryTag] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'default' | 'asc' | 'desc'>('default');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  
  // Voice Search State
  const [isListening, setIsListening] = useState(false);
  const [browserSupportsSpeech, setBrowserSupportsSpeech] = useState(false);

  // Modals
  const [customizationItem, setCustomizationItem] = useState<FoodItem | null>(null);
  const [customizationOptions, setCustomizationOptions] = useState<CoffeeCustomization>({ sugarSpoons: 1, powderLevel: 'Medium', temperature: 'Hot' });
  const [warningModal, setWarningModal] = useState<{show: boolean, item: FoodItem | null, reason: string}>({ show: false, item: null, reason: '' });
  const [pendingQuantity, setPendingQuantity] = useState(1);

  // Favorites State (Read from LS for filtering)
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    // 1. Fetch live foods from the API
    const fetchFoods = async () => {
      try {
        setLoadingFoods(true);
        const data = await foodsAPI.getAll();
        if (Array.isArray(data) && data.length > 0) {
          const mapped: FoodItem[] = data.map((f: any) => ({
            id: f._id?.toString() || f.id,
            _id: f._id?.toString() || f.id,
            name: f.name,
            description: f.description || `Delicious ${f.name} prepared with authentic ingredients.`,
            price: f.price,
            category: (f.category as FoodCategory) || FoodCategory.VEG,
            image: f.image || '/images/food/default-food.webp',
            isVegetarian: f.isVegetarian !== undefined ? f.isVegetarian : (f.category === 'Veg' || f.category === FoodCategory.HEALTHY_COMBO),
            stock: f.stock,
            rating: f.rating || 4.5,
            reviewCount: f.reviewsCount || 24,
            calories: f.nutritionalInfo?.calories || 350,
            protein: f.nutritionalInfo?.protein || 12,
            carbs: f.nutritionalInfo?.carbs || 45,
            fat: f.nutritionalInfo?.fat || 10,
            sugar: f.nutritionalInfo?.sugar || 4,
            sodium: f.nutritionalInfo?.sodium || 300,
            dietaryTags: f.dietaryTags || [],
            healthTags: f.healthTags || [],
            healthScore: 85,
            isRecommendedForHealth: f.isRecommendedForHealth !== undefined ? f.isRecommendedForHealth : (f.category === 'Veg' || f.category === FoodCategory.HEALTHY_COMBO),
            customizationAvailable: f.category === FoodCategory.COFFEE || f.category === FoodCategory.DRINKS
          }));
          setFoods(mapped);
        }
      } catch (err) {
        console.warn('Failed to load foods from backend API:', err);
      } finally {
        setLoadingFoods(false);
      }
    };

    fetchFoods();
    validateCartWithServer();
    // Check Speech Recognition Support
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        setBrowserSupportsSpeech(true);
    }

    const loadFavorites = () => {
        try {
            const stored = localStorage.getItem('f66_favorites');
            if (stored) {
                const parsed = JSON.parse(stored);
                setFavorites(prev => {
                    if (JSON.stringify(prev) === JSON.stringify(parsed)) {
                        return prev;
                    }
                    return parsed;
                });
            } else {
                setFavorites(prev => (prev.length === 0 ? prev : []));
            }
        } catch (e) {
            console.error("Error loading favorites", e);
        }
    };
    loadFavorites();

    window.addEventListener('favorites-change', loadFavorites);
    window.addEventListener('storage', loadFavorites);
    return () => {
        window.removeEventListener('favorites-change', loadFavorites);
        window.removeEventListener('storage', loadFavorites);
    };
  }, []);



  const handleVoiceSearch = () => {
    if (!browserSupportsSpeech) return;

    if (isListening) {
        setIsListening(false);
        return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        
        setIsListening(true);

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setSearchTerm(transcript);
            setIsListening(false);
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
            if (event.error === 'not-allowed') {
                showNotification('Permission Denied', 'Please allow microphone access to use voice search.', 'error');
            } else {
                showNotification('Voice Search Error', 'Could not understand audio. Please try again.', 'warning');
            }
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    }
  };

  const handleAddToCart = async (item: FoodItem, quantity: number) => {
    // 1. Check for Drink/Item Customization
    if (item.customizationAvailable) {
      setCustomizationItem(item);
      setPendingQuantity(quantity);
      // Reset options to defaults
      setCustomizationOptions({ sugarSpoons: 1, powderLevel: 'Medium', temperature: 'Hot' });
      return;
    }

    // 2. Health Safety Check (AI) - Check if user is in Common Menu and has issues
    if (user?.healthProfile.hasIssues) {
       try {
         const check = await checkFoodSafety(item, user.healthProfile);
         
         if (check.isError) {
             // If AI check failed (network/service), warn via toast but allow add (fail open)
             showNotification(
                 "Safety Check Unavailable", 
                 check.reason || "Network Issue", 
                 "warning"
             );
             addToCart(item, quantity);
             return;
         }

         if (!check.safe) {
             setWarningModal({ show: true, item: item, reason: check.reason || "This might conflict with your condition." });
             setPendingQuantity(quantity);
             return;
         }
       } catch (e) {
         // Fallback if unexpected error occurs
         console.error("Safety check unexpected error", e);
         showNotification("Safety Check Error", "Proceeding without verification.", "error");
         addToCart(item, quantity);
         return;
       }
    }

    addToCart(item, quantity);
  };

  const confirmCustomization = () => {
    if (customizationItem) {
      addToCart(customizationItem, pendingQuantity, customizationOptions);
      setCustomizationItem(null);
      setPendingQuantity(1);
    }
  };

  const confirmUnsafeAdd = () => {
    if (warningModal.item) {
      addToCart(warningModal.item, pendingQuantity);
      setWarningModal({ show: false, item: null, reason: '' });
      setPendingQuantity(1);
    }
  };

  const handleUpdateQuantity = (item: FoodItem, newQuantity: number) => {
    const canonicalId = (item._id || item.id) as string;
    if (newQuantity <= 0) {
      removeFromCart(canonicalId);
      showNotification('Cart Updated', `Removed ${item.name} from cart`, 'info');
    } else {
      updateQuantity(canonicalId, newQuantity);
      showNotification('Cart Updated', `${item.name} quantity: ${newQuantity}`, 'success');
    }
  };

  const handleClearFilters = () => {
    setActiveCategory('All');
    setCategorySearch('');
    setActiveDietaryTag('All');
    setSearchTerm('');
    setSortOrder('default');
    setShowFavoritesOnly(false);
  };

  // Filter & Sort Logic
  const processedItems = useMemo(() => {
    const source = foods;
    let items = source.filter(item => {
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      const matchesDiet = activeDietaryTag === 'All' || (item.dietaryTags && item.dietaryTags.includes(activeDietaryTag as DietaryTag));
      
      const term = searchTerm.toLowerCase();
      const matchesSearch = item.name.toLowerCase().includes(term) || 
                            item.description.toLowerCase().includes(term) ||
                            (item.ingredients && item.ingredients.some(ing => ing.name.toLowerCase().includes(term))) ||
                            (item.dietaryTags && item.dietaryTags.some(tag => tag.toLowerCase().includes(term)));
                            
      const matchesFav = showFavoritesOnly ? favorites.includes(item.id) : true;
      return matchesCategory && matchesDiet && matchesSearch && matchesFav;
    });

    if (sortOrder === 'asc') {
      items.sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'desc') {
      items.sort((a, b) => b.price - a.price);
    }
    return items;
  }, [foods, activeCategory, activeDietaryTag, searchTerm, showFavoritesOnly, favorites, sortOrder]);

  // Phones: the fixed-height virtual grid clips tall cards and traps scrolling, so render a normal
  // page-flow list and reveal more cards as the user scrolls.
  const [isPhone, setIsPhone] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches);
  const [phoneVisibleCount, setPhoneVisibleCount] = useState(12);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const onChange = () => setIsPhone(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => { setPhoneVisibleCount(12); }, [processedItems]);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!isPhone || !el) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) setPhoneVisibleCount(c => c + 12);
    }, { rootMargin: '600px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [isPhone, phoneVisibleCount, processedItems.length]);

  // Calculate Virtualization Info
  const getColumnCount = (width: number) => {
    if (width >= 1280) return 4;
    if (width >= 1024) return 3;
    if (width >= 768) return 2;
    return 1;
  };

  return (
    <div 
      className="min-h-dvh bg-cover md:bg-fixed bg-center transition-colors duration-500"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=2070')" }}
    >
      <div className="min-h-dvh bg-white/80 dark:bg-gray-950/85 backdrop-blur-xl transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 py-8 pb-20">
      
      {/* Hero Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-12 text-center py-10 bg-gradient-to-r from-orange-600/10 to-red-600/10 dark:from-orange-500/20 dark:to-red-500/20 rounded-3xl border border-orange-200/50 dark:border-orange-500/20 shadow-sm relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-white/40 dark:bg-gray-900/40 backdrop-blur-[2px]"></div>
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
            What are you <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400">craving</span> today?
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-lg">
              Explore our extensive menu of over 1000+ dishes from across India, curated for your taste and health.
          </p>
        </div>
      </motion.div>

      {/* Trust Badge Strip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex flex-wrap justify-center gap-3 mb-10"
      >
        <span className="trust-badge">
          <Clock size={14} className="text-orange-500" /> Avg. delivery: 35–45 min
        </span>
        <span className="trust-badge">
          <Star size={14} className="text-amber-500 fill-amber-500" /> 4.5★ from 12k+ reviews
        </span>
        <span className="trust-badge">
          <Shield size={14} className="text-green-500" /> Secure payment
        </span>
        <span className="trust-badge">
          <Heart size={14} className="text-teal-500" /> Contactless delivery
        </span>
      </motion.div>

      {/* Tab Switcher (Navigation) */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-full flex w-full sm:w-auto sm:inline-flex shadow-inner">
          <button 
            className="flex-1 sm:flex-none justify-center px-3 sm:px-6 py-3 text-sm sm:text-base rounded-full flex items-center font-semibold transition-all duration-300 bg-white dark:bg-gray-700 shadow text-orange-600 dark:text-orange-400 ring-1 ring-orange-100 dark:ring-gray-600"
          >
            <Utensils size={18} className="mr-2" /> Common Menu 
            <span className="hidden sm:inline ml-2 text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-300">1000+</span>
          </button>
          <button 
             onClick={() => navigate('/recommended-foods')}
             className="flex-1 sm:flex-none justify-center px-3 sm:px-6 py-3 text-sm sm:text-base rounded-full flex items-center font-semibold transition-all duration-300 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <Heart size={18} className="mr-2" /> 
            <span className="sm:hidden">{user?.healthProfile.hasIssues ? 'For You' : 'Healthy'}</span><span className="hidden sm:inline">{user?.healthProfile.hasIssues ? 'My Recommendations' : 'Healthy Options'}</span>
            <span className="hidden sm:inline ml-2 text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-300">600+</span>
          </button>
        </div>
      </div>

      {/* STICKY FILTER BAR */}
      <div className="md:sticky md:top-16 z-40 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-800 -mx-4 px-4 py-4 mb-6 transition-all">
        <div className="max-w-7xl mx-auto space-y-4">
            
            {/* Top Row: Search and Dropdowns */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                {/* Search Input with Voice */}
                <div className="relative w-full md:w-80 group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className={`transition-colors ${isListening ? 'text-orange-500' : 'text-gray-400'}`} size={20} />
                </div>
                <input 
                    type="text"
                    placeholder={isListening ? "Listening..." : "Search dishes, ingredients..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    aria-label="Search dishes, ingredients, or dietary tags"
                    title="Press Enter to search"
                    className={`pl-10 pr-12 py-2.5 w-full rounded-full border outline-none transition shadow-sm ${
                    isListening 
                        ? 'border-orange-500 ring-2 ring-orange-100 bg-orange-50 text-orange-900 placeholder-orange-400' 
                        : 'border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent'
                    }`}
                />
                
                {browserSupportsSpeech && (
                    <button 
                        onClick={handleVoiceSearch}
                        className={`absolute inset-y-0 right-0 px-4 flex items-center justify-center transition-all duration-200 rounded-r-full ${
                            isListening 
                            ? 'text-red-500 bg-red-50 hover:bg-red-100' 
                            : 'text-gray-400 hover:text-orange-600 hover:bg-gray-50'
                        }`}
                        title={isListening ? "Stop Listening" : "Voice Search"}
                    >
                        {isListening ? (
                            <div className="relative flex items-center justify-center">
                            <MicOff size={20} className="relative z-10" />
                            </div>
                        ) : (
                            <Mic size={20} />
                        )}
                    </button>
                )}
                </div>
                
                <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 items-center">
                    {/* Favorites Filter */}
                    <button
                        onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                        aria-pressed={showFavoritesOnly}
                        className={`flex items-center justify-center px-4 py-2.5 rounded-full font-medium transition whitespace-nowrap border shadow-sm ${showFavoritesOnly ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                    >
                        <Heart size={16} className={`mr-2 ${showFavoritesOnly ? 'fill-current' : ''}`} /> Favorites
                    </button>

                    {/* More Filters Toggle (mobile) */}
                    <button
                        onClick={() => setShowMoreFilters(!showMoreFilters)}
                        aria-expanded={showMoreFilters}
                        className="md:hidden flex items-center justify-center px-4 py-2.5 rounded-full font-medium transition whitespace-nowrap border shadow-sm bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                    >
                        <Filter size={16} className="mr-2" /> Filters
                        <ChevronDown size={14} className={`ml-1 transition-transform ${showMoreFilters ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dietary Filter — visible on desktop, collapsible on mobile */}
                    <div className={`${showMoreFilters ? 'flex' : 'hidden'} md:flex gap-3 items-center`}>
                    <div className="relative flex-grow md:flex-grow-0 min-w-[140px]">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                        <Filter size={14} />
                        </div>
                        <select
                            value={activeDietaryTag}
                            onChange={(e) => setActiveDietaryTag(e.target.value)}
                            aria-label="Filter by dietary preference"
                            className="w-full appearance-none bg-white border border-gray-300 text-gray-700 py-2.5 pl-9 pr-8 rounded-full leading-tight focus:outline-none focus:bg-white focus:border-orange-500 shadow-sm cursor-pointer text-sm"
                        >
                            <option value="All">Dietary (All)</option>
                            <option value="Vegan">Vegan</option>
                            <option value="Gluten-Free">Gluten-Free</option>
                            <option value="High-Protein">High-Protein</option>
                            <option value="Low-Carb">Low-Carb</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                        <ChevronRight size={14} className="rotate-90" />
                        </div>
                    </div>

                    {/* Sort Dropdown */}
                    <div className="relative flex-grow md:flex-grow-0 min-w-[150px]">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                        <ArrowUpDown size={14} />
                        </div>
                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value as any)}
                            aria-label="Sort items by price"
                            className="w-full appearance-none bg-white border border-gray-300 text-gray-700 py-2.5 pl-9 pr-8 rounded-full leading-tight focus:outline-none focus:bg-white focus:border-orange-500 shadow-sm cursor-pointer text-sm"
                        >
                            <option value="default">Relevance</option>
                            <option value="asc">Price: Low to High</option>
                            <option value="desc">Price: High to Low</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                        <ChevronRight size={14} className="rotate-90" />
                        </div>
                    </div>
                    </div>

                    {/* Clear Filters Button */}
                    {(activeCategory !== 'All' || activeDietaryTag !== 'All' || searchTerm || sortOrder !== 'default' || showFavoritesOnly || categorySearch) && (
                        <button 
                        onClick={handleClearFilters}
                        className="flex items-center justify-center text-red-500 hover:text-red-700 font-medium transition px-4 py-2 rounded-full hover:bg-red-50 bg-white border border-red-100 shadow-sm whitespace-nowrap"
                        >
                        <RotateCcw size={16} className="md:mr-2" /> <span className="hidden md:inline">Reset</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Bottom Row: Categories */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
                 {/* Category Filter Input */}
                 <div className="relative w-full md:w-64 flex-shrink-0">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <ListFilter size={16} className="text-gray-400"/>
                    </div>
                    <input 
                        type="text" 
                        placeholder="Filter categories..." 
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium focus:ring-1 focus:ring-orange-500 outline-none shadow-sm transition-all focus:bg-white"
                    />
                </div>

                <div className="flex overflow-x-auto space-x-2 pb-1 scrollbar-hide w-full">
                    <button 
                        onClick={() => setActiveCategory('All')} 
                        aria-pressed={activeCategory === 'All'}
                        className={`px-5 py-2 rounded-full whitespace-nowrap transition border text-sm font-medium ${activeCategory === 'All' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                    >
                        All <span className="text-xs opacity-70 ml-1">({foods.length})</span>
                    </button>
                    {Object.values(FoodCategory)
                        .filter(cat => cat.toLowerCase().includes(categorySearch.toLowerCase()))
                        .map(cat => {
                        const count = foods.filter(item => item.category === cat).length;
                        return (
                        <button 
                            key={cat} 
                            onClick={() => setActiveCategory(cat)} 
                            aria-pressed={activeCategory === cat}
                            className={`px-5 py-2 rounded-full whitespace-nowrap transition border text-sm font-medium ${activeCategory === cat ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                        >
                            {cat} <span className="text-xs opacity-70 ml-1">({count})</span>
                        </button>
                        );
                    })}
                </div>
            </div>
        </div>
      </div>

      {/* Main Grid with Virtualization */}
      <div className="mb-4 flex justify-between items-center">
         <h2 className="text-xl font-bold text-gray-700">
            Menu Items ({processedItems.length})
         </h2>
      </div>

      {processedItems.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <Search size={40} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-2 font-semibold">No results found</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">Try ‘Paneer’, ‘High-protein’ or ‘Breakfast’</p>
              <button onClick={handleClearFilters} className="bg-orange-600 text-white px-6 py-2.5 rounded-full font-bold hover:bg-orange-700 transition shadow-sm">
                Clear All Filters
              </button>
          </div>
      ) : isPhone ? (
          <div className="space-y-6">
            {processedItems.slice(0, phoneVisibleCount).map((item: any) => (
              <FoodCard
                key={item.id}
                item={item}
                onAdd={(qty: number) => handleAddToCart(item, qty)}
                onUpdateQuantity={handleUpdateQuantity}
                recommended={false}
              />
            ))}
            {phoneVisibleCount < processedItems.length && (
              <div ref={loadMoreRef} className="flex justify-center py-6 text-orange-500" aria-label="Loading more dishes">
                <Loader2 size={24} className="animate-spin" />
              </div>
            )}
          </div>
      ) : (
          <div style={{ height: 'calc(100vh - 200px)', minHeight: '680px', width: '100%' }}>
            <AutoSizer renderProp={({ height, width }) => {
                const columnCount = getColumnCount(width || 1000);
                const rowCount = Math.ceil(processedItems.length / columnCount);
                // 490px accommodates the full FoodCard (image, info, tags, nutrition) + QuantitySelector & Add to Cart footer + pb-6 gap
                return (
                  <List
                    height={height || 680}
                    itemCount={rowCount}
                    itemSize={490} 
                    width={width || 1000}
                    itemData={{ items: processedItems, columnCount, handleAddToCart, handleUpdateQuantity, cart }}
                  >
                    {Row}
                  </List>
                );
              }} />
          </div>
      )}

      {/* Customization Modal */}
      {customizationItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[90dvh] overflow-y-auto animate-scaleIn">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-xl font-bold flex items-center"><Coffee className="mr-2 text-brown-600" /> Customize {customizationItem.name}</h3>
               <button onClick={() => setCustomizationItem(null)}><X size={24} className="text-gray-400 hover:text-gray-600"/></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sugar (Spoons)</label>
                <div className="flex items-center space-x-4">
                  <button onClick={() => setCustomizationOptions(p => ({...p, sugarSpoons: Math.max(0, p.sugarSpoons - 0.5)}))} className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-lg">-</button>
                  <span className="font-mono text-lg">{customizationOptions.sugarSpoons}</span>
                  <button onClick={() => setCustomizationOptions(p => ({...p, sugarSpoons: p.sugarSpoons + 0.5}))} className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-lg">+</button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Powder Level / Strength</label>
                <div className="flex space-x-2">
                  {['Mild', 'Medium', 'Strong'].map(l => (
                    <button key={l} onClick={() => setCustomizationOptions(p => ({...p, powderLevel: l as any}))} 
                    className={`flex-1 py-2 rounded-lg border ${customizationOptions.powderLevel === l ? 'bg-amber-700 text-white border-amber-700' : 'text-gray-600 border-gray-300'}`}>{l}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
                <div className="flex space-x-2">
                  {['Hot', 'Cold', 'Lukewarm'].map(t => (
                     <button key={t} onClick={() => setCustomizationOptions(p => ({...p, temperature: t as any}))} 
                     className={`flex-1 py-2 rounded-lg border ${customizationOptions.temperature === t ? 'bg-red-500 text-white border-red-500' : 'text-gray-600 border-gray-300'}`}>{t}</button>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={confirmCustomization} className="w-full mt-6 bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 shadow-md">Add to Cart ({pendingQuantity})</button>
          </div>
        </div>
      )}

      {/* Health Warning Modal */}
      {warningModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm max-h-[90dvh] overflow-y-auto border-l-4 border-amber-500">
             <div className="flex items-start mb-4">
                <AlertTriangle size={32} className="text-amber-500 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Health Alert</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Based on your condition ({user?.healthProfile.diseaseName}), this item might be unsuitable.
                  </p>
                  <div className="mt-2 bg-amber-50 p-2 rounded text-xs font-medium text-amber-800">
                    Reason: {warningModal.reason}
                  </div>
                </div>
             </div>
             <div className="flex gap-3">
               <button onClick={() => setWarningModal({show:false, item:null, reason:''})} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50">Cancel</button>
               <button onClick={confirmUnsafeAdd} className="flex-1 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600">Order Anyway ({pendingQuantity})</button>
             </div>
          </div>
        </div>
      )}

        </div>
      </div>
    </div>
  );
};

export default CommonMenu;