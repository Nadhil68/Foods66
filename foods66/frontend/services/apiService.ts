import { apiClient, API_BASE_URL } from './apiClient';

// Upload API
export const uploadAPI = {
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return apiClient.post<{ imageUrl: string }>('/upload', formData);
  }
};

// Users API
export const usersAPI = {
  getAll: () => apiClient.get<any[]>('/users'),
  getById: (id: string) => apiClient.get<any>(`/users/${id}`),
  update: (id: string, data: unknown) => apiClient.put<any>(`/users/${id}`, data),
  updateProfile: (data: unknown) => apiClient.put<any>('/users/profile', data),
  delete: (id: string) => apiClient.delete<{ success: boolean; message: string }>(`/users/${id}`),
  getMe: () => apiClient.get<{ user: any }>('/users/me')
};

// Foods API
export const foodsAPI = {
  getAll: (category?: string) => {
    const endpoint = category ? `/foods?category=${encodeURIComponent(category)}` : '/foods';
    return apiClient.get<any[]>(endpoint);
  },
  getById: (id: string) => apiClient.get<any>(`/foods/${id}`),
  create: (data: unknown) => apiClient.post<any>('/foods', data),
  update: (id: string, data: unknown) => apiClient.put<any>(`/foods/${id}`, data),
  delete: (id: string) => apiClient.delete<{ message: string }>(`/foods/${id}`),
  searchAggregate: (params: { category?: string; minPrice?: number; maxPrice?: number; sort?: string }) => {
    const query = new URLSearchParams();
    if (params.category) query.set('category', params.category);
    if (params.minPrice) query.set('minPrice', params.minPrice.toString());
    if (params.maxPrice) query.set('maxPrice', params.maxPrice.toString());
    if (params.sort) query.set('sort', params.sort);
    return apiClient.get<any[]>(`/foods/search/aggregate?${query.toString()}`);
  }
};

// Orders API (Module 2)
export const ordersAPI = {
  getAll: (status?: string) => {
    const endpoint = status ? `/orders?status=${encodeURIComponent(status)}` : '/orders';
    return apiClient.get<{ success: boolean; count: number; orders: any[] }>(endpoint);
  },
  getById: (id: string) => apiClient.get<{ success: boolean; order: any }>(`/orders/${id}`),
  create: (payload: {
    items: Array<{ foodId: string; quantity: number; customization?: any }>;
    deliveryAddress: any;
    couponCode?: string;
    paymentMethod?: 'CARD' | 'COD' | 'UPI';
    specialInstructions?: string;
  }, idempotencyKey?: string) => apiClient.post<{ success: boolean; orderId: string; order: any; calculation: any }>('/orders', payload, {
    headers: idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : {}
  }),
  updateStatus: (id: string, status: string, note?: string) => 
    apiClient.put<{ success: boolean; message: string; order: any }>(`/orders/${id}/status`, { status, note }),
  cancel: (id: string, reason?: string) => 
    apiClient.put<{ success: boolean; message: string; order: any }>(`/orders/${id}/status`, { status: 'CANCELLED', note: reason || 'Customer requested cancellation' })
};

// Payments API (Module 1)
export const paymentsAPI = {
  createSession: (payload: {
    items: Array<{ foodId: string; quantity: number; customization?: any }>;
    deliveryAddress: any;
    couponCode?: string;
    paymentMethod?: 'CARD' | 'COD' | 'UPI';
    specialInstructions?: string;
  }, idempotencyKey?: string) => {
    return apiClient.post<{
      success: boolean;
      sessionId?: string;
      sessionUrl?: string;
      orderId: string;
      calculation: {
        subtotal: number;
        deliveryFee: number;
        tax: number;
        discountAmount: number;
        grandTotal: number;
      };
    }>('/payments/create-session', payload, {
      headers: idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : {}
    });
  },
  verify: (orderId: string) =>
    apiClient.post<{ success: boolean; orderId: string; status: string; paymentStatus: string; message?: string }>(`/payments/verify/${orderId}`),
  getStatus: (orderId: string) => 
    apiClient.get<{
      success: boolean;
      orderId: string;
      sessionId?: string;
      status: string;
      paymentStatus: string;
      paymentMethod: string;
      totalPrice: number;
      createdAt: string;
    }>(`/payments/status/${orderId}`)
};

