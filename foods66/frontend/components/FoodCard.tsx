import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FoodItem, FoodCategory } from '../types';
import { useAuthStore, useCartStore, useNotificationStore } from '../store/useStore';
import {
  Info, Flame, Dumbbell, Wheat, Heart, AlertTriangle, Star,
  Loader, Check, Award, Sparkles, Dot, Bot, Clock,
  Tag, Leaf, Zap, X, ShoppingCart, Plus, Minus, Trash2
} from 'lucide-react';
import { PLACEHOLDER_IMAGE, getRelevantFoodImage } from '../constants';
import { getImageUrl } from '../services/apiClient';
import QuantitySelector from './QuantitySelector';
import { generateFoodImage } from '../services/geminiService';
import { isFoodUnhealthyForUser } from '../utils/healthLogic';
import { CommonFoodsAlerts } from './CommonFoodsAlerts';

interface FoodCardProps {
  item: FoodItem;
  onAdd: (quantity: number, customImage?: string) => Promise<void> | void;
  onUpdateQuantity?: (item: FoodItem, newQuantity: number) => void;
  recommended?: boolean;
}

/* ─── Skeleton ───────────────────────────────────────────────── */
export const FoodCardSkeleton: React.FC = () => (
  <div className="card overflow-hidden flex flex-col h-full">
    <div className="skeleton h-48 w-full" />
    <div className="p-4 space-y-3 flex-1">
      <div className="skeleton h-5 w-3/4" />
      <div className="skeleton h-3 w-1/2" />
      <div className="skeleton h-3 w-full" />
      <div className="skeleton h-3 w-5/6" />
      <div className="mt-auto flex gap-2">
        <div className="skeleton h-9 w-1/3 rounded-xl" />
        <div className="skeleton h-9 flex-1 rounded-xl" />
      </div>
    </div>
  </div>
);

