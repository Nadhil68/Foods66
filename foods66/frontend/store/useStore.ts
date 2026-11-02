import { create } from 'zustand';
import { User, AppNotification, CartItem, Order, DeliveryVehicle, FoodItem } from '../types';
import { db, DB_KEYS } from '../utils/db';
import { getHealthRecommendations } from '../services/geminiService';

// --- Notifications Store ---
interface NotificationState {
  notifications: AppNotification[];
  showNotification: (title: string, message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  removeNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  showNotification: (title, message, type = 'info') => {
    const id = Date.now().toString() + Math.random().toString();
    set((state) => ({ notifications: [...state.notifications, { id, title, message, type }] }));
    setTimeout(() => get().removeNotification(id), 5000);
  },
  removeNotification: (id) => {
    set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) }));
  },
}));

// --- Auth Store ---
interface AuthState {
  user: User | null;
  registerUser: (user: User) => boolean;
  loginUser: (username: string, password?: string) => boolean;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
  syncAuthUser: (authUser: any) => void;
}

const DEFAULT_USER: User = {
  firstName: 'Guest',
  lastName: 'User',
  username: 'guest',
  email: 'guest@foods66.com',
  phone: '9876543210',
  role: 'user',
  address: {
    doorNo: '12A',
    landmark: 'Anna Nagar',
    district: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600040',
    lat: 13.0827,
    lng: 80.2707
  },
  healthProfile: { hasIssues: false }
};

const getActiveUser = (): User => {
  let u = db.get<User | null>(DB_KEYS.SESSION, null);
  if (!u) {
    u = DEFAULT_USER;
    db.set(DB_KEYS.SESSION, u);
  }
  if (!u.healthProfile) u.healthProfile = { hasIssues: false };
  return u;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: getActiveUser(),
  registerUser: (newUser) => {
    const users = db.get<User[]>(DB_KEYS.USERS, []);
    if (users.some(u => u.username.toLowerCase() === newUser.username.toLowerCase())) {
        useNotificationStore.getState().showNotification('Error', 'Username exists', 'error');
        return false;
    }
    db.set(DB_KEYS.USERS, [...users, newUser]);
    return true;
  },
  loginUser: (username, password) => {
    const users = db.get<User[]>(DB_KEYS.USERS, []);
    const foundUser = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    if (foundUser && (!foundUser.password || foundUser.password === password)) {
        if (!foundUser.healthProfile) {
            foundUser.healthProfile = { hasIssues: false };
        }
        set({ user: foundUser });
        db.set(DB_KEYS.SESSION, foundUser);
        
        // Trigger initialization of other stores
        useCartStore.getState().init(foundUser);
        useAppStore.getState().init(foundUser);
        return true;
    }
    return false;
  },
  logout: () => {
    set({ user: DEFAULT_USER });
    localStorage.removeItem(DB_KEYS.SESSION);
    useCartStore.getState().init(DEFAULT_USER);
    useAppStore.getState().init(DEFAULT_USER);
  },
  updateUser: (updatedUser) => {
    set({ user: updatedUser });
    db.set(DB_KEYS.SESSION, updatedUser);
    const users = db.get<User[]>(DB_KEYS.USERS, []);
    db.set(DB_KEYS.USERS, users.map(u => u.username === updatedUser.username ? updatedUser : u));
  },
  syncAuthUser: (authUser) => {
    if (!authUser) {
      set({ user: DEFAULT_USER });
      db.set(DB_KEYS.SESSION, DEFAULT_USER);
      return;
    }
    
    const users = db.get<User[]>(DB_KEYS.USERS, []);
    let foundUser = users.find(u => u.email === authUser.email || u.username === authUser.email.split('@')[0]);
    
    if (!foundUser) {
      // Create local profile if it doesn't exist
      foundUser = {
        firstName: authUser.name.split(' ')[0] || '',
        lastName: authUser.name.split(' ').slice(1).join(' ') || '',
        username: authUser.email.split('@')[0],
        email: authUser.email,
        phone: '9876543210',
        role: authUser.role,
        address: DEFAULT_USER.address,
        healthProfile: { hasIssues: false }
      };
      db.set(DB_KEYS.USERS, [...users, foundUser]);
    } else {
      // Update role and name from backend
      foundUser.role = authUser.role;
      foundUser.firstName = authUser.name.split(' ')[0] || foundUser.firstName;
    }
    
    set({ user: foundUser });
    db.set(DB_KEYS.SESSION, foundUser);
    
    // Trigger initialization of other stores
    useCartStore.getState().init(foundUser);
    useAppStore.getState().init(foundUser);
  },
}));

