import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useCartStore } from '@/store/cartStore';
import type { Product, VariantType, ProductVariant } from '@/types/ecommerce';
import { ShoppingCart, Search, Plus, Minus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Props {
  products: Product[];
  variantTypes: VariantType[];
  filters: any;
}

export default function ProductsPage({ products, variantTypes, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [selectedVariantValues, setSelectedVariantValues] = useState<number[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<Record<number, Record<number, number>>>({});

  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const totalItems = useCartStore((state) => state.getTotalItems());
  const cartItems = useCartStore((state) => state.items);

  const handleVariantValueToggle = (valueId: number) => {
    setSelectedVariantValues((prev) =>
      prev.includes(valueId) ? prev.filter((id) => id !== valueId) : [...prev, valueId]
    );
  };

  const selectVariantValue = (productId: number, typeId: number, valueId: number) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {}),
        [typeId]: valueId,
      },
    }));
  };

  const getSelectedVariant = (product: Product): ProductVariant | null => {
    if (!product.has_variants || !product.product_variants) return null;

    const selectedForProduct = selectedVariants[product.id];
    if (!selectedForProduct) return null;

    const selectedValueIds = Object.values(selectedForProduct);

    return product.product_variants.find((variant) => {
      const variantValueIds = variant.variant_values.map((v) => v.id);
      return (
        selectedValueIds.length === variantValueIds.length &&
        selectedValueIds.every((id) => variantValueIds.includes(id))
      );
    }) || null;
  };

  const handleAddToCart = (product: Product, variant?: ProductVariant) => {
    if (product.has_variants && !variant) {
      toast.error('Please select all variant options');
      return;
    }

    addItem({
      productId: product.id,
      productVariantId: variant?.id,
      name: product.name,
      variantDisplay: variant?.display_name,
      price: variant?.price || product.price,
      imageUrl: product.thumb_url,
      stock: variant?.stock || product.stock,
      sku: variant?.sku,
    });

    toast.success('Added to cart!');
  };

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button variant="outline" size="sm" onClick={() => window.location.href = '/cart'}>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Cart ({totalItems})
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

      <div className="flex gap-6">
        {/* Variant Filters Sidebar */}
        {variantTypes && variantTypes.length > 0 && (
          <aside className="hidden w-64 shrink-0 lg:block">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {variantTypes.map((variantType) => (
                  <div key={variantType.id} className="space-y-2">
                    <h3 className="font-semibold text-sm">{variantType.name.en}</h3>
                    <div className="space-y-1">
                      {variantType.variant_values.map((value) => (
                        <div key={value.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`filter-${value.id}`}
                            checked={selectedVariantValues.includes(value.id)}
                            onCheckedChange={() => handleVariantValueToggle(value.id)}
                          />
                          <Label
                            htmlFor={`filter-${value.id}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {value.value.en}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </aside>
        )}

        {/* Products Grid */}
        <div className="flex-1 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => {
          const selectedVariant = getSelectedVariant(product);
          const displayPrice = selectedVariant?.price || product.price;
          const displayStock = selectedVariant?.stock ?? product.stock;
          const cartItem = cartItems.find(
            (item) =>
              item.productId === product.id &&
              item.productVariantId === selectedVariant?.id
          );

          return (
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
                  <Badge variant={displayStock > 0 ? 'default' : 'destructive'}>
                    {displayStock > 0 ? `${displayStock} left` : 'Out of stock'}
                  </Badge>
                </div>
                <CardDescription>{product.category.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {product.description}
                </p>

                {/* Variant Selection */}
                {product.has_variants && product.product_variants && (
                  <div className="space-y-2">
                    {/* Get unique variant types for this product */}
                    {(() => {
                      const variantTypesMap = new Map();
                      product.product_variants.forEach((variant) => {
                        variant.variant_values.forEach((value) => {
                          if (value.variant_type) {
                            if (!variantTypesMap.has(value.variant_type.id)) {
                              variantTypesMap.set(value.variant_type.id, {
                                type: value.variant_type,
                                values: new Set(),
                              });
                            }
                            variantTypesMap.get(value.variant_type.id).values.add(value);
                          }
                        });
                      });

                      return Array.from(variantTypesMap.values()).map(({ type, values }) => (
                        <div key={type.id}>
                          <Label className="text-xs font-semibold">{type.name.en}</Label>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {Array.from(values).map((value: any) => {
                              const isSelected =
                                selectedVariants[product.id]?.[type.id] === value.id;
                              return (
                                <Button
                                  key={value.id}
                                  size="sm"
                                  variant={isSelected ? 'default' : 'outline'}
                                  onClick={() => selectVariantValue(product.id, type.id, value.id)}
                                  className="h-7 text-xs"
                                >
                                  {value.value.en}
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex items-center justify-between">
                <span className="text-xl font-bold">{displayPrice} LYD</span>
                {cartItem ? (
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => updateQuantity(product.id, cartItem.quantity - 1, selectedVariant?.id)}
                      className="h-8 w-8"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="min-w-8 text-center font-semibold">{cartItem.quantity}</span>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => updateQuantity(product.id, cartItem.quantity + 1, selectedVariant?.id)}
                      disabled={cartItem.quantity >= displayStock}
                      className="h-8 w-8"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleAddToCart(product, selectedVariant || undefined)}
                    disabled={displayStock === 0}
                    size="sm"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to Cart
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
        </div>
      </div>

      {products.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">No products found.</p>
        </div>
      )}
    </div>
  );
}
