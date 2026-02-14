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
import { Pencil, Trash2, Plus, X } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';

interface VariantValue {
  id?: number;
  value: { en: string; ar: string };
}

interface VariantType {
  id: number;
  name: { en: string; ar: string };
  slug: string;
  variant_values: VariantValue[];
}

function VariantTypesPage() {
  const [variantTypes, setVariantTypes] = useState<VariantType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [currentVariantType, setCurrentVariantType] = useState<VariantType | null>(null);

  // Form state
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [slug, setSlug] = useState('');
  const [values, setValues] = useState<Array<{ value: { en: string; ar: string } }>>([
    { value: { en: '', ar: '' } },
  ]);

  useEffect(() => {
    fetchVariantTypes();
  }, []);

  const fetchVariantTypes = async () => {
    try {
      const response = await axios.get('/admin/api/variant-types');
      setVariantTypes(response.data);
    } catch (error) {
      toast.error('Failed to fetch variant types');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (text: string) => {
    return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  const addValue = () => {
    setValues([...values, { value: { en: '', ar: '' } }]);
  };

  const removeValue = (index: number) => {
    if (values.length > 1) {
      setValues(values.filter((_, i) => i !== index));
    }
  };

  const updateValue = (index: number, lang: 'en' | 'ar', text: string) => {
    const newValues = [...values];
    newValues[index] = {
      ...newValues[index],
      value: {
        ...newValues[index].value,
        [lang]: text,
      },
    };
    setValues(newValues);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const filteredValues = values.filter((v) => v.value.en.trim() && v.value.ar.trim());

    try {
      await axios.post('/admin/api/variant-types', {
        name: { en: nameEn, ar: nameAr },
        slug: slug || generateSlug(nameEn),
        values: filteredValues.length > 0 ? filteredValues : undefined,
      });
      toast.success('Variant type created successfully');
      setIsCreateOpen(false);
      resetForm();
      fetchVariantTypes();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create variant type');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVariantType) return;

    const filteredValues = values.filter((v) => v.value.en.trim() && v.value.ar.trim());

    try {
      await axios.put(`/admin/api/variant-types/${currentVariantType.id}`, {
        name: { en: nameEn, ar: nameAr },
        slug: slug,
        values: filteredValues.length > 0 ? filteredValues : undefined,
      });
      toast.success('Variant type updated successfully');
      setIsEditOpen(false);
      resetForm();
      fetchVariantTypes();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update variant type');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this variant type?')) return;

    try {
      await axios.delete(`/admin/api/variant-types/${id}`);
      toast.success('Variant type deleted successfully');
      fetchVariantTypes();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete variant type');
    }
  };

  const openEditDialog = (variantType: VariantType) => {
    setCurrentVariantType(variantType);
    setNameEn(variantType.name.en);
    setNameAr(variantType.name.ar);
    setSlug(variantType.slug);
    setValues(
      variantType.variant_values.length > 0
        ? variantType.variant_values.map((v) => ({ value: v.value }))
        : [{ value: { en: '', ar: '' } }]
    );
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setNameEn('');
    setNameAr('');
    setSlug('');
    setValues([{ value: { en: '', ar: '' } }]);
    setCurrentVariantType(null);
  };

  return (
    <>
      <Head title="Variant Type Management" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Variant Type Management</h1>
            <p className="text-muted-foreground">
              Create reusable variant types like Size, Color, Material
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Variant Type
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Variant Types</CardTitle>
            <CardDescription>{variantTypes.length} variant types total</CardDescription>
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
                      <th className="pb-3 font-semibold">Slug</th>
                      <th className="pb-3 font-semibold">Values</th>
                      <th className="pb-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variantTypes.map((variantType) => (
                      <tr key={variantType.id} className="border-b">
                        <td className="py-3">{variantType.name.en}</td>
                        <td className="py-3">{variantType.name.ar}</td>
                        <td className="py-3">
                          <Badge variant="secondary">{variantType.slug}</Badge>
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-1">
                            {variantType.variant_values.slice(0, 3).map((value, idx) => (
                              <Badge key={idx} variant="outline">
                                {value.value.en}
                              </Badge>
                            ))}
                            {variantType.variant_values.length > 3 && (
                              <Badge variant="outline">
                                +{variantType.variant_values.length - 3}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(variantType)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(variantType.id)}
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
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create Variant Type</DialogTitle>
                <DialogDescription>Add a new variant type with optional values</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nameEn">Name (English)</Label>
                  <Input
                    id="nameEn"
                    value={nameEn}
                    onChange={(e) => {
                      setNameEn(e.target.value);
                      if (!slug) setSlug(generateSlug(e.target.value));
                    }}
                    placeholder="e.g., Size"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="nameAr">Name (Arabic)</Label>
                  <Input
                    id="nameAr"
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    placeholder="e.g., الحجم"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(generateSlug(e.target.value))}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label>Values (Optional)</Label>
                    <Button type="button" size="sm" variant="outline" onClick={addValue}>
                      <Plus className="mr-1 h-3 w-3" />
                      Add Value
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {values.map((value, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="English (e.g., Small)"
                          value={value.value.en}
                          onChange={(e) => updateValue(index, 'en', e.target.value)}
                        />
                        <Input
                          placeholder="Arabic (e.g., صغير)"
                          value={value.value.ar}
                          onChange={(e) => updateValue(index, 'ar', e.target.value)}
                        />
                        {values.length > 1 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeValue(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Variant Type</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleEdit}>
              <DialogHeader>
                <DialogTitle>Edit Variant Type</DialogTitle>
                <DialogDescription>Update variant type information</DialogDescription>
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
                  <Label htmlFor="editSlug">Slug</Label>
                  <Input
                    id="editSlug"
                    value={slug}
                    onChange={(e) => setSlug(generateSlug(e.target.value))}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label>Values</Label>
                    <Button type="button" size="sm" variant="outline" onClick={addValue}>
                      <Plus className="mr-1 h-3 w-3" />
                      Add Value
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {values.map((value, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="English"
                          value={value.value.en}
                          onChange={(e) => updateValue(index, 'en', e.target.value)}
                        />
                        <Input
                          placeholder="Arabic"
                          value={value.value.ar}
                          onChange={(e) => updateValue(index, 'ar', e.target.value)}
                        />
                        {values.length > 1 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeValue(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Variant Type</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

VariantTypesPage.layout = (page: React.ReactNode) => (
  <AdminLayout breadcrumbs={[{ title: 'Admin', href: '/admin' }, { title: 'Variant Types' }]}>
    {page}
  </AdminLayout>
);

export default VariantTypesPage;
