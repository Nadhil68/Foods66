import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../store/useStore';
import { useAuth } from '../context/AuthContext';
import { useCartStore } from '../store/useStore';
import { useNotificationStore } from '../store/useStore';
import { User } from '../types';
import { MapPin, User as UserIcon, Phone, Mail, Lock, CheckCircle, Loader, Activity, Eye, EyeOff, Navigation, Check, ChevronDown, RefreshCw, ShieldCheck, AlertCircle, Sparkles, ExternalLink, AlertTriangle, Shield, Heart, FileText, Stethoscope, Clock, Star, Search, X as XIcon } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { healthValidationAPI } from '../services/apiService';

import { toast } from 'sonner';

// ─── Diet-relevant health conditions with common names ────────────────────────
// Organized by category; used to power the Condition/Disease autocomplete field.
const HEALTH_CONDITIONS: { label: string; synonyms: string; category: string }[] = [
  // Metabolic & Endocrine
  { label: 'Diabetes Type 1',           synonyms: 'T1D, Juvenile Diabetes, Insulin-Dependent Diabetes',    category: 'Metabolic' },
  { label: 'Diabetes Type 2',           synonyms: 'T2D, Adult-Onset Diabetes, High Blood Sugar',           category: 'Metabolic' },
  { label: 'Prediabetes',               synonyms: 'Borderline Diabetes, Impaired Fasting Glucose',         category: 'Metabolic' },
  { label: 'Gestational Diabetes',      synonyms: 'Pregnancy Diabetes, GDM',                               category: 'Metabolic' },
  { label: 'Hypothyroidism',            synonyms: 'Underactive Thyroid, Low Thyroid',                      category: 'Metabolic' },
  { label: 'Hyperthyroidism',           synonyms: 'Overactive Thyroid, Graves Disease',                    category: 'Metabolic' },
  { label: 'Obesity',                   synonyms: 'Overweight, High BMI, Morbid Obesity',                  category: 'Metabolic' },
  { label: 'Metabolic Syndrome',        synonyms: 'Syndrome X, Insulin Resistance Syndrome',               category: 'Metabolic' },
  { label: 'Hyperuricemia',             synonyms: 'High Uric Acid, Gout Risk',                             category: 'Metabolic' },
  { label: 'Gout',                      synonyms: 'Gouty Arthritis, Uric Acid Arthritis',                  category: 'Metabolic' },
  { label: 'Hyperlipidemia',            synonyms: 'High Cholesterol, High Triglycerides, Dyslipidemia',    category: 'Metabolic' },
  { label: 'PCOD / PCOS',              synonyms: 'Polycystic Ovary Syndrome, Polycystic Ovary Disease',   category: 'Metabolic' },
  // Cardiovascular
  { label: 'Hypertension',             synonyms: 'High Blood Pressure, HTN',                              category: 'Cardiovascular' },
  { label: 'Hypotension',              synonyms: 'Low Blood Pressure',                                    category: 'Cardiovascular' },
  { label: 'Coronary Artery Disease',  synonyms: 'CAD, Heart Disease, Blocked Arteries, CHD',             category: 'Cardiovascular' },
  { label: 'Heart Failure',            synonyms: 'Congestive Heart Failure, CHF, Weak Heart',             category: 'Cardiovascular' },
  { label: 'Atrial Fibrillation',      synonyms: 'AFib, Irregular Heartbeat, AF',                        category: 'Cardiovascular' },
  { label: 'Atherosclerosis',          synonyms: 'Hardening of Arteries, Plaque in Arteries',             category: 'Cardiovascular' },
  { label: 'Stroke (History)',         synonyms: 'Cerebrovascular Accident, CVA, Brain Stroke',           category: 'Cardiovascular' },
  // Digestive & Gut
  { label: 'Irritable Bowel Syndrome', synonyms: 'IBS, Spastic Colon, Functional Bowel Disorder',         category: 'Digestive' },
  { label: "Crohn's Disease",          synonyms: 'Inflammatory Bowel Disease, IBD, Crohns',               category: 'Digestive' },
  { label: 'Ulcerative Colitis',       synonyms: 'UC, Inflammatory Bowel Disease, IBD',                   category: 'Digestive' },
  { label: 'GERD / Acid Reflux',       synonyms: 'Gastroesophageal Reflux, Heartburn, Acidity',           category: 'Digestive' },
  { label: 'Celiac Disease',           synonyms: 'Gluten Intolerance, Gluten Sensitivity, Sprue',         category: 'Digestive' },
  { label: 'Lactose Intolerance',      synonyms: 'Milk Allergy, Dairy Intolerance',                       category: 'Digestive' },
  { label: 'Peptic Ulcer',             synonyms: 'Stomach Ulcer, Gastric Ulcer, Duodenal Ulcer',          category: 'Digestive' },
  { label: 'Fatty Liver',              synonyms: 'NAFLD, Non-Alcoholic Fatty Liver Disease, Liver Fat',   category: 'Digestive' },
  { label: 'Liver Cirrhosis',          synonyms: 'Liver Scarring, Chronic Liver Disease',                 category: 'Digestive' },
  { label: 'Gallstones',              synonyms: 'Cholelithiasis, Gallbladder Stones',                    category: 'Digestive' },
  { label: 'Pancreatitis',            synonyms: 'Pancreatic Inflammation, Pancreas Disease',              category: 'Digestive' },
  // Kidney
  { label: 'Chronic Kidney Disease',  synonyms: 'CKD, Renal Failure, Kidney Failure, Nephropathy',      category: 'Kidney' },
  { label: 'Kidney Stones',           synonyms: 'Nephrolithiasis, Renal Calculi',                        category: 'Kidney' },
  { label: 'Nephrotic Syndrome',      synonyms: 'Protein in Urine, Kidney Protein Loss',                 category: 'Kidney' },
  // Bones & Joints
  { label: 'Osteoporosis',            synonyms: 'Weak Bones, Low Bone Density, Brittle Bones',           category: 'Bones & Joints' },
  { label: 'Rheumatoid Arthritis',    synonyms: 'RA, Autoimmune Arthritis, Inflammatory Arthritis',      category: 'Bones & Joints' },
  { label: 'Osteoarthritis',          synonyms: 'Degenerative Joint Disease, Wear-and-Tear Arthritis',   category: 'Bones & Joints' },
  { label: 'Vitamin D Deficiency',    synonyms: 'Low Vitamin D, Rickets, Osteomalacia',                  category: 'Bones & Joints' },
  { label: 'Anemia',                  synonyms: 'Low Hemoglobin, Iron Deficiency, Low RBC',              category: 'Bones & Joints' },
  // Allergies & Immune
  { label: 'Food Allergy',            synonyms: 'Nut Allergy, Seafood Allergy, Egg Allergy',             category: 'Allergies' },
  { label: 'Lupus (SLE)',             synonyms: 'Systemic Lupus, Autoimmune Disease',                    category: 'Allergies' },
  { label: 'Eczema / Dermatitis',     synonyms: 'Atopic Dermatitis, Skin Allergy, Itchy Skin',           category: 'Allergies' },
  { label: 'Psoriasis',               synonyms: 'Skin Inflammation, Plaque Psoriasis',                  category: 'Allergies' },
  // Neurological
  { label: 'Epilepsy',                synonyms: 'Seizure Disorder, Convulsions',                        category: 'Neurological' },
  { label: "Parkinson's Disease",     synonyms: 'PD, Motor Disorder, Tremors',                          category: 'Neurological' },
  { label: "Alzheimer's Disease",     synonyms: 'Dementia, Memory Loss, Cognitive Decline',             category: 'Neurological' },
  { label: 'Migraine',                synonyms: 'Chronic Headache, Severe Headache',                    category: 'Neurological' },
  // Mental Health
  { label: 'Depression',              synonyms: 'Clinical Depression, Major Depressive Disorder, MDD',  category: 'Mental Health' },
  { label: 'Anxiety Disorder',        synonyms: 'Generalized Anxiety, GAD, Panic Disorder',             category: 'Mental Health' },
  { label: 'Eating Disorder',         synonyms: 'Anorexia, Bulimia, Binge Eating',                      category: 'Mental Health' },
  // Cancer / Oncology
  { label: 'Cancer (General)',        synonyms: 'Oncology, Malignancy, Tumor',                          category: 'Oncology' },
  { label: 'Colon Cancer',            synonyms: 'Colorectal Cancer, Bowel Cancer',                      category: 'Oncology' },
  { label: 'Breast Cancer',           synonyms: 'Breast Tumor, Mammary Cancer',                         category: 'Oncology' },
  // Other common
  { label: 'Asthma',                  synonyms: 'Respiratory Allergy, Bronchial Asthma, Wheezing',     category: 'Respiratory' },
  { label: 'COPD',                    synonyms: 'Chronic Obstructive Pulmonary Disease, Emphysema',     category: 'Respiratory' },
  { label: 'Tuberculosis',            synonyms: 'TB, Pulmonary TB, Koch Disease',                       category: 'Respiratory' },
  { label: 'Sickle Cell Anemia',      synonyms: 'SCD, Sickle Cell Disease',                            category: 'Blood' },
  { label: 'HIV / AIDS',              synonyms: 'Human Immunodeficiency Virus, Immunodeficiency',       category: 'Immune' },
  { label: 'Dengue',                  synonyms: 'Dengue Fever, Break-Bone Fever',                       category: 'Infectious' },
  { label: 'Malaria',                 synonyms: 'Malarial Fever, Plasmodium Infection',                 category: 'Infectious' },
  { label: 'Typhoid',                 synonyms: 'Typhoid Fever, Enteric Fever',                        category: 'Infectious' },
  { label: 'Post-COVID Syndrome',     synonyms: 'Long COVID, Post-COVID, COVID Recovery',              category: 'Infectious' },
  { label: 'Pregnancy',               synonyms: 'Expecting, Prenatal, Maternity',                       category: 'Other' },
  { label: 'Postpartum Recovery',     synonyms: 'Post-Delivery, After Birth, New Mother',               category: 'Other' },
];


