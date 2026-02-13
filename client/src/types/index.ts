export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  stock: number;
  categoryId: number;
  categoryName?: string;
  categorySlug?: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  createdAt: Date | string;
}

export interface Order {
  id: number;
  userId: number;
  phoneNumber: string;
  location: string;
  totalAmount: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date | string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
  createdAt: Date | string;
}

export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  allows_write_to_pm?: boolean;
}
