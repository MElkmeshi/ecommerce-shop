import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Order } from '@/types/ecommerce';
import { Package, Home, ShoppingCart } from 'lucide-react';

interface Props {
  orders: Order[];
}

export default function OrdersPage({ orders }: Props) {
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
                        <span>${item.subtotal.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between border-t pt-2 font-bold">
                    <span>Total</span>
                    <span>${order.total_amount.toFixed(2)}</span>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Phone: {order.phone_number}</p>
                    <p>Location: {order.location.address || `${order.location.latitude}, ${order.location.longitude}`}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