/* ─── FoodCard ───────────────────────────────────────────────── */
const FoodCard: React.FC<FoodCardProps> = ({ item, onAdd, onUpdateQuantity, recommended }) => {
  const { user } = useAuthStore();
  const cartStore = useCartStore?.() || ({} as any);
  const cart = cartStore.cart || [];
  const updateQuantity = cartStore.updateQuantity;
  const removeFromCart = cartStore.removeFromCart;
  const { showNotification } = useNotificationStore();
  const [quantity, setQuantity] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const resolvedImage = getImageUrl(item.image) || getRelevantFoodImage(item.name);
  const [imageSrc, setImageSrc] = useState(resolvedImage || PLACEHOLDER_IMAGE);
  const [imgError, setImgError] = useState(false);

  const itemId = (item._id || item.id) as string;
  const inCartItems = (cart || []).filter(c => (c._id || c.id) === itemId || c.id === itemId || c._id === itemId);
  const inCartCount = inCartItems.reduce((acc, c) => acc + c.quantity, 0);

  const handleIncrease = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newQty = inCartCount + 1;
    if (onUpdateQuantity) {
      onUpdateQuantity(item, newQty);
    } else if (updateQuantity) {
      updateQuantity(itemId, newQty);
      showNotification('Cart Updated', `Added another ${item.name} (${newQty} in cart)`, 'success');
    }
  };

  const handleDecrease = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newQty = inCartCount - 1;
    if (onUpdateQuantity) {
      onUpdateQuantity(item, newQty);
    } else {
      if (newQty <= 0) {
        if (removeFromCart) {
          removeFromCart(itemId);
        } else if (updateQuantity) {
          updateQuantity(itemId, 0);
        }
        showNotification('Cart Updated', `Removed ${item.name} from cart`, 'info');
      } else if (updateQuantity) {
        updateQuantity(itemId, newQty);
        showNotification('Cart Updated', `Decreased ${item.name} to ${newQty}`, 'info');
      }
    }
  };

  // Sync image when item changes — resolve uploads to full backend URL, fall back to keyword-matched image
  useEffect(() => {
    const resolved = getImageUrl(item.image) || getRelevantFoodImage(item.name);
    setImageSrc(resolved || PLACEHOLDER_IMAGE);
    setImgError(false);
    setIsExpanded(false);
    setQuantity(1);
  }, [item.id, item.image]);

  const handleImageError = useCallback(() => {
    if (!imgError) {
      setImgError(true);
      // First try the smart keyword-matched image from FOOD_IMAGE_MAP
      const smartFallback = getRelevantFoodImage(item.name);
      if (smartFallback !== PLACEHOLDER_IMAGE) {
        setImageSrc(smartFallback);
      } else {
        setImageSrc(PLACEHOLDER_IMAGE);
      }
    }
  }, [imgError, item.name]);

  // Favorites
  const [isFavorite, setIsFavorite] = useState(() => {
    try {
      const stored = localStorage.getItem('f66_favorites');
      const favs = stored ? JSON.parse(stored) : [];
      return Array.isArray(favs) && favs.includes(item.id);
    } catch { return false; }
  });

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const stored = localStorage.getItem('f66_favorites');
      const favs: string[] = stored ? JSON.parse(stored) : [];
      const updated = isFavorite ? favs.filter(id => id !== item.id) : [...favs, item.id];
      localStorage.setItem('f66_favorites', JSON.stringify(updated));
      window.dispatchEvent(new Event('favorites-change'));
      setIsFavorite(!isFavorite);
      if (!isFavorite) showNotification('Saved', `${item.name} added to favourites`, 'success');
    } catch { /* ignore */ }
  };

  // Health safety reason
  const evaluation = useMemo(() => {
    if (!user || recommended) return { isUnhealthy: false };
    return isFoodUnhealthyForUser(item, user.healthProfile);
  }, [user, item, recommended]);

  const isPotentiallyUnsafe = evaluation.isUnhealthy;
  const safetyReason = evaluation.reason;

  // AI image generation
  const handleGenerateImage = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (isGeneratingImg) return;
    setIsGeneratingImg(true);
    showNotification('Visualizing', `Generating AI image for ${item.name}…`, 'info');
    try {
      const base64 = await generateFoodImage(item.name);
      if (base64) { setImageSrc(base64); showNotification('Done', 'Image generated!', 'success'); }
      else showNotification('Error', 'Generation failed.', 'error');
    } catch { showNotification('Error', 'Generation failed.', 'error'); }
    finally { setIsGeneratingImg(false); }
  };

  const handleAskAI = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('ask-ai', { detail: { query: `Is ${item.name} safe for my condition?` } }));
  };

  const [showWarningModal, setShowWarningModal] = useState(false);

  const handleAddClick = async (e?: React.MouseEvent | any, bypassWarning = false) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    
    if (isSuccess || isAdding) return;

    if (isPotentiallyUnsafe && !bypassWarning) {
      setShowWarningModal(true);
      return;
    }

    setIsAdding(true);
    setShowWarningModal(false);
    try {
      const customImage = imageSrc !== item.image && imageSrc !== PLACEHOLDER_IMAGE ? imageSrc : undefined;
      await onAdd(quantity, customImage);
      setIsSuccess(true);
      setQuantity(1);
      setTimeout(() => setIsSuccess(false), 2000);
    } catch { /* handled upstream */ }
    finally { setIsAdding(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      role="article"
      aria-label={`${item.name}, ₹${item.price}${item.isVegetarian ? ', vegetarian' : ', non-vegetarian'}${isPotentiallyUnsafe ? ', health caution' : ''}`}
      className={`card overflow-hidden flex flex-col h-full relative group
        hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300
        ${recommended ? 'ring-1 ring-teal-200 dark:ring-teal-700' : ''}
        ${isPotentiallyUnsafe ? 'ring-1 ring-red-200 dark:ring-red-800' : ''}
      `}
    >
      {/* ── Image ─── */}
      <div className="relative h-44 bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0">
        {isGeneratingImg && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <Loader size={24} className="text-white animate-spin" />
          </div>
        )}
        <picture>
          {imageSrc.includes('.webp') && (
            <source srcSet={imageSrc} type="image/webp" />
          )}
          <img
            src={imageSrc}
            alt={item.name}
            onError={handleImageError}
            loading="lazy"
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105
              ${isPotentiallyUnsafe ? 'grayscale-[.4]' : ''}`}
          />
        </picture>

        {/* Overlay badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {recommended && (
            <span className="badge bg-teal-500/90 backdrop-blur text-white text-[9px] gap-1">
              <Award size={9} /> Recommended
            </span>
          )}
          {isPotentiallyUnsafe && (
            <span className="badge bg-red-500/90 backdrop-blur text-white text-[9px] gap-1">
              <AlertTriangle size={9} /> Caution
            </span>
          )}
          {item.isDietitianRecommended && (
            <span className="badge bg-emerald-500/90 backdrop-blur text-white text-[9px] gap-1">
              <Leaf size={9} /> Dietitian Pick
            </span>
          )}
        </div>

        {/* Ask AI button */}
        <button
          onClick={handleAskAI}
          className="absolute top-2.5 right-2.5 bg-white/90 dark:bg-gray-900/90 backdrop-blur p-2.5 sm:p-1.5 rounded-full shadow-md text-orange-600 hover:bg-orange-600 hover:text-white transition-all transform hover:scale-110 z-10 border border-orange-100 dark:border-orange-900"
          title="Ask Chef AI about this dish"
        >
          <Bot size={15} />
        </button>

        {/* Discount badge */}
        {item.originalPrice && item.originalPrice > item.price && (
          <div className="absolute bottom-2.5 left-2.5 badge bg-red-500 text-white text-[9px] gap-1">
            <Tag size={9} />
            {Math.round((1 - item.price / item.originalPrice) * 100)}% OFF
          </div>
        )}
      </div>

      {/* ── Content ─── */}
      <div className="p-3.5 flex flex-col flex-grow">

        {/* Title row */}
        <div className="flex justify-between items-start gap-2 mb-1.5">
          <div className="flex-1 min-w-0">
            <h3 className={`font-bold text-base leading-tight truncate transition-colors
              ${isPotentiallyUnsafe ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400'}`}>
              {item.name}
            </h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <button onClick={toggleFavorite} aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'} aria-pressed={isFavorite} className="p-2.5 -m-2 sm:p-0.5 sm:m-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                <Heart size={14} className={`transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-300 hover:text-red-400'}`} />
              </button>
              {item.rating && (
                <div className="flex items-center text-[11px] font-bold text-amber-500">
                  <Star size={10} className="fill-current mr-0.5" /> {item.rating}
                  {item.reviewCount && <span className="text-gray-400 font-normal ml-1">({item.reviewCount})</span>}
                </div>
              )}
              {inCartCount > 0 && (
                <span className="badge bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 text-[10px] font-bold">
                  {inCartCount} in cart
                </span>
              )}
              {item.restaurantName && (
                <span className="text-[10px] text-gray-400 truncate ml-auto">{item.restaurantName}</span>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="font-extrabold text-orange-600 dark:text-orange-400 text-lg">₹{item.price}</span>
            {item.originalPrice && item.originalPrice > item.price && (
              <span className="block text-[11px] text-gray-400 line-through">₹{item.originalPrice}</span>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          <span className={`badge border text-[9px] font-bold uppercase
            ${item.isVegetarian
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'}`}>
            <Dot size={10} strokeWidth={8} className={item.isVegetarian ? 'text-green-600' : 'text-red-600'} />
            {item.isVegetarian ? 'Veg' : 'Non-Veg'}
          </span>
          {item.dietaryTags?.slice(0, 2).map(tag => (
            <span key={tag} className="badge bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800 text-[9px] font-bold">
              {tag}
            </span>
          ))}
          {item.isCookedToOrder && (
            <span className="badge bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-800 text-[9px]">
              <Flame size={9} className="mr-0.5" /> Fresh
            </span>
          )}
        </div>

        {/* Safety warning */}
        {user && <CommonFoodsAlerts item={item} profile={user.healthProfile} />}

        {/* Description */}
        <p className="text-gray-500 dark:text-gray-400 text-xs line-clamp-2 mb-2.5 leading-relaxed flex-grow">
          {item.description}
        </p>

        {/* Quick nutrition strip */}
        {(item.calories || item.protein || item.carbs) && (
          <div className="flex gap-2 mb-2.5">
            {item.calories && (
              <div className="flex items-center gap-1 text-[11px] font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-lg">
                <Flame size={10} className="text-orange-400" /> {item.calories} kcal
              </div>
            )}
            {item.protein && (
              <div className="flex items-center gap-1 text-[11px] font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-lg">
                <Dumbbell size={10} className="text-blue-400" /> {item.protein}g prot
              </div>
            )}
            {item.carbs && (
              <div className="flex items-center gap-1 text-[11px] font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-lg">
                <Wheat size={10} className="text-yellow-400" /> {item.carbs}g carbs
              </div>
            )}
          </div>
        )}

        {/* Info/Generate row */}
        <div className="flex justify-between items-center mb-3 gap-2">
          <button
            onClick={handleGenerateImage}
            disabled={isGeneratingImg}
            aria-label={`Visualize ${item.name} with AI`}
            title="See AI-generated image of this dish"
            className="flex-1 inline-flex items-center justify-center py-2.5 sm:py-1.5 px-2.5 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-800 disabled:opacity-50 transition"
          >
            <Sparkles size={12} className="mr-1" />
            {isGeneratingImg ? 'Generating…' : 'Visualize'}
          </button>
          <button
            onClick={e => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            aria-label={`${isExpanded ? 'Hide' : 'View'} nutrition facts for ${item.name}`}
            aria-expanded={isExpanded}
            title="View full nutrition breakdown"
            className="flex-1 inline-flex items-center justify-center py-2.5 sm:py-1.5 px-2.5 rounded-xl text-xs font-semibold bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/40 border border-orange-100 dark:border-orange-800 transition"
          >
            <Info size={12} className="mr-1" />
            {isExpanded ? 'Hide' : 'Nutrition'}
          </button>
        </div>

        {/* In-cart active controller or Add to cart footer */}
        {inCartCount > 0 ? (
          <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/40 border border-orange-200 dark:border-orange-800/80 rounded-xl p-1 shadow-xs">
              <button
                type="button"
                onClick={handleDecrease}
                aria-label={`Decrease ${item.name} quantity in cart`}
                title={inCartCount === 1 ? `Remove ${item.name} from cart` : `Decrease ${item.name} quantity`}
                className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 hover:bg-orange-600 hover:text-white dark:hover:bg-orange-500 dark:hover:text-white shadow-xs transition-all duration-200 active:scale-90 border border-orange-100 dark:border-orange-900/60"
              >
                {inCartCount === 1 ? (
                  <Trash2 size={14} className="text-red-500 hover:text-white transition-colors" />
                ) : (
                  <Minus size={14} strokeWidth={2.5} />
                )}
              </button>

              <div className="flex flex-col items-center justify-center px-2 select-none">
                <span className="font-extrabold text-xs text-gray-900 dark:text-white flex items-center gap-1 font-mono tracking-tight" aria-live="polite">
                  <ShoppingCart size={13} className="text-orange-600 dark:text-orange-400" />
                  {inCartCount} in Cart
                </span>
                <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">
                  ₹{inCartCount * item.price}
                </span>
              </div>

              <button
                type="button"
                onClick={handleIncrease}
                aria-label={`Increase ${item.name} quantity in cart`}
                title={`Add another ${item.name}`}
                className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-orange-600 hover:bg-orange-700 text-white shadow-xs transition-all duration-200 active:scale-90"
              >
                <Plus size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
            <QuantitySelector
              quantity={quantity}
              onIncrease={() => setQuantity(q => q + 1)}
              onDecrease={() => setQuantity(q => Math.max(1, q - 1))}
              disabled={isAdding}
              className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 h-9"
              size="sm"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleAddClick(e);
              }}
              disabled={isAdding || isSuccess}
              aria-label={`Add ${item.name} to cart, ₹${item.price}`}
              className={`flex-1 flex items-center justify-center h-9 px-3 rounded-xl text-sm font-bold transition-all duration-300 shadow-sm active:scale-95
                ${isSuccess
                  ? 'bg-emerald-600 text-white animate-success-pulse'
                  : isPotentiallyUnsafe
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white hover:shadow-md hover:shadow-orange-500/30'
                }`}
            >
              {isAdding ? (
                <Loader size={15} className="animate-spin" />
              ) : isSuccess ? (
                <><Check size={15} className="mr-1" /> Added!</>
              ) : isPotentiallyUnsafe ? (
                'Add (Risky)'
              ) : (
                <span className="flex items-center gap-1">
                  <ShoppingCart size={14} className="mr-0.5" />
                  Add to Cart
                </span>
              )}
            </button>
          </div>
        )}
      </div>
      
      {/* Nutrition Modal Overlay */}
      {isExpanded && (
        <div className="absolute inset-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md p-4 flex flex-col rounded-2xl animate-fadeIn" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800 mb-3">
            <h4 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-1.5 truncate">
              <Info size={15} className="text-orange-500 flex-shrink-0" /> {item.name}
            </h4>
            <button 
              type="button" 
              onClick={() => setIsExpanded(false)}
              className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              aria-label="Close nutrition details"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { icon: <Flame size={12} />, label: 'Calories', value: item.calories ? `${item.calories} kcal` : '—', color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/40' },
                { icon: <Dumbbell size={12} />, label: 'Protein', value: item.protein ? `${item.protein}g` : '—', color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40' },
                { icon: <Wheat size={12} />, label: 'Carbs', value: item.carbs ? `${item.carbs}g` : '—', color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' },
                { icon: <Zap size={12} />, label: 'Fat', value: item.fat ? `${item.fat}g` : '—', color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40' },
                { icon: <Sparkles size={12} />, label: 'Sugar', value: item.sugar ? `${item.sugar}g` : '—', color: 'text-pink-500 bg-pink-50 dark:bg-pink-950/40' },
                { icon: <Heart size={12} />, label: 'Sodium', value: item.sodium ? `${item.sodium}mg` : '—', color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/40' },
              ].map((m, i) => (
                <div key={i} className={`p-1.5 rounded-lg border border-gray-100 dark:border-gray-800 text-center ${m.color}`}>
                  <span className="font-extrabold block text-xs">{m.value}</span>
                  <span className="text-[9px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">{m.label}</span>
                </div>
              ))}
            </div>

            {item.ingredients && item.ingredients.length > 0 && (
              <div>
                <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">Key Ingredients</p>
                <div className="flex flex-wrap gap-1">
                  {item.ingredients.map((ing, i) => (
                    <span key={i} className="text-[10px] bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md text-gray-700 dark:text-gray-300">
                      {ing.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button 
            type="button" 
            onClick={() => setIsExpanded(false)} 
            className="w-full mt-2 py-1.5 text-xs font-bold rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition"
          >
            Back to Dish
          </button>
        </div>
      )}

      {/* Warning Modal */}
      {showWarningModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 rounded-2xl" onClick={e => e.stopPropagation()}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-2xl flex flex-col items-center text-center">
            <AlertTriangle size={32} className="text-red-500 mb-3" />
            <h4 className="font-bold text-gray-900 dark:text-white mb-2">Health Warning</h4>
            <p className="text-xs text-gray-600 dark:text-gray-300 mb-4">{safetyReason}</p>
            {evaluation.alternativeCategory && (
              <p className="text-[10px] text-orange-600 dark:text-orange-400 mb-4">
                Consider trying items from the <strong>{evaluation.alternativeCategory}</strong> category instead.
              </p>
            )}
            <div className="flex gap-2 w-full mt-auto">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowWarningModal(false); }}
                className="flex-1 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-xs font-bold text-gray-700 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button 
                onClick={(e) => handleAddClick(e, true)}
                className="flex-1 py-2 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition"
              >
                Add Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default FoodCard;
