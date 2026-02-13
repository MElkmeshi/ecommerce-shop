import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useCartStore } from '@/store/cartStore';
import type { Product } from '@/types/ecommerce';
import { ShoppingCart, Search, Plus, Minus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Props {
  products: Product[];
  filters: any;
}

export default function ProductsPage({ products, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const cartItems = useCartStore((state) => state.items);

  const handleAddToCart = (product: Product) => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.thumb_url,
      stock: product.stock,
    });
  };

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button variant="outline" size="sm" onClick={() => window.location.href = '/cart'}>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Cart ({getTotalItems()})
        </Button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Card key={product.id}>
            {product.thumb_url && (
              <div className="aspect-video overflow-hidden rounded-t-lg">
                <img
                  src={product.thumb_url}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <Badge variant={product.stock > 0 ? 'default' : 'destructive'}>
                  {product.stock > 0 ? `${product.stock} left` : 'Out of stock'}
                </Badge>
              </div>
              <CardDescription>{product.category.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {product.description}
              </p>
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <span className="text-xl font-bold">{product.price} LYD</span>
              {(() => {
                const cartItem = cartItems.find(item => item.productId === product.id);
                if (cartItem) {
                  return (
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                        className="h-8 w-8"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="min-w-8 text-center font-semibold">{cartItem.quantity}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                        disabled={cartItem.quantity >= product.stock}
                        className="h-8 w-8"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                }
                return (
                  <Button
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock === 0}
                    size="sm"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to Cart
                  </Button>
                );
              })()}
            </CardFooter>
          </Card>
        ))}
      </div>

      {products.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">No products found.</p>
        </div>
      )}
    </div>
  );
}
