
export enum FoodCategory {
  VEG = 'Veg',
  NON_VEG = 'Non-Veg',
  DRINKS = 'Drinks',
  COFFEE = 'Coffee',
  DESSERT = 'Ice Creams & Dessert',
  GYM_COMBO = 'Gym Combo',
  HEALTHY_COMBO = 'Healthy Combo'
}

export type DietaryTag = 'Vegan' | 'Gluten-Free' | 'High-Protein' | 'Low-Carb';

export interface HealthProfile {
  hasIssues: boolean;
  diseaseName?: string;
  stage?: '1' | '2' | '3'; // 1: Beginning, 2: Intermediate, 3: Advanced
  medicines?: string;
  age?: number; // Added age field
  symptoms?: string; // Free-text symptoms for red flag detection
  diagnosedBy?: 'self' | 'physician'; // Source of diagnosis
  dietaryMemo?: string; // New field for AI generated dietary advice
  healthy_level?: 'low' | 'medium' | 'high';
  disease_level?: 'none' | 'hypertension' | 'diabetes' | 'heart_disease' | 'other';
}

export interface Address {
  doorNo: string;
  landmark: string;
  district: string;
  state: string;
  pincode: string;
  lat?: number;
  lng?: number;
}

export interface User {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  password?: string; // Added password field for authentication
  profileImage?: string; // New field for profile picture (Base64 or URL)
  role?: 'admin' | 'user' | 'restaurant' | 'delivery';
  address: Address;
  healthProfile: HealthProfile;
}

export interface CoffeeCustomization {
  sugarSpoons: number;
  powderLevel: 'Mild' | 'Medium' | 'Strong';
  temperature: 'Hot' | 'Cold' | 'Lukewarm';
}

export interface Ingredient {
  name: string;
  amount: string;
}

export interface FoodItem {
  id: string;
  _id?: string;
  name: string;
  description: string;
  price: number;
  category: FoodCategory;
  image: string;
  isVegetarian: boolean;
  isRecommendedForHealth?: boolean; // Dynamically set
  isDietitianRecommended?: boolean; // New field for static expert recommendation
  calories?: number;
  protein?: number;
  carbs?: number;
  customizationAvailable?: boolean; // For coffee
  isCookedToOrder?: boolean;
  ingredients?: Ingredient[];
  dietaryTags?: DietaryTag[]; // Added dietary tags
  healthTags?: string[]; // Added for explicit health-related risks
  
  // New Fields
  rating?: number;
  reviewCount?: number;
  restaurantName?: string;
  restaurantLocation?: string;
  originalPrice?: number; // For showing discounts
  
  // Specific Macro Nutrients for Health Alerts
  sugar?: number; // grams
  sodium?: number; // mg
  fat?: number; // grams
  healthScore?: number; // 0-100
}

export interface CartItem extends FoodItem {
  quantity: number;
  customization?: CoffeeCustomization;
}

export type DeliveryVehicle = 'Bike' | 'Scooter' | 'Cycle' | 'Walking';

export interface Order {
  id: string;
  username: string; // Linked to User
  date: string; // ISO Date String
  items: CartItem[];
  total: number;
  status: 'Preparing' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  deliveryBoy?: {
    name: string;
    vehicle: DeliveryVehicle;
    location: { lat: number; lng: number }; // Simulated
    etaMinutes: number;
  };
  specialInstructions?: string; // Added field for order notes
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

export interface ActionLog {
  id: string;
  username: string;
  action: 'REGISTER' | 'LOGIN' | 'LOGOUT' | 'ADD_TO_CART' | 'PLACE_ORDER' | 'CANCEL_ORDER' | 'UPDATE_PROFILE' | 'SYSTEM';
  details: string;
  timestamp: string;
}
