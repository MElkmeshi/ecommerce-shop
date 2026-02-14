import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useCartStore } from '@/store/cartStore';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { router } from '@inertiajs/react';

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);
  const getTotalItems = useCartStore((state) => state.getTotalItems);

  const handleCheckout = () => {
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
        <h1 className="mb-6 text-2xl font-bold">Shopping Cart</h1>

        <div className="space-y-3">
          {items.map((item) => (
            <Card key={`${item.productId}-${item.productVariantId || 'no-variant'}`}>
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
          ))}
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
          <CardFooter>
            <Button className="w-full" size="lg" onClick={handleCheckout}>
              Proceed to Checkout
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
