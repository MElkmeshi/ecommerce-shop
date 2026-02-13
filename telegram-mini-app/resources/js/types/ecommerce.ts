export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  thumb_url?: string;
  preview_url?: string;
  stock: number;
  category: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Order {
  id: number;
  total_amount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  phone_number: string;
  location: any;
  created_at: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  price: number;
  subtotal: number;
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
