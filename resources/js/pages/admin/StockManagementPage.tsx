import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import { Save, Package } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';
import { Head } from '@inertiajs/react';

interface VariantValue {
  id: number;
  value: string;
  type: {
    id: number;
    name: string;
  };
}

interface ProductVariant {
  id: number;
  price: number;
  stock: number;
  display_name: string;
  variant_values: VariantValue[];
}

interface Product {
  id: number;
  name: { en: string; ar: string };
  category: {
    id: number;
    name: { en: string; ar: string };
  };
  image_url?: string;
  thumb_url?: string;
  variants: ProductVariant[];
}

function StockManagementPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockChanges, setStockChanges] = useState<Record<number, number>>({});

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/admin/api/stock-management');
      setProducts(response.data.products);
    } catch (error) {
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleStockChange = (variantId: number, value: string) => {
    const stockValue = parseInt(value) || 0;
    setStockChanges((prev) => ({
      ...prev,
      [variantId]: stockValue,
    }));
  };

  const handleBulkSave = async () => {
    const updates = Object.entries(stockChanges).map(([variantId, stock]) => ({
      variant_id: parseInt(variantId),
      stock,
    }));

    if (updates.length === 0) {
      toast.error('No changes to save');
      return;
    }

    setSaving(true);
    try {
      await axios.post('/admin/api/stock-management/bulk-update', {
        updates,
      });
      toast.success(`Updated ${updates.length} variant${updates.length > 1 ? 's' : ''}`);
      setStockChanges({});
      fetchProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update stock');
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const searchLower = searchQuery.toLowerCase();
    const nameEn = product.name.en.toLowerCase();
    const nameAr = product.name.ar.toLowerCase();
    const categoryEn = product.category.name.en.toLowerCase();

    return (
      nameEn.includes(searchLower) ||
      nameAr.includes(searchLower) ||
      categoryEn.includes(searchLower)
    );
  });

  const getTotalChanges = () => Object.keys(stockChanges).length;

  return (
    <>
      <Head title="Stock Management" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Stock Management</h1>
            <p className="text-muted-foreground">Manage product variant stock levels</p>
          </div>
          <Button onClick={handleBulkSave} disabled={getTotalChanges() === 0 || saving}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes {getTotalChanges() > 0 && `(${getTotalChanges()})`}
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </CardContent>
        </Card>

        {/* Stock Table */}
        <Card>
          <CardHeader>
            <CardTitle>Product Variants</CardTitle>
            <CardDescription>
              {filteredProducts.length} products, {filteredProducts.reduce((sum, p) => sum + p.variants.length, 0)} variants total
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center">Loading...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Package className="mx-auto mb-2 h-12 w-12 opacity-50" />
                <p>No products found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-semibold">Product</th>
                      <th className="pb-3 font-semibold">Variant</th>
                      <th className="pb-3 font-semibold">Price</th>
                      <th className="pb-3 font-semibold">Current Stock</th>
                      <th className="pb-3 font-semibold">New Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) =>
                      product.variants.map((variant, index) => (
                        <tr key={variant.id} className="border-b">
                          {index === 0 && (
                            <td className="py-3" rowSpan={product.variants.length}>
                              <div className="flex items-center gap-3">
                                {product.thumb_url ? (
                                  <img
                                    src={product.thumb_url}
                                    alt={product.name.en}
                                    className="h-12 w-12 rounded object-cover"
                                  />
                                ) : (
                                  <div className="h-12 w-12 rounded bg-muted" />
                                )}
                                <div>
                                  <div className="font-medium">{product.name.en}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {product.category.name.en}
                                  </div>
                                </div>
                              </div>
                            </td>
                          )}
                          <td className="py-3">
                            <Badge variant="secondary">
                              {variant.display_name || 'Default'}
                            </Badge>
                          </td>
                          <td className="py-3">{variant.price} LYD</td>
                          <td className="py-3">
                            <Badge variant={variant.stock > 0 ? 'default' : 'destructive'}>
                              {variant.stock}
                            </Badge>
                          </td>
                          <td className="py-3">
                            <Input
                              type="number"
                              min="0"
                              value={stockChanges[variant.id] ?? variant.stock}
                              onChange={(e) => handleStockChange(variant.id, e.target.value)}
                              className="w-24"
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

StockManagementPage.layout = (page: React.ReactNode) => (
  <AdminLayout breadcrumbs={[{ title: 'Admin', href: '/admin' }, { title: 'Stock Management' }]}>
    {page}
  </AdminLayout>
);

export default StockManagementPage;
