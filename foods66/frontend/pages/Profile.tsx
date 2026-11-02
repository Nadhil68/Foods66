import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useStore';
import { useAuthStore } from '../store/useStore';
import { useCartStore } from '../store/useStore';
import { useNotificationStore } from '../store/useStore';
import { User as UserIcon, MapPin, Activity, Clock, ChevronRight, Pill, ShieldCheck, Edit2, Save, X, Camera, Mail, Phone, ZoomIn, ZoomOut, Check, LogOut, Eye, EyeOff, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { HealthProfile, User } from '../types';

const Profile: React.FC = () => {
  const { user, updateUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Canvas Refs for Cropping
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [showHealthDetails, setShowHealthDetails] = useState(false);
  const [editForm, setEditForm] = useState<{
      email: string;
      phone: string;
      profileImage?: string;
      healthProfile: HealthProfile;
  }>({
      email: '',
      phone: '',
      healthProfile: {
          hasIssues: false,
          diseaseName: '',
          stage: '1',
          medicines: '',
          age: undefined,
          dietaryMemo: '',
          healthy_level: 'high',
          disease_level: 'none'
      }
  });

  // Cropping State
  const [showCropModal, setShowCropModal] = useState(false);
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (user) {
        setEditForm({
            email: user.email,
            phone: user.phone,
            profileImage: user.profileImage,
            healthProfile: user.healthProfile
        });
    }
  }, [user]);

  // --- Image Handling Logic ---

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setRawImage(reader.result as string);
              setShowCropModal(true);
              setScale(1);
              setOffset({ x: 0, y: 0 });
          };
          reader.readAsDataURL(file);
      }
      // Reset input value to allow selecting same file again
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const drawCanvas = () => {
      const canvas = canvasRef.current;
      const img = imageRef.current;
      if (!canvas || !img) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Draw Image with transforms
      ctx.save();
      ctx.translate(centerX + offset.x, centerY + offset.y);
      ctx.scale(scale, scale);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();

      // Overlay (Darken outside circle)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.rect(0, 0, canvas.width, canvas.height);
      ctx.arc(centerX, centerY, 100, 0, Math.PI * 2, true); // 100 radius = 200px circle
      ctx.fill();

      // Border ring
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 100, 0, Math.PI * 2);
      ctx.stroke();
  };

  // Re-draw whenever state changes
  useEffect(() => {
      if (showCropModal && rawImage) {
          // Wait for image to load before drawing
          const img = new Image();
          img.src = rawImage;
          img.onload = () => {
              // Initial scale to fit
              if (canvasRef.current && scale === 1) {
                   const minScale = Math.max(200 / img.width, 200 / img.height);
                   setScale(minScale);
              }
              drawCanvas();
          };
          imageRef.current = img;
      }
  }, [rawImage, showCropModal, scale, offset]);

  const handleMouseDown = (e: React.MouseEvent) => {
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (isDragging) {
          setOffset({
              x: e.clientX - dragStart.x,
              y: e.clientY - dragStart.y
          });
      }
  };

  const handleMouseUp = () => setIsDragging(false);

  const saveCroppedImage = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Create a temporary canvas to extract just the circle content
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 200;
      tempCanvas.height = 200;
      const tCtx = tempCanvas.getContext('2d');
      
      if (tCtx) {
          // Calculate source coordinates based on current transform
          const img = imageRef.current;
          if (img) {
             tCtx.save();
             // Clip to circle
             tCtx.beginPath();
             tCtx.arc(100, 100, 100, 0, Math.PI * 2);
             tCtx.clip();
             
             // Draw background just in case
             tCtx.fillStyle = '#fff';
             tCtx.fillRect(0,0,200,200);

             // Translate to center of temp canvas (100,100) + offset
             tCtx.translate(100 + offset.x, 100 + offset.y);
             tCtx.scale(scale, scale);
             tCtx.drawImage(img, -img.width / 2, -img.height / 2);
             tCtx.restore();
             
             const finalImage = tempCanvas.toDataURL('image/jpeg', 0.9);
             
             // If we are currently editing the profile, just update the form state
             if (isEditing) {
                setEditForm(prev => ({ ...prev, profileImage: finalImage }));
             } else {
                // If not in edit mode, save immediately to user profile
                if (user) {
                    updateUser({ ...user, profileImage: finalImage });
                    // Also update edit form to stay in sync
                    setEditForm(prev => ({ ...prev, profileImage: finalImage }));
                }
             }
             
             setShowCropModal(false);
          }
      }
  };

  // --- End Image Handling ---

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (['hasIssues', 'diseaseName', 'stage', 'medicines', 'age', 'dietaryMemo', 'healthy_level', 'disease_level'].includes(name)) {
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setEditForm(prev => ({ ...prev, healthProfile: { ...prev.healthProfile, [name]: checked } }));
        } else {
            // Fix Age type to be number or undefined, not string
            const val = name === 'age' ? (value ? parseInt(value) : undefined) : value;
            setEditForm(prev => ({ ...prev, healthProfile: { ...prev.healthProfile, [name]: val } }));
        }
    } else {
        setEditForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const triggerFileInput = () => {
      fileInputRef.current?.click();
  };

  const handleSave = async () => {
    if (user) {
      updateUser({
        ...user,
        email: editForm.email,
        phone: editForm.phone,
        profileImage: editForm.profileImage,
        healthProfile: editForm.healthProfile
      });
      setIsEditing(false);

      try {
        const { usersAPI } = await import('../services/apiService');
        await usersAPI.updateProfile({
          phone: editForm.phone,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim()
        });
      } catch (e) {
        // Fallback gracefully
      }
    }
  };

  const handleCancel = () => {
      if (user) {
        setEditForm({
            email: user.email,
            phone: user.phone,
            profileImage: user.profileImage,
            healthProfile: user.healthProfile
        });
      }
      setIsEditing(false);
  };

  const handleLogout = () => {
      logout();
      navigate('/');
  };

  if (!user) return null;

  return (
    <div 
      className="min-h-dvh bg-cover md:bg-fixed bg-center"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&q=80&w=2000')" }}
    >
      <div className="min-h-dvh bg-white/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-10 pb-20">
      
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl shadow-lg p-8 text-white mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
           <UserIcon size={300} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
           <div className="flex flex-col items-center gap-3">
               <div className="relative group cursor-pointer" onClick={triggerFileInput}>
                    <div className="w-24 h-24 rounded-full border-4 border-white/30 overflow-hidden bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg relative">
                        {editForm.profileImage || user.profileImage ? (
                            <img src={isEditing && editForm.profileImage ? editForm.profileImage : user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <UserIcon size={48} className="text-white" />
                        )}
                    </div>
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera size={24} className="text-white" />
                    </div>
                    
                    {/* Persistent Edit Button */}
                    <div className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow-lg border border-gray-100 transform translate-x-1/4 translate-y-1/4 z-10 group-hover:scale-110 transition-transform">
                        <Edit2 size={12} className="text-orange-600" />
                    </div>

                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleFileSelect} 
                    />
               </div>
               
               <button 
                 onClick={triggerFileInput}
                 className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-full flex items-center backdrop-blur-sm transition border border-white/20 shadow-sm"
               >
                 <Camera size={14} className="mr-1.5" /> Change Photo
               </button>
           </div>
           
           <div className="flex-1">
              <h1 className="text-3xl font-bold">{user.firstName} {user.lastName}</h1>
              <p className="text-orange-100 text-lg">@{user.username}</p>
              
              <div className="flex flex-wrap gap-4 mt-4">
                 {isEditing ? (
                     <div className="space-y-2 w-full max-w-md">
                        <div className="flex items-center bg-white/20 rounded-lg px-3 py-2 border border-white/30">
                            <Mail size={16} className="text-orange-100 mr-2" />
                            <input 
                                type="email" 
                                name="email"
                                value={editForm.email}
                                onChange={handleInputChange}
                                className="bg-transparent border-none focus:outline-none text-white placeholder-orange-200 w-full text-sm"
                            />
                        </div>
                        <div className="flex items-center bg-white/20 rounded-lg px-3 py-2 border border-white/30">
                            <Phone size={16} className="text-orange-100 mr-2" />
                            <span className="text-white/70 text-sm font-medium mr-1 select-none">+91</span>
                            <input 
                                type="text" 
                                name="phone"
                                value={editForm.phone}
                                onChange={handleInputChange}
                                className="bg-transparent border-none focus:outline-none text-white placeholder-orange-200 w-full text-sm"
                                maxLength={10}
                            />
                        </div>
                     </div>
                 ) : (
                     <>
                        <span className="bg-white/20 px-3 py-1 rounded-lg text-sm flex items-center border border-white/10">
                            <span className="mr-2 opacity-70">📧</span> {user.email}
                        </span>
                        <span className="bg-white/20 px-3 py-1 rounded-lg text-sm flex items-center border border-white/10">
                            <span className="mr-2 opacity-70">📱</span> +91 {user.phone}
                        </span>
                     </>
                 )}
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column: Details */}
        <div className="space-y-8">
           {/* Address Card */}
           <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <MapPin className="mr-2 text-orange-600" size={24}/> Delivery Address
              </h2>
              <div className="bg-gray-50 p-4 rounded-lg text-gray-700 space-y-1 border border-gray-200">
                 <p className="font-medium">{user.address.doorNo}</p>
                 <p>{user.address.landmark}</p>
                 <p>{user.address.district}, {user.address.state} - {user.address.pincode}</p>
              </div>
           </div>

           {/* Quick Actions */}
           <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <Clock className="mr-2 text-orange-600" size={24}/> Account Actions
              </h2>
              
              <button 
                onClick={() => navigate('/orders')}
                className="w-full bg-white border border-orange-200 hover:border-orange-500 hover:shadow-md transition p-4 rounded-xl flex items-center justify-between group mb-4"
              >
                 <div className="flex items-center">
                    <div className="bg-orange-50 p-3 rounded-lg text-orange-600 mr-4 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                        <Clock size={24} />
                    </div>
                    <div className="text-left">
                       <h3 className="font-bold text-gray-800">Order History</h3>
                       <p className="text-sm text-gray-500">View past orders and status</p>
                    </div>
                 </div>
                 <ChevronRight className="text-gray-400 group-hover:text-orange-600 transition-colors" />
              </button>

              <button 
                onClick={handleLogout}
                className="w-full bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300 transition p-4 rounded-xl flex items-center justify-between group"
              >
                 <div className="flex items-center">
                    <div className="bg-white p-3 rounded-lg text-red-500 mr-4 shadow-sm group-hover:bg-red-500 group-hover:text-white transition-colors">
                        <LogOut size={24} />
                    </div>
                    <div className="text-left">
                       <h3 className="font-bold text-red-700">Log Out</h3>
                       <p className="text-sm text-red-500">Sign out of your account</p>
                    </div>
                 </div>
                 <ChevronRight className="text-red-300 group-hover:text-red-600 transition-colors" />
              </button>
           </div>
        </div>

        {/* Right Column: Health Profile */}
        <div className="h-full">
          <div className={`h-full rounded-xl shadow-sm border p-6 relative overflow-hidden transition-all ${editForm.healthProfile.hasIssues || user.healthProfile.hasIssues ? 'bg-gradient-to-br from-white to-orange-50 border-orange-200' : 'bg-white border-gray-100'}`}>
             
             <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <Activity className="mr-2 text-orange-600" size={24}/> Health Profile
                </h2>
                <div className="flex gap-2">
                    {!isEditing && user.healthProfile.hasIssues && (
                        <button 
                            onClick={() => setShowHealthDetails(!showHealthDetails)} 
                            className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-full transition"
                            title={showHealthDetails ? "Hide sensitive details" : "Show sensitive details"}
                        >
                            {showHealthDetails ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    )}
                    {isEditing ? (
                        <div className="flex gap-2">
                             <button onClick={handleCancel} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition">
                                <X size={20} />
                             </button>
                             <button onClick={handleSave} className="p-2 text-orange-600 hover:bg-orange-100 rounded-full transition">
                                <Save size={20} />
                             </button>
                        </div>
                    ) : (
                        <button onClick={() => setIsEditing(true)} className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-full transition" title="Edit Health Profile">
                            <Edit2 size={18} />
                        </button>
                    )}
                </div>
             </div>

             {/* Editing Mode */}
             {isEditing ? (
                 <div className="space-y-4 animate-fadeIn">
                     <div className="flex items-center p-3 bg-orange-50/50 rounded-lg border border-orange-100">
                        <input 
                            type="checkbox" 
                            id="hasIssues" 
                            name="hasIssues" 
                            checked={editForm.healthProfile.hasIssues} 
                            onChange={handleInputChange} 
                            className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 border-gray-300 cursor-pointer" 
                        />
                        <label htmlFor="hasIssues" className="ml-3 text-sm font-medium text-gray-800 cursor-pointer select-none">
                            I have specific health concerns
                        </label>
                     </div>

                     {editForm.healthProfile.hasIssues && (
                         <>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Age</label>
                                <input 
                                    type="number" 
                                    name="age" 
                                    value={editForm.healthProfile.age || ''} 
                                    onChange={handleInputChange}
                                    placeholder="e.g. 25"
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm bg-white"
                                    min="1"
                                    max="120"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Health Tolerance Level</label>
                                <select 
                                    name="healthy_level" 
                                    value={editForm.healthProfile.healthy_level || 'high'} 
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm bg-white"
                                >
                                    <option value="high">High (No Strict Diet)</option>
                                    <option value="medium">Medium (Moderate Diet)</option>
                                    <option value="low">Low (Strict Diet)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Disease Level</label>
                                <select 
                                    name="disease_level" 
                                    value={editForm.healthProfile.disease_level || 'none'} 
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm bg-white"
                                >
                                    <option value="none">None</option>
                                    <option value="diabetes">Diabetes</option>
                                    <option value="hypertension">Hypertension</option>
                                    <option value="heart_disease">Heart Disease</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Disease Name</label>
                                <input 
                                    type="text" 
                                    name="diseaseName" 
                                    value={editForm.healthProfile.diseaseName || ''} 
                                    onChange={handleInputChange}
                                    placeholder="e.g. Type 2 Diabetes"
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Stage</label>
                                <select 
                                    name="stage" 
                                    value={editForm.healthProfile.stage || '1'} 
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm bg-white"
                                >
                                    <option value="1">Stage 1 (Beginning)</option>
                                    <option value="2">Stage 2 (Intermediate)</option>
                                    <option value="3">Stage 3 (Advanced)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Medications</label>
                                <textarea 
                                    name="medicines" 
                                    value={editForm.healthProfile.medicines || ''} 
                                    onChange={handleInputChange}
                                    placeholder="List your medications..."
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm h-24 resize-none"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Dietary Memo</label>
                                <textarea 
                                    name="dietaryMemo" 
                                    value={editForm.healthProfile.dietaryMemo || ''} 
                                    onChange={handleInputChange}
                                    placeholder="Dietary notes (AI generated)..."
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm h-20 resize-none bg-gray-50"
                                />
                            </div>
                         </>
                     )}
                     
                     <button onClick={handleSave} className="w-full py-2 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 transition mt-2">
                        Save Changes
                     </button>
                 </div>
             ) : (
                /* View Mode */
                user.healthProfile.hasIssues ? (
                    <div className="space-y-6 relative z-10 animate-fadeIn">
                       
                       {/* Summary Header (Always Visible if has issues) */}
                       <div className="flex items-center text-sm font-medium text-green-700 bg-green-50 p-2 rounded-lg border border-green-100">
                          <Check size={16} className="mr-2" />
                          Health Monitoring Active
                       </div>

                       {showHealthDetails ? (
                           <div className="animate-fadeIn space-y-6">
                               {user.healthProfile.age && (
                                   <div>
                                      <label className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Age</label>
                                      <p className="text-xl font-bold text-gray-800 mt-1">{user.healthProfile.age} Years</p>
                                   </div>
                               )}
                               
                               <div>
                                  <label className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Condition</label>
                                  <p className="text-2xl font-bold text-orange-900 mt-1">
                                      {user.healthProfile.disease_level && user.healthProfile.disease_level !== 'none' 
                                          ? user.healthProfile.disease_level.replace('_', ' ').toUpperCase() 
                                          : user.healthProfile.diseaseName || 'None'}
                                  </p>
                                  {user.healthProfile.healthy_level && (
                                    <p className="text-sm font-medium text-gray-500 mt-1">
                                      Health Tolerance: <span className="capitalize">{user.healthProfile.healthy_level}</span>
                                    </p>
                                  )}
                               </div>
                               
                               <div>
                                  <label className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Severity</label>
                                  <div className="mt-2">
                                    <div className="flex items-center justify-between text-xs font-medium text-gray-400 mb-1">
                                       <span>Stage 1</span>
                                       <span>Stage 2</span>
                                       <span>Stage 3</span>
                                    </div>
                                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                       <div 
                                          className={`h-full rounded-full ${
                                             user.healthProfile.stage === '1' ? 'w-1/3 bg-green-500' : 
                                             user.healthProfile.stage === '2' ? 'w-2/3 bg-yellow-500' : 
                                             'w-full bg-red-500'
                                          }`}
                                       ></div>
                                    </div>
                                    <p className="text-right text-xs font-bold text-orange-700 mt-1">
                                       {user.healthProfile.stage === '1' ? 'Beginning' : user.healthProfile.stage === '2' ? 'Intermediate' : 'Advanced'}
                                    </p>
                                  </div>
                               </div>
            
                               {user.healthProfile.medicines && (
                                 <div>
                                    <label className="text-sm text-gray-500 uppercase tracking-wider font-semibold flex items-center">
                                       <Pill size={14} className="mr-1"/> Medications
                                    </label>
                                    <div className="mt-2 bg-white/60 p-3 rounded-lg border border-orange-100 text-gray-700 text-sm">
                                       {user.healthProfile.medicines}
                                    </div>
                                 </div>
                               )}

                               {user.healthProfile.dietaryMemo && (
                                 <div>
                                    <label className="text-sm text-gray-500 uppercase tracking-wider font-semibold flex items-center">
                                       <FileText size={14} className="mr-1"/> Dietary Prescription
                                    </label>
                                    <div className="mt-2 bg-green-50/50 p-3 rounded-lg border border-green-200 text-green-800 text-sm font-medium italic">
                                       "{user.healthProfile.dietaryMemo}"
                                    </div>
                                 </div>
                               )}
                           </div>
                       ) : (
                           <div className="py-8 text-center text-gray-400 italic bg-white/50 rounded-lg border border-dashed border-gray-200">
                               <p>Sensitive details hidden for privacy.</p>
                               <p className="text-xs mt-1">Click the eye icon above to reveal.</p>
                           </div>
                       )}
    
                       <div className="bg-orange-100/50 p-4 rounded-xl border border-orange-200 flex items-start mt-4">
                          <ShieldCheck className="text-orange-600 flex-shrink-0 mr-3 mt-1" size={20} />
                          <p className="text-sm text-orange-800">
                             Your menu is automatically filtered to recommend safe foods based on this profile.
                          </p>
                       </div>
                    </div>
                 ) : (
                    <div className="text-center py-10 text-gray-500 animate-fadeIn">
                       <Activity size={48} className="mx-auto mb-4 opacity-20" />
                       <p>No specific health conditions recorded.</p>
                       <p className="text-sm mt-2">You can enjoy our full range of menu items.</p>
                    </div>
                 )
             )}
          </div>
        </div>

      </div>

      {/* --- Image Cropper Modal --- */}
      {showCropModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-md">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-gray-800">Adjust Profile Picture</h3>
                      <button onClick={() => setShowCropModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
                  </div>
                  
                  <div className="relative rounded-lg overflow-hidden bg-gray-100 border border-gray-200 cursor-move flex justify-center items-center h-[300px]">
                      <canvas 
                         ref={canvasRef} 
                         width={300} 
                         height={300}
                         onMouseDown={handleMouseDown}
                         onMouseMove={handleMouseMove}
                         onMouseUp={handleMouseUp}
                         onMouseLeave={handleMouseUp}
                      />
                  </div>

                  <div className="mt-4 space-y-4">
                      <div className="flex items-center gap-4">
                          <ZoomOut size={16} className="text-gray-500"/>
                          <input 
                              type="range" 
                              min="0.1" 
                              max="3" 
                              step="0.1" 
                              value={scale} 
                              onChange={(e) => setScale(parseFloat(e.target.value))}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <ZoomIn size={16} className="text-gray-500"/>
                      </div>
                      
                      <div className="flex gap-3">
                          <button 
                             onClick={() => setShowCropModal(false)} 
                             className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-50"
                          >
                             Cancel
                          </button>
                          <button 
                             onClick={saveCroppedImage} 
                             className="flex-1 py-2 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 flex justify-center items-center"
                          >
                             <Check size={18} className="mr-2"/> Save Photo
                          </button>
                      </div>
                  </div>
                  <p className="text-xs text-center text-gray-400 mt-2">Drag to reposition • Use slider to zoom</p>
              </div>
          </div>
      )}

        </div>
      </div>
    </div>
  );
};

export default Profile;