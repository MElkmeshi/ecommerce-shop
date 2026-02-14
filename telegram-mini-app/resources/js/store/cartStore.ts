import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: number;
  productVariantId?: number;
  name: string;
  variantDisplay?: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  stock: number;
  sku?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: number, productVariantId?: number) => void;
  updateQuantity: (productId: number, quantity: number, productVariantId?: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) => {
        const items = get().items;
        // Match by both productId and productVariantId (if variant exists)
        const existingItem = items.find((item) =>
          item.productId === product.productId &&
          item.productVariantId === product.productVariantId
        );

        if (existingItem) {
          // Increase quantity if item already in cart
          const newQuantity = Math.min(existingItem.quantity + 1, product.stock);
          set({
            items: items.map((item) =>
              item.productId === product.productId &&
              item.productVariantId === product.productVariantId
                ? { ...item, quantity: newQuantity }
                : item
            ),
          });
        } else {
          // Add new item to cart
          set({
            items: [...items, { ...product, quantity: 1 }],
          });
        }
      },

      removeItem: (productId, productVariantId) => {
        set({
          items: get().items.filter((item) =>
            !(item.productId === productId && item.productVariantId === productVariantId)
          ),
        });
      },

      updateQuantity: (productId, quantity, productVariantId) => {
        if (quantity <= 0) {
          get().removeItem(productId, productVariantId);
          return;
        }

        set({
          items: get().items.map((item) => {
            if (item.productId === productId && item.productVariantId === productVariantId) {
              // Don't exceed stock
              const newQuantity = Math.min(quantity, item.stock);
              return { ...item, quantity: newQuantity };
            }
            return item;
          }),
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage', // LocalStorage key
    }
  )
);
