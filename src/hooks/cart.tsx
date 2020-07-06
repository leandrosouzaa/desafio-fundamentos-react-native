import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

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
      const productsInStorage = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );
      if (productsInStorage) {
        setProducts(JSON.parse(productsInStorage));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const productsUpdated = products.map(p => {
        if (p.id === id) {
          p.quantity += 1;
        }
        return p;
      });

      await setProducts(productsUpdated);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(productsUpdated),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const product = products.find(p => p.id === id);

      if (product?.quantity <= 1) {
        const productsDeleted = products.filter(p => p.id !== id);
        setProducts(productsDeleted);

        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify(productsDeleted),
        );

        return products;
      }

      const productsUpdated = products.map(p => {
        if (p.id === id) {
          p.quantity -= 1;
        }
        return p;
      });

      await setProducts(productsUpdated);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(productsUpdated),
      );

      return products;
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const checkProductExistInCart = products.find(p => product.id === p.id);

      if (checkProductExistInCart) {
        increment(product.id);
        return;
      }

      setProducts([...products, { ...product, quantity: 1 }]);
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [increment, products],
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