// --- Cart Store ---
interface CartState {
  cart: CartItem[];
  orders: Order[];
  activeOrder: Order | null;
  deliveryVehicle: DeliveryVehicle;
  init: (user: User | null) => void;
  addToCart: (item: FoodItem, qty: number, customization?: any) => void;
  updateQuantity: (itemId: string, qty: number) => void;
  removeFromCart: (itemId: string) => void;
  removeInvalidItems: () => void;
  validateCartWithServer: () => Promise<{ hasStale: boolean; removedCount: number }>;
  clearCart: () => void;
  reorder: (items: CartItem[]) => void;
  placeOrder: (deliveryAddress: string, specialInstructions?: string) => void;
  cancelOrder: (orderId: string) => void;
  setDeliveryVehicle: (vehicle: DeliveryVehicle) => void;
}

export const useCartStore = create<CartState>((set, get) => {
  const initialUser = getActiveUser();
  const initialCart = db.get<CartItem[]>(`${DB_KEYS.CART_PREFIX}${initialUser.username}`, []);
  const allOrders = db.get<Order[]>(DB_KEYS.ORDERS, []);
  const initialOrders = allOrders.filter(o => o.username === initialUser.username);
  const initialActive = initialOrders.find(o => o.status === 'Preparing' || o.status === 'Out for Delivery') || null;

  return {
    cart: initialCart,
    orders: initialOrders,
    activeOrder: initialActive,
    deliveryVehicle: 'Bike',
    init: (user) => {
      const targetUser = user || getActiveUser();
      const cart = db.get<CartItem[]>(`${DB_KEYS.CART_PREFIX}${targetUser.username}`, []);
      const allOrders = db.get<Order[]>(DB_KEYS.ORDERS, []);
      const userOrders = allOrders.filter(o => o.username === targetUser.username);
      const active = userOrders.find(o => o.status === 'Preparing' || o.status === 'Out for Delivery');
      set({ cart, orders: userOrders, activeOrder: active || null });
    },
    addToCart: (item, qty, customization) => {
      const user = useAuthStore.getState().user || getActiveUser();
      if (!useAuthStore.getState().user) {
        useAuthStore.setState({ user });
      }
      const canonicalId = item._id || item.id;
      const canonicalItem: FoodItem = {
        ...item,
        id: canonicalId,
        _id: canonicalId
      };

      set((state) => {
        const existingIdx = state.cart.findIndex(p => (p._id || p.id) === canonicalId && JSON.stringify(p.customization) === JSON.stringify(customization));
        const updated = [...state.cart];
        if (existingIdx > -1) {
          updated[existingIdx].quantity += qty;
        } else {
          updated.push({ ...canonicalItem, quantity: qty, customization });
        }
        db.set(`${DB_KEYS.CART_PREFIX}${user.username}`, updated);
        return { cart: updated };
      });
      useNotificationStore.getState().showNotification('Added', `${qty}x ${item.name}`, 'success');
    },
    updateQuantity: (itemId, qty) => {
      const user = useAuthStore.getState().user || getActiveUser();
      set((state) => {
        let updated: CartItem[];
        if (qty <= 0) {
          updated = state.cart.filter(item => (item._id || item.id) !== itemId && item.id !== itemId);
        } else {
          updated = state.cart.map(item => {
            if ((item._id || item.id) === itemId || item.id === itemId) {
              return { ...item, quantity: qty };
            }
            return item;
          });
        }
        db.set(`${DB_KEYS.CART_PREFIX}${user.username}`, updated);
        return { cart: updated };
      });
    },
    removeFromCart: (itemId) => {
      const user = useAuthStore.getState().user || getActiveUser();
      set((state) => {
        const updated = state.cart.filter(item => (item._id || item.id) !== itemId && item.id !== itemId);
        db.set(`${DB_KEYS.CART_PREFIX}${user.username}`, updated);
        return { cart: updated };
      });
    },
    removeInvalidItems: () => {
      const user = useAuthStore.getState().user || getActiveUser();
      set((state) => {
        const updated = state.cart.filter(item => {
          const id = item._id || item.id;
          return id && /^[0-9a-fA-F]{24}$/.test(id) && !id.startsWith('ITEM-');
        });
        db.set(`${DB_KEYS.CART_PREFIX}${user.username}`, updated);
        return { cart: updated };
      });
      useNotificationStore.getState().showNotification('Cart Updated', 'Removed outdated items from your cart.', 'info');
    },
    validateCartWithServer: async () => {
      const user = useAuthStore.getState().user || getActiveUser();
      const currentCart = get().cart;
      if (currentCart.length === 0) return { hasStale: false, removedCount: 0 };

      try {
        const { foodsAPI } = await import('../services/apiService');
        const foods = await foodsAPI.getAll();
        if (!Array.isArray(foods) || foods.length === 0) return { hasStale: false, removedCount: 0 };

        const foodMap = new Map(foods.map((f: any) => [f._id?.toString(), f]));
        let removedCount = 0;
        const validCart: CartItem[] = [];

        for (const item of currentCart) {
          const foodId = item._id || item.id;
          if (!foodId || foodId.startsWith('ITEM-') || !foodMap.has(foodId)) {
            removedCount++;
            continue;
          }
          const serverFood = foodMap.get(foodId);
          if (serverFood && serverFood.available !== false) {
            validCart.push({
              ...item,
              id: serverFood._id,
              _id: serverFood._id,
              name: serverFood.name,
              price: serverFood.price,
              image: serverFood.image,
              category: serverFood.category,
              quantity: Math.min(item.quantity, serverFood.stock !== undefined ? serverFood.stock : item.quantity)
            });
          } else {
            removedCount++;
          }
        }

        if (removedCount > 0) {
          set({ cart: validCart });
          db.set(`${DB_KEYS.CART_PREFIX}${user.username}`, validCart);
          useNotificationStore.getState().showNotification('Cart Refreshed', `${removedCount} outdated or unavailable item(s) were removed.`, 'warning');
        }

        return { hasStale: removedCount > 0, removedCount };
      } catch (err) {
        console.warn('Failed to sync cart with server:', err);
        return { hasStale: false, removedCount: 0 };
      }
    },
    clearCart: () => {
      const user = useAuthStore.getState().user || getActiveUser();
      set({ cart: [] });
      db.set(`${DB_KEYS.CART_PREFIX}${user.username}`, []);
    },
    reorder: (items) => {
      items.forEach(i => get().addToCart(i, i.quantity, i.customization));
    },
    placeOrder: (deliveryAddress, specialInstructions) => {
      const user = useAuthStore.getState().user || getActiveUser();
      const { cart, deliveryVehicle } = get();
      if (!cart || cart.length === 0) return;
    
    const total = cart.reduce((acc, i) => acc + i.price * i.quantity, 0) + 40 + Math.round(cart.reduce((acc, i) => acc + i.price * i.quantity, 0) * 0.05);
    const order: Order = {
      id: `ORD-${Date.now()}`,
      username: user.username,
      date: new Date().toISOString(),
      items: [...cart],
      total,
      status: 'Preparing',
      deliveryBoy: { name: 'Ramesh', vehicle: deliveryVehicle, location: { lat: 13.0, lng: 80.2 }, etaMinutes: 25 },
      specialInstructions
    };
    
    set((state) => ({ orders: [order, ...state.orders], activeOrder: order }));
    db.set(DB_KEYS.ORDERS, [order, ...db.get<Order[]>(DB_KEYS.ORDERS, [])]);
    get().clearCart();
    
    setTimeout(() => {
        set((state) => ({
            orders: state.orders.map(o => o.id === order.id ? { ...o, status: 'Out for Delivery' } : o),
            activeOrder: state.activeOrder?.id === order.id ? { ...state.activeOrder, status: 'Out for Delivery' } : state.activeOrder
        }));
        useNotificationStore.getState().showNotification('Update', 'Order Out for Delivery', 'info');
    }, 10000);
    setTimeout(() => {
        set((state) => ({
            orders: state.orders.map(o => o.id === order.id ? { ...o, status: 'Delivered' } : o),
            activeOrder: state.activeOrder?.id === order.id ? { ...state.activeOrder, status: 'Delivered' } : state.activeOrder
        }));
        useNotificationStore.getState().showNotification('Update', 'Order Delivered', 'success');
    }, 20000);
  },
  cancelOrder: (orderId) => {
    set((state) => ({
        orders: state.orders.map(o => o.id === orderId ? { ...o, status: 'Cancelled' } : o),
        activeOrder: state.activeOrder?.id === orderId ? { ...state.activeOrder, status: 'Cancelled' } : state.activeOrder
    }));
    const all = db.get<Order[]>(DB_KEYS.ORDERS, []);
    db.set(DB_KEYS.ORDERS, all.map(o => o.id === orderId ? { ...o, status: 'Cancelled' } : o));
    useNotificationStore.getState().showNotification('Cancelled', 'Order cancelled', 'warning');
  },
  setDeliveryVehicle: (vehicle) => set({ deliveryVehicle: vehicle }),
  };
});

