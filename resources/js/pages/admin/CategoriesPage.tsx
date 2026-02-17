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
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import { Pencil, Trash2, Plus } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';

interface Category {
  id: number;
  name: { en: string; ar: string };
}

function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);

  // Form state
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/admin/api/categories');
      setCategories(response.data);
    } catch (error) {
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await axios.post('/admin/api/categories', {
        name: { en: nameEn, ar: nameAr },
      });
      toast.success('Category created successfully');
      setIsCreateOpen(false);
      resetForm();
      fetchCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create category');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCategory) return;

    try {
      await axios.put(`/admin/api/categories/${currentCategory.id}`, {
        name: { en: nameEn, ar: nameAr },
      });
      toast.success('Category updated successfully');
      setIsEditOpen(false);
      resetForm();
      fetchCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update category');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      await axios.delete(`/admin/api/categories/${id}`);
      toast.success('Category deleted successfully');
      fetchCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete category');
    }
  };

  const openEditDialog = (category: Category) => {
    setCurrentCategory(category);
    setNameEn(category.name.en);
    setNameAr(category.name.ar);
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setNameEn('');
    setNameAr('');
    setCurrentCategory(null);
  };

  return (
    <>
      <Head title="Category Management" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Category Management</h1>
            <p className="text-muted-foreground">
              Organize your products into categories
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>{categories.length} categories total</CardDescription>
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
                    {categories.map((category) => (
                      <tr key={category.id} className="border-b">
                        <td className="py-3">{category.name.en}</td>
                        <td className="py-3">{category.name.ar}</td>
                        <td className="py-3">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(category)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(category.id)}
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
                <DialogTitle>Create Category</DialogTitle>
                <DialogDescription>Add a new product category</DialogDescription>
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
                <Button type="submit">Create Category</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <form onSubmit={handleEdit}>
              <DialogHeader>
                <DialogTitle>Edit Category</DialogTitle>
                <DialogDescription>Update category information</DialogDescription>
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
                <Button type="submit">Update Category</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

CategoriesPage.layout = (page: React.ReactNode) => (
  <AdminLayout breadcrumbs={[{ title: 'Admin', href: '/admin' }, { title: 'Categories' }]}>
    {page}
  </AdminLayout>
);

export default CategoriesPage;
