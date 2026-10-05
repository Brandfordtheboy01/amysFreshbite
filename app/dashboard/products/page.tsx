'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase, type Product, type Category } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatPrice } from '@/lib/format';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, ArrowLeft, Search, Eye, EyeOff, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type ProductForm = {
  id?: string;
  name: string;
  description: string;
  price: string;
  image_url: string;
  category_id: string;
  is_available: boolean;
};

const emptyForm: ProductForm = {
  name: '',
  description: '',
  price: '',
  image_url: '',
  category_id: '',
  is_available: true,
};

export default function ProductsManagerPage() {
  const router = useRouter();
  const { user, isOwner, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const checkAuth = useCallback(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return false;
    }
    if (!authLoading && user && !isOwner) {
      router.push('/');
      return false;
    }
    return true;
  }, [authLoading, user, isOwner, router]);

  useEffect(() => {
    if (!checkAuth()) return;
  }, [checkAuth]);

  const fetchData = useCallback(async () => {
    if (!user || !isOwner) return;
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from('products').select('*, category:categories(*)').order('sort_order'),
      supabase.from('categories').select('*').order('sort_order'),
    ]);
    setProducts((prods as Product[]) ?? []);
    setCategories((cats as Category[]) ?? []);
    setLoading(false);
  }, [user, isOwner]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = () => {
    setForm(emptyForm);
    setEditing(false);
    setDialogOpen(true);
  };

  const handleEdit = (product: Product) => {
    setForm({
      id: product.id,
      name: product.name,
      description: product.description ?? '',
      price: String(product.price),
      image_url: product.image_url ?? '',
      category_id: product.category_id ?? '',
      is_available: product.is_available,
    });
    setEditing(true);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) {
      toast.error('Name and price are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        price: parseFloat(form.price),
        image_url: form.image_url || null,
        category_id: form.category_id || null,
        is_available: form.is_available,
      };

      if (editing && form.id) {
        const { error } = await supabase.from('products').update(payload).eq('id', form.id);
        if (error) throw error;
        toast.success('Product updated');
      } else {
        const { error } = await supabase.from('products').insert(payload);
        if (error) throw error;
        toast.success('Product added');
      }
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from('products').delete().eq('id', product.id);
    if (error) {
      toast.error('Failed to delete product');
    } else {
      toast.success('Product deleted');
      fetchData();
    }
  };

  const toggleAvailability = async (product: Product) => {
    const { error } = await supabase
      .from('products')
      .update({ is_available: !product.is_available })
      .eq('id', product.id);
    if (error) {
      toast.error('Failed to update');
    } else {
      fetchData();
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase());
      const matchCat =
        categoryFilter === 'all' ||
        (categoryFilter === 'uncategorized' ? !p.category_id : p.category_id === categoryFilter);
      return matchSearch && matchCat;
    });
  }, [products, search, categoryFilter]);

  const columns: ColumnDef<Product>[] = [
    {
      header: 'Item',
      className: 'min-w-[240px]',
      cell: (product) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center flex-shrink-0 border border-border">
            {product.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-5 h-5 text-muted-foreground/50" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">{product.name}</p>
            {product.description && (
              <p className="text-xs text-muted-foreground truncate max-w-[220px]">
                {product.description}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Category',
      className: 'whitespace-nowrap',
      cell: (product) => (
        <Badge variant="outline" className="font-normal text-xs bg-muted/30">
          {product.category?.name ?? 'Uncategorized'}
        </Badge>
      ),
    },
    {
      header: 'Price',
      className: 'font-semibold text-foreground whitespace-nowrap',
      cell: (product) => formatPrice(product.price),
    },
    {
      header: 'Status',
      cell: (product) => (
        <Badge
          variant={product.is_available ? 'default' : 'secondary'}
          className={cn(
            'text-xs font-medium cursor-pointer',
            product.is_available
              ? 'bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25'
              : 'bg-muted text-muted-foreground'
          )}
          onClick={() => toggleAvailability(product)}
          title="Click to toggle availability"
        >
          {product.is_available ? 'Available' : 'Hidden'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      headerClassName: 'text-right pr-4',
      className: 'text-right pr-2',
      cell: (product) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleAvailability(product)}
            title={product.is_available ? 'Hide from menu' : 'Show on menu'}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            {product.is_available ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(product)}
            title="Edit dish"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(product)}
            title="Delete dish"
            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (authLoading || !user || !isOwner) {
    return <div className="max-w-2xl mx-auto px-4 py-20 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" />
        Back to dashboard
      </Link>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products & Menu Items</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage your dishes, pricing, imagery, and visibility.
          </p>
        </div>
        <Button onClick={handleAdd} className="gap-2 shadow-sm">
          <Plus className="w-4 h-4" />
          Add New Product
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>
        <div className="w-full sm:w-56">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="bg-card">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories ({products.length})</SelectItem>
              <SelectItem value="uncategorized">Uncategorized</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Global DataTable Component */}
      <DataTable
        columns={columns}
        data={filteredProducts}
        loading={loading}
        keyExtractor={(item) => item.id}
        emptyMessage={
          <div className="py-12 text-center">
            <p className="text-muted-foreground mb-3">No products match your criteria.</p>
            <Button onClick={handleAdd} variant="outline" size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              Add Product
            </Button>
          </div>
        }
      />

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Product' : 'Add Product'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Signature Grilled Salmon"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief savory description of the dish"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price ($) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="14.50"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={form.category_id || 'none'}
                  onValueChange={(v) => setForm({ ...form, category_id: v === 'none' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Uncategorized</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="image_url">Image URL</Label>
              <Input
                id="image_url"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="https://..."
              />
              {form.image_url && (
                <div className="w-full h-32 rounded-lg overflow-hidden bg-muted mt-2 border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button
                type="button"
                variant={form.is_available ? 'default' : 'outline'}
                size="sm"
                onClick={() => setForm({ ...form, is_available: !form.is_available })}
                className={cn(!form.is_available && 'text-muted-foreground')}
              >
                {form.is_available ? 'Available on menu' : 'Hidden from menu'}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
