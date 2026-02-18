export interface VariantType {
  id: number;
  name: string; // Translated by backend based on locale
  variant_values: VariantValue[];
}

export interface VariantValue {
  id: number;
  variant_type_id: number;
  value: string; // Translated by backend based on locale
  variant_type?: VariantType;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  price: number;
  stock: number;
  display_name: string;
  variant_values: VariantValue[];
}

export interface Product {
  id: number;
  name: string; // Translated by backend based on locale
  description?: string; // Translated by backend based on locale
  price?: number; // Display price from primary variant
  image_url?: string;
  thumb_url?: string;
  preview_url?: string;
  stock?: number; // Display stock from primary variant
  variant_count?: number; // Number of variants
  product_variants?: ProductVariant[];
  category_id: number;
  category: {
    id: number;
    name: string; // Translated by backend based on locale
  };
  brand_id?: number;
  brand?: {
    id: number;
    name: string; // Translated by backend based on locale
  };
}

export interface Category {
  id: number;
  name: string; // Translated by backend based on locale
}

export interface Brand {
  id: number;
  name: string; // Translated by backend based on locale
}

export interface Order {
  id: number;
  total_amount: number;
  delivery_fee: number;
  delivery_distance: number | null;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  payment_method: 'cash' | 'credit_card';
  payment_status: 'pending' | 'paid' | 'failed' | 'cancelled';
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
