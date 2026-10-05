'use client';

import { Heart, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/lib/cart-context';
import { useWishlist } from '@/lib/wishlist-context';
import { useAuth } from '@/lib/auth-context';
import { formatPrice } from '@/lib/format';
import type { Product } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();
  const wished = isInWishlist(product.id);

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please sign in to add items to your cart');
      return;
    }
    await addToCart(product);
    toast.success(`${product.name} added to cart`);
  };

  const handleWishlist = async () => {
    if (!user) {
      toast.error('Please sign in to use your wishlist');
      return;
    }
    await toggleWishlist(product);
    toast.success(wished ? 'Removed from wishlist' : 'Added to wishlist');
  };

  return (
    <Link href={`/products/${product.id}`} className="group relative bg-card rounded-xl border border-border overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/30 flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {product.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        )}
        {!product.is_available && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="secondary" className="text-sm">Unavailable</Badge>
          </div>
        )}
        {user && (
          <button
            onClick={(e) => { e.preventDefault(); handleWishlist(); }}
            className={cn(
              'absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-sm',
              wished
                ? 'bg-primary text-primary-foreground scale-100'
                : 'bg-white/80 text-foreground hover:bg-white scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100'
            )}
            aria-label="Toggle wishlist"
          >
            <Heart className={cn('w-4 h-4', wished && 'fill-current')} />
          </button>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-base leading-tight">{product.name}</h3>
        {product.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2 flex-1">
            {product.description}
          </p>
        )}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
          <span className="text-lg font-bold text-primary">{formatPrice(product.price)}</span>
          <Button
            size="sm"
            onClick={(e) => { e.preventDefault(); handleAddToCart(); }}
            disabled={!product.is_available}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>
      </div>
    </Link>
  );
}
