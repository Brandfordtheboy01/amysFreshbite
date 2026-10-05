'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, type Order } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/format';
import { Package, ChevronRight, Clock, ChefHat, CheckCircle, XCircle } from 'lucide-react';

const statusConfig = {
  pending: { label: 'Pending', icon: Clock, color: 'bg-warning/15 text-warning border-warning/30' },
  preparing: { label: 'Preparing', icon: ChefHat, color: 'bg-blue-500/15 text-blue-600 border-blue-500/30' },
  ready: { label: 'Ready for Pickup', icon: CheckCircle, color: 'bg-success/15 text-success border-success/30' },
  completed: { label: 'Completed', icon: CheckCircle, color: 'bg-muted text-muted-foreground border-border' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'bg-destructive/15 text-destructive border-destructive/30' },
};

export default function OrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    async function fetchOrders() {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      setOrders((data as Order[]) ?? []);
      setLoading(false);
    }
    fetchOrders();
  }, [user]);

  if (authLoading || !user) {
    return <div className="max-w-2xl mx-auto px-4 py-20 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-2">My Orders</h1>
      <p className="text-muted-foreground mb-8">Track the status of your orders</p>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
          <p className="text-muted-foreground mb-6">When you place an order, it will appear here.</p>
          <Link href="/menu">
            <Button>Start Ordering</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = statusConfig[order.status] ?? statusConfig.pending;
            const StatusIcon = status.icon;
            return (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <Card className="hover:border-primary/30 hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={status.color} variant="outline">
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {status.label}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {order.order_items?.length ?? 0} {(order.order_items?.length ?? 0) === 1 ? 'item' : 'items'}
                          {order.order_items?.slice(0, 3).map((item) => item.product_name).join(', ')}
                          {(order.order_items?.length ?? 0) > 3 && '...'}
                        </p>
                        <p className="text-lg font-bold text-primary mt-1">{formatPrice(order.total)}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