// --- App Store ---
interface AppState {
  recommendations: FoodItem[];
  isLoadingRecommendations: boolean;
  isOfflineMode: boolean;
  recommendationsError: string | null;
  init: (user: User | null) => void;
  refreshRecommendations: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  recommendations: [],
  isLoadingRecommendations: false,
  isOfflineMode: false,
  recommendationsError: null,
  init: (user) => {
    if (user) {
      get().refreshRecommendations();
    } else {
      set({ recommendations: [] });
    }
  },
  refreshRecommendations: async () => {
    const { user } = useAuthStore.getState();
    if (!user || !user.healthProfile.hasIssues || !user.healthProfile.diseaseName) {
        set({ recommendations: [] });
        return;
    }
    
    set({ isLoadingRecommendations: true, recommendationsError: null });
    const key = `${DB_KEYS.RECS_PREFIX}${user.username}`;

    try {
        const recs = await getHealthRecommendations(user.healthProfile);
        set({ recommendations: recs, isOfflineMode: false, isLoadingRecommendations: false });
        db.set(key, recs);
    } catch (e: any) {
        console.warn("AI Service unavailable, switching to Offline Heuristic Engine.", e);
        set({ isOfflineMode: true });
        
        try {
            const { foodsAPI } = await import('../services/apiService');
            const allFoods = await foodsAPI.getAll();
            
            const worker = new Worker(new URL('../workers/recommendationWorker.ts', import.meta.url), { type: 'module' });
            
            worker.onmessage = (e) => {
                set({ recommendations: e.data, isLoadingRecommendations: false });
                worker.terminate();
            };
            worker.postMessage({ healthProfile: user.healthProfile, pool: allFoods });
        } catch (err) {
            set({ recommendations: [], isLoadingRecommendations: false });
        }
    }
  }
}));

// Seed a default admin user if no users exist yet - Removed, backend handles seeding

// Initialize stores with the user if they were already logged in (on page load)
const initialUser = db.get<User | null>(DB_KEYS.SESSION, null);
if (initialUser && !initialUser.healthProfile) {
  initialUser.healthProfile = { hasIssues: false };
  db.set(DB_KEYS.SESSION, initialUser);
}
useCartStore.getState().init(initialUser);
useAppStore.getState().init(initialUser);
