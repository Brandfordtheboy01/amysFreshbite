'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase, type Order, type Product } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { formatPrice } from '@/lib/format';
import {
  ShoppingBag,
  DollarSign,
  Package,
  ArrowRight,
  TrendingUp,
  Layers,
  Clock,
  ChefHat,
  CheckCircle,
  XCircle,
} from 'lucide-react';

const statusConfig = {
  pending: { label: 'Pending', icon: Clock, color: 'bg-amber-500/15 text-amber-600 border-amber-500/30' },
  preparing: { label: 'Preparing', icon: ChefHat, color: 'bg-blue-500/15 text-blue-600 border-blue-500/30' },
  ready: { label: 'Ready', icon: CheckCircle, color: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' },
  completed: { label: 'Completed', icon: CheckCircle, color: 'bg-muted text-muted-foreground border-border' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'bg-destructive/15 text-destructive border-destructive/30' },
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, isOwner, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (!authLoading && user && !isOwner) {
      router.push('/');
    }
  }, [user, isOwner, authLoading, router]);

  useEffect(() => {
    if (!user || !isOwner) return;
    async function fetchData() {
      try {
        const [{ data: ords }, { data: prods }] = await Promise.all([
          supabase
            .from('orders')
            .select('*, order_items(*)')
            .order('created_at', { ascending: false })
            .limit(10),
          supabase.from('products').select('*'),
        ]);

        const orderList = (ords as Order[]) ?? [];
        const userIds = Array.from(new Set(orderList.map((o) => o.user_id).filter(Boolean)));
        let profileMap: Record<string, string> = {};

        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, email')
            .in('id', userIds);

          (profilesData ?? []).forEach((p: { id: string; email: string | null }) => {
            if (p.email) profileMap[p.id] = p.email;
          });
        }

        const mergedOrders = orderList.map((o) => ({
          ...o,
          profile: profileMap[o.user_id] ? { email: profileMap[o.user_id] } : null,
        }));

        setOrders(mergedOrders);
        setProducts((prods as Product[]) ?? []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, isOwner]);

  if (authLoading || !user || !isOwner) {
    return <div className="max-w-2xl mx-auto px-4 py-20 text-center text-muted-foreground">Loading...</div>;
  }

  const todayOrders = orders.filter(
    (o) => new Date(o.created_at).toDateString() === new Date().toDateString()
  );
  const todayRevenue = todayOrders
    .filter((o) => o.payment_status === 'paid')
    .reduce((sum, o) => sum + o.total, 0);
  const activeOrders = orders.filter(
    (o) => o.status === 'pending' || o.status === 'preparing'
  ).length;

  const stats = [
    { label: "Today's Orders", value: todayOrders.length, icon: ShoppingBag, color: 'text-blue-600 bg-blue-500/10' },
    { label: "Today's Revenue", value: formatPrice(todayRevenue), icon: DollarSign, color: 'text-emerald-600 bg-emerald-500/10' },
    { label: 'Active Orders', value: activeOrders, icon: TrendingUp, color: 'text-amber-600 bg-amber-500/10' },
    { label: 'Total Menu Dishes', value: products.length, icon: Package, color: 'text-primary bg-primary/10' },
  ];

  const recentOrderColumns: ColumnDef<Order>[] = [
    {
      header: 'Order ID',
      className: 'font-mono text-xs font-semibold',
      cell: (order) => `#${order.id.slice(0, 8)}`,
    },
    {
      header: 'Customer',
      cell: (order) => (
        <span className="text-xs text-muted-foreground">
          {(order as any).profile?.email || `User: ${order.user_id.slice(0, 8)}`}
        </span>
      ),
    },
    {
      header: 'Items',
      className: 'max-w-[220px]',
      cell: (order) => (
        <p className="text-xs text-foreground truncate font-medium">
          {order.order_items?.map((i) => `${i.quantity}x ${i.product_name}`).join(', ') || 'Order details'}
        </p>
      ),
    },
    {
      header: 'Total',
      className: 'font-bold text-primary text-sm whitespace-nowrap',
      cell: (order) => formatPrice(order.total),
    },
    {
      header: 'Status',
      cell: (order) => {
        const status = statusConfig[order.status] ?? statusConfig.pending;
        const StatusIcon = status.icon;
        return (
          <Badge className={status.color} variant="outline">
            <StatusIcon className="w-3 h-3 mr-1" />
            {status.label}
          </Badge>
        );
      },
    },
    {
      header: 'Time',
      className: 'text-xs text-muted-foreground whitespace-nowrap text-right pr-4',
      headerClassName: 'text-right pr-4',
      cell: (order) =>
        new Date(order.created_at).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        }),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-4 mb-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/logonb.png"
          alt="Amy's FreshBites"
          className="h-14 w-auto object-contain"
        />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Restaurant Overview</h1>
          <p className="text-sm text-muted-foreground">Real-time stats, management tables & quick actions</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border">
            <CardContent className="pt-6">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/dashboard/products">
          <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
            <CardContent className="pt-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-base">Menu Dishes Table</p>
                  <p className="text-xs text-muted-foreground">View & edit products in table</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/categories">
          <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
            <CardContent className="pt-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-base">Categories Table</p>
                  <p className="text-xs text-muted-foreground">Manage sections & order</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/orders">
          <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
            <CardContent className="pt-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-base">Orders Table</p>
                  <p className="text-xs text-muted-foreground">Update fulfillment statuses</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Orders in DataTable */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Recent Inbound Orders</h2>
            <p className="text-xs text-muted-foreground">Latest customer orders awaiting or undergoing preparation</p>
          </div>
          <Link href="/dashboard/orders">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              Manage All Orders
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        <DataTable
          columns={recentOrderColumns}
          data={orders}
          loading={loading}
          keyExtractor={(item) => item.id}
          onRowClick={(order) => router.push(`/orders/${order.id}`)}
          emptyMessage="No recent orders placed yet."
        />
      </div>
    </div>
  );
}
