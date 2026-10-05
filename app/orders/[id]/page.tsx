'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase, type Order } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatPrice } from '@/lib/format';
import { Clock, ChefHat, CheckCircle, XCircle, ArrowLeft, Package } from 'lucide-react';

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  pending: { label: 'Order Received', icon: Clock, color: 'bg-warning/15 text-warning' },
  preparing: { label: 'Being Prepared', icon: ChefHat, color: 'bg-blue-500/15 text-blue-600' },
  ready: { label: 'Ready for Pickup!', icon: CheckCircle, color: 'bg-success/15 text-success' },
  completed: { label: 'Completed', icon: CheckCircle, color: 'bg-muted text-muted-foreground' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'bg-destructive/15 text-destructive' },
};

const statusSteps = ['pending', 'preparing', 'ready', 'completed'];

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !orderId) return;
    async function fetchOrder() {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', orderId)
        .maybeSingle();
      setOrder(data as Order | null);
      setLoading(false);
    }
    fetchOrder();
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, [user, orderId]);

  if (authLoading || !user) {
    return <div className="max-w-2xl mx-auto px-4 py-20 text-center text-muted-foreground">Loading...</div>;
  }

  if (loading) {
    return <div className="max-w-2xl mx-auto px-4 py-20 text-center text-muted-foreground">Loading order...</div>;
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Order not found</h2>
        <Link href="/orders">
          <Button variant="outline">Back to Orders</Button>
        </Link>
      </div>
    );
  }

  const status = statusConfig[order.status] ?? statusConfig.pending;
  const StatusIcon = status.icon;
  const currentStepIndex = statusSteps.indexOf(order.status);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/orders" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to orders
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Order Details</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Placed on {new Date(order.created_at).toLocaleString('en-US')}
        </p>
      </div>

      {/* Status Tracker */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-1 mb-6">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${status.color}`}>
              <StatusIcon className="w-5 h-5" />
              <span className="font-medium">{status.label}</span>
            </div>
          </div>

          {order.status !== 'cancelled' && (
            <div className="flex items-center justify-between max-w-md mx-auto">
              {statusSteps.map((step, index) => {
                const stepConfig = statusConfig[step];
                const StepIcon = stepConfig.icon;
                const isComplete = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                return (
                  <div key={step} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          isComplete
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        } ${isCurrent ? 'ring-4 ring-primary/20 scale-110' : ''}`}
                      >
                        <StepIcon className="w-5 h-5" />
                      </div>
                      <span className={`text-xs ${isComplete ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        {stepConfig.label}
                      </span>
                    </div>
                    {index < statusSteps.length - 1 && (
                      <div className={`h-1 flex-1 mx-2 rounded ${index < currentStepIndex ? 'bg-primary' : 'bg-muted'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Items Ordered</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {order.order_items?.map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                  {item.quantity}
                </div>
                <div>
                  <p className="font-medium">{item.product_name}</p>
                  <p className="text-sm text-muted-foreground">{formatPrice(item.unit_price)} each</p>
                </div>
              </div>
              <p className="font-semibold">{formatPrice(item.unit_price * item.quantity)}</p>
            </div>
          ))}

          <Separator />

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Payment</span>
            <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>
              {order.payment_status === 'paid' ? 'Paid' : 'Pay on Pickup'}
            </Badge>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-primary">{formatPrice(order.total)}</span>
          </div>

          {order.customer_note && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-1">Order Note</p>
                <p className="text-sm text-muted-foreground">{order.customer_note}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
