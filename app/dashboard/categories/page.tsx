'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase, type Category } from '@/lib/supabase';
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
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, ArrowLeft, Search, Layers } from 'lucide-react';

type CategoryForm = {
  id?: string;
  name: string;
  description: string;
  sort_order: string;
};

const emptyForm: CategoryForm = {
  name: '',
  description: '',
  sort_order: '0',
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function CategoriesManagerPage() {
  const router = useRouter();
  const { user, isOwner, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (!authLoading && user && !isOwner) {
      router.push('/');
    }
  }, [user, isOwner, authLoading, router]);

  const fetchData = useCallback(async () => {
    if (!user || !isOwner) return;
    const [{ data: cats }, { data: prods }] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('products').select('category_id'),
    ]);
    const catList = (cats as Category[]) ?? [];
    setCategories(catList);
    const countMap: Record<string, number> = {};
    (prods ?? []).forEach((p: { category_id: string | null }) => {
      if (p.category_id) {
        countMap[p.category_id] = (countMap[p.category_id] ?? 0) + 1;
      }
    });
    setCounts(countMap);
    setLoading(false);
  }, [user, isOwner]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = () => {
    setForm({ ...emptyForm, sort_order: String(categories.length) });
    setEditing(false);
    setDialogOpen(true);
  };

  const handleEdit = (cat: Category) => {
    setForm({
      id: cat.id,
      name: cat.name,
      description: cat.description ?? '',
      sort_order: String(cat.sort_order),
    });
    setEditing(true);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      const slug = slugify(form.name);
      const payload = {
        name: form.name,
        slug,
        description: form.description || null,
        sort_order: parseInt(form.sort_order) || 0,
      };

      if (editing && form.id) {
        const { error } = await supabase.from('categories').update(payload).eq('id', form.id);
        if (error) throw error;
        toast.success('Category updated');
      } else {
        const { error } = await supabase.from('categories').insert(payload);
        if (error) throw error;
        toast.success('Category added');
      }
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (counts[cat.id] > 0) {
      toast.error(`Cannot delete: ${counts[cat.id]} products are in this category. Move them first.`);
      return;
    }
    if (!confirm(`Delete "${cat.name}"?`)) return;
    const { error } = await supabase.from('categories').delete().eq('id', cat.id);
    if (error) {
      toast.error('Failed to delete category');
    } else {
      toast.success('Category deleted');
      fetchData();
    }
  };

  const filteredCategories = useMemo(() => {
    return categories.filter(
      (c) =>
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.description?.toLowerCase().includes(search.toLowerCase()) ||
        c.slug.toLowerCase().includes(search.toLowerCase())
    );
  }, [categories, search]);

  const columns: ColumnDef<Category>[] = [
    {
      header: 'Order',
      className: 'w-16 font-mono text-xs text-muted-foreground text-center',
      headerClassName: 'text-center',
      cell: (cat) => `#${cat.sort_order}`,
    },
    {
      header: 'Category Name',
      className: 'min-w-[180px]',
      cell: (cat) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-sm text-foreground">{cat.name}</span>
            <span className="block text-xs text-muted-foreground font-mono">/{cat.slug}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Description',
      className: 'text-muted-foreground text-sm max-w-sm truncate',
      cell: (cat) => cat.description || <span className="italic text-xs text-muted-foreground/60">No description</span>,
    },
    {
      header: 'Items Count',
      cell: (cat) => (
        <Badge variant="secondary" className="font-medium text-xs">
          {counts[cat.id] ?? 0} {(counts[cat.id] ?? 0) === 1 ? 'dish' : 'dishes'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      headerClassName: 'text-right pr-4',
      className: 'text-right pr-2',
      cell: (cat) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(cat)}
            title="Edit category"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(cat)}
            title="Delete category"
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" />
        Back to dashboard
      </Link>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Menu Categories</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Organize sections and dish classifications</p>
        </div>
        <Button onClick={handleAdd} className="gap-2 shadow-sm">
          <Plus className="w-4 h-4" />
          Add Category
        </Button>
      </div>

      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-card"
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredCategories}
        loading={loading}
        keyExtractor={(item) => item.id}
        emptyMessage={
          <div className="py-12 text-center">
            <p className="text-muted-foreground mb-3">No categories found.</p>
            <Button onClick={handleAdd} variant="outline" size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              Add your first category
            </Button>
          </div>
        }
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Category' : 'Add Category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Name *</Label>
              <Input
                id="cat-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Appetizers"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-desc">Description</Label>
              <Textarea
                id="cat-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Short description of this section"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-order">Display Order</Label>
              <Input
                id="cat-order"
                type="number"
                min="0"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
