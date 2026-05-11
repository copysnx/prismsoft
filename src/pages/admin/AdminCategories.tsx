import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  FolderTree,
  Package,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useCategories, Category } from "@/hooks/useCategories";
import { useProducts } from "@/hooks/useProducts";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const emptyCategory = {
  name: "",
  slug: "",
  description: "",
  icon: "",
  sort_order: 0,
  is_active: true,
};

const AdminCategories = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const {
    categories,
    loading,
    createCategory,
    updateCategory,
    deleteCategory,
    fetchCategories,
  } = useCategories();
  const { products, fetchProducts } = useProducts();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selected, setSelected] = useState<Category | null>(null);
  const [form, setForm] = useState(emptyCategory);
  const [saving, setSaving] = useState(false);
  const [pickedIds, setPickedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);
  useEffect(() => {
    if (!adminLoading && !isAdmin && user) navigate("/");
  }, [isAdmin, adminLoading, user, navigate]);

  const openCreate = () => {
    setSelected(null);
    setForm(emptyCategory);
    setIsDialogOpen(true);
  };
  const openEdit = (c: Category) => {
    setSelected(c);
    setForm({
      name: c.name,
      slug: c.slug,
      description: c.description || "",
      icon: c.icon || "",
      sort_order: c.sort_order,
      is_active: c.is_active,
    });
    setIsDialogOpen(true);
  };
  const openDelete = (c: Category) => {
    setSelected(c);
    setIsDeleteOpen(true);
  };
  const openAssign = (c: Category) => {
    setSelected(c);
    const ids = new Set(
      products.filter((p) => p.category_id === c.id).map((p) => p.id),
    );
    setPickedIds(ids);
    setIsAssignOpen(true);
  };

  const slugify = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, slug: form.slug || slugify(form.name) };
      if (selected) {
        await updateCategory(selected.id, payload);
        toast.success("Categoria atualizada!");
      } else {
        await createCategory(payload);
        toast.success("Categoria criada!");
      }
      setIsDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await deleteCategory(selected.id);
      toast.success("Categoria excluída!");
      setIsDeleteOpen(false);
      await fetchProducts();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSaveAssignments = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const inCategory = products
        .filter((p) => p.category_id === selected.id)
        .map((p) => p.id);
      const toAdd = [...pickedIds].filter((id) => !inCategory.includes(id));
      const toRemove = inCategory.filter((id) => !pickedIds.has(id));

      if (toAdd.length) {
        const { error } = await supabase
          .from("products")
          .update({ category_id: selected.id })
          .in("id", toAdd);
        if (error) throw error;
      }
      if (toRemove.length) {
        const { error } = await supabase
          .from("products")
          .update({ category_id: null })
          .in("id", toRemove);
        if (error) throw error;
      }

      toast.success("Produtos atualizados!");
      await fetchProducts();
      setIsAssignOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || adminLoading)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Categorias</h1>
              <p className="text-sm text-muted-foreground">
                Gerenciar categorias da Store
              </p>
            </div>
          </div>
          <Button variant="hero" onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Nova Categoria
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12">
            <FolderTree className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">
              Nenhuma categoria cadastrada
            </h3>
            <Button variant="hero" onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" /> Nova Categoria
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {categories.map((c) => {
              const count = products.filter((p) => p.category_id === c.id).length;
              return (
                <div
                  key={c.id}
                  className="bg-card rounded-xl border border-border p-4 flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center">
                    <FolderTree className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{c.name}</h3>
                      {!c.is_active && (
                        <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-500 text-xs">
                          Inativa
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      /store/{c.slug} · {count} produto(s) · ordem {c.sort_order}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => openAssign(c)}
                    >
                      <Package className="h-4 w-4" /> Produtos
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => openEdit(c)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => openDelete(c)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create/Edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selected ? "Editar Categoria" : "Nova Categoria"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                      slug: selected ? form.slug : slugify(e.target.value),
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) =>
                    setForm({ ...form, slug: slugify(e.target.value) })
                  }
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ícone (lucide-react)</Label>
                <Input
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  placeholder="MessageCircle"
                />
              </div>
              <div className="space-y-2">
                <Label>Ordem</Label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) =>
                    setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
              <Label>Categoria ativa</Label>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="hero" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Products */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Produtos em "{selected?.name}"</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {products.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum produto cadastrado.</p>
            ) : (
              products.map((p) => (
                <label
                  key={p.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                >
                  <Checkbox
                    checked={pickedIds.has(p.id)}
                    onCheckedChange={(v) => {
                      const next = new Set(pickedIds);
                      v ? next.add(p.id) : next.delete(p.id);
                      setPickedIds(next);
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.category_id
                        ? p.category_id === selected?.id
                          ? "Já nesta categoria"
                          : "Em outra categoria"
                        : "Sem categoria"}
                    </p>
                  </div>
                </label>
              ))
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsAssignOpen(false)}>
              Cancelar
            </Button>
            <Button variant="hero" onClick={handleSaveAssignments} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              "{selected?.name}" será excluída. Os produtos vinculados ficarão sem
              categoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminCategories;
