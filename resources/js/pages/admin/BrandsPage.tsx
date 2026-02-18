import { Head } from '@inertiajs/react';
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
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import { Pencil, Trash2, Plus } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';

interface Brand {
  id: number;
  name: { en: string; ar: string };
}

function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [currentBrand, setCurrentBrand] = useState<Brand | null>(null);

  // Form state
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const response = await axios.get('/admin/api/brands');
      setBrands(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch brands');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await axios.post('/admin/api/brands', {
        name: { en: nameEn, ar: nameAr },
      });
      toast.success('Brand created successfully');
      setIsCreateOpen(false);
      resetForm();
      fetchBrands();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create brand');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBrand) return;

    try {
      await axios.put(`/admin/api/brands/${currentBrand.id}`, {
        name: { en: nameEn, ar: nameAr },
      });
      toast.success('Brand updated successfully');
      setIsEditOpen(false);
      resetForm();
      fetchBrands();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update brand');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this brand?')) return;

    try {
      await axios.delete(`/admin/api/brands/${id}`);
      toast.success('Brand deleted successfully');
      fetchBrands();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete brand');
    }
  };

  const openEditDialog = (brand: Brand) => {
    setCurrentBrand(brand);
    setNameEn(brand.name.en);
    setNameAr(brand.name.ar);
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setNameEn('');
    setNameAr('');
    setCurrentBrand(null);
  };

  return (
    <>
      <Head title="Brand Management" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Brand Management</h1>
            <p className="text-muted-foreground">
              Manage product brands and manufacturers
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Brand
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Brands</CardTitle>
            <CardDescription>{brands.length} brands total</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-semibold">Name (English)</th>
                      <th className="pb-3 font-semibold">Name (Arabic)</th>
                      <th className="pb-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brands.map((brand) => (
                      <tr key={brand.id} className="border-b">
                        <td className="py-3">{brand.name.en}</td>
                        <td className="py-3">{brand.name.ar}</td>
                        <td className="py-3">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(brand)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(brand.id)}
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
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create Brand</DialogTitle>
                <DialogDescription>Add a new product brand</DialogDescription>
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
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Brand</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <form onSubmit={handleEdit}>
              <DialogHeader>
                <DialogTitle>Edit Brand</DialogTitle>
                <DialogDescription>Update brand information</DialogDescription>
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
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Brand</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

BrandsPage.layout = (page: React.ReactNode) => (
  <AdminLayout breadcrumbs={[{ title: 'Admin', href: '/admin' }, { title: 'Brands' }]}>
    {page}
  </AdminLayout>
);

export default BrandsPage;
