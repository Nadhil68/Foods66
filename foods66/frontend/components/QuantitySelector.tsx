
import React from 'react';
import { Plus, Minus } from 'lucide-react';

interface QuantitySelectorProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  className?: string;
  size?: 'sm' | 'md';
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({ 
  quantity, 
  onIncrease, 
  onDecrease, 
  disabled = false,
  min = 1,
  max = 99,
  className = "",
  size = 'md'
}) => {
  const btnSize = size === 'sm' ? 'w-7 h-7' : 'w-8 h-8';
  const iconSize = size === 'sm' ? 13 : 15;
  const textSize = size === 'sm' ? 'text-xs w-7' : 'text-sm w-8';

  return (
    <div className={`flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-0.5 shadow-inner border border-gray-200 dark:border-gray-700 ${className}`}>
      <button 
        type="button"
        onClick={(e) => { 
            e.preventDefault();
            e.stopPropagation(); 
            if (quantity > min && !disabled) onDecrease(); 
        }}
        disabled={disabled || quantity <= min}
        className={`${btnSize} flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm text-gray-700 dark:text-gray-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:shadow-none active:scale-90`}
        aria-label="Decrease quantity"
        title="Decrease quantity"
      >
        <Minus size={iconSize} strokeWidth={2.5} />
      </button>
      
      <span 
        className={`${textSize} font-extrabold text-gray-900 dark:text-white text-center select-none font-mono flex items-center justify-center`}
        aria-live="polite"
        role="status"
      >
        {quantity}
      </span>
      
      <button 
        type="button"
        onClick={(e) => { 
            e.preventDefault();
            e.stopPropagation(); 
            if (quantity < max && !disabled) onIncrease(); 
        }}
        disabled={disabled || quantity >= max}
        className={`${btnSize} flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm text-gray-700 dark:text-gray-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:shadow-none active:scale-90`}
        aria-label="Increase quantity"
        title="Increase quantity"
      >
        <Plus size={iconSize} strokeWidth={2.5} />
      </button>
    </div>
  );
};

export default QuantitySelector;
