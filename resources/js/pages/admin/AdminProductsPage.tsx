import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import { Pencil, Trash2, Plus, Settings, X } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';
import { Head } from '@inertiajs/react';

interface VariantValue {
  id: number;
  value: { en: string; ar: string };
  variant_type?: {
    id: number;
    name: { en: string; ar: string };
    slug: string;
  };
}

interface ProductVariant {
  id: number;
  price: number;
  stock: number;
  display_name: string;
  variant_values: VariantValue[];
}

interface VariantType {
  id: number;
  name: { en: string; ar: string };
  slug: string;
  variant_values: VariantValue[];
}

interface Product {
  id: number;
  name: { en: string; ar: string };
  description?: { en: string; ar: string };
  price: number;
  stock: number;
  variant_count?: number;
  category_id: number;
  category: {
    id: number;
    name: { en: string; ar: string };
    slug: string;
  };
  image_url?: string;
  thumb_url?: string;
}

interface Category {
  id: number;
  name: { en: string; ar: string };
  slug: string;
}

function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);

  // Form state
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descAr, setDescAr] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [image, setImage] = useState<File | null>(null);

  // Variant management state
  const [isVariantDialogOpen, setIsVariantDialogOpen] = useState(false);
  const [variantTypes, setVariantTypes] = useState<VariantType[]>([]);
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);
  const [selectedVariantTypes, setSelectedVariantTypes] = useState<number[]>([]);
  const [variantCombinations, setVariantCombinations] = useState<
    Array<{
      variant_value_ids: number[];
      price: string;
      stock: string;
    }>
  >([]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/admin/api/products');
      setProducts(response.data.products);
    } catch (error) {
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories');
    }
  };

  const fetchVariantTypes = async () => {
    try {
      const response = await axios.get('/admin/api/variant-types');
      setVariantTypes(response.data);
    } catch (error) {
      console.error('Failed to fetch variant types');
    }
  };

  const fetchProductVariants = async (productId: number) => {
    try {
      const response = await axios.get(`/admin/api/products/${productId}/variants`);
      setProductVariants(response.data);
    } catch (error) {
      toast.error('Failed to fetch product variants');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name[en]', nameEn);
    formData.append('name[ar]', nameAr);
    formData.append('description[en]', descEn);
    formData.append('description[ar]', descAr);
    formData.append('price', price);
    formData.append('stock', stock);
    formData.append('categoryId', categoryId);
    if (image) formData.append('image', image);

    try {
      await axios.post('/admin/api/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Product created successfully');
      setIsCreateOpen(false);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create product');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct) return;

    const formData = new FormData();
    formData.append('name[en]', nameEn);
    formData.append('name[ar]', nameAr);
    formData.append('description[en]', descEn);
    formData.append('description[ar]', descAr);
    formData.append('price', price);
    formData.append('stock', stock);
    formData.append('categoryId', categoryId);
    if (image) formData.append('image', image);
    formData.append('_method', 'PUT');

    try {
      await axios.post(`/admin/api/products/${currentProduct.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Product updated successfully');
      setIsEditOpen(false);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update product');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await axios.delete(`/admin/api/products/${id}`);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    }
  };

  const openEditDialog = (product: Product) => {
    console.log('Opening edit dialog for product:', product);
    setCurrentProduct(product);

    // Handle both string and object name formats
    const name = typeof product.name === 'object' ? product.name : { en: '', ar: '' };
    const description = typeof product.description === 'object' ? product.description : { en: '', ar: '' };

    console.log('Name:', name);
    console.log('Description:', description);

    setNameEn(name.en || '');
    setNameAr(name.ar || '');
    setDescEn(description.en || '');
    setDescAr(description.ar || '');
    setPrice(product.price.toString());
    setStock(product.stock.toString());
    setCategoryId(product.category_id.toString());
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setNameEn('');
    setNameAr('');
    setDescEn('');
    setDescAr('');
    setPrice('');
    setStock('');
    setCategoryId('');
    setImage(null);
    setCurrentProduct(null);
  };

  const openVariantDialog = async (product: Product) => {
    setCurrentProduct(product);
    await fetchVariantTypes();
    await fetchProductVariants(product.id);
    setIsVariantDialogOpen(true);
  };

  const generateCombinations = () => {
    if (selectedVariantTypes.length === 0) {
      toast.error('Please select at least one variant type');
      return;
    }

    const selectedTypes = variantTypes.filter((vt) =>
      selectedVariantTypes.includes(vt.id)
    );

    const combinations: number[][] = [[]];
    for (const variantType of selectedTypes) {
      const newCombinations: number[][] = [];
      for (const combination of combinations) {
        for (const value of variantType.variant_values) {
          newCombinations.push([...combination, value.id]);
        }
      }
      combinations.splice(0, combinations.length, ...newCombinations);
    }

    setVariantCombinations(
      combinations.map((combo) => ({
        variant_value_ids: combo,
        price: currentProduct?.price.toString() || '',
        stock: '0',
      }))
    );
  };

  const handleSaveVariants = async () => {
    if (!currentProduct) return;

    const validCombinations = variantCombinations.filter(
      (c) => c.variant_value_ids.length > 0
    );

    if (validCombinations.length === 0) {
      toast.error('Please generate variant combinations first');
      return;
    }

    try {
      await axios.post(`/admin/api/products/${currentProduct.id}/variants/generate`, {
        combinations: validCombinations.map((c) => ({
          variant_value_ids: c.variant_value_ids,
          price: parseFloat(c.price),
          stock: parseInt(c.stock),
        })),
      });

      toast.success('Variants generated successfully');
      setIsVariantDialogOpen(false);
      setVariantCombinations([]);
      setSelectedVariantTypes([]);
      fetchProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate variants');
    }
  };

  const handleDeleteVariant = async (variantId: number) => {
    if (!confirm('Are you sure you want to delete this variant?')) return;

    try {
      await axios.delete(`/admin/api/product-variants/${variantId}`);
      toast.success('Variant deleted successfully');
      if (currentProduct) {
        await fetchProductVariants(currentProduct.id);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete variant');
    }
  };

  const getVariantDisplayName = (variantValueIds: number[]): string => {
    const values = variantTypes
      .flatMap((vt) => vt.variant_values)
      .filter((vv) => variantValueIds.includes(vv.id));

    return values.map((v) => v.value.en).join(', ');
  };

  return (
    <>
      <Head title="Product Management" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Product Management</h1>
            <p className="text-muted-foreground">Manage your e-commerce products</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
            <CardDescription>
              {products.length} products total
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-semibold">Image</th>
                      <th className="pb-3 font-semibold">Name (EN)</th>
                      <th className="pb-3 font-semibold">Name (AR)</th>
                      <th className="pb-3 font-semibold">Category</th>
                      <th className="pb-3 font-semibold">Price</th>
                      <th className="pb-3 font-semibold">Stock</th>
                      <th className="pb-3 font-semibold">Variants</th>
                      <th className="pb-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} className="border-b">
                        <td className="py-3">
                          {product.thumb_url ? (
                            <img
                              src={product.thumb_url}
                              alt={typeof product.name === 'object' ? product.name.en : product.name}
                              className="h-12 w-12 rounded object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded bg-muted" />
                          )}
                        </td>
                        <td className="py-3">
                          {typeof product.name === 'object' ? product.name.en : product.name}
                        </td>
                        <td className="py-3">
                          {typeof product.name === 'object' ? product.name.ar : product.name}
                        </td>
                        <td className="py-3">
                          <Badge variant="secondary">
                            {typeof product.category.name === 'object'
                              ? product.category.name.en
                              : product.category.name}
                          </Badge>
                        </td>
                        <td className="py-3">{product.price} LYD</td>
                        <td className="py-3">
                          <Badge variant={product.stock > 0 ? 'default' : 'destructive'}>
                            {product.stock}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <Badge variant="secondary">
                            {product.variant_count || 0} variant{product.variant_count !== 1 ? 's' : ''}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(product)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => openVariantDialog(product)}
                              title="Manage Variants"
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(product.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create Product</DialogTitle>
                <DialogDescription>Add a new product to your store</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nameEn">Name (English)</Label>
                  <Input
                    id="nameEn"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="nameAr">Name (Arabic)</Label>
                  <Input
                    id="nameAr"
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="descEn">Description (English)</Label>
                  <Input
                    id="descEn"
                    value={descEn}
                    onChange={(e) => setDescEn(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="descAr">Description (Arabic)</Label>
                  <Input
                    id="descAr"
                    value={descAr}
                    onChange={(e) => setDescAr(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="stock">Stock</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {typeof cat.name === 'object' ? cat.name.en : cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="image">Image</Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImage(e.target.files?.[0] || null)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Product</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog
          open={isEditOpen}
          onOpenChange={(open) => {
            setIsEditOpen(open);
            if (!open) {
              resetForm();
            }
          }}
        >
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
            <form onSubmit={handleEdit}>
              <DialogHeader>
                <DialogTitle>Edit Product</DialogTitle>
                <DialogDescription>Update product information</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="editNameEn">Name (English)</Label>
                  <Input
                    id="editNameEn"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editNameAr">Name (Arabic)</Label>
                  <Input
                    id="editNameAr"
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editDescEn">Description (English)</Label>
                  <Input
                    id="editDescEn"
                    value={descEn}
                    onChange={(e) => setDescEn(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editDescAr">Description (Arabic)</Label>
                  <Input
                    id="editDescAr"
                    value={descAr}
                    onChange={(e) => setDescAr(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="editPrice">Price</Label>
                    <Input
                      id="editPrice"
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="editStock">Stock</Label>
                    <Input
                      id="editStock"
                      type="number"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editCategory">Category</Label>
                  <select
                    id="editCategory"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {typeof cat.name === 'object' ? cat.name.en : cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editImage">Image (leave empty to keep current)</Label>
                  <Input
                    id="editImage"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImage(e.target.files?.[0] || null)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Product</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Variant Management Dialog */}
        <Dialog open={isVariantDialogOpen} onOpenChange={setIsVariantDialogOpen}>
          <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Manage Product Variants</DialogTitle>
              <DialogDescription>
                {currentProduct?.name.en} - Create and manage product variants
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Existing Variants */}
              {productVariants.length > 0 && (
                <div>
                  <h3 className="mb-3 font-semibold">Existing Variants</h3>
                  <div className="overflow-x-auto rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="p-2 text-left text-sm font-semibold">Variant</th>
                          <th className="p-2 text-left text-sm font-semibold">Price</th>
                          <th className="p-2 text-left text-sm font-semibold">Stock</th>
                          <th className="p-2 text-left text-sm font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productVariants.map((variant) => (
                          <tr key={variant.id} className="border-b">
                            <td className="p-2">{variant.display_name || 'Default'}</td>
                            <td className="p-2">{variant.price} LYD</td>
                            <td className="p-2">
                              <Badge variant={variant.stock > 0 ? 'default' : 'destructive'}>
                                {variant.stock}
                              </Badge>
                            </td>
                            <td className="p-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteVariant(variant.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Generate New Variants */}
              <div>
                <h3 className="mb-3 font-semibold">Generate New Variants</h3>

                {/* Select Variant Types */}
                <div className="mb-4 space-y-2">
                  <Label>Select Variant Types</Label>
                  <div className="flex flex-wrap gap-2">
                    {variantTypes.map((variantType) => (
                      <div key={variantType.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`vt-${variantType.id}`}
                          checked={selectedVariantTypes.includes(variantType.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedVariantTypes([...selectedVariantTypes, variantType.id]);
                            } else {
                              setSelectedVariantTypes(
                                selectedVariantTypes.filter((id) => id !== variantType.id)
                              );
                            }
                          }}
                        />
                        <Label htmlFor={`vt-${variantType.id}`} className="cursor-pointer">
                          {variantType.name.en} ({variantType.variant_values.length} values)
                        </Label>
                      </div>
                    ))}
                  </div>
                  {variantTypes.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No variant types available. Create them in Variant Types page first.
                    </p>
                  )}
                </div>

                <Button type="button" onClick={generateCombinations} disabled={selectedVariantTypes.length === 0}>
                  Generate Combinations
                </Button>

                {/* Variant Combinations Table */}
                {variantCombinations.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-sm text-muted-foreground">
                      {variantCombinations.length} combinations generated
                    </p>
                    <div className="max-h-80 overflow-y-auto rounded-md border">
                      <table className="w-full">
                        <thead className="sticky top-0 bg-muted/50">
                          <tr className="border-b">
                            <th className="p-2 text-left text-sm font-semibold">Variant</th>
                            <th className="p-2 text-left text-sm font-semibold">Price</th>
                            <th className="p-2 text-left text-sm font-semibold">Stock</th>
                            <th className="p-2 text-left text-sm font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {variantCombinations.map((combo, index) => (
                            <tr key={index} className="border-b">
                              <td className="p-2 text-sm">
                                {getVariantDisplayName(combo.variant_value_ids)}
                              </td>
                              <td className="p-2">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={combo.price}
                                  onChange={(e) => {
                                    const newCombos = [...variantCombinations];
                                    newCombos[index].price = e.target.value;
                                    setVariantCombinations(newCombos);
                                  }}
                                  className="h-8 w-24"
                                />
                              </td>
                              <td className="p-2">
                                <Input
                                  type="number"
                                  value={combo.stock}
                                  onChange={(e) => {
                                    const newCombos = [...variantCombinations];
                                    newCombos[index].stock = e.target.value;
                                    setVariantCombinations(newCombos);
                                  }}
                                  className="h-8 w-20"
                                />
                              </td>
                              <td className="p-2">
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    const newCombos = variantCombinations.filter((_, i) => i !== index);
                                    setVariantCombinations(newCombos);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsVariantDialogOpen(false);
                  setVariantCombinations([]);
                  setSelectedVariantTypes([]);
                }}
              >
                Cancel
              </Button>
              {variantCombinations.length > 0 && (
                <Button type="button" onClick={handleSaveVariants}>
                  Save Variants
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

AdminProductsPage.layout = (page: React.ReactNode) => (
  <AdminLayout breadcrumbs={[{ title: 'Admin', href: '/admin' }, { title: 'Products' }]}>
    {page}
  </AdminLayout>
);

export default AdminProductsPage;
