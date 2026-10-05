'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, type Product, type Category } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProductCard } from '@/components/product-card';
import { formatPrice } from '@/lib/format';
import { ArrowLeft, ShoppingBag, Heart, Minus, Plus, CheckCircle2, Clock, Truck, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { useWishlist } from '@/lib/wishlist-context';
import { toast } from 'sonner';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart, setIsOpen } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!params.id) return;

      const { data: prod } = await supabase
        .from('products')
        .select('*, category:categories(*)')
        .eq('id', params.id)
        .maybeSingle();

      if (prod) {
        setProduct(prod as Product);
        setCategory((prod as any).category as Category);

        // Fetch recommendations from same category
        if ((prod as any).category_id) {
          const { data: recs } = await supabase
            .from('products')
            .select('*, category:categories(*)')
            .eq('category_id', (prod as any).category_id)
            .eq('is_available', true)
            .neq('id', params.id)
            .limit(4);
          setRecommendations((recs as Product[]) ?? []);
        }
      }

      setLoading(false);
    }
    fetchData();
  }, [params.id]);

  const wished = product ? isInWishlist(product.id) : false;

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please sign in to add items to your cart');
      router.push('/login');
      return;
    }
    if (!product) return;

    setAdding(true);
    try {
      await addToCart(product, quantity);
      toast.success(`${quantity}x ${product.name} added to your cart`);
      setIsOpen(true); // Open the cart drawer so the user sees the item added
    } catch (err) {
      console.error(err);
      toast.error('Failed to add item to cart');
    } finally {
      setAdding(false);
    }
  };

  const handleWishlist = async () => {
    if (!user) {
      toast.error('Please sign in to add to your wishlist');
      router.push('/login');
      return;
    }
    if (!product) return;

    await toggleWishlist(product);
    toast.success(wished ? 'Removed from wishlist' : 'Added to wishlist');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-32" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="aspect-[4/3] bg-muted rounded-2xl" />
            <div className="space-y-4">
              <div className="h-6 bg-muted rounded w-24" />
              <div className="h-10 bg-muted rounded w-3/4" />
              <div className="h-8 bg-muted rounded w-1/3" />
              <div className="h-24 bg-muted rounded w-full" />
              <div className="h-12 bg-muted rounded w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h2 className="text-2xl font-bold mb-2">Dish Not Found</h2>
        <p className="text-muted-foreground mb-6">The item you are looking for is no longer available on our menu.</p>
        <Link href="/menu">
          <Button className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Menu
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back to Menu */}
      <Link href="/menu" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to menu
      </Link>

      {/* Main Product Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 mb-16 items-start">
        {/* Left Column: Dish Image */}
        <div className="lg:col-span-6">
          <div className="relative aspect-[4/3] sm:aspect-[16/11] rounded-2xl overflow-hidden bg-muted border border-border shadow-md">
            {product.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No image preview available
              </div>
            )}
            {!product.is_available && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Badge variant="secondary" className="text-sm px-3 py-1 font-semibold">
                  Currently Sold Out
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Dish Info & Add to Cart Controls */}
        <div className="lg:col-span-6 flex flex-col space-y-6">
          <div>
            {category && (
              <Badge variant="outline" className="mb-2 bg-primary/5 text-primary border-primary/20 text-xs font-semibold">
                {category.name}
              </Badge>
            )}
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              {product.name}
            </h1>
            <p className="text-3xl font-extrabold text-primary mt-3">
              {formatPrice(product.price)}
            </p>
          </div>

          {product.description && (
            <div className="border-t border-b border-border/70 py-4">
              <p className="text-muted-foreground leading-relaxed text-base">
                {product.description}
              </p>
            </div>
          )}

          {/* Highlights */}
          <div className="grid grid-cols-2 gap-4 py-1">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-muted-foreground">
              <Clock className="w-4 h-4 text-primary flex-shrink-0" />
              <span>Ready in 20 minutes</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
              <span>Freshly cooked to order</span>
            </div>
          </div>

          {/* Quantity Selector & Add to Cart */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold">Quantity:</span>
              <div className="flex items-center border border-border rounded-lg bg-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || !product.is_available}
                  className="p-2.5 hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 font-semibold text-sm min-w-[2.5rem] text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  disabled={!product.is_available}
                  className="p-2.5 hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span className="text-sm text-muted-foreground font-medium">
                Total: <strong className="text-foreground">{formatPrice(product.price * quantity)}</strong>
              </span>
            </div>

            <div className="flex gap-3">
              <Button
                size="lg"
                onClick={handleAddToCart}
                disabled={!product.is_available || adding}
                className="flex-1 h-12 text-base gap-2 font-semibold shadow-md shadow-primary/20"
              >
                <ShoppingBag className="w-5 h-5" />
                {adding ? 'Adding to Cart...' : product.is_available ? 'Add to Cart' : 'Out of Stock'}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleWishlist}
                className="h-12 w-12 p-0 border-border"
                title={wished ? 'Remove from wishlist' : 'Save to wishlist'}
              >
                <Heart className={`w-5 h-5 ${wished ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="border-t border-border pt-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">You Might Also Like</h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Other popular items from {category?.name ?? 'our kitchen'}</p>
            </div>
            <Link href="/menu">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                View Full Menu
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendations.map((rec) => (
              <ProductCard key={rec.id} product={rec} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
