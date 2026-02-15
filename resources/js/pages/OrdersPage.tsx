import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Order } from '@/types/ecommerce';
import { Package, Home, ShoppingCart, CreditCard } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

interface Props {
  orders: Order[];
}

export default function OrdersPage({ orders }: Props) {
  const [payingOrderId, setPayingOrderId] = useState<number | null>(null);

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'pending':
      case 'processing':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const formatPrice = (price: number): string => {
    return price % 1 === 0 ? price.toString() : price.toFixed(2);
  };

  const handlePayNow = async (orderId: number) => {
    setPayingOrderId(orderId);
    try {
      const response = await axios.post('/payments/init', {
        order_id: orderId,
        provider: 'moamalat',
      });

      if (response.data.success && response.data.redirect_url) {
        // Redirect to payment page
        window.location.href = response.data.redirect_url;
      } else {
        toast.error('Failed to initialize payment');
        setPayingOrderId(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to initialize payment');
      setPayingOrderId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Orders</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => (window.location.href = '/')}
            >
              <Home className="mr-2 h-4 w-4" />
              Products
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => (window.location.href = '/cart')}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Cart
            </Button>
          </div>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardHeader className="text-center">
              <Package className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
              <CardTitle>No orders yet</CardTitle>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                    <Badge variant={getStatusVariant(order.status)}>
                      {order.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.product_name} × {item.quantity}</span>
                        <span>{formatPrice(item.subtotal)} LYD</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1 border-t pt-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>{formatPrice(order.items.reduce((sum, item) => sum + item.subtotal, 0))} LYD</span>
                    </div>
                    {order.delivery_fee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Delivery Fee</span>
                        <span>{formatPrice(order.delivery_fee)} LYD</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-2 font-bold">
                      <span>Total</span>
                      <span>{formatPrice(order.total_amount)} LYD</span>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Phone: {order.phone_number}</p>
                    <p>Location: {order.location.address || order.location.plusCode || `${order.location.latitude}, ${order.location.longitude}`}</p>
                    {order.payment_method === 'credit_card' && (
                      <p>Payment: Credit Card ({order.payment_status})</p>
                    )}
                  </div>
                  {order.status === 'pending' && order.payment_method === 'credit_card' && order.payment_status === 'pending' && (
                    <Button
                      onClick={() => handlePayNow(order.id)}
                      disabled={payingOrderId === order.id}
                      className="w-full"
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      {payingOrderId === order.id ? 'Processing...' : 'Pay Now'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
