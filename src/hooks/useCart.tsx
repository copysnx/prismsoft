import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface CartItem {
  productId: string;
  productSlug: string;
  productName: string;
  productImage: string;
  variationId: string;
  variationName: string;
  price: number;
  originalPrice?: number;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: string, variationId: string) => void;
  updateQuantity: (productId: string, variationId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  discount: number;
  total: number;
  couponCode: string | null;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'prism-cart';
const COUPON_STORAGE_KEY = 'prism-coupon';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });
  
  const [couponCode, setCouponCode] = useState<string | null>(() => {
    return localStorage.getItem(COUPON_STORAGE_KEY);
  });

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (couponCode) {
      localStorage.setItem(COUPON_STORAGE_KEY, couponCode);
    } else {
      localStorage.removeItem(COUPON_STORAGE_KEY);
    }
  }, [couponCode]);

  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      const existingIndex = prev.findIndex(
        i => i.productId === item.productId && i.variationId === item.variationId
      );
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        return updated;
      }
      
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeItem = (productId: string, variationId: string) => {
    setItems(prev => prev.filter(
      i => !(i.productId === productId && i.variationId === variationId)
    ));
  };

  const updateQuantity = (productId: string, variationId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId, variationId);
      return;
    }
    
    setItems(prev => prev.map(item => 
      item.productId === productId && item.variationId === variationId
        ? { ...item, quantity }
        : item
    ));
  };

  const clearCart = () => {
    setItems([]);
    setCouponCode(null);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Simple coupon system - 10% off with code "PRISM10"
  const discount = couponCode === 'PRISM10' ? subtotal * 0.1 : 0;
  
  const total = subtotal - discount;

  const applyCoupon = (code: string): boolean => {
    const upperCode = code.toUpperCase();
    if (upperCode === 'PRISM10') {
      setCouponCode(upperCode);
      return true;
    }
    return false;
  };

  const removeCoupon = () => {
    setCouponCode(null);
  };

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalItems,
      subtotal,
      discount,
      total,
      couponCode,
      applyCoupon,
      removeCoupon
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
