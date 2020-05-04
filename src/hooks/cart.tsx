import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

import produce from 'immer';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storageProducts = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );
      if (storageProducts) {
        setProducts(JSON.parse(storageProducts));
      }
    }
    loadProducts();
  }, []);

  useEffect(() => {
    async function updateStoredProducts(): Promise<void> {
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    }

    updateStoredProducts();
  }, [products]);

  const addToCart = useCallback(
    async product => {
      setProducts(
        produce(products, draft => {
          const productIndex = products.findIndex(p => p.id === product.id);
          if (productIndex >= 0) {
            draft[productIndex].quantity += 1;
          } else {
            draft.push({ ...product, quantity: 1 });
          }
        }),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      setProducts(
        produce(products, draft => {
          const productIndex = draft.findIndex(p => p.id === id);
          draft[productIndex].quantity += 1;
        }),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      setProducts(
        produce(products, draft => {
          const productIndex = draft.findIndex(p => p.id === id);
          draft[productIndex].quantity -= 1;
        }),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
