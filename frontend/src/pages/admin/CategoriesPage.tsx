import { useState, useMemo } from 'react';
import {
  useGetCategoryTreeQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from '../../features/products/productsApi';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, Save, X, Eye, EyeOff } from 'lucide-react';
import { useNotification } from '../../components/ui/NotificationProvider';
import type { CategoryDTO } from '../../features/products/productsTypes';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ─── Recursive tree node ──────────────────────────────────────────────
function CategoryTreeNode({
  node,
  onEdit,
  onDelete,
  depth,
}: {
  node: CategoryDTO;
  onEdit: (cat: CategoryDTO) => void;
  onDelete: (id: string) => void;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-gray-50 group ${
          !node.active ? 'opacity-60' : ''
        }`}
        style={{ paddingLeft: `${12 + depth * 20}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-0.5 text-gray-400 hover:text-gray-600"
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <span className="w-5" />
        )}

        {node.image && (
          <img src={node.image} alt="" className="h-6 w-6 rounded object-cover" />
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{node.name}</p>
          {node.slug && (
            <p className="text-xs text-gray-400 truncate">/{node.slug}</p>
          )}
        </div>

        <span className="text-xs text-gray-400 hidden sm:inline">{node.sortOrder}</span>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {node.active ? (
            <Eye className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <EyeOff className="h-3.5 w-3.5 text-gray-300" />
          )}
          <button
            type="button"
            onClick={() => onEdit(node)}
            className="p-1 text-gray-400 hover:text-indigo-600"
            title="Editar"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(node.id)}
            className="p-1 text-gray-400 hover:text-red-600"
            title="Eliminar"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <CategoryTreeNode
              key={child.id}
              node={child}
              onEdit={onEdit}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────
export default function CategoriesPage() {
  const { data: categories, isLoading, isError } = useGetCategoryTreeQuery();
  const [createCategory] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const { notify } = useNotification();

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    parentId: '',
    sortOrder: '0',
    image: '',
    active: true,
  });
  const [slugAuto, setSlugAuto] = useState(true);
  const [saving, setSaving] = useState(false);

  // Flatten categories for parent selector
  const flatOptions = useMemo(() => {
    const flatten = (cats: CategoryDTO[], prefix = ''): { value: string; label: string }[] => {
      const result: { value: string; label: string }[] = [];
      for (const c of cats) {
        result.push({ value: c.id, label: prefix + c.name });
        if (c.children) result.push(...flatten(c.children, prefix + '— '));
      }
      return result;
    };
    const opts = categories ? flatten(categories) : [];
    return [{ value: '', label: 'Ninguna (categoría raíz)' }, ...opts];
  }, [categories]);

  const resetForm = () => {
    setForm({ name: '', slug: '', description: '', parentId: '', sortOrder: '0', image: '', active: true });
    setEditingId(null);
    setSlugAuto(true);
    setShowForm(false);
  };

  const handleEdit = (cat: CategoryDTO) => {
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      parentId: cat.parentId || '',
      sortOrder: String(cat.sortOrder ?? 0),
      image: cat.image || '',
      active: cat.active,
    });
    setEditingId(cat.id);
    setSlugAuto(false);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta categoría? Las subcategorías podrían quedar huérfanas.')) return;
    try {
      await deleteCategory(id).unwrap();
      notify({ title: 'Categoría eliminada', message: 'La categoría se eliminó correctamente.', variant: 'success' });
    } catch {
      notify({ title: 'Error', message: 'No se pudo eliminar la categoría.', variant: 'error' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        slug: form.slug.trim() || slugify(form.name),
        description: form.description.trim(),
        parentId: form.parentId || null,
        sortOrder: parseInt(form.sortOrder, 10) || 0,
        image: form.image.trim() || null,
        active: form.active,
      };

      if (editingId) {
        await updateCategory({ id: editingId, body }).unwrap();
        notify({ title: 'Categoría actualizada', message: 'Los cambios se guardaron correctamente.', variant: 'success' });
      } else {
        await createCategory(body).unwrap();
        notify({ title: 'Categoría creada', message: 'La nueva categoría se guardó correctamente.', variant: 'success' });
      }
      resetForm();
    } catch {
      notify({ title: 'Error', message: 'No se pudo guardar la categoría.', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (isError) return <div className="py-20 text-center text-red-500">Error al cargar categorías</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
          <p className="text-sm text-gray-500">Administra la jerarquía de categorías del catálogo.</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Nueva categoría
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Tree ─── */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-700">
                Árbol de categorías ({categories?.length ?? 0} raíces)
              </p>
            </div>
            <div className="p-2">
              {categories && categories.length > 0 ? (
                categories.map((cat) => (
                  <CategoryTreeNode
                    key={cat.id}
                    node={cat}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    depth={0}
                  />
                ))
              ) : (
                <p className="text-sm text-gray-400 py-8 text-center">
                  No hay categorías. Crea la primera.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ─── Form ─── */}
        <div>
          {showForm ? (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">
                  {editingId ? 'Editar categoría' : 'Nueva categoría'}
                </h2>
                <button type="button" onClick={resetForm} className="p-1 text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <Input
                  label="Nombre *"
                  value={form.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      name: val,
                      slug: slugAuto ? slugify(val) : prev.slug,
                    }));
                  }}
                  required
                />

                <Input
                  label="Slug"
                  value={form.slug}
                  onChange={(e) => {
                    setForm({ ...form, slug: e.target.value });
                    setSlugAuto(false);
                  }}
                  placeholder="auto-generado"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <Select
                  label="Categoría padre"
                  value={form.parentId}
                  onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                  options={
                    editingId
                      ? flatOptions.filter((o) => o.value !== editingId)
                      : flatOptions
                  }
                />

                <Input
                  label="Orden"
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                />

                <Input
                  label="URL de imagen"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  placeholder="https://..."
                />

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Activa</span>
                </label>

                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={saving} className="flex-1">
                    {saving ? (
                      'Guardando...'
                    ) : (
                      <><Save className="h-4 w-4 mr-1" /> {editingId ? 'Actualizar' : 'Crear'}</>
                    )}
                  </Button>
                  <Button type="button" variant="ghost" onClick={resetForm}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <p className="text-sm text-gray-400">
                Selecciona una categoría para editarla o crea una nueva.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
