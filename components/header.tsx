'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, ShoppingBag, Heart, User, LogOut, LayoutDashboard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { useCart } from '@/lib/cart-context';
import { useWishlist } from '@/lib/wishlist-context';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname();
  const { totalItems, setIsOpen } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { user, isOwner, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/menu', label: 'Menu' },
    { href: '/orders', label: 'My Orders' },
  ];

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
        scrolled
          ? 'bg-background/90 backdrop-blur-md shadow-sm border-b border-border'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-2 group py-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/logonb.png"
              alt="Amy's FreshBites"
              className="h-14 sm:h-16 w-auto object-contain transition-transform group-hover:scale-105 drop-shadow-sm"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent/10 hover:text-primary',
                  pathname === link.href
                    ? 'text-primary'
                    : 'text-foreground/70'
                )}
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <Link
                href="/account"
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent/10 hover:text-primary',
                  pathname === '/account'
                    ? 'text-primary'
                    : 'text-foreground/70'
                )}
              >
                Account
              </Link>
            )}
            {isOwner && (
              <Link
                href="/dashboard"
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent/10 hover:text-primary flex items-center gap-1.5',
                  pathname?.startsWith('/dashboard')
                    ? 'text-primary'
                    : 'text-foreground/70'
                )}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2">
            {user && (
              <Link href="/wishlist">
                <Button variant="ghost" size="icon" className="relative">
                  <Heart className="w-5 h-5" />
                  {wishlistCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground">
                      {wishlistCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setIsOpen(true)}
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground animate-in zoom-in">
                  {totalItems}
                </Badge>
              )}
            </Button>

            {user ? (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/account">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User className="w-4 h-4" />
                    <span className="max-w-[100px] truncate">
                      {user.email}
                    </span>
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Link href="/login" className="hidden md:block">
                <Button variant="default" size="sm">
                  Sign In
                </Button>
              </Link>
            )}

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetTitle className="text-lg font-bold mb-4">Menu</SheetTitle>
                <nav className="flex flex-col gap-2">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'px-4 py-2.5 rounded-md text-sm font-medium transition-colors',
                        pathname === link.href
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-muted'
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                  {user && (
                    <>
                      <Link
                        href="/wishlist"
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          'px-4 py-2.5 rounded-md text-sm font-medium transition-colors',
                          pathname === '/wishlist'
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted'
                        )}
                      >
                        Wishlist
                      </Link>
                      <Link
                        href="/account"
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          'px-4 py-2.5 rounded-md text-sm font-medium transition-colors',
                          pathname === '/account'
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted'
                        )}
                      >
                        Account
                      </Link>
                    </>
                  )}
                  {isOwner && (
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="px-4 py-2.5 rounded-md text-sm font-medium transition-colors hover:bg-muted flex items-center gap-2"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                  )}
                  <div className="border-t border-border mt-2 pt-2">
                    {user ? (
                      <>
                        <div className="px-4 py-2 text-sm text-muted-foreground truncate">
                          {user.email}
                        </div>
                        <button
                          onClick={() => {
                            signOut();
                            setMobileOpen(false);
                          }}
                          className="w-full text-left px-4 py-2.5 rounded-md text-sm font-medium hover:bg-muted flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </>
                    ) : (
                      <Link
                        href="/login"
                        onClick={() => setMobileOpen(false)}
                        className="block px-4 py-2.5 rounded-md text-sm font-medium bg-primary text-primary-foreground text-center"
                      >
                        Sign In
                      </Link>
                    )}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
