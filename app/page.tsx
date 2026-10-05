'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, type Category, type Product } from '@/lib/supabase';
import { ProductCard } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  UtensilsCrossed,
  Truck,
  Clock,
  Star,
  CheckCircle2,
  ChefHat,
  Leaf,
  HeartHandshake,
  ShieldCheck,
  Instagram,
  Facebook,
  Twitter,
  MapPin,
  Phone,
  Mail,
  Navigation,
  ExternalLink,
} from 'lucide-react';

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [{ data: cats }, { data: prods }] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order'),
        supabase
          .from('products')
          .select('*, category:categories(*)')
          .eq('is_available', true)
          .order('sort_order')
          .limit(8),
      ]);
      setCategories((cats as Category[]) ?? []);
      setProducts((prods as Product[]) ?? []);
      setLoading(false);
    }
    fetchData();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* 1. SIMPLE 2-GRID HERO SECTION (100vh) */}
      <section className="min-h-screen w-full flex items-center justify-center pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Column: Text & CTAs */}
            <div className="flex flex-col justify-center space-y-6">
              <span className="text-sm font-semibold tracking-wider text-primary uppercase">
                Welcome to Amy's FreshBites
              </span>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
                Delicious food made from fresh ingredients every day.
              </h1>

              <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                Enjoy a flavorful selection of dishes crafted by passionate chefs. Order online for quick pickup or dine in with family and friends.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link href="/menu">
                  <Button size="lg" className="text-base px-8 h-12 gap-2">
                    View Menu
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/menu">
                  <Button size="lg" variant="outline" className="text-base px-8 h-12">
                    Order Online
                  </Button>
                </Link>
              </div>

              {/* Quick Perks */}
              <div className="pt-4 flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>Fresh Daily</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>Fast Pickup</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>100% Quality</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Image */}
            <div className="w-full h-full flex items-center justify-center">
              <div className="relative w-full aspect-[4/3] sm:aspect-[16/11] rounded-2xl overflow-hidden shadow-xl border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80"
                  alt="Delicious food spread at Amy's FreshBites"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORIES SECTION */}
      {categories.length > 0 && (
        <section className="py-16 bg-muted/40 border-y border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-xl mx-auto mb-10">
              <h2 className="text-3xl font-bold tracking-tight">Browse by Category</h2>
              <p className="text-muted-foreground mt-2 text-sm">Pick your favorite category and discover our fresh menu</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/menu?category=${cat.slug}`}
                  className="px-6 py-2.5 rounded-full border border-border bg-card hover:border-primary hover:text-primary transition-colors text-sm font-medium shadow-sm"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. POPULAR DISHES SECTION */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Popular Dishes</h2>
            <p className="text-muted-foreground mt-1 text-sm">Customer favorites crafted to perfection</p>
          </div>
          <Link href="/menu" className="hidden sm:block">
            <Button variant="outline" className="gap-2">
              See All Dishes
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-4 space-y-3">
                <div className="aspect-[4/3] bg-muted animate-pulse rounded-lg" />
                <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        <div className="mt-8 text-center sm:hidden">
          <Link href="/menu">
            <Button variant="outline" className="w-full">
              See All Dishes
            </Button>
          </Link>
        </div>
      </section>

      {/* 4. ABOUT US & OUR STORY */}
      <section className="py-20 bg-muted/30 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Image */}
            <div className="rounded-2xl overflow-hidden border border-border shadow-md aspect-[4/3]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1000&q=80"
                alt="Chefs cooking in Amy's kitchen"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Right Story Text */}
            <div className="space-y-6">
              <span className="text-sm font-semibold tracking-wider text-primary uppercase">
                Our Story & Philosophy
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Fresh, Wholesome & Cooked with Real Passion
              </h2>
              <p className="text-muted-foreground text-base leading-relaxed">
                At Amy's FreshBites, we believe good food starts with simple, honest ingredients. We partner with local farmers and suppliers to bring you dishes that taste incredible and fuel your everyday lifestyle.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
                  <Leaf className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm">Locally Sourced</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Farm fresh produce picked daily.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
                  <ChefHat className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm">Artisan Recipes</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Authentic recipes made from scratch.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. LOCATIONS SECTION (2 BRANCH LOCATIONS WITH GOOGLE MAP EMBEDS) */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full border-t border-border">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-sm font-semibold tracking-wider text-primary uppercase">
            Visit Us In Person
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-1">
            Our Restaurant Locations
          </h2>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Drop by any of our two branches to dine in, say hello, or pick up your hot online order.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Location 1: Osu / Main Branch */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm flex flex-col">
            <div className="w-full h-64 bg-muted relative">
              <iframe
                title="Amy's FreshBites - Osu Branch"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15884.053896574945!2d-0.185671!3d5.558362!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfdf9084b2b7a77d%3A0x6a0907e4dc68a2d!2sOsu%2C%20Accra%2C%20Ghana!5e0!3m2!1sen!2sgh!4v1700000000000!5m2!1sen!2sgh"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full"
              />
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xl font-bold">Osu Central Branch</h3>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
                    Main Kitchen
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-2 mt-2">
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Oxford Street, Osu, Accra, Ghana</span>
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1.5">
                  <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>+233 24 123 4567</span>
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1.5">
                  <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Mon - Sun: 8:00 AM - 10:30 PM</span>
                </p>
              </div>
              <div className="pt-2">
                <a
                  href="https://maps.google.com/?q=Osu,+Accra,+Ghana"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button variant="outline" className="w-full gap-2 text-sm">
                    <Navigation className="w-4 h-4" />
                    Get Directions
                    <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                  </Button>
                </a>
              </div>
            </div>
          </div>

          {/* Location 2: East Legon Branch */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm flex flex-col">
            <div className="w-full h-64 bg-muted relative">
              <iframe
                title="Amy's FreshBites - East Legon Branch"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15881.092795819793!2d-0.158298!3d5.635832!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfdf9b772c67425f%3A0xbfa6f8ca310246a!2sEast%20Legon%2C%20Accra%2C%20Ghana!5e0!3m2!1sen!2sgh!4v1700000000000!5m2!1sen!2sgh"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full"
              />
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xl font-bold">East Legon Branch</h3>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
                    Garden Lounge
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-2 mt-2">
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Lagos Avenue, East Legon, Accra, Ghana</span>
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1.5">
                  <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>+233 50 987 6543</span>
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1.5">
                  <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Mon - Sun: 9:00 AM - 11:00 PM</span>
                </p>
              </div>
              <div className="pt-2">
                <a
                  href="https://maps.google.com/?q=East+Legon,+Accra,+Ghana"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button variant="outline" className="w-full gap-2 text-sm">
                    <Navigation className="w-4 h-4" />
                    Get Directions
                    <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. HOW IT WORKS / ORDERING STEPS */}
      <section className="py-20 bg-muted/20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-sm font-semibold tracking-wider text-primary uppercase">Simple & Fast</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-1">How It Works</h2>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">Order your favorite food in 3 effortless steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border shadow-sm">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl mb-5">
                1
              </div>
              <h3 className="text-lg font-bold mb-2">Explore Menu</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Browse through our fresh categories and select the dishes and drinks you love.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border shadow-sm">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl mb-5">
                2
              </div>
              <h3 className="text-lg font-bold mb-2">Order & Pay</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Easily customize your items, checkout securely online, and select your pickup time.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border shadow-sm">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl mb-5">
                3
              </div>
              <h3 className="text-lg font-bold mb-2">Pick Up & Enjoy</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your meal will be freshly cooked, packed hot, and waiting for you with zero wait time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. TRUE BLACK FOOTER WITH LIGHTER SHADE "AMY'S" */}
      <footer className="bg-black text-white pt-16 pb-12 mt-auto border-t border-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Footer Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-neutral-800">
            {/* Col 1: About & Info */}
            <div className="md:col-span-2 space-y-4">
              <h3 className="text-2xl font-bold tracking-tight text-white">Amy's FreshBites</h3>
              <p className="text-neutral-400 text-sm max-w-md leading-relaxed">
                Fresh ingredients, handcrafted recipes, and fast pickup across 2 convenient branches in Accra. Join us for a delightful culinary journey everyday.
              </p>
              <div className="flex items-center gap-4 pt-2">
                <a href="#" className="w-9 h-9 rounded-full bg-neutral-900 hover:bg-neutral-800 flex items-center justify-center text-white transition-colors border border-neutral-800">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-neutral-900 hover:bg-neutral-800 flex items-center justify-center text-white transition-colors border border-neutral-800">
                  <Facebook className="w-4 h-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-neutral-900 hover:bg-neutral-800 flex items-center justify-center text-white transition-colors border border-neutral-800">
                  <Twitter className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Col 2: Navigation Links */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-neutral-200">Quick Links</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li>
                  <Link href="/menu" className="hover:text-white transition-colors">Full Menu</Link>
                </li>
                <li>
                  <Link href="/orders" className="hover:text-white transition-colors">Order Status</Link>
                </li>
                <li>
                  <Link href="/wishlist" className="hover:text-white transition-colors">Saved Favorites</Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-white transition-colors">Owner Dashboard</Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Contact Details */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-neutral-200">Our Branches</h4>
              <div className="space-y-2.5 text-sm text-neutral-400">
                <p className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>Branch 1: Oxford Street, Osu, Accra</span>
                </p>
                <p className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>Branch 2: Lagos Avenue, East Legon, Accra</span>
                </p>
                <p className="flex items-center gap-2 pt-1">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>Mon - Sun: 8:00 AM - 11:00 PM</span>
                </p>
              </div>
            </div>
          </div>

          {/* BIG BOLD BRAND TEXT: "AMY'S" IN A LIGHTER SHADE OF BLACK (DARK CHARCOAL / NEUTRAL TONE) */}
          <div className="pt-12 pb-6 text-center select-none overflow-hidden">
            <h1 className="text-[17vw] sm:text-[15vw] md:text-[14vw] font-black uppercase tracking-tighter leading-none text-neutral-800/80 hover:text-neutral-700 transition-colors">
              AMY'S
            </h1>
          </div>

          {/* Copyright line */}
          <div className="pt-6 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
            <p>© {new Date().getFullYear()} Amy's FreshBites. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
