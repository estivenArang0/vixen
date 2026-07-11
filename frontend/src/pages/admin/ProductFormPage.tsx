import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useGetProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useGetCategoriesQuery,
  useCreateVariantMutation,
  useGetVariantsByProductQuery,
} from '../../features/products/productsApi';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { Plus, Trash2, Eye, X } from 'lucide-react';
import { parseImageCrop, buildImageCrop } from '../../utils/imageCrop';
import { useNotification } from '../../components/ui/NotificationProvider';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ─── Crop Editor (reused) ─────────────────────────────────────────────
function CropEditor({ raw, onChange, onClose }: { raw: string; onChange: (newRaw: string) => void; onClose: () => void }) {
  const crop = parseImageCrop(raw);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  const update = (changes: Partial<typeof crop>) => {
    onChange(buildImageCrop({ ...crop, ...changes }));
  };

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    const newX = Math.min(100, Math.max(0, crop.offsetX + dx * 0.3));
    const newY = Math.min(100, Math.max(0, crop.offsetY + dy * 0.3));
    update({ offsetX: newX, offsetY: newY });
  };

  const onMouseUp = () => { dragging.current = false; };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-700">Ajustar recorte</p>
        <button type="button" onClick={onClose} className="text-xs text-gray-500 hover:text-gray-700">Cerrar</button>
      </div>
      <div
        ref={containerRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        className="relative aspect-square rounded-lg overflow-hidden cursor-grab active:cursor-grabbing select-none bg-gray-100"
      >
        <img
          src={crop.url}
          draggable={false}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: `${crop.offsetX}% ${crop.offsetY}%`,
            transform: `scale(${crop.zoom / 100})`,
            transformOrigin: `${crop.offsetX}% ${crop.offsetY}%`,
            pointerEvents: 'none',
          }}
        />
        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          Arrastra para mover
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Zoom: {crop.zoom}%</label>
        <input
          type="range" min={100} max={300} step={1}
          value={crop.zoom}
          onChange={e => update({ zoom: parseInt(e.target.value) })}
          className="w-full accent-pink-500"
        />
      </div>
    </div>
  );
}

// ─── Types ─────────────────────────────────────────────────────────────
interface AttributePair {
  key: string;
  value: string;
}

interface VariantRow {
  _key: string;
  color: string;
  size: string;
  sku: string;
  price: string;
  originalPrice: string;
  stock: string;
  images: string[];
}

let variantKeyCounter = 0;
function newVariantKey(): string {
  return `v_${++variantKeyCounter}_${Date.now()}`;
}

function emptyVariantRow(): VariantRow {
  return {
    _key: newVariantKey(),
    color: '',
    size: '',
    sku: '',
    price: '',
    originalPrice: '',
    stock: '0',
    images: [''],
  };
}

