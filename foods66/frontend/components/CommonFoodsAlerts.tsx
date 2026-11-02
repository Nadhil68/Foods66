import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { FoodItem, HealthProfile } from '../types';
import { isFoodUnhealthyForUser } from '../utils/healthLogic';

interface CommonFoodsAlertsProps {
  item: FoodItem;
  profile: HealthProfile;
}

export const CommonFoodsAlerts: React.FC<CommonFoodsAlertsProps> = ({ item, profile }) => {
  const evaluation = isFoodUnhealthyForUser(item, profile);
  const [showDetails, setShowDetails] = useState(false);

  if (!evaluation.isUnhealthy) return null;

  return (
    <div className="relative z-20 mb-2">
      {/* Always-visible alert banner */}
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2.5">
        <div className="flex items-start gap-2">
          <AlertTriangle size={14} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-red-700 dark:text-red-400 uppercase tracking-wider mb-0.5">
              ⚠ Unhealthy for You
            </p>
            <p className="text-[11px] text-red-600 dark:text-red-300 leading-relaxed">
              {evaluation.reason}
            </p>
            {evaluation.alternativeCategory && (
              <p className="text-[10px] text-orange-600 dark:text-orange-400 mt-1 font-medium">
                💡 Try items from <strong>{evaluation.alternativeCategory}</strong> instead
              </p>
            )}
          </div>
          {/* Expand nutrient details button */}
          {(item.sugar !== undefined || item.sodium !== undefined || item.fat !== undefined || item.healthScore !== undefined) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDetails(!showDetails);
              }}
              className="text-red-400 hover:text-red-600 dark:hover:text-red-300 p-2.5 -m-2 sm:p-0.5 sm:m-0 rounded transition flex-shrink-0"
              aria-label={showDetails ? "Hide nutrient details" : "Show nutrient details"}
              title="Nutrient details"
            >
              {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>

        {/* Expandable nutrient details */}
        {showDetails && (
          <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-800" onClick={(e) => e.stopPropagation()}>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-gray-600 dark:text-gray-400">
              {item.sugar !== undefined && (
                <div className="flex justify-between">
                  <span>Sugar:</span>
                  <span className={item.sugar > 15 ? 'text-red-600 font-bold' : ''}>{item.sugar}g</span>
                </div>
              )}
              {item.sodium !== undefined && (
                <div className="flex justify-between">
                  <span>Sodium:</span>
                  <span className={item.sodium > 600 ? 'text-red-600 font-bold' : ''}>{item.sodium}mg</span>
                </div>
              )}
              {item.fat !== undefined && (
                <div className="flex justify-between">
                  <span>Fat:</span>
                  <span className={item.fat > 10 ? 'text-red-600 font-bold' : ''}>{item.fat}g</span>
                </div>
              )}
              {item.healthScore !== undefined && (
                <div className="flex justify-between">
                  <span>Score:</span>
                  <span className={item.healthScore < 40 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>
                    {item.healthScore}/100
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
