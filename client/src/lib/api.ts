import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add Telegram initData to requests
api.interceptors.request.use((config) => {
  try {
    // Get raw initData from Telegram WebApp
    const rawInitData = window.Telegram?.WebApp?.initData;

    if (rawInitData) {
      config.headers['x-telegram-init-data'] = rawInitData;
    }
  } catch (err) {
    console.warn('Failed to get Telegram initData:', err);
  }

  return config;
});

// Admin API client (with JWT token)
export const adminApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to admin requests
adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// API methods
export const getProducts = async (params?: {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
}) => {
  const response = await api.get('/products', { params });
  return response.data;
};

export const getProductById = async (id: number) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

export const getCategories = async () => {
  const response = await api.get('/categories');
  return response.data;
};

export const createOrder = async (orderData: {
  phoneNumber: string;
  location: any;
  items: Array<{ productId: number; quantity: number }>;
}) => {
  const response = await api.post('/orders', orderData);
  return response.data;
};

export const getUserOrders = async () => {
  const response = await api.get('/orders');
  return response.data;
};

// Admin API methods
export const adminLogin = async (credentials: { username: string; password: string }) => {
  const response = await adminApi.post('/admin/login', credentials);
  return response.data;
};

export const getAdminProducts = async () => {
  const response = await adminApi.get('/admin/products');
  return response.data;
};

export const createProduct = async (productData: any) => {
  const response = await adminApi.post('/admin/products', productData);
  return response.data;
};

export const updateProduct = async (id: number, productData: any) => {
  const response = await adminApi.put(`/admin/products/${id}`, productData);
  return response.data;
};

export const deleteProduct = async (id: number) => {
  const response = await adminApi.delete(`/admin/products/${id}`);
  return response.data;
};

export const getAdminOrders = async () => {
  const response = await adminApi.get('/admin/orders');
  return response.data;
};

export const createCategory = async (categoryData: { name: string; slug: string }) => {
  const response = await adminApi.post('/admin/categories', categoryData);
  return response.data;
};

export const updateCategory = async (id: number, categoryData: { name: string; slug: string }) => {
  const response = await adminApi.put(`/admin/categories/${id}`, categoryData);
  return response.data;
};

export const deleteCategory = async (id: number) => {
  const response = await adminApi.delete(`/admin/categories/${id}`);
  return response.data;
};