const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const showNotification = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => {
    if (type === 'error') toast.error(title, { description: message });
    else if (type === 'success') toast.success(title, { description: message });
    else if (type === 'warning') toast.warning(title, { description: message });
    else toast(title, { description: message });
  };
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState<User>({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    address: {
      doorNo: '',
      landmark: '',
      district: '',
      state: '',
      pincode: '',
      lat: 13.0827, // Default Chennai
      lng: 80.2707
    },
    healthProfile: {
      hasIssues: false,
      diseaseName: '',
      stage: '1',
      medicines: '',
      age: undefined,
      symptoms: '',
      diagnosedBy: 'self' as const,
      dietaryMemo: ''
    }
  });

  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);
  
  // Password Visibility & Validation
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
    hasSpecial: false
  });

  // Country Code State
  const [countryCode, setCountryCode] = useState('+91');

  // CAPTCHA State
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Location State
  const [locationLoading, setLocationLoading] = useState(false);
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});

  // Condition/Disease autocomplete state
  const [diseaseQuery, setDiseaseQuery] = useState(formData.healthProfile.diseaseName || '');
  const [diseaseDropdownOpen, setDiseaseDropdownOpen] = useState(false);
  const diseaseInputRef = useRef<HTMLInputElement>(null);
  const diseaseDropdownRef = useRef<HTMLDivElement>(null);

  // Keep diseaseQuery in sync when formData is reset externally
  useEffect(() => {
    setDiseaseQuery(formData.healthProfile.diseaseName || '');
  }, [formData.healthProfile.diseaseName]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        diseaseDropdownRef.current && !diseaseDropdownRef.current.contains(e.target as Node) &&
        diseaseInputRef.current && !diseaseInputRef.current.contains(e.target as Node)
      ) {
        setDiseaseDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredConditions = diseaseQuery.trim().length === 0
    ? HEALTH_CONDITIONS
    : HEALTH_CONDITIONS.filter(c =>
        c.label.toLowerCase().includes(diseaseQuery.toLowerCase()) ||
        c.synonyms.toLowerCase().includes(diseaseQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(diseaseQuery.toLowerCase())
      );

  const handleSelectCondition = (label: string) => {
    setDiseaseQuery(label);
    setFormData(prev => ({ ...prev, healthProfile: { ...prev.healthProfile, diseaseName: label } }));
    setDiseaseDropdownOpen(false);
    if (validationResult) setValidationResult(null);
  };

  // Health Validation State
  const [isVerifyingHealth, setIsVerifyingHealth] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  // --- Real-time Password Validation ---
  useEffect(() => {
    const pwd = formData.password || '';
    setPasswordCriteria({
      length: pwd.length >= 8,
      hasUpper: /[A-Z]/.test(pwd),
      hasLower: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
    });
  }, [formData.password]);

  const passwordScore = Object.values(passwordCriteria).filter(Boolean).length;

  const getPasswordStrengthColor = () => {
    if (passwordScore <= 2) return 'bg-red-500';
    if (passwordScore <= 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordScore === 0) return '';
    if (passwordScore <= 2) return 'Weak';
    if (passwordScore <= 4) return 'Medium';
    return 'Strong';
  };

  // --- CAPTCHA Logic ---
  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);
    setCaptchaInput(''); 
    
    // Defer drawing to ensure state update doesn't conflict or canvas is ready
    setTimeout(() => drawCaptcha(code), 0);
  };

  const drawCaptcha = (code: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background
    ctx.fillStyle = '#f3f4f6'; // gray-100
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add Noise (Lines)
    for(let i=0; i<7; i++) {
        ctx.strokeStyle = `rgba(0,0,0,${0.1 + Math.random() * 0.2})`;
        ctx.lineWidth = 1 + Math.random();
        ctx.beginPath();
        ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.stroke();
    }

    // Add Noise (Dots)
    for(let i=0; i<30; i++) {
        ctx.fillStyle = `rgba(0,0,0,${0.1 + Math.random() * 0.2})`;
        ctx.beginPath();
        ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1, 0, 2 * Math.PI);
        ctx.fill();
    }

    // Draw Text
    ctx.font = 'bold 24px "Courier New", monospace';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    
    const charWidth = canvas.width / 6;
    for (let i = 0; i < 6; i++) {
        ctx.save();
        const x = (i * charWidth) + (charWidth / 2);
        const y = canvas.height / 2;
        const angle = (Math.random() - 0.5) * 0.4; // Random rotation between -0.2 and 0.2 radians
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillStyle = '#374151'; // gray-700
        ctx.fillText(code[i], 0, 0);
        ctx.restore();
    }
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  // --- Location Logic ---
  const validateAddressField = (field: string, value: string) => {
    let error = '';
    const val = value.trim();
    switch(field) {
        case 'doorNo':
            if (!val) error = 'Door No. / Flat No. is required';
            break;
        case 'landmark':
            if (!val) error = 'Landmark is required';
            break;
        case 'district':
            if (!val) error = 'District / City is required';
            break;
        case 'state':
            if (!val) error = 'State is required';
            break;
        case 'pincode':
            if (!val) error = 'Pincode is required';
            else if (!/^\d{5,6}$/.test(val)) error = 'Enter a valid 5-6 digit pincode';
            break;
    }
    return error;
  };

  const handleGetLocation = async () => {
    setLocationLoading(true);

    // Fill address fields and clear errors
    const fillAddress = (fields: { doorNo?: string; landmark?: string; district?: string; state?: string; pincode?: string; lat: number; lng: number }) => {
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          doorNo: fields.doorNo || prev.address.doorNo || 'Flat 101',
          landmark: fields.landmark || prev.address.landmark || 'Kurla West',
          district: fields.district || 'Mumbai',
          state: fields.state || 'Maharashtra',
          pincode: fields.pincode || '400070',
          lat: fields.lat || 19.0748,
          lng: fields.lng || 72.8856
        }
      }));

      setAddressErrors({
        doorNo: '',
        landmark: '',
        district: '',
        state: '',
        pincode: ''
      });

      setLocationLoading(false);
      showNotification('Location Found', 'Address details auto-filled successfully!', 'success');
    };

    // Server-side IP + reverse geocode fallback
    const tryBackendDetect = async (): Promise<boolean> => {
      try {
        const response: any = await apiClient.get('/users/detect-location');
        if (response && response.district) {
          fillAddress({
            doorNo: response.doorNo || 'Flat 101',
            landmark: response.landmark || 'Kurla West',
            district: response.district || 'Mumbai',
            state: response.state || 'Maharashtra',
            pincode: response.pincode || '400070',
            lat: response.lat || 19.0748,
            lng: response.lng || 72.8856
          });
          return true;
        }
      } catch (err) {
        console.warn('Backend detect-location error:', err);
      }
      return false;
    };

    // Client-side Nominatim reverse-geocode (fallback when backend fails)
    const clientReverseGeocode = async (latitude: number, longitude: number): Promise<boolean> => {
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`;
        const res = await fetch(url);
        if (!res.ok) return false;
        const data = await res.json();
        const addr = data.address || {};
        fillAddress({
          doorNo: addr.house_number || 'Flat 101',
          landmark: addr.suburb || addr.neighbourhood || addr.road || 'Kurla West',
          district: addr.city || addr.town || addr.county || addr.state_district || 'Mumbai',
          state: addr.state || 'Maharashtra',
          pincode: addr.postcode || '400070',
          lat: latitude,
          lng: longitude
        });
        return true;
      } catch {
        return false;
      }
    };

    // Reverse-geocode coordinates to address via backend, with client-side fallback
    const reverseGeocodeAndFill = async (latitude: number, longitude: number) => {
      try {
        const response = await apiClient.post<{doorNo: string, landmark: string, district: string, state: string, pincode: string}>('/users/reverse-geocode', { lat: latitude, lng: longitude });
        fillAddress({ ...response, lat: latitude, lng: longitude });
      } catch (error) {
        console.warn("Backend geocoding failed, trying client-side Nominatim...", error);
        const ok = await clientReverseGeocode(latitude, longitude);
        if (!ok) {
          const backendOk = await tryBackendDetect();
          if (!backendOk) {
            fillAddress({ doorNo: 'Flat 101', landmark: 'Kurla West', district: 'Mumbai', state: 'Maharashtra', pincode: '400070', lat: latitude, lng: longitude });
          }
        }
      }
    };

    // Fallback chain when browser geolocation fails or is denied
    const handleGeoFallback = async () => {
      const backendOk = await tryBackendDetect();
      if (!backendOk) {
        fillAddress({
          doorNo: 'Flat 101',
          landmark: 'Kurla West',
          district: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400070',
          lat: 19.0748,
          lng: 72.8856
        });
      }
    };

    if (!navigator.geolocation) {
      await handleGeoFallback();
      return;
    }

    const success = async (position: GeolocationPosition) => {
      await reverseGeocodeAndFill(position.coords.latitude, position.coords.longitude);
    };

    const error = async (err: GeolocationPositionError) => {
      console.warn('Browser geolocation failed or denied, using IP/backend location detection:', err.message);
      await handleGeoFallback();
    };

    navigator.geolocation.getCurrentPosition(success, error, { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 });
  };

  const geocodeAddress = async () => {
      const { district, state, pincode } = formData.address;
      if (!district && !pincode) return;

      const query = `${district}, ${state}, ${pincode}`;
      try {
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
          const data = await response.json();
          if (data && data.length > 0) {
              setFormData(prev => ({
                  ...prev,
                  address: {
                      ...prev.address,
                      lat: parseFloat(data[0].lat),
                      lng: parseFloat(data[0].lon)
                  }
              }));
          }
      } catch (e) {
          console.warn("Forward geocoding failed", e);
      }
  };

  // --- Form Handling ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // Reset validation when health fields change
    if (name.startsWith('health_')) {
        setValidationResult(null);
    }

    if (name.startsWith('addr_')) {
      const field = name.replace('addr_', '');
      setFormData(prev => ({ ...prev, address: { ...prev.address, [field]: value } }));
      const error = validateAddressField(field, value);
      setAddressErrors(prev => ({ ...prev, [field]: error }));
    } else if (name.startsWith('health_')) {
      const field = name.replace('health_', '');
      if (field === 'age') {
        const numVal = value ? parseInt(value) : undefined;
        setFormData(prev => ({ ...prev, healthProfile: { ...prev.healthProfile, age: isNaN(numVal as number) ? undefined : numVal } }));
      } else {
        setFormData(prev => ({ ...prev, healthProfile: { ...prev.healthProfile, [field]: value } }));
      }
    } else if (name === 'hasIssues') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, healthProfile: { ...prev.healthProfile, hasIssues: checked } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
       if (!formData.firstName || !formData.username || !formData.email || !formData.password || !formData.phone) {
           showNotification('Missing Fields', 'Please fill in all personal details', 'warning');
           return;
       }
       
       if (passwordScore < 5) {
           showNotification('Weak Password', 'Please meet all password requirements.', 'warning');
           return;
       }
       if (formData.password !== confirmPassword) {
           showNotification('Password Mismatch', 'Passwords do not match', 'error');
           return;
       }

       const phoneDigits = formData.phone.replace(/\D/g, ''); 
       if (phoneDigits.length < 8) {
           showNotification('Invalid Phone', 'Please enter a valid phone number.', 'warning');
           return;
       }

       if (!captchaInput || captchaInput.toUpperCase() !== captchaCode) {
           showNotification('Verification Failed', 'Incorrect CAPTCHA code.', 'error');
           generateCaptcha(); 
           return;
       }

       setStep(2);
    } else if (step === 2) {
       const errors: Record<string, string> = {};
       let hasError = false;
       ['doorNo', 'landmark', 'district', 'state', 'pincode'].forEach(field => {
           const val = formData.address[field as keyof typeof formData.address] as string || '';
           const error = validateAddressField(field, val);
           if (error) {
               errors[field] = error;
               hasError = true;
           }
       });
       setAddressErrors(errors);
       if (hasError) {
           showNotification('Invalid Address', 'Please correct the errors.', 'error');
           return;
       }
       if (!formData.address.lat || formData.address.lat === 13.0827) {
           geocodeAddress();
       }
       setStep(3);
    }
  };

  const handleVerifyProfile = async () => {
    const { age, diseaseName, stage, medicines, symptoms, diagnosedBy } = formData.healthProfile;
    if (!age) {
      showNotification('Incomplete', 'Please enter your age', 'warning');
      return;
    }
    if (!diseaseName || !diseaseName.trim()) {
      showNotification('Incomplete', 'Please enter your condition or disease name', 'warning');
      return;
    }
    
    setIsVerifyingHealth(true);
    try {
      const result = await apiClient.post<any>('/users/validate-health', {
        age: Number(age),
        diseaseName: diseaseName.trim(),
        stage: stage || '1',
        medicines: medicines || '',
        symptoms: symptoms || '',
        diagnosedBy: diagnosedBy || 'self'
      });
      
      setValidationResult(result);
      
      // Auto-correct medications if spelling was fixed
      if (result.correctedMedicines && result.correctedMedicines !== medicines) {
        setFormData(prev => ({
          ...prev,
          healthProfile: { ...prev.healthProfile, medicines: result.correctedMedicines }
        }));
      }
      
      // Save dietary memo from AI or clinical contraindications
      const memo = result.analysis?.dietaryMemo || (
        result.dietaryContraindications?.length > 0
          ? `Avoid: ${result.dietaryContraindications.join(', ')}`
          : 'Safe dietary profile'
      );
      setFormData(prev => ({
        ...prev,
        healthProfile: { ...prev.healthProfile, dietaryMemo: memo }
      }));
      
      if (result.valid) {
        if (result.analysisAvailable) {
          showNotification('Verified', 'Health profile analyzed successfully.', 'success');
        } else {
          showNotification('Verified', result.message || 'Health profile validated successfully. AI analysis is temporarily unavailable.', 'info');
        }
      } else {
        showNotification('Review Required', 'Please review the flagged items below.', 'warning');
      }
    } catch (err: any) {
      console.error('Health validation failed:', err);
      if (err.status === 400 || err.code === 'INVALID_HEALTH_PROFILE') {
        showNotification('Invalid Profile', err.message || 'Please check your health profile information.', 'error');
      } else if (err.status === 503) {
        showNotification('Service Unavailable', 'Health validation service is temporarily unavailable. Please try again.', 'error');
      } else {
        showNotification('Validation Note', err.message || 'Unable to connect to health validation service. Please check your connection.', 'warning');
      }
    } finally {
      setIsVerifyingHealth(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // If health issues exist but not verified, force verification first
    if (formData.healthProfile.hasIssues && !validationResult?.valid) {
      showNotification('Action Required', 'Please analyze your health profile first.', 'warning');
      setIsLoading(false);
      return;
    }

    try {
      await register({
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        password: formData.password,
        healthProfile: formData.healthProfile.hasIssues ? formData.healthProfile : undefined
      });

      // We are redirecting to Sign In (Login) page instead of menu directly
      // Passing state so Login page can show a success message
      navigate('/signin', { state: { registered: true, email: formData.email } });
    } catch (err: any) {
      showNotification('Registration Failed', err.message || 'An error occurred during registration', 'error');
      setIsLoading(false);
    }
  };

  const renderPasswordRequirement = (met: boolean, text: string) => (
    <div className={`flex items-center text-xs transition-colors duration-200 ${met ? 'text-green-600' : 'text-gray-400'}`}>
      <div className={`w-3 h-3 rounded-full mr-1.5 flex items-center justify-center border ${met ? 'bg-green-100 border-green-500' : 'bg-gray-100 border-gray-300'}`}>
        {met && <Check size={8} />}
      </div>
      {text}
    </div>
  );

  return (
    <div 
      className="min-h-dvh flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative bg-cover bg-center"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&q=80')" }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Join <span className="text-orange-500">FOODS66</span>
          </h2>
          <p className="mt-2 text-gray-200">
             Your personalized health-focused food journey starts here.
          </p>
        </div>

        <div className="bg-white/95 backdrop-blur-md py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-white/20">
          
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
            <div className={`w-16 h-1 ${step >= 2 ? 'bg-orange-600' : 'bg-gray-200'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
            <div className={`w-16 h-1 ${step >= 3 ? 'bg-orange-600' : 'bg-gray-200'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 3 ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-500'}`}>3</div>
          </div>

          <form onSubmit={handleSubmit}>
            
            {/* --- STEP 1: Account Details --- */}
            {step === 1 && (
              <div className="space-y-4 animate-fadeIn">
                 {/* ... (Previous Step 1 Content: Name, Email, Password, Phone, Captcha) ... */}
                 {/* Re-using existing UI logic for Step 1 for brevity, assumed unchanged except imports */}
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700">First Name</label>
                      <input type="text" name="firstName" required value={formData.firstName} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-lg p-2.5 bg-gray-50 border" placeholder="John" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700">Last Name</label>
                      <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-lg p-2.5 bg-gray-50 border" placeholder="Doe" />
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-gray-700">Username</label>
                    <input type="text" name="username" required value={formData.username} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-lg p-2.5 bg-gray-50 border" placeholder="user123" />
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-gray-700">Email</label>
                    <input type="email" name="email" required value={formData.email} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-lg p-2.5 bg-gray-50 border" placeholder="mail@example.com" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-sm font-bold text-gray-700">Password</label>
                      <input type="password" name="password" required value={formData.password} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-lg p-2.5 bg-gray-50 border" placeholder="••••••" />
                   </div>
                   <div>
                      <label className="block text-sm font-bold text-gray-700">Confirm</label>
                      <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-lg p-2.5 bg-gray-50 border" placeholder="••••••" />
                   </div>
                 </div>
                 <div className="bg-gray-50 p-2 rounded text-xs border">
                    {renderPasswordRequirement(passwordCriteria.length, "8+ chars")}
                    {renderPasswordRequirement(passwordCriteria.hasUpper, "Uppercase")}
                    {renderPasswordRequirement(passwordCriteria.hasNumber, "Number")}
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-gray-700">Phone</label>
                    <div className="flex mt-1">
                      <div className="flex items-center justify-center px-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-100 text-gray-500 font-bold sm:text-sm select-none">
                        +91
                      </div>
                      <input 
                        type="tel" 
                        name="phone" 
                        required 
                        value={formData.phone} 
                        onChange={handleInputChange} 
                        className="block w-full border-gray-300 rounded-r-lg p-2.5 bg-gray-50 border focus:ring-orange-500 focus:border-orange-500" 
                        placeholder="9876543210" 
                        maxLength={10}
                      />
                    </div>
                 </div>
                 
                 <div className="pt-2 border-t mt-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                        <ShieldCheck size={16} className="mr-1 text-orange-600"/> Human Verification
                    </label>
                    <div className="flex gap-2">
                       <div className="bg-gray-200 w-32 h-10 rounded overflow-hidden">
                          <canvas ref={canvasRef} width="128" height="40" className="w-full h-full"></canvas>
                       </div>
                       <button type="button" onClick={generateCaptcha} className="p-2 bg-gray-100 rounded hover:bg-gray-200"><RefreshCw size={16}/></button>
                       <input type="text" value={captchaInput} onChange={(e) => setCaptchaInput(e.target.value)} className="flex-1 border rounded p-2 uppercase font-mono tracking-widest text-center" placeholder="CODE" maxLength={6} />
                    </div>
                 </div>

                 <button type="button" onClick={handleNextStep} className="w-full bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700 transition mt-4 shadow-md">
                    Next: Address Details
                 </button>
              </div>
            )}

            {/* --- STEP 2: Address --- */}
            {step === 2 && (
              <div className="space-y-4 animate-slideInRight">
                {/* Re-using logic, abbreviated for clarity */}
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 flex items-center gap-3">
                   <Navigation size={20} className="text-orange-600" />
                   <span className="text-sm font-bold text-orange-900">Delivery Location</span>
                </div>
                <div>
                   <input type="text" name="addr_doorNo" required value={formData.address.doorNo} onChange={handleInputChange} className="w-full border rounded p-2.5 bg-gray-50" placeholder="Door No." />
                   {addressErrors.doorNo && <p className="text-xs text-red-500">{addressErrors.doorNo}</p>}
                </div>
                <div>
                   <input type="text" name="addr_landmark" value={formData.address.landmark} onChange={handleInputChange} className="w-full border rounded p-2.5 bg-gray-50" placeholder="Landmark" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <input type="text" name="addr_district" required value={formData.address.district} onChange={handleInputChange} className="w-full border rounded p-2.5 bg-gray-50" placeholder="City" />
                   <input type="text" name="addr_pincode" required value={formData.address.pincode} onChange={handleInputChange} className="w-full border rounded p-2.5 bg-gray-50" placeholder="Pincode" />
                </div>
                <div>
                   <input type="text" name="addr_state" required value={formData.address.state} onChange={handleInputChange} className="w-full border rounded p-2.5 bg-gray-50" placeholder="State" />
                </div>
                <button type="button" onClick={handleGetLocation} className="w-full py-2 border-2 border-orange-500 text-orange-600 rounded-lg font-bold flex justify-center items-center gap-2">
                  {locationLoading ? <Loader size={16} className="animate-spin" /> : <MapPin size={16} />} Use Current Location
                </button>
                <div className="flex gap-4 mt-6">
                  <button type="button" onClick={() => setStep(1)} className="w-1/2 bg-gray-300 text-gray-700 py-3 rounded-lg font-bold">Back</button>
                  <button type="button" onClick={handleNextStep} className="w-1/2 bg-orange-600 text-white py-3 rounded-lg font-bold">Next</button>
                </div>
              </div>
            )}

            {/* --- STEP 3: Health Profile (Enhanced) --- */}
            {step === 3 && (
              <div className="space-y-6 animate-slideInRight">
                 <div className="text-center">
                    <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                       <Activity size={32} className="text-orange-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Disease Verification</h3>
                    <p className="text-sm text-gray-500">Analyze your condition to get accurate recommendations.</p>
                 </div>

                 <div className="bg-white p-4 rounded-xl border-2 border-orange-100 shadow-sm">
                    <label className="flex items-center cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                      <input 
                        type="checkbox" 
                        name="hasIssues" 
                        checked={formData.healthProfile.hasIssues} 
                        onChange={handleInputChange} 
                        className="w-6 h-6 text-orange-600 rounded focus:ring-orange-500 border-gray-300" 
                      />
                       <span className="ml-3 font-bold text-gray-800">I have specific health concerns</span>
                     </label>

                     {formData.healthProfile.hasIssues && (
                       <div className="mt-4 space-y-4 pl-2 border-l-2 border-orange-200 ml-3 animate-fadeIn">

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                               <label className="block text-sm font-bold text-gray-700">Age *</label>
                               <input type="number" name="health_age" value={formData.healthProfile.age || ''} onChange={handleInputChange} placeholder="e.g. 30" className="mt-1 block w-full border-gray-300 rounded-lg p-2.5 bg-gray-50 focus:ring-orange-500" min="1" max="120" />
                            </div>

                            <div className="relative">
                               <label className="block text-sm font-bold text-gray-700">Condition / Disease *</label>
                               <div className="relative mt-1">
                                 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                 <input
                                   ref={diseaseInputRef}
                                   type="text"
                                   value={diseaseQuery}
                                   onChange={e => {
                                     setDiseaseQuery(e.target.value);
                                     setFormData(prev => ({ ...prev, healthProfile: { ...prev.healthProfile, diseaseName: e.target.value } }));
                                     setDiseaseDropdownOpen(true);
                                     if (validationResult) setValidationResult(null);
                                   }}
                                   onFocus={() => setDiseaseDropdownOpen(true)}
                                   placeholder="Search… e.g. Diabetes, Hypertension"
                                   className="block w-full border border-gray-300 rounded-lg pl-8 pr-8 py-2.5 bg-gray-50 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none text-sm"
                                 />
                                 {diseaseQuery && (
                                   <button type="button" onClick={() => { setDiseaseQuery(''); setFormData(prev => ({ ...prev, healthProfile: { ...prev.healthProfile, diseaseName: '' } })); setDiseaseDropdownOpen(true); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                     <XIcon size={14} />
                                   </button>
                                 )}
                               </div>
                               {diseaseDropdownOpen && (
                                 <div ref={diseaseDropdownRef} className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                                   {filteredConditions.length === 0 ? (
                                     <div className="px-4 py-3 text-xs text-gray-400 italic">No match — your entry will be used as-is</div>
                                   ) : (
                                     (() => {
                                       const categories = [...new Set(filteredConditions.map(c => c.category))];
                                       return categories.map(cat => (
                                         <div key={cat}>
                                           <div className="px-3 py-1 text-[10px] font-bold text-orange-500 uppercase tracking-wider bg-orange-50 sticky top-0">{cat}</div>
                                           {filteredConditions.filter(c => c.category === cat).map(cond => (
                                             <button key={cond.label} type="button" onMouseDown={e => { e.preventDefault(); handleSelectCondition(cond.label); }} className="w-full text-left px-4 py-2 hover:bg-orange-50 transition group">
                                               <div className="text-sm font-semibold text-gray-800 group-hover:text-orange-700">{cond.label}</div>
                                               <div className="text-[10px] text-gray-400 truncate">{cond.synonyms}</div>
                                             </button>
                                           ))}
                                         </div>
                                       ));
                                     })()
                                   )}
                                   {diseaseQuery.trim() && !HEALTH_CONDITIONS.find(c => c.label.toLowerCase() === diseaseQuery.toLowerCase()) && (
                                     <button type="button" onMouseDown={e => { e.preventDefault(); handleSelectCondition(diseaseQuery.trim()); }} className="w-full text-left px-4 py-2.5 border-t bg-gray-50 hover:bg-orange-50 transition text-sm text-orange-700 font-semibold">
                                       + Use "{diseaseQuery.trim()}" as custom condition
                                     </button>
                                   )}
                                 </div>
                               )}
                            </div>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                               <label className="block text-sm font-bold text-gray-700">Stage / Severity</label>
                               <select name="health_stage" value={formData.healthProfile.stage} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-lg p-2.5 bg-gray-50 focus:ring-orange-500">
                                 <option value="1">Stage 1 - Beginning / Mild</option>
                                 <option value="2">Stage 2 - Intermediate / Moderate</option>
                                 <option value="3">Stage 3 - Advanced / Severe</option>
                               </select>
                            </div>

                            <div>
                               <label className="block text-sm font-bold text-gray-700">Diagnosed By</label>
                               <select name="health_diagnosedBy" value={formData.healthProfile.diagnosedBy} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-lg p-2.5 bg-gray-50 focus:ring-orange-500">
                                 <option value="self">Self-Diagnosed / Suspected</option>
                                 <option value="physician">Healthcare Professional</option>
                               </select>
                            </div>
                         </div>

                        <div>
                           <label className="block text-sm font-bold text-gray-700">Medications Taking</label>
                           <textarea name="health_medicines" value={formData.healthProfile.medicines} onChange={handleInputChange} placeholder="List medicines..." className="mt-1 block w-full border-gray-300 rounded-lg p-2.5 bg-gray-50 focus:ring-orange-500 h-16 resize-none" />
                        </div>

                        <div>
                           <label className="block text-sm font-bold text-gray-700">Current Symptoms <span className="text-gray-400 font-normal">(Optional)</span></label>
                           <textarea name="health_symptoms" value={formData.healthProfile.symptoms} onChange={handleInputChange} placeholder="Any specific symptoms you're currently experiencing?" className="mt-1 block w-full border-gray-300 rounded-lg p-2.5 bg-gray-50 focus:ring-orange-500 h-16 resize-none" />
                        </div>

                        {/* Analyze Button */}
                        <button 
                            type="button" 
                            onClick={handleVerifyProfile}
                            disabled={isVerifyingHealth}
                            className={`w-full text-white py-3 rounded-lg font-bold transition flex justify-center items-center shadow-md mt-4 ${validationResult ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                        >
                            {isVerifyingHealth ? <Loader size={18} className="animate-spin mr-2"/> : (validationResult ? <RefreshCw size={18} className="mr-2" /> : <Sparkles size={18} className="mr-2" />)}
                            {isVerifyingHealth ? 'Analyzing Profile...' : (validationResult ? 'Re-Analyze Profile' : 'Analyze Health Profile')}
                        </button>
                      </div>
                    )}
                 </div>

                {/* --- Enhanced Validation Result Display --- */}
                {validationResult && formData.healthProfile.hasIssues && (
                   <div className="space-y-4 animate-fadeIn">
                      
                      {/* Red Flags Alert */}
                      {validationResult.redFlags?.length > 0 && (
                        <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-lg shadow-sm">
                          <div className="flex items-start">
                            <AlertTriangle className="text-red-600 mt-0.5 mr-3 flex-shrink-0" size={24} />
                            <div>
                              <h4 className="text-red-800 font-bold text-lg mb-2">Urgent Attention Required</h4>
                              <ul className="space-y-3">
                                {validationResult.redFlags.map((flag: any, i: number) => (
                                  <li key={i} className="text-red-700 text-sm">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-bold bg-red-200 text-red-900 px-2 py-0.5 rounded text-xs">
                                        {flag.urgency === 'IMMEDIATE' ? 'EMERGENCY' : flag.urgency === 'WITHIN_24H' ? 'URGENT (24h)' : 'SCHEDULE APPT'}
                                      </span>
                                      <span className="font-semibold uppercase tracking-wide">{flag.symptom}</span>
                                    </div>
                                    <p>{flag.action}</p>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Main Validation Card */}
                      <div className={`p-5 rounded-xl border-t-4 shadow-md bg-white ${validationResult.valid ? 'border-green-500' : 'border-amber-500'}`}>
                         
                         {/* Header & Confidence Score */}
                         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-gray-100 gap-4">
                            <div className="flex items-center gap-3">
                               {validationResult.valid ? <ShieldCheck className="text-green-500" size={32} /> : <AlertCircle className="text-amber-500" size={32} />}
                               <div>
                                   <h4 className={`text-xl font-bold ${validationResult.valid ? 'text-green-800' : 'text-amber-800'}`}>
                                       {validationResult.valid ? 'Profile Validated' : 'Review Required'}
                                   </h4>
                                   <p className="text-xs text-gray-500 mt-0.5">Automated dietary safety check</p>
                               </div>
                            </div>
                            
                            <div className="w-full md:w-48">
                               <div className="flex justify-between text-xs mb-1 font-semibold text-gray-600">
                                 <span>Confidence Score</span>
                                 <span>{Math.round(validationResult.confidenceScore * 100)}%</span>
                               </div>
                               <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full transition-all duration-1000 ease-out ${validationResult.confidenceScore >= 0.8 ? 'bg-green-500' : validationResult.confidenceScore >= 0.5 ? 'bg-amber-500' : 'bg-red-500'}`} 
                                    style={{ width: `${Math.round(validationResult.confidenceScore * 100)}%` }}
                                  ></div>
                               </div>
                            </div>
                         </div>

                         {/* Structured Summary (if valid) */}
                         {validationResult.valid && validationResult.structuredSummary && (
                            <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                               <h5 className="font-bold text-gray-800 flex items-center gap-2 mb-3"><FileText size={18} className="text-indigo-500"/> Profile Summary</h5>
                               <div className="grid grid-cols-2 gap-y-2 text-sm">
                                 <div className="text-gray-500">Condition:</div>
                                 <div className="font-semibold text-gray-800">{validationResult.structuredSummary.patientData.condition}</div>
                                 <div className="text-gray-500">Stage:</div>
                                 <div className="font-semibold text-gray-800">{validationResult.structuredSummary.patientData.stage}</div>
                               </div>
                               
                               <div className="mt-4 pt-3 border-t border-gray-200">
                                 <span className="font-bold uppercase text-xs block text-green-700 mb-1 flex items-center gap-1"><Heart size={14}/> Dietary Guidance</span>
                                 <p className="text-sm text-gray-700 bg-white p-2 rounded border border-gray-100">{validationResult.structuredSummary.dietaryGuidance}</p>
                               </div>
                            </div>
                         )}

                         {/* Validation Checks */}
                         <div className="mb-6">
                            <h5 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Validation Checks</h5>
                            <div className="space-y-2">
                               {validationResult.checks.map((check: any, idx: number) => (
                                 <div key={idx} className={`flex items-start gap-2 text-sm p-2 rounded-md ${check.passed ? 'bg-green-50/50 text-green-800' : check.severity === 'critical' ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-800'}`}>
                                    {check.passed ? <CheckCircle size={16} className="mt-0.5 text-green-500 shrink-0"/> : check.severity === 'critical' ? <AlertTriangle size={16} className="mt-0.5 text-red-500 shrink-0"/> : <AlertCircle size={16} className="mt-0.5 text-amber-500 shrink-0"/>}
                                    <span className={check.passed ? 'text-green-700' : check.severity === 'critical' ? 'text-red-700 font-medium' : 'text-amber-700'}>{check.message}</span>
                                 </div>
                               ))}
                            </div>
                         </div>

                         {/* Escalation & Next Steps */}
                         {validationResult.escalation?.shouldConsultDoctor && (
                           <div className="mb-6 bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-start gap-3">
                             <Stethoscope className="text-blue-600 mt-1 shrink-0" size={24} />
                             <div>
                               <h5 className="font-bold text-blue-900 mb-1">Medical Consultation Recommended</h5>
                               <p className="text-sm text-blue-800 mb-2">{validationResult.escalation.reason}</p>
                               <div className="flex flex-wrap gap-2 text-xs">
                                 {validationResult.escalation.specialtyRecommended && (
                                   <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded font-semibold flex items-center gap-1"><Star size={12}/> {validationResult.escalation.specialtyRecommended}</span>
                                 )}
                                 {validationResult.escalation.timeframe && (
                                   <span className="bg-white text-blue-700 border border-blue-200 px-2 py-1 rounded flex items-center gap-1"><Clock size={12}/> {validationResult.escalation.timeframe}</span>
                                 )}
                               </div>
                             </div>
                           </div>
                         )}

                         {/* References */}
                         {validationResult.references?.length > 0 && (
                            <div className="mt-6 pt-4 border-t border-gray-100">
                               <h5 className="font-bold text-gray-500 text-xs uppercase tracking-wide mb-2">Clinical Guidelines Referenced</h5>
                               <ul className="space-y-1">
                                 {validationResult.references.map((ref: any, idx: number) => (
                                   <li key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                                     <ExternalLink size={12} className="mt-0.5 text-gray-400 shrink-0"/>
                                     <div>
                                       {ref.url ? (
                                         <a href={ref.url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">{ref.title}</a>
                                       ) : (
                                         <span className="font-medium">{ref.title}</span>
                                       )}
                                       <span className="text-gray-400 ml-1">({ref.source})</span>
                                     </div>
                                   </li>
                                 ))}
                               </ul>
                            </div>
                         )}
                      </div>
                   </div>
                )}

                {/* Liability Disclaimer */}
                {validationResult?.valid && formData.healthProfile.hasIssues && (
                    <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg animate-fadeIn">
                       <label className="flex items-start cursor-pointer">
                           <input 
                               type="checkbox" 
                               checked={acceptedDisclaimer}
                               onChange={(e) => setAcceptedDisclaimer(e.target.checked)}
                               className="mt-1 w-5 h-5 text-orange-600 rounded focus:ring-orange-500 border-gray-300"
                           />
                           <span className="ml-3 text-sm text-gray-600">
                               <strong>Disclaimer:</strong> I understand that this platform provides dietary suggestions, not medical advice, diagnosis, or treatment. I will consult my physician before changing my diet.
                           </span>
                       </label>
                    </div>
                )}

                <div className="flex gap-4 mt-6">
                  <button type="button" onClick={() => setStep(2)} className="w-1/2 bg-gray-300 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-400 transition" disabled={isVerifyingHealth}>Back</button>
                  <button 
                    type="submit" 
                    disabled={isVerifyingHealth || isLoading || (formData.healthProfile.hasIssues && !validationResult?.valid) || (formData.healthProfile.hasIssues && validationResult?.valid && !acceptedDisclaimer)}
                    className={`w-1/2 bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700 transition flex justify-center items-center shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isLoading ? <Loader size={20} className="animate-spin" /> : 'Complete Registration'}
                  </button>
                </div>
              </div>
            )}
            
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/signin" className="font-bold text-orange-600 hover:text-orange-500">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;