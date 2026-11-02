import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useStore';
import { useAuthStore } from '../store/useStore';
import { useCartStore } from '../store/useStore';
import { useNotificationStore } from '../store/useStore';

import { FoodItem, CoffeeCustomization, FoodCategory } from '../types';
import { Coffee, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Heart, Sparkles, Utensils, RefreshCw, ArrowUpDown, Loader, ListFilter, WifiOff, FileText } from 'lucide-react';
import FoodCard from '../components/FoodCard';
import { foodsAPI } from '../services/apiService';
import { useNavigate } from 'react-router-dom';

const ITEMS_PER_PAGE = 12;

const RecommendedMenu: React.FC = () => {
  const { user } = useAuthStore();
  const { cart, addToCart, updateQuantity, removeFromCart } = useCartStore();
  const { showNotification } = useNotificationStore();
  const { recommendations, isLoadingRecommendations, isOfflineMode, refreshRecommendations } = useAppStore();
  const navigate = useNavigate();
  
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [categorySearch, setCategorySearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<'default' | 'asc' | 'desc'>('default');
  const [dbHealthyFoods, setDbHealthyFoods] = useState<FoodItem[]>([]);
  
  // Modals
  const [customizationItem, setCustomizationItem] = useState<FoodItem | null>(null);
  const [customizationOptions, setCustomizationOptions] = useState<CoffeeCustomization>({ sugarSpoons: 1, powderLevel: 'Medium', temperature: 'Hot' });
  const [pendingQuantity, setPendingQuantity] = useState(1);

  const hasHealthIssues = user?.healthProfile.hasIssues;

  // Load real healthy database foods
  useEffect(() => {
    const fetchHealthyFoods = async () => {
      try {
        const data = await foodsAPI.getAll();
        if (Array.isArray(data) && data.length > 0) {
          const healthy = data
            .filter((f: any) => 
              f.isRecommendedForHealth === true ||
              f.category === 'Healthy Combo' ||
              f.category === 'Gym Combo' ||
              (f.category === 'Veg' && (!f.nutritionalInfo?.calories || f.nutritionalInfo.calories <= 450))
            )
            .map((f: any) => ({
              id: f._id?.toString() || f.id,
              _id: f._id?.toString() || f.id,
              name: f.name,
              description: f.description || `Healthy ${f.name} prepared with authentic ingredients.`,
              price: f.price,
              category: (f.category as FoodCategory) || FoodCategory.HEALTHY_COMBO,
              image: f.image || '/images/food/default-food.webp',
              isVegetarian: f.isVegetarian !== undefined ? f.isVegetarian : (f.category === 'Veg' || f.category === 'Healthy Combo'),
              stock: f.stock,
              rating: f.rating || 4.5,
              reviewCount: f.reviewsCount || 24,
              calories: f.nutritionalInfo?.calories || 320,
              protein: f.nutritionalInfo?.protein || 22,
              carbs: f.nutritionalInfo?.carbs || 30,
              fat: f.nutritionalInfo?.fat || 8,
              sugar: f.nutritionalInfo?.sugar || 3,
              sodium: f.nutritionalInfo?.sodium || 220,
              dietaryTags: f.dietaryTags || [],
              healthTags: f.healthTags || [],
              healthScore: 92,
              isRecommendedForHealth: true,
              customizationAvailable: f.category === FoodCategory.COFFEE || f.category === FoodCategory.DRINKS
            }));
          setDbHealthyFoods(healthy);
        }
      } catch (err) {
        console.warn('Failed to load healthy foods from backend API:', err);
      }
    };
    fetchHealthyFoods();
  }, []);

  // Reset page on sort or category change
  useEffect(() => {
      setCurrentPage(1);
  }, [sortOrder, activeCategory, categorySearch, recommendations]);

  const handleAddToCart = async (item: FoodItem, quantity: number, customImage?: string) => {
    const itemToAdd = customImage ? { ...item, image: customImage } : item;

    if (itemToAdd.customizationAvailable) {
      setCustomizationItem(itemToAdd);
      setPendingQuantity(quantity);
      setCustomizationOptions({ sugarSpoons: 1, powderLevel: 'Medium', temperature: 'Hot' });
      return;
    }
    addToCart(itemToAdd, quantity);
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

  const confirmCustomization = () => {
    if (customizationItem) {
      addToCart(customizationItem, pendingQuantity, customizationOptions);
      setCustomizationItem(null);
      setPendingQuantity(1);
    }
  };

  // Determine Source Data - strictly real database items
  const sourceData = (hasHealthIssues && recommendations.length > 0) ? recommendations : dbHealthyFoods;

  // Processing Logic
  let processedItems = sourceData.filter(item => {
    if (activeCategory === 'All') return true;
    return item.category === activeCategory;
  });
  
  if (sortOrder === 'asc') {
    processedItems.sort((a, b) => a.price - b.price);
  } else if (sortOrder === 'desc') {
    processedItems.sort((a, b) => b.price - a.price);
  }

  // Pagination Logic
  const totalPages = Math.ceil(processedItems.length / ITEMS_PER_PAGE);
  const paginatedItems = processedItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div 
      className="min-h-dvh bg-cover md:bg-fixed bg-center"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=2053')" }}
    >
      <div className="min-h-dvh bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-8 pb-20">
      
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 flex justify-center items-center">
           Discover Food
        </h1>
        <p className="text-gray-500">
            {hasHealthIssues 
                ? (isOfflineMode ? "Smart filtered menu (Offline Mode)" : `Personalized AI recommendations based on your verified profile.`)
                : "Curated selection of healthy and nutritious options."}
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 p-1 rounded-full flex w-full sm:w-auto sm:inline-flex shadow-inner">
          <button 
            onClick={() => navigate('/common-foods')}
            className="flex-1 sm:flex-none justify-center px-3 sm:px-6 py-3 text-sm sm:text-base rounded-full flex items-center font-semibold transition-all duration-300 text-gray-500 hover:text-gray-700 hover:bg-gray-200"
          >
            <Utensils size={18} className="mr-2" /> Common Menu 
            <span className="hidden sm:inline ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded-full text-gray-600">1000+</span>
          </button>
          <button 
             className="flex-1 sm:flex-none justify-center px-3 sm:px-6 py-3 text-sm sm:text-base rounded-full flex items-center font-semibold transition-all duration-300 bg-orange-600 shadow text-white"
          >
            <Heart size={18} className="mr-2" /> 
            <span className="sm:hidden">{hasHealthIssues ? 'For You' : 'Healthy'}</span><span className="hidden sm:inline">{hasHealthIssues ? 'My Recommendations' : 'Healthy Options'}</span>
            <span className="ml-2 text-xs bg-orange-500 px-2 py-0.5 rounded-full text-white">
               {hasHealthIssues ? (recommendations.length || 'AI') : `${dbHealthyFoods.length || '600'}+`}
            </span>
          </button>
        </div>
      </div>

      {/* Health Profile Header */}
      {hasHealthIssues && (
        <div className={`mb-8 rounded-2xl p-6 border relative overflow-hidden shadow-sm transition-all duration-500 ${isOfflineMode ? 'bg-amber-50 border-amber-200' : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100'}`}>
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
             <div className="flex-1">
                <h2 className={`text-xl font-bold flex items-center ${isOfflineMode ? 'text-amber-900' : 'text-emerald-900'}`}>
                    {isOfflineMode ? (
                        <span className="bg-amber-600 text-white px-2 py-1 rounded mr-3 text-xs uppercase font-bold tracking-wider flex items-center">
                          <WifiOff size={12} className="mr-1" /> Offline
                        </span>
                    ) : (
                        <span className="bg-emerald-600 text-white px-2 py-1 rounded mr-3 text-xs uppercase font-bold tracking-wider flex items-center">
                          <Sparkles size={12} className="mr-1" /> Gemini AI
                        </span>
                    )}
                    {isOfflineMode ? "Safe Choices" : "Chef AI's Prescription"}
                </h2>
                
                <p className={`${isOfflineMode ? 'text-amber-800' : 'text-emerald-700'} mt-1 text-sm font-medium`}>
                   Verified Condition: {user.healthProfile.diseaseName}
                </p>

                {/* Dietary Memo Display */}
                {user.healthProfile.dietaryMemo && (
                    <div className="mt-3 bg-white/70 p-3 rounded-lg border border-emerald-100 flex items-start gap-2 shadow-sm">
                        <FileText size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-emerald-800 italic font-medium">
                            "{user.healthProfile.dietaryMemo}"
                        </p>
                    </div>
                )}
             </div>
             {!isLoadingRecommendations && (
                <button onClick={refreshRecommendations} className="bg-white/80 hover:bg-white text-emerald-600 p-2 rounded-full shadow-sm transition self-start" title="Refresh Recommendations">
                    <RefreshCw size={18} className={isLoadingRecommendations ? 'animate-spin' : ''} />
                </button>
             )}
           </div>
        </div>
      )}

      {/* Loading State */}
      {isLoadingRecommendations && hasHealthIssues ? (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-fadeIn min-h-[400px]">
                <div className="bg-white p-4 rounded-full shadow-lg mb-6 border border-orange-100 relative">
                    <Loader size={48} className="text-orange-600 animate-spin" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Curating Your Menu...</h3>
                <p className="text-gray-500 mt-2 max-w-md mx-auto">
                    Gemini AI is filtering recipes based on: <strong>{user?.healthProfile.dietaryMemo || user?.healthProfile.diseaseName}</strong>
                </p>
            </div>
      ) : (
        /* Data Grid */
        <>
            {/* Filter Bar */}
            <div className="md:sticky md:top-16 z-40 bg-gray-50/95 backdrop-blur-md shadow-sm border-b border-gray-200 -mx-4 px-4 py-4 mb-6 transition-all">
                <div className="max-w-7xl mx-auto flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 animate-fadeIn">
                        <div className="relative w-full md:w-64 flex-shrink-0">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <ListFilter size={16} className="text-gray-400"/>
                            </div>
                            <input 
                                type="text" 
                                placeholder="Filter categories..." 
                                value={categorySearch}
                                onChange={(e) => setCategorySearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium focus:ring-1 focus:ring-orange-500 outline-none shadow-sm transition-all focus:bg-white"
                            />
                        </div>
                        
                        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                            <span className="text-sm font-bold text-gray-700 whitespace-nowrap">{processedItems.length} Items</span>
                            <div className="relative">
                                <select
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(e.target.value as any)}
                                    className="appearance-none bg-white border border-gray-300 text-gray-700 py-2 pl-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-orange-500 shadow-sm cursor-pointer text-sm"
                                >
                                    <option value="default">Sort by</option>
                                    <option value="asc">Price: Low to High</option>
                                    <option value="desc">Price: High to Low</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                <ArrowUpDown size={14} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex overflow-x-auto space-x-2 pb-1 scrollbar-hide">
                        <button onClick={() => setActiveCategory('All')} className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition border ${activeCategory === 'All' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>All</button>
                        {Object.values(FoodCategory)
                            .filter(cat => cat.toLowerCase().includes(categorySearch.toLowerCase()))
                            .map(cat => (
                            <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition border ${activeCategory === cat ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>{cat}</button>
                        ))}
                    </div>
                </div>
            </div>

            {processedItems.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-xl">
                    <p className="text-gray-500 text-lg mb-2">No items found.</p>
                    <button onClick={() => { setActiveCategory('All'); setCategorySearch(''); }} className="text-orange-600 font-bold hover:underline">
                        View All
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8 animate-fadeIn">
                    {paginatedItems.map(item => (
                      <FoodCard 
                        key={item.id} 
                        item={item} 
                        onAdd={(qty, img) => handleAddToCart(item, qty, img)} 
                        onUpdateQuantity={handleUpdateQuantity}
                        recommended={true} 
                      />
                    ))}
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-10 select-none">
                    <div className="flex items-center gap-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800">
                        {/* First Page Button */}
                        <button 
                            type="button"
                            onClick={() => setCurrentPage(1)} 
                            disabled={currentPage === 1}
                            aria-label="First page"
                            title="Go to First Page"
                            className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-orange-600 hover:text-white hover:border-orange-600 dark:hover:bg-orange-500 dark:hover:text-white dark:hover:border-orange-500 disabled:opacity-30 disabled:hover:bg-gray-100 disabled:hover:text-gray-400 disabled:hover:border-gray-300 dark:disabled:hover:bg-gray-800 dark:disabled:hover:text-gray-600 disabled:cursor-not-allowed transition-all duration-200 active:scale-95 shadow-sm"
                        >
                            <ChevronsLeft size={20} strokeWidth={2.5} className="text-current" />
                        </button>

                        {/* Previous Page Button */}
                        <button 
                            type="button"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                            disabled={currentPage === 1}
                            aria-label="Previous page"
                            title="Go to Previous Page"
                            className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-orange-600 hover:text-white hover:border-orange-600 dark:hover:bg-orange-500 dark:hover:text-white dark:hover:border-orange-500 disabled:opacity-30 disabled:hover:bg-gray-100 disabled:hover:text-gray-400 disabled:hover:border-gray-300 dark:disabled:hover:bg-gray-800 dark:disabled:hover:text-gray-600 disabled:cursor-not-allowed transition-all duration-200 active:scale-95 shadow-sm"
                        >
                            <ChevronLeft size={20} strokeWidth={2.5} className="text-current" />
                        </button>
                        
                        {/* Page Numbers */}
                        <div className="flex items-center gap-1.5 px-2">
                            {Array.from({ length: totalPages }).map((_, idx) => {
                                const pageNum = idx + 1;
                                const isCurrent = currentPage === pageNum;
                                if (totalPages > 6 && Math.abs(currentPage - pageNum) > 2 && pageNum !== 1 && pageNum !== totalPages) {
                                  if (Math.abs(currentPage - pageNum) === 3) {
                                    return <span key={pageNum} className="text-gray-400 text-xs px-0.5">…</span>;
                                  }
                                  return null;
                                }
                                return (
                                  <button
                                    key={pageNum}
                                    type="button"
                                    onClick={() => setCurrentPage(pageNum)}
                                    aria-current={isCurrent ? "page" : undefined}
                                    title={`Go to page ${pageNum}`}
                                    className={`w-9 h-9 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center border ${
                                      isCurrent 
                                        ? 'bg-orange-600 text-white border-orange-600 shadow-md shadow-orange-500/30 scale-105' 
                                        : 'bg-gray-50 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-orange-100 dark:hover:bg-gray-700 hover:border-orange-300'
                                    }`}
                                  >
                                    {pageNum}
                                  </button>
                                );
                            })}
                        </div>

                        {/* Next Page Button */}
                        <button 
                            type="button"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                            disabled={currentPage === totalPages}
                            aria-label="Next page"
                            title="Go to Next Page"
                            className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-orange-600 hover:text-white hover:border-orange-600 dark:hover:bg-orange-500 dark:hover:text-white dark:hover:border-orange-500 disabled:opacity-30 disabled:hover:bg-gray-100 disabled:hover:text-gray-400 disabled:hover:border-gray-300 dark:disabled:hover:bg-gray-800 dark:disabled:hover:text-gray-600 disabled:cursor-not-allowed transition-all duration-200 active:scale-95 shadow-sm"
                        >
                            <ChevronRight size={20} strokeWidth={2.5} className="text-current" />
                        </button>

                        {/* Last Page Button */}
                        <button 
                            type="button"
                            onClick={() => setCurrentPage(totalPages)} 
                            disabled={currentPage === totalPages}
                            aria-label="Last page"
                            title="Go to Last Page"
                            className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-orange-600 hover:text-white hover:border-orange-600 dark:hover:bg-orange-500 dark:hover:text-white dark:hover:border-orange-500 disabled:opacity-30 disabled:hover:bg-gray-100 disabled:hover:text-gray-400 disabled:hover:border-gray-300 dark:disabled:hover:bg-gray-800 dark:disabled:hover:text-gray-600 disabled:cursor-not-allowed transition-all duration-200 active:scale-95 shadow-sm"
                        >
                            <ChevronsRight size={20} strokeWidth={2.5} className="text-current" />
                        </button>
                    </div>

                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white/90 dark:bg-gray-800/90 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                      Page <strong className="text-orange-600 dark:text-orange-400 font-bold">{currentPage}</strong> of <strong>{totalPages}</strong>
                    </span>
                </div>
            )}
        </>
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

        </div>
      </div>
    </div>
  );
};

export default RecommendedMenu;