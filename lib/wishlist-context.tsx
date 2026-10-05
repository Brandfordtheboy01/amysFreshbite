'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, type WishlistItem, type Product } from './supabase';
import { useAuth } from './auth-context';

type WishlistContextType = {
  items: WishlistItem[];
  loading: boolean;
  toggleWishlist: (product: Product) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  count: number;
};

const WishlistContext = createContext<WishlistContextType>({
  items: [],
  loading: false,
  toggleWishlist: async () => {},
  isInWishlist: () => false,
  count: 0,
});

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('wishlist_items')
      .select('*, product:products(*)')
      .eq('user_id', user.id);
    setItems((data as WishlistItem[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const toggleWishlist = useCallback(
    async (product: Product) => {
      if (!user) return;
      const existing = items.find((i) => i.product_id === product.id);
      if (existing) {
        await supabase.from('wishlist_items').delete().eq('id', existing.id);
      } else {
        await supabase.from('wishlist_items').insert({
          user_id: user.id,
          product_id: product.id,
        });
      }
      fetchWishlist();
    },
    [user, items, fetchWishlist]
  );

  const isInWishlist = useCallback(
    (productId: string) => items.some((i) => i.product_id === productId),
    [items]
  );

  return (
    <WishlistContext.Provider
      value={{ items, loading, toggleWishlist, isInWishlist, count: items.length }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