// Delivery API (Module 3)
export const deliveriesAPI = {
  getAll: (status?: string) => {
    const endpoint = status ? `/deliveries?status=${encodeURIComponent(status)}` : '/deliveries';
    return apiClient.get<{ success: boolean; count: number; deliveries: any[] }>(endpoint);
  },
  getAvailable: () => apiClient.get<{ success: boolean; count: number; orders: any[] }>('/deliveries/available'),
  getById: (id: string) => apiClient.get<{ success: boolean; delivery: any; order?: any }>(`/deliveries/${id}`),
  getTracking: (orderId: string) => apiClient.get<any>(`/deliveries/tracking/${orderId}`),
  assign: (orderId: string, driverId: string) => 
    apiClient.post<{ success: boolean; message: string; delivery: any; order: any }>('/deliveries/assign', { orderId, driverId }),
  accept: (orderId: string) => 
    apiClient.post<{ success: boolean; message: string; delivery: any }>('/deliveries/accept', { orderId }),
  reject: (orderId: string, reason?: string) => 
    apiClient.post<{ success: boolean; message: string }>('/deliveries/reject', { orderId, reason }),
  pickup: (orderId: string) => 
    apiClient.post<{ success: boolean; message: string; delivery: any; order: any }>('/deliveries/pickup', { orderId }),
  outForDelivery: (orderId: string) => 
    apiClient.post<{ success: boolean; message: string; delivery: any; order: any }>('/deliveries/out-for-delivery', { orderId }),
  delivered: (orderId: string) => 
    apiClient.post<{ success: boolean; message: string; delivery: any; order: any }>('/deliveries/delivered', { orderId }),
  updateLocation: (id: string, coordinates: [number, number]) => 
    apiClient.put<{ success: boolean; currentLocation: [number, number] }>(`/deliveries/${id}/location`, { coordinates })
};

// Coupons API (Module 4)
export const couponsAPI = {
  validate: (code: string, items?: any[], subtotal?: number) =>
    apiClient.post<{
      success: boolean;
      coupon: any;
      discountAmount: number;
      deliveryFeeDiscount: number;
      finalSubtotal: number;
    }>('/coupons/validate', { code, items, subtotal }),
  apply: (code: string, items?: any[], subtotal?: number) =>
    apiClient.post<{
      success: boolean;
      message: string;
      coupon: any;
      discountAmount: number;
      deliveryFeeDiscount: number;
    }>('/coupons/apply', { code, items, subtotal }),
  remove: () => apiClient.post<{ success: boolean; message: string }>('/coupons/remove'),
  getAll: () => apiClient.get<{ success: boolean; count: number; coupons: any[] }>('/coupons'),
  create: (couponData: any) => apiClient.post<{ success: boolean; message: string; coupon: any }>('/coupons', couponData),
  update: (id: string, couponData: any) => apiClient.put<{ success: boolean; message: string; coupon: any }>(`/coupons/${id}`, couponData),
  delete: (id: string) => apiClient.delete<{ success: boolean; message: string }>(`/coupons/${id}`)
};

// Analytics & Reports API (Module 5)
export const analyticsAPI = {
  getOverview: (range = 'last30days', startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ range });
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    return apiClient.get<{
      success: boolean;
      range: { start: string; end: string };
      kpis: {
        totalRevenue: number;
        todayRevenue: number;
        monthlyRevenue: number;
        totalOrders: number;
        todayOrders: number;
        completedOrders: number;
        cancelledOrders: number;
        averageOrderValue: number;
        activeDeliveries: number;
        deliveredOrders: number;
        couponUsageCount: number;
        couponDiscountTotal: number;
        paymentSuccessRate: number;
        deliverySuccessRate: number;
        totalUsers: number;
      };
    }>(`/analytics/overview?${params.toString()}`);
  },
  getRevenue: (range = 'last30days', startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ range });
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    return apiClient.get<{ success: boolean; data: Array<{ date: string; revenue: number; orders: number; discountGiven: number }> }>(`/analytics/revenue?${params.toString()}`);
  },
  getOrders: (range = 'last30days', startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ range });
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    return apiClient.get<{
      success: boolean;
      statusDistribution: Array<{ status: string; count: number }>;
      hourlyOrders: Array<{ hour: string; orders: number }>;
      orderTrends: Array<{ date: string; orders: number }>;
    }>(`/analytics/orders?${params.toString()}`);
  },
  getFoods: (range = 'last30days', startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ range });
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    return apiClient.get<{
      success: boolean;
      topFoods: Array<{ name: string; category: string; orders: number; revenue: number }>;
      categoryDistribution: Array<{ category: string; count: number }>;
    }>(`/analytics/foods?${params.toString()}`);
  },
  getCustomers: () => 
    apiClient.get<{
      success: boolean;
      totalCustomers: number;
      segments: Array<{ name: string; count: number; revenue: number }>;
    }>('/analytics/customers'),
  getDelivery: () => 
    apiClient.get<{
      success: boolean;
      deliveryStatusDist: Array<{ status: string; count: number }>;
      drivers: any[];
    }>('/analytics/delivery'),
  exportReport: async (type: string, format = 'csv', range = 'last30days', startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ type, format, range });
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    
    if (format === 'csv') {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/analytics/export?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `foods66_${type}_report_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } else {
      return apiClient.get<any>(`/analytics/export?${params.toString()}`);
    }
  }
};

// Health Validation API
export const healthValidationAPI = {
  getStatus: () => 
    apiClient.get<{ success: boolean; service: string; backend: boolean; ai: boolean }>('/health-validation/status'),
  analyze: (data: {
    age: number;
    condition?: string;
    diseaseName?: string;
    severity?: string;
    stage?: string;
    diagnosedBy?: string;
    medications?: string;
    medicines?: string;
    symptoms?: string;
  }) => apiClient.post<any>('/users/validate-health', data)
};