// ─── Component ─────────────────────────────────────────────────────────
export default function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const { notify } = useNotification();

  // Api hooks
  const { data: existing, isLoading: loadingProduct } = useGetProductByIdQuery(id!, { skip: !isEdit });
  const { data: existingVariants } = useGetVariantsByProductQuery(id!, { skip: !isEdit });
  const { data: categories } = useGetCategoriesQuery();
  const [createProduct, { isLoading: creating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateProductMutation();
  const [createVariant] = useCreateVariantMutation();
  // TODO: edit-mode variant save — wire up updateVariant/deleteVariant hooks here
  // when implementing variant save-on-edit in handleSubmit

  // ─── Product form state ──────────────────────────────────────────────
  const [form, setForm] = useState({
    name: '',
    description: '',
    brand: '',
    slug: '',
    sku: '',
    categoryId: '',
    active: true,
    tags: '',
    specifications: '',
    weight: '',
    length: '',
    width: '',
    height: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
  });

  const [images, setImages] = useState<string[]>(['']);
  const [attributes, setAttributes] = useState<AttributePair[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [editingCropIndex, setEditingCropIndex] = useState<number | null>(null);

  // ─── Variant rows (flat table) ───────────────────────────────────────
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [variantPreviewImage, setVariantPreviewImage] = useState<string | null>(null);
  const [variantEditingCropIndex, setVariantEditingCropIndex] = useState<{ rowIdx: number; imgIdx: number } | null>(null);

  // Slug auto-generation
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // ─── Load existing product ───────────────────────────────────────────
  useEffect(() => {
    if (!existing) return;

    setForm({
      name: existing.name,
      description: existing.description,
      brand: existing.brand,
      slug: existing.slug || slugify(existing.name),
      sku: existing.sku || '',
      categoryId: existing.categoryId || '',
      active: existing.active,
      tags: existing.tags?.join(', ') || '',
      specifications: existing.specifications?.join('\n') || '',
      weight: existing.weight != null ? String(existing.weight) : '',
      length: existing.dimensions?.length != null ? String(existing.dimensions.length) : '',
      width: existing.dimensions?.width != null ? String(existing.dimensions.width) : '',
      height: existing.dimensions?.height != null ? String(existing.dimensions.height) : '',
      seoTitle: existing.seo?.title || '',
      seoDescription: existing.seo?.description || '',
      seoKeywords: existing.seo?.keywords || '',
    });
    setSlugManuallyEdited(true);

    setImages(existing.images && existing.images.length > 0 ? existing.images : ['']);

    if (existing.attributes) {
      setAttributes(
        Object.entries(existing.attributes).map(([key, value]) => ({ key, value }))
      );
    }
  }, [existing]);

  // ─── Load existing variants ──────────────────────────────────────────
  useEffect(() => {
    if (!existingVariants || existingVariants.length === 0) return;

    const rows: VariantRow[] = existingVariants.map((v) => ({
      _key: newVariantKey(),
      color: v.color,
      size: v.size,
      sku: v.sku,
      price: String(v.price ?? ''),
      originalPrice: v.originalPrice != null ? String(v.originalPrice) : '',
      stock: String(v.stock ?? 0),
      images: v.images && v.images.length > 0 ? v.images : [''],
    }));
    setVariants(rows);
  }, [existingVariants]);

  // ─── Handlers ────────────────────────────────────────────────────────
  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-generate slug from name if not manually edited
      if (field === 'name' && !slugManuallyEdited) {
        next.slug = slugify(value);
      }
      return next;
    });
  };

  const updateImage = (index: number, value: string) => {
    setImages(images.map((img, i) => (i === index ? value : img)));
  };

  const addImageField = () => setImages([...images, '']);
  const removeImageField = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    if (editingCropIndex === index) setEditingCropIndex(null);
  };

  // Attributes
  const updateAttribute = (index: number, field: 'key' | 'value', val: string) => {
    setAttributes(attributes.map((a, i) => (i === index ? { ...a, [field]: val } : a)));
  };
  const addAttribute = () => setAttributes([...attributes, { key: '', value: '' }]);
  const removeAttribute = (index: number) => setAttributes(attributes.filter((_, i) => i !== index));

  // Variant handlers
  const addVariant = () => setVariants([...variants, emptyVariantRow()]);

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariantField = (index: number, field: keyof VariantRow, value: string) => {
    setVariants(variants.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  };

  const updateVariantImage = (rowIdx: number, imgIdx: number, value: string) => {
    setVariants(
      variants.map((v, i) =>
        i === rowIdx ? { ...v, images: v.images.map((img, j) => (j === imgIdx ? value : img)) } : v
      )
    );
  };

  const addVariantImage = (rowIdx: number) => {
    setVariants(variants.map((v, i) => (i === rowIdx ? { ...v, images: [...v.images, ''] } : v)));
  };

  const removeVariantImage = (rowIdx: number, imgIdx: number) => {
    setVariants(
      variants.map((v, i) =>
        i === rowIdx ? { ...v, images: v.images.filter((_, j) => j !== imgIdx) } : v
      )
    );
    if (variantEditingCropIndex?.rowIdx === rowIdx && variantEditingCropIndex?.imgIdx === imgIdx) {
      setVariantEditingCropIndex(null);
    }
  };

  // Category options
  const categoryOptions = useMemo(() => {
    const opts = categories?.map((c) => ({ value: c.id, label: c.name })) ?? [];
    return [{ value: '', label: 'Seleccionar categoría' }, ...opts];
  }, [categories]);

  // ─── Submit ──────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const attributesRecord: Record<string, string> = {};
    attributes.forEach((a) => {
      if (a.key.trim()) attributesRecord[a.key.trim()] = a.value.trim();
    });

    const dimensions =
      form.length || form.width || form.height
        ? {
            length: parseFloat(form.length) || 0,
            width: parseFloat(form.width) || 0,
            height: parseFloat(form.height) || 0,
          }
        : undefined;

    const seo =
      form.seoTitle || form.seoDescription || form.seoKeywords
        ? {
            title: form.seoTitle,
            description: form.seoDescription,
            keywords: form.seoKeywords,
          }
        : undefined;

    const body: Record<string, unknown> = {
      name: form.name,
      description: form.description,
      brand: form.brand,
      slug: form.slug || slugify(form.name),
      sku: form.sku,
      categoryId: form.categoryId || undefined,
      active: form.active,
      images: images.map((s) => s.trim()).filter(Boolean),
      tags: form.tags ? form.tags.split(',').map((s) => s.trim()).filter(Boolean) : [],
      specifications: form.specifications ? form.specifications.split('\n').map((s) => s.trim()).filter(Boolean) : [],
      weight: form.weight ? parseFloat(form.weight) : undefined,
      dimensions,
      seo,
      attributes: Object.keys(attributesRecord).length > 0 ? attributesRecord : undefined,
    };

    try {
      if (isEdit) {
        await updateProduct({ id: id!, body }).unwrap();
        notify({
          title: 'Producto actualizado',
          message: 'El producto se actualizó correctamente.',
          variant: 'success',
        });
      } else {
        const created = await createProduct(body).unwrap();
        // Save variants after creation
        const validVariants = variants.filter((v) => v.color.trim() || v.size.trim());
        for (const v of validVariants) {
          await createVariant({
            productId: created.id,
            sku: v.sku || `${created.sku}-${slugify(v.color)}-${slugify(v.size)}`,
            color: v.color,
            size: v.size,
            price: parseFloat(v.price) || 0,
            originalPrice: v.originalPrice ? parseFloat(v.originalPrice) : null,
            stock: parseInt(v.stock, 10) || 0,
            images: v.images.map((s) => s.trim()).filter(Boolean),
            active: true,
          } as Parameters<typeof createVariant>[0]).unwrap();
        }
        notify({
          title: 'Producto creado',
          message: 'El nuevo producto se guardó correctamente.',
          variant: 'success',
        });
      }
      navigate('/admin/products');
    } catch {
      notify({
        title: 'Error al guardar',
        message: 'No pudimos guardar el producto. Intenta nuevamente.',
        variant: 'error',
      });
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────
  const isSaving = creating || updating;

  if (isEdit && loadingProduct) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? 'Editar Producto' : 'Nuevo Producto'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ═══════════ SECCIÓN 1: DATOS DEL PRODUCTO ═══════════ */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">
            Datos del Producto
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre *" value={form.name} onChange={set('name')} required />
            <Input label="Marca *" value={form.brand} onChange={set('brand')} required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              rows={4}
              required
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Slug"
              value={form.slug}
              onChange={(e) => {
                setForm({ ...form, slug: e.target.value });
                setSlugManuallyEdited(true);
              }}
              placeholder="auto-generado"
            />
            <Input label="SKU" value={form.sku} onChange={set('sku')} placeholder="Ej: VXN-001" />
            <Select
              label="Categoría"
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              options={categoryOptions}
            />
          </div>

          {/* Imágenes generales */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Imágenes del producto</label>
            <div className="space-y-2">
              {images.map((img, i) => {
                const crop = parseImageCrop(img);
                return (
                  <div key={i}>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={img}
                        onChange={(e) => updateImage(i, e.target.value)}
                        placeholder="https://res.cloudinary.com/..."
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setPreviewImage(crop.url)}
                        disabled={!img}
                        className="p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                        title="Ver imagen"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCropIndex(editingCropIndex === i ? null : i)}
                        disabled={!img}
                        className="px-2 py-2 rounded-lg border border-gray-300 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                      >
                        Recortar
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImageField(i)}
                        className="p-2 rounded-lg border border-gray-300 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {editingCropIndex === i && img && (
                      <div className="mt-2">
                        <CropEditor
                          raw={img}
                          onChange={(newRaw) => updateImage(i, newRaw)}
                          onClose={() => setEditingCropIndex(null)}
                        />
                      </div>
                    )}
                    {previewImage === crop.url && (
                      <div className="mt-2 relative">
                        <img src={previewImage} alt="preview" className="max-h-64 rounded-lg border border-gray-200" />
                        <button
                          type="button"
                          onClick={() => setPreviewImage(null)}
                          className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded"
                        >
                          Cerrar
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={addImageField}
              className="mt-2 flex items-center gap-1 text-sm text-pink-600 hover:text-pink-500"
            >
              <Plus className="h-4 w-4" /> Agregar imagen
            </button>
          </div>

          {/* Atributos dinámicos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Atributos (clave: valor)</label>
            {attributes.map((attr, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={attr.key}
                  onChange={(e) => updateAttribute(i, 'key', e.target.value)}
                  placeholder="Clave (ej. Material)"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-gray-400">:</span>
                <input
                  type="text"
                  value={attr.value}
                  onChange={(e) => updateAttribute(i, 'value', e.target.value)}
                  placeholder="Valor (ej. Algodón)"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => removeAttribute(i)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addAttribute}
              className="flex items-center gap-1 text-sm text-pink-600 hover:text-pink-500"
            >
              <Plus className="h-4 w-4" /> Agregar atributo
            </button>
          </div>

          {/* Peso y Dimensiones */}
          <div className="grid grid-cols-4 gap-4">
            <Input label="Peso (kg)" type="number" step="0.01" value={form.weight} onChange={set('weight')} />
            <Input label="Largo (cm)" type="number" step="0.1" value={form.length} onChange={set('length')} />
            <Input label="Ancho (cm)" type="number" step="0.1" value={form.width} onChange={set('width')} />
            <Input label="Alto (cm)" type="number" step="0.1" value={form.height} onChange={set('height')} />
          </div>

          {/* Tags & Specifications */}
          <Input label="Tags (separados por coma)" value={form.tags} onChange={set('tags')} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Especificaciones (una por línea)</label>
            <textarea
              value={form.specifications}
              onChange={set('specifications')}
              rows={3}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* SEO */}
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">SEO Metadata</h3>
            <div className="space-y-3">
              <Input label="SEO Title" value={form.seoTitle} onChange={set('seoTitle')} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SEO Description</label>
                <textarea
                  value={form.seoDescription}
                  onChange={set('seoDescription')}
                  rows={2}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <Input label="SEO Keywords (separados por coma)" value={form.seoKeywords} onChange={set('seoKeywords')} />
            </div>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Producto activo</span>
          </label>
        </section>

        {/* ═══════════ SECCIÓN 2: VARIANTES ═══════════ */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Variantes</h2>
              <p className="text-xs text-gray-500 mt-1">
                Cada fila es una variante independiente (color + talla). Cada una tiene su propio SKU, precio, stock e imágenes.
              </p>
            </div>
            <Button type="button" variant="secondary" onClick={addVariant} className="text-sm">
              <Plus className="h-4 w-4 mr-1" /> Agregar variante
            </Button>
          </div>

          {variants.length === 0 ? (
            <p className="text-sm text-gray-400 italic py-4 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
              No hay variantes. Agrega la primera combinación de color + talla.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Talla</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">P. Original</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Imágenes</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {variants.map((v, rowIdx) => (
                    <tr key={v._key} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={v.color}
                          onChange={(e) => updateVariantField(rowIdx, 'color', e.target.value)}
                          placeholder="Rojo"
                          className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={v.size}
                          onChange={(e) => updateVariantField(rowIdx, 'size', e.target.value)}
                          placeholder="S"
                          className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={v.sku}
                          onChange={(e) => updateVariantField(rowIdx, 'sku', e.target.value)}
                          placeholder="VXN-ROJO-S"
                          className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={v.price}
                          onChange={(e) => updateVariantField(rowIdx, 'price', e.target.value)}
                          placeholder="29.99"
                          className="w-24 rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={v.originalPrice}
                          onChange={(e) => updateVariantField(rowIdx, 'originalPrice', e.target.value)}
                          placeholder="39.99"
                          className="w-24 rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          value={v.stock}
                          onChange={(e) => updateVariantField(rowIdx, 'stock', e.target.value)}
                          className="w-20 rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-3 py-2 max-w-[200px]">
                        <div className="space-y-1">
                          {v.images.map((img, imgIdx) => (
                            <div key={imgIdx} className="flex items-center gap-1">
                              <input
                                type="text"
                                value={img}
                                onChange={(e) => updateVariantImage(rowIdx, imgIdx, e.target.value)}
                                placeholder="URL..."
                                className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setVariantPreviewImage(
                                    variantPreviewImage === parseImageCrop(img).url ? null : parseImageCrop(img).url
                                  )
                                }
                                disabled={!img}
                                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                              >
                                <Eye className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeVariantImage(rowIdx, imgIdx)}
                                disabled={v.images.length <= 1}
                                className="p-1 text-red-400 hover:text-red-600 disabled:opacity-30"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addVariantImage(rowIdx)}
                            className="text-xs text-pink-600 hover:text-pink-500 flex items-center gap-0.5"
                          >
                            <Plus className="h-3 w-3" /> Agregar
                          </button>
                          {variantPreviewImage && (
                            <div className="mt-1 relative">
                              <img
                                src={variantPreviewImage}
                                alt="preview"
                                className="max-h-20 rounded border border-gray-200"
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeVariant(rowIdx)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                          title="Eliminar variante"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Resumen de variantes */}
          {variants.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1">
              <p>Total variantes: <strong>{variants.length}</strong></p>
              <p>
                Stock total:{' '}
                <strong>
                  {variants.reduce((sum, v) => sum + (parseInt(v.stock, 10) || 0), 0)}
                </strong>{' '}
                unidades
              </p>
              <p>
                Colores únicos:{' '}
                <strong>{new Set(variants.map((v) => v.color.trim()).filter(Boolean)).size}</strong>
              </p>
              <p>
                Tallas únicas:{' '}
                <strong>{new Set(variants.map((v) => v.size.trim()).filter(Boolean)).size}</strong>
              </p>
            </div>
          )}
        </section>

        {/* Botones de acción */}
        <div className="flex gap-3">
          <Button type="submit" disabled={isSaving}>
            {isSaving
              ? 'Guardando...'
              : isEdit
                ? 'Actualizar Producto'
                : 'Crear Producto'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate('/admin/products')}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
