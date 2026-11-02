import React, { useState, useEffect, useRef } from 'react';
import { foodsAPI, uploadAPI } from '../services/apiService';
import { FoodItem } from '../types';
import { useNotificationStore } from '../store/useStore';
import { UploadCloud, CheckCircle, Image as ImageIcon, Loader2, Search } from 'lucide-react';
import { PLACEHOLDER_IMAGE } from '../constants';
import { getImageUrl } from '../services/apiClient';

const AdminFoodManagement: React.FC = () => {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const { showNotification } = useNotificationStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFoods();
  }, []);

  const loadFoods = async () => {
    try {
      setLoading(true);
      const data = await foodsAPI.getAll();
      setFoods(data);
    } catch (err) {
      showNotification('Error', 'Failed to load foods', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (foodId: string, file: File) => {
    if (!file) return;
    
    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showNotification('Error', 'Only JPG, PNG, and WebP are allowed', 'error');
      return;
    }

    setUploadingId(foodId);
    try {
      // 1. Upload image to server
      const uploadRes = await uploadAPI.uploadImage(file);
      const imageUrl = (uploadRes as any).imageUrl || (uploadRes as any).image;
      if (!imageUrl) throw new Error('Upload failed to return image URL');

      // 2. Update food record in database with new primary image
      const updateRes = await foodsAPI.update(foodId, { image: imageUrl });
      
      // 3. Update local state
      setFoods(foods.map(f => f.id === foodId ? { ...f, image: updateRes?.image || imageUrl } : f));
      showNotification('Success', 'Image updated successfully!', 'success');
    } catch (err: any) {
      console.error(err);
      showNotification('Upload Failed', err.message || 'Something went wrong', 'error');
    } finally {
      setUploadingId(null);
    }
  };

  const filteredFoods = foods.filter(f => f.name.toLowerCase().includes(search.toLowerCase()) || f.category.toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-orange-500" size={32} /></div>;
  }

  return (
    <div className="card p-6 w-full text-left">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ImageIcon className="text-indigo-500" />
            Image Management System
          </h2>
          <p className="text-sm text-gray-500 mt-1">Upload and automatically optimize WebP images for your menu items.</p>
        </div>
        
        <div className="relative w-64">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search foods..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm transition-all outline-none text-gray-800 dark:text-gray-200"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredFoods.map(food => (
          <div key={food.id || food._id} className="flex gap-4 p-4 border border-gray-100 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-900/50 hover:shadow-lg transition-all items-center">
            
            {/* Image Preview */}
            <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0 group">
              <picture>
                {/* We try to load the webp if we have multiple sizes later, but for now we rely on the primary image path which IS webp */}
                <source srcSet={getImageUrl(food.image)?.includes('.webp') ? getImageUrl(food.image) : undefined} type="image/webp" />
                <img
                  src={getImageUrl(food.image) || PLACEHOLDER_IMAGE}
                  alt={food.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
                />
              </picture>
              
              {uploadingId === (food.id || food._id) && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                  <Loader2 className="animate-spin text-white" size={20} />
                </div>
              )}
            </div>

            {/* Food Info & Uploader */}
            <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-1">
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white truncate">{food.name}</h4>
                <p className="text-xs text-gray-500 mb-1">{food.category}</p>
                <p className="text-sm font-semibold text-orange-500">₹{food.price}</p>
              </div>

              <div className="mt-2">
                <label className="relative inline-flex items-center justify-center w-full px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 rounded-lg cursor-pointer transition-colors border border-indigo-100 dark:border-indigo-800">
                  <UploadCloud size={14} className="mr-1.5" />
                  Replace Image
                  <input
                    type="file"
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp"
                    disabled={uploadingId === (food.id || food._id)}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileChange((food.id || food._id), e.target.files[0]);
                      }
                      e.target.value = ''; // reset
                    }}
                  />
                </label>
              </div>
            </div>

          </div>
        ))}

        {filteredFoods.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500">
            No foods found matching "{search}"
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFoodManagement;
