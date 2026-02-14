import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useCartStore } from '@/store/cartStore';
import { Minus, Plus, ShoppingBag, Trash2, AlertCircle, Package, Home } from 'lucide-react';
import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

interface StockStatus {
  productVariantId: number;
  inStock: boolean;
  availableStock: number;
  message: string | null;
}

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  const [stockStatus, setStockStatus] = useState<Record<number, StockStatus>>({});
  const [validatingStock, setValidatingStock] = useState(false);

  // Calculate totals from items directly
  const getTotalPrice = () => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  // Validate stock when items change
  useEffect(() => {
    if (items.length === 0) {
      setStockStatus({});
      return;
    }

    const validateStock = async () => {
      setValidatingStock(true);
      try {
        const response = await axios.post('/api/cart/validate-stock', {
          items: items.map((item) => ({
            productVariantId: item.productVariantId,
            quantity: item.quantity,
          })),
        });

        const statusMap: Record<number, StockStatus> = {};
        response.data.stockStatus.forEach((status: StockStatus) => {
          statusMap[status.productVariantId] = status;
        });

        setStockStatus(statusMap);

        // Show warning if any items are out of stock
        const outOfStockItems = response.data.stockStatus.filter(
          (status: StockStatus) => !status.inStock
        );
        if (outOfStockItems.length > 0) {
          toast.error('Some items in your cart have insufficient stock');
        }
      } catch (error) {
        console.error('Failed to validate stock:', error);
      } finally {
        setValidatingStock(false);
      }
    };

    validateStock();
  }, [items]);

  // Check if checkout should be disabled
  const hasStockIssues = Object.values(stockStatus).some((status) => !status.inStock);

  const handleCheckout = () => {
    if (hasStockIssues) {
      toast.error('Please remove or adjust items with insufficient stock');
      return;
    }
    router.visit('/checkout');
  };

  // Format price to remove unnecessary decimals
  const formatPrice = (price: number): string => {
    return price % 1 === 0 ? price.toString() : price.toFixed(2);
  };

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <ShoppingBag className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <CardTitle>Your cart is empty</CardTitle>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" onClick={() => window.location.href = '/'}>
              Continue Shopping
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Shopping Cart</h1>
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
              onClick={() => (window.location.href = '/orders')}
            >
              <Package className="mr-2 h-4 w-4" />
              Orders
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {items.map((item) => {
            const itemStockStatus = stockStatus[item.productVariantId];
            const hasStockIssue = itemStockStatus && !itemStockStatus.inStock;

            return (
              <Card
                key={`${item.productId}-${item.productVariantId || 'no-variant'}`}
                className={hasStockIssue ? 'border-destructive' : ''}
              >
                <CardContent className="p-3">
                  <div className="flex gap-3">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <h3 className="font-semibold text-sm">{item.name}</h3>
                        {item.variantDisplay && (
                          <p className="text-xs text-muted-foreground">{item.variantDisplay}</p>
                        )}
                        {hasStockIssue && (
                          <div className="mt-1 flex items-center gap-1 text-xs text-destructive">
                            <AlertCircle className="h-3 w-3" />
                            <span>{itemStockStatus.message}</span>
                          </div>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {formatPrice(Number(item.price))} LYD each
                        </p>
                      </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1, item.productVariantId)}
                          className="h-8 w-8"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(item.productId, parseInt(e.target.value), item.productVariantId)
                          }
                          className="w-12 text-center h-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          min="1"
                          max={item.stock}
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1, item.productVariantId)}
                          disabled={item.quantity >= item.stock}
                          className="h-8 w-8"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">
                          {formatPrice(Number(item.price) * item.quantity)} LYD
                        </span>
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={() => removeItem(item.productId, item.productVariantId)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Items ({getTotalItems()})</span>
              <span className="font-semibold">{formatPrice(getTotalPrice())} LYD</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-lg font-bold">Total</span>
              <span className="text-lg font-bold">{formatPrice(getTotalPrice())} LYD</span>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            {hasStockIssues && (
              <div className="w-full flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>Some items have insufficient stock. Please adjust quantities or remove them.</span>
              </div>
            )}
            <Button
              className="w-full"
              size="lg"
              onClick={handleCheckout}
              disabled={hasStockIssues || validatingStock}
            >
              {validatingStock ? 'Checking stock...' : 'Proceed to Checkout'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
