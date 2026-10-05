'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, type Order } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { formatPrice } from '@/lib/format';
import {
  Package,
  ChevronRight,
  Clock,
  ChefHat,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Search,
  RefreshCw,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const statusConfig = {
  pending: { label: 'Pending', icon: Clock, color: 'bg-amber-500/15 text-amber-600 border-amber-500/30' },
  preparing: { label: 'Preparing', icon: ChefHat, color: 'bg-blue-500/15 text-blue-600 border-blue-500/30' },
  ready: { label: 'Ready for Pickup', icon: CheckCircle, color: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' },
  completed: { label: 'Completed', icon: CheckCircle, color: 'bg-muted text-muted-foreground border-border' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'bg-destructive/15 text-destructive border-destructive/30' },
};

export default function DashboardOrdersPage() {
  const router = useRouter();
  const { user, isOwner, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (!authLoading && user && !isOwner) {
      router.push('/');
      return;
    }
  }, [user, isOwner, authLoading, router]);

  async function fetchOrders() {
    try {
      // 1. Fetch all orders with order items
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        toast.error('Failed to load orders: ' + ordersError.message);
        setLoading(false);
        return;
      }

      const orderList = (ordersData as Order[]) ?? [];

      // 2. Fetch profiles safely without relying on broken implicit PostgREST joins
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
    } catch (err) {
      console.error('Fetch orders error:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user || !isOwner) return;
    fetchOrders();
    const interval = setInterval(fetchOrders, 8000);
    return () => clearInterval(interval);
  }, [user, isOwner]);

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order status');
    } else {
      toast.success(`Order marked as ${newStatus}`);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const email = (order as any).profile?.email?.toLowerCase() || '';
      const orderId = order.id.toLowerCase();
      const items = order.order_items?.map((i) => i.product_name.toLowerCase()).join(' ') || '';
      const matchSearch =
        !search ||
        email.includes(search.toLowerCase()) ||
        orderId.includes(search.toLowerCase()) ||
        items.includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || order.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, search, statusFilter]);

  const columns: ColumnDef<Order>[] = [
    {
      header: 'Order Details',
      className: 'min-w-[220px]',
      cell: (order) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold text-xs text-foreground">
              #{order.id.slice(0, 8)}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(order.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {(order as any).profile?.email || (
              <span className="font-mono text-[11px] text-muted-foreground/70">
                User: {order.user_id.slice(0, 8)}
              </span>
            )}
          </p>
        </div>
      ),
    },
    {
      header: 'Ordered Dishes',
      className: 'max-w-[260px]',
      cell: (order) => (
        <div>
          <span className="text-xs font-semibold text-foreground">
            {order.order_items?.length ?? 0} {(order.order_items?.length ?? 0) === 1 ? 'item' : 'items'}
          </span>
          <p className="text-xs text-muted-foreground truncate">
            {order.order_items && order.order_items.length > 0
              ? order.order_items.map((item) => `${item.quantity}x ${item.product_name}`).join(', ')
              : 'No items recorded'}
          </p>
        </div>
      ),
    },
    {
      header: 'Total',
      className: 'font-bold text-primary whitespace-nowrap',
      cell: (order) => formatPrice(order.total),
    },
    {
      header: 'Payment',
      cell: (order) => (
        <Badge
          variant="outline"
          className={
            order.payment_status === 'paid'
              ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[11px]'
              : 'bg-amber-500/10 text-amber-600 border-amber-500/20 text-[11px]'
          }
        >
          {order.payment_status === 'paid' ? 'Paid' : 'Unpaid (Pay on Pickup)'}
        </Badge>
      ),
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
      header: 'Quick Action',
      className: 'min-w-[190px]',
      cell: (order) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          {order.status === 'pending' && (
            <Button
              size="sm"
              variant="default"
              className="h-7 text-xs px-2.5"
              onClick={() => updateOrderStatus(order.id, 'preparing')}
            >
              Start Preparing
            </Button>
          )}
          {order.status === 'preparing' && (
            <Button
              size="sm"
              variant="default"
              className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => updateOrderStatus(order.id, 'ready')}
            >
              Mark Ready
            </Button>
          )}
          {order.status === 'ready' && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs px-2.5"
              onClick={() => updateOrderStatus(order.id, 'completed')}
            >
              Complete
            </Button>
          )}
          {(order.status === 'pending' || order.status === 'preparing') && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs px-2 text-destructive hover:bg-destructive/10"
              onClick={() => updateOrderStatus(order.id, 'cancelled')}
            >
              Cancel
            </Button>
          )}
        </div>
      ),
    },
    {
      header: '',
      className: 'w-10 text-right pr-3',
      cell: (order) => (
        <Link href={`/orders/${order.id}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
      ),
    },
  ];

  if (authLoading || !user || !isOwner) {
    return <div className="max-w-2xl mx-auto px-4 py-20 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" />
        Back to dashboard
      </Link>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Track live incoming orders and update kitchen progress</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchOrders()} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh Orders
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer email, order ID, or dish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-card">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses ({orders.length})</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="preparing">Preparing</SelectItem>
              <SelectItem value="ready">Ready for Pickup</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredOrders}
        loading={loading}
        keyExtractor={(item) => item.id}
        emptyMessage={
          <div className="py-16 text-center">
            <Package className="w-12 h-12 mx-auto text-muted-foreground/60 mb-3" />
            <h3 className="font-semibold text-base mb-1">No orders found</h3>
            <p className="text-xs text-muted-foreground">Orders will appear here as soon as customers place them.</p>
          </div>
        }
      />
    </div>
  );
}
