import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { useCartStore } from '@/store/cartStore';
import type { Product, VariantType, ProductVariant } from '@/types/ecommerce';
import { ShoppingCart, Search, Plus, Minus, Filter, Package } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Props {
    products: Product[];
    variantTypes: VariantType[];
    filters: any;
    user?: {
        name: string;
        username: string | null;
    } | null;
}

export default function ProductsPage({
    products,
    variantTypes,
    filters,
    user,
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedVariantValues, setSelectedVariantValues] = useState<
        number[]
    >([]);
    const [selectedVariants, setSelectedVariants] = useState<
        Record<number, Record<number, number>>
    >({});
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const addItem = useCartStore((state) => state.addItem);
    const removeItem = useCartStore((state) => state.removeItem);
    const updateQuantity = useCartStore((state) => state.updateQuantity);
    const totalItems = useCartStore((state) => state.getTotalItems());
    const cartItems = useCartStore((state) => state.items);

    const handleVariantValueToggle = (valueId: number) => {
        setSelectedVariantValues((prev) =>
            prev.includes(valueId)
                ? prev.filter((id) => id !== valueId)
                : [...prev, valueId],
        );
    };

    const selectVariantValue = (
        productId: number,
        typeId: number,
        valueId: number,
    ) => {
        setSelectedVariants((prev) => ({
            ...prev,
            [productId]: {
                ...(prev[productId] || {}),
                [typeId]: valueId,
            },
        }));
    };

    const getSelectedVariant = (product: Product): ProductVariant | null => {
        if (!product.product_variants || product.product_variants.length === 0)
            return null;

        // If there's only one variant, auto-select it
        if (product.product_variants.length === 1) {
            return product.product_variants[0];
        }

        const selectedForProduct = selectedVariants[product.id];
        if (!selectedForProduct || Object.keys(selectedForProduct).length === 0) {
            // No selections made and multiple variants - require user to select
            return null;
        }

        const selectedValueIds = Object.values(selectedForProduct);

        // Find variant that matches ALL selected values
        const matchedVariant = product.product_variants.find((variant) => {
            const variantValueIds = variant.variant_values.map((v) => v.id);
            return (
                selectedValueIds.length === variantValueIds.length &&
                selectedValueIds.every((id) => variantValueIds.includes(id))
            );
        });

        return matchedVariant || null;
    };

    const handleAddToCart = (product: Product, variant: ProductVariant) => {
        if (!variant) {
            toast.error('Please select a variant');
            return;
        }

        addItem({
            productId: product.id,
            productVariantId: variant.id,
            name: product.name,
            variantDisplay: variant.display_name,
            price: variant.price,
            imageUrl: product.thumb_url,
            stock: variant.stock,
        });
    };

    // Filter products based on search and selected variant values
    const filteredProducts = products.filter((product) => {
        // Search filter
        if (search.trim()) {
            const searchLower = search.toLowerCase();

            // Search in product name (en and ar)
            const nameMatch =
                (typeof product.name === 'string' &&
                    product.name.toLowerCase().includes(searchLower)) ||
                (typeof product.name === 'object' &&
                    product.name &&
                    (product.name.en?.toLowerCase().includes(searchLower) ||
                        product.name.ar?.toLowerCase().includes(searchLower)));

            // Search in product description (en and ar)
            const descMatch =
                (typeof product.description === 'string' &&
                    product.description.toLowerCase().includes(searchLower)) ||
                (typeof product.description === 'object' &&
                    product.description &&
                    (product.description.en
                        ?.toLowerCase()
                        .includes(searchLower) ||
                        product.description.ar
                            ?.toLowerCase()
                            .includes(searchLower)));

            // Search in category name (en and ar)
            const categoryMatch =
                (typeof product.category?.name === 'string' &&
                    product.category.name
                        .toLowerCase()
                        .includes(searchLower)) ||
                (typeof product.category?.name === 'object' &&
                    product.category.name &&
                    (product.category.name.en
                        ?.toLowerCase()
                        .includes(searchLower) ||
                        product.category.name.ar
                            ?.toLowerCase()
                            .includes(searchLower)));

            // Search in variant types and values
            const variantMatch = product.product_variants?.some((variant) =>
                variant.variant_values?.some((value) => {
                    const valueMatch =
                        (typeof value.value === 'string' &&
                            value.value.toLowerCase().includes(searchLower)) ||
                        (typeof value.value === 'object' &&
                            value.value &&
                            (value.value.en
                                ?.toLowerCase()
                                .includes(searchLower) ||
                                value.value.ar
                                    ?.toLowerCase()
                                    .includes(searchLower)));

                    const typeMatch =
                        (typeof value.variant_type?.name === 'string' &&
                            value.variant_type.name
                                .toLowerCase()
                                .includes(searchLower)) ||
                        (typeof value.variant_type?.name === 'object' &&
                            value.variant_type.name &&
                            (value.variant_type.name.en
                                ?.toLowerCase()
                                .includes(searchLower) ||
                                value.variant_type.name.ar
                                    ?.toLowerCase()
                                    .includes(searchLower)));

                    return valueMatch || typeMatch;
                }),
            );

            if (!nameMatch && !descMatch && !categoryMatch && !variantMatch) {
                return false;
            }
        }

        // Variant value filter
        if (selectedVariantValues.length > 0) {
            // Check if product has any variant with all selected values
            return product.product_variants?.some((variant) => {
                const variantValueIds = variant.variant_values.map((v) => v.id);
                // Product matches if ANY of its variants contain ALL selected filter values
                return selectedVariantValues.every((filterId) =>
                    variantValueIds.includes(filterId),
                );
            });
        }

        return true;
    });

    return (
        <div className="min-h-screen bg-background p-4">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold">Products</h1>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => (window.location.href = '/orders')}
                    >
                        <Package className="mr-2 h-4 w-4" />
                        Orders
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => (window.location.href = '/cart')}
                    >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Cart ({totalItems})
                    </Button>
                </div>
            </div>

            {/* User Greeting */}
            {user && (
                <div className="mb-6">
                    <p className="text-lg text-muted-foreground">
                        Hey, <span className="font-semibold text-foreground">{user.name}</span>!
                    </p>
                </div>
            )}

            {/* Search Bar and Filter Button */}
            <div className="mb-6 flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search products..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                {/* Mobile Filter Button */}
                {variantTypes && variantTypes.length > 0 && (
                    <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                        <SheetTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="lg:hidden"
                            >
                                <Filter className="h-4 w-4" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-80">
                            <SheetHeader className="px-6">
                                <SheetTitle>Filters</SheetTitle>
                            </SheetHeader>
                            <div className="mt-6 space-y-4 px-6">
                                {variantTypes.map((variantType) => (
                                    <div
                                        key={variantType.id}
                                        className="space-y-2"
                                    >
                                        <h3 className="text-sm font-semibold">
                                            {variantType.name.en}
                                        </h3>
                                        <div className="space-y-1">
                                            {variantType.variant_values.map(
                                                (value) => (
                                                    <div
                                                        key={value.id}
                                                        className="flex items-center space-x-2"
                                                    >
                                                        <Checkbox
                                                            id={`mobile-filter-${value.id}`}
                                                            checked={selectedVariantValues.includes(
                                                                value.id,
                                                            )}
                                                            onCheckedChange={() =>
                                                                handleVariantValueToggle(
                                                                    value.id,
                                                                )
                                                            }
                                                        />
                                                        <Label
                                                            htmlFor={`mobile-filter-${value.id}`}
                                                            className="cursor-pointer text-sm font-normal"
                                                        >
                                                            {value.value.en}
                                                        </Label>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </SheetContent>
                    </Sheet>
                )}
            </div>

            <div className="flex gap-6">
                {/* Desktop Variant Filters Sidebar */}
                {variantTypes && variantTypes.length > 0 && (
                    <aside className="hidden w-64 shrink-0 lg:block">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    Filters
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {variantTypes.map((variantType) => (
                                    <div
                                        key={variantType.id}
                                        className="space-y-2"
                                    >
                                        <h3 className="text-sm font-semibold">
                                            {variantType.name.en}
                                        </h3>
                                        <div className="space-y-1">
                                            {variantType.variant_values.map(
                                                (value) => (
                                                    <div
                                                        key={value.id}
                                                        className="flex items-center space-x-2"
                                                    >
                                                        <Checkbox
                                                            id={`filter-${value.id}`}
                                                            checked={selectedVariantValues.includes(
                                                                value.id,
                                                            )}
                                                            onCheckedChange={() =>
                                                                handleVariantValueToggle(
                                                                    value.id,
                                                                )
                                                            }
                                                        />
                                                        <Label
                                                            htmlFor={`filter-${value.id}`}
                                                            className="cursor-pointer text-sm font-normal"
                                                        >
                                                            {value.value.en}
                                                        </Label>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </aside>
                )}

                {/* Products Grid */}
                <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredProducts.map((product) => {
                        const selectedVariant = getSelectedVariant(product);
                        const currentSelections = selectedVariants[product.id];
                        const hasVariants = product.product_variants && product.product_variants.length > 0;

                        // If variant is selected, show its stock and price
                        // Otherwise, show total stock and lowest price
                        const displayStock = selectedVariant
                            ? selectedVariant.stock
                            : (product.product_variants?.reduce(
                                  (sum, v) => sum + (v.stock || 0),
                                  0,
                              ) ?? 0);

                        const displayPrice = selectedVariant
                            ? selectedVariant.price
                            : (Math.min(...(product.product_variants?.map(v => v.price) || [0])));
                        const cartItem = cartItems.find(
                            (item) =>
                                item.productId === product.id &&
                                item.productVariantId === selectedVariant?.id,
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
                                        <CardTitle className="text-lg">
                                            {product.name}
                                        </CardTitle>
                                        <Badge
                                            variant={
                                                displayStock > 0
                                                    ? 'default'
                                                    : 'destructive'
                                            }
                                        >
                                            {displayStock > 0
                                                ? `${displayStock} left`
                                                : 'Out of stock'}
                                        </Badge>
                                    </div>
                                    <CardDescription>
                                        {product.category.name}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <p className="line-clamp-2 text-sm text-muted-foreground">
                                        {product.description}
                                    </p>

                                    {/* Variant Selection */}
                                    {product.product_variants &&
                                        product.product_variants.length > 0 && (
                                            <div className="space-y-2">
                                                {/* Get unique variant types for this product */}
                                                {(() => {
                                                    // First, collect all variant types
                                                    const variantTypesMap =
                                                        new Map();
                                                    product.product_variants.forEach(
                                                        (variant) => {
                                                            variant.variant_values.forEach(
                                                                (value) => {
                                                                    if (
                                                                        value.variant_type &&
                                                                        !variantTypesMap.has(
                                                                            value
                                                                                .variant_type
                                                                                .id,
                                                                        )
                                                                    ) {
                                                                        variantTypesMap.set(
                                                                            value
                                                                                .variant_type
                                                                                .id,
                                                                            value.variant_type,
                                                                        );
                                                                    }
                                                                },
                                                            );
                                                        },
                                                    );

                                                    // Get current selections for this product
                                                    const currentSelections =
                                                        selectedVariants[
                                                            product.id
                                                        ] || {};

                                                    return Array.from(
                                                        variantTypesMap.values(),
                                                    ).map((type) => {
                                                        // Filter variants based on selections from OTHER variant types
                                                        let availableVariants =
                                                            product.product_variants || [];

                                                        Object.entries(
                                                            currentSelections,
                                                        ).forEach(
                                                            ([
                                                                typeId,
                                                                valueId,
                                                            ]) => {
                                                                if (
                                                                    parseInt(
                                                                        typeId,
                                                                    ) !==
                                                                    type.id
                                                                ) {
                                                                    availableVariants =
                                                                        availableVariants.filter(
                                                                            (
                                                                                variant,
                                                                            ) =>
                                                                                variant.variant_values.some(
                                                                                    (
                                                                                        v,
                                                                                    ) =>
                                                                                        v.id ===
                                                                                        valueId,
                                                                                ),
                                                                        );
                                                                }
                                                            },
                                                        );

                                                        // Extract unique values for this type from available variants with stock
                                                        const availableValuesMap =
                                                            new Map();
                                                        availableVariants.forEach(
                                                            (variant) => {
                                                                // Only include values from variants that have stock
                                                                if (
                                                                    variant.stock >
                                                                    0
                                                                ) {
                                                                    variant.variant_values.forEach(
                                                                        (
                                                                            value,
                                                                        ) => {
                                                                            if (
                                                                                value
                                                                                    .variant_type
                                                                                    ?.id ===
                                                                                type.id
                                                                            ) {
                                                                                availableValuesMap.set(
                                                                                    value.id,
                                                                                    value,
                                                                                );
                                                                            }
                                                                        },
                                                                    );
                                                                }
                                                            },
                                                        );

                                                        return (
                                                            <div key={type.id}>
                                                                <Label className="text-xs font-semibold">
                                                                    {
                                                                        type
                                                                            .name
                                                                            .en
                                                                    }
                                                                </Label>
                                                                <div className="mt-1 flex flex-wrap gap-1">
                                                                    {Array.from(
                                                                        availableValuesMap.values(),
                                                                    ).map(
                                                                        (
                                                                            value: any,
                                                                        ) => {
                                                                            const isSelected =
                                                                                currentSelections[
                                                                                    type
                                                                                        .id
                                                                                ] ===
                                                                                value.id;
                                                                            return (
                                                                                <Button
                                                                                    key={
                                                                                        value.id
                                                                                    }
                                                                                    size="sm"
                                                                                    variant={
                                                                                        isSelected
                                                                                            ? 'default'
                                                                                            : 'outline'
                                                                                    }
                                                                                    onClick={() =>
                                                                                        selectVariantValue(
                                                                                            product.id,
                                                                                            type.id,
                                                                                            value.id,
                                                                                        )
                                                                                    }
                                                                                    className="h-7 text-xs"
                                                                                >
                                                                                    {
                                                                                        value
                                                                                            .value
                                                                                            .en
                                                                                    }
                                                                                </Button>
                                                                            );
                                                                        },
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    });
                                                })()}
                                            </div>
                                        )}
                                </CardContent>
                                <CardFooter className="flex items-center justify-between">
                                    <span className="text-xl font-bold">
                                        {!selectedVariant && hasVariants && 'from '}
                                        {displayPrice} LYD
                                    </span>
                                    {cartItem ? (
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="icon"
                                                variant="outline"
                                                onClick={() =>
                                                    updateQuantity(
                                                        product.id,
                                                        cartItem.quantity - 1,
                                                        selectedVariant?.id,
                                                    )
                                                }
                                                className="h-8 w-8"
                                            >
                                                <Minus className="h-4 w-4" />
                                            </Button>
                                            <span className="min-w-8 text-center font-semibold">
                                                {cartItem.quantity}
                                            </span>
                                            <Button
                                                size="icon"
                                                variant="outline"
                                                onClick={() =>
                                                    updateQuantity(
                                                        product.id,
                                                        cartItem.quantity + 1,
                                                        selectedVariant?.id,
                                                    )
                                                }
                                                disabled={
                                                    cartItem.quantity >=
                                                    displayStock
                                                }
                                                className="h-8 w-8"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            onClick={() =>
                                                selectedVariant &&
                                                handleAddToCart(
                                                    product,
                                                    selectedVariant,
                                                )
                                            }
                                            disabled={
                                                displayStock === 0 ||
                                                !selectedVariant
                                            }
                                            size="sm"
                                        >
                                            <ShoppingCart className="mr-2 h-4 w-4" />
                                            {!selectedVariant && hasVariants
                                                ? 'Select Options'
                                                : 'Add to Cart'}
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {filteredProducts.length === 0 && (
                <div className="py-12 text-center">
                    <p className="text-muted-foreground">No products found.</p>
                </div>
            )}
        </div>
    );
}
