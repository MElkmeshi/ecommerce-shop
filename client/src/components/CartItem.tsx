import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { CartItem as CartItemType } from '@/store/cartStore';
import { formatPrice } from '@/lib/utils';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemove: (productId: number) => void;
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= item.stock) {
      onUpdateQuantity(item.productId, newQuantity);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex gap-4">
        {/* Product Image */}
        <div className="w-20 h-20 rounded-md overflow-hidden bg-muted shrink-0">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
              No image
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{item.name}</h3>
          <p className="text-sm text-muted-foreground">
            {formatPrice(item.price)} each
          </p>
          <p className="text-lg font-bold text-primary mt-1">
            {formatPrice(item.price * item.quantity)}
          </p>

          {/* Quantity Controls */}
          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleQuantityChange(item.quantity - 1)}
              disabled={item.quantity <= 1}
            >
              <Minus className="w-4 h-4" />
            </Button>

            <Input
              type="number"
              value={item.quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val)) {
                  handleQuantityChange(val);
                }
              }}
              className="w-16 h-8 text-center"
              min="1"
              max={item.stock}
            />

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleQuantityChange(item.quantity + 1)}
              disabled={item.quantity >= item.stock}
            >
              <Plus className="w-4 h-4" />
            </Button>

            <div className="flex-1" />

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => onRemove(item.productId)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {item.quantity >= item.stock && (
            <p className="text-xs text-destructive mt-1">
              Maximum stock reached
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
