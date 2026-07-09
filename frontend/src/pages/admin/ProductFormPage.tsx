import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetProductByIdQuery, useCreateProductMutation, useUpdateProductMutation } from '../../features/products/productsApi';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { Plus, Trash2, Eye, X } from 'lucide-react';
import { parseImageCrop, buildImageCrop } from '../../utils/imageCrop';
import { useNotification } from '../../components/ui/NotificationProvider';

const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Talla única'];

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
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Zoom: {crop.zoom}%
        </label>
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

interface VariantSizeRow {
  size: string;
  stock: string;
}

interface VariantRow {
  color: string;
  price: string;
  images: string[];
  sizes: VariantSizeRow[];
}

const emptyVariant = (): VariantRow => ({ color: '', price: '', images: [''], sizes: [] });

export default function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { data: existing, isLoading } = useGetProductByIdQuery(id!, { skip: !isEdit });
  const { notify } = useNotification();
  const [createProduct, { isLoading: creating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateProductMutation();

  const [form, setForm] = useState({
    name: '', description: '', category: '', price: '', stockQuantity: '',
    brand: '', sku: '', active: true, tags: '', specifications: '',
  });
  const [images, setImages] = useState<string[]>(['']);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [editingCropIndex, setEditingCropIndex] = useState<number | null>(null);

  // --- Variantes (hojas independientes por color) ---
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [activeVariantTab, setActiveVariantTab] = useState<number | null>(null);
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [variantPreviewImage, setVariantPreviewImage] = useState<string | null>(null);
  const [variantEditingCropIndex, setVariantEditingCropIndex] = useState<number | null>(null);

  const variantsTotalStock = variants.reduce(
    (sum, v) => sum + v.sizes.reduce((s, sz) => s + (parseInt(sz.stock, 10) || 0), 0),
    0
  );
  const hasVariants = variants.length > 0;
  const activeVariant = activeVariantTab !== null ? variants[activeVariantTab] : null;

  const selectVariantTab = (index: number | null) => {
    setActiveVariantTab(index);
    setVariantPreviewImage(null);
    setVariantEditingCropIndex(null);
    setCustomSizeInput('');
  };

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name,
        description: existing.description,
        category: existing.category,
        price: String(existing.price),
        stockQuantity: String(existing.stockQuantity),
        brand: existing.brand,
        sku: existing.sku,
        active: existing.active,
        tags: existing.tags?.join(', ') || '',
        specifications: existing.specifications?.join('\n') || '',
      });

      setImages(existing.images && existing.images.length > 0 ? existing.images : ['']);

      const loadedVariants: VariantRow[] =
        existing.variants && existing.variants.length > 0
          ? existing.variants.map((v) => ({
              color: v.color || '',
              price: v.price != null ? String(v.price) : '',
              images: v.images && v.images.length > 0 ? v.images : [''],
              sizes:
                v.sizes && Object.keys(v.sizes).length > 0
                  ? Object.entries(v.sizes).map(([size, stock]) => ({ size, stock: String(stock) }))
                  : [],
            }))
          : [];
      setVariants(loadedVariants);
      setActiveVariantTab(loadedVariants.length > 0 ? 0 : null);
    }
  }, [existing]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [field]: e.target.value });

  const updateImage = (index: number, value: string) => {
    setImages(images.map((img, i) => i === index ? value : img));
  };

  const addImageField = () => {
    setImages([...images, '']);
  };

  const removeImageField = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    if (editingCropIndex === index) setEditingCropIndex(null);
  };

  // --- Handlers de variantes ---
  const addVariant = () => {
    const next = [...variants, emptyVariant()];
    setVariants(next);
    selectVariantTab(next.length - 1);
  };

  const removeVariant = (vIndex: number) => {
    const next = variants.filter((_, i) => i !== vIndex);
    setVariants(next);
    if (activeVariantTab === vIndex) {
      selectVariantTab(next.length > 0 ? Math.max(0, vIndex - 1) : null);
    } else if (activeVariantTab !== null && activeVariantTab > vIndex) {
      setActiveVariantTab(activeVariantTab - 1);
    }
  };

  const updateVariantColor = (vIndex: number, color: string) => {
    setVariants(variants.map((v, i) => (i === vIndex ? { ...v, color } : v)));
  };

  const updateVariantPrice = (vIndex: number, price: string) => {
    setVariants(variants.map((v, i) => (i === vIndex ? { ...v, price } : v)));
  };

  const addVariantImage = (vIndex: number) => {
    setVariants(variants.map((v, i) => (i === vIndex ? { ...v, images: [...v.images, ''] } : v)));
  };

  const updateVariantImage = (vIndex: number, imgIndex: number, value: string) => {
    setVariants(
      variants.map((v, i) =>
        i === vIndex ? { ...v, images: v.images.map((img, j) => (j === imgIndex ? value : img)) } : v
      )
    );
  };

  const removeVariantImage = (vIndex: number, imgIndex: number) => {
    setVariants(
      variants.map((v, i) => (i === vIndex ? { ...v, images: v.images.filter((_, j) => j !== imgIndex) } : v))
    );
    if (variantEditingCropIndex === imgIndex) setVariantEditingCropIndex(null);
  };

  const toggleVariantSize = (vIndex: number, size: string) => {
    setVariants(
      variants.map((v, i) => {
        if (i !== vIndex) return v;
        const exists = v.sizes.some((sz) => sz.size === size);
        return {
          ...v,
          sizes: exists ? v.sizes.filter((sz) => sz.size !== size) : [...v.sizes, { size, stock: '0' }],
        };
      })
    );
  };

  const updateVariantSizeStock = (vIndex: number, size: string, stock: string) => {
    setVariants(
      variants.map((v, i) =>
        i === vIndex ? { ...v, sizes: v.sizes.map((sz) => (sz.size === size ? { ...sz, stock } : sz)) } : v
      )
    );
  };

  const addCustomSize = (vIndex: number) => {
    const label = customSizeInput.trim();
    if (!label) return;
    setVariants(
      variants.map((v, i) => {
        if (i !== vIndex) return v;
        if (v.sizes.some((sz) => sz.size.toLowerCase() === label.toLowerCase())) return v;
        return { ...v, sizes: [...v.sizes, { size: label, stock: '0' }] };
      })
    );
    setCustomSizeInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanedVariants = variants
      .filter((v) => v.color.trim())
      .map((v) => {
        const sizesEntries = v.sizes
          .filter((sz) => sz.size.trim())
          .map((sz) => [sz.size.trim(), parseInt(sz.stock, 10) || 0] as const);
        return {
          color: v.color.trim(),
          price: v.price.trim() ? parseFloat(v.price) : undefined,
          images: v.images.map((s) => s.trim()).filter(Boolean),
          sizes: Object.fromEntries(sizesEntries),
        };
      });

    const body = {
      name: form.name,
      description: form.description,
      category: form.category,
      price: parseFloat(form.price),
      stockQuantity: cleanedVariants.length > 0 ? variantsTotalStock : parseInt(form.stockQuantity, 10),
      brand: form.brand,
      sku: form.sku,
      active: form.active,
      images: images.map((s) => s.trim()).filter(Boolean),
      variants: cleanedVariants,
      tags: form.tags ? form.tags.split(',').map((s) => s.trim()).filter(Boolean) : [],
      specifications: form.specifications ? form.specifications.split('\n').map((s) => s.trim()).filter(Boolean) : [],
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
        await createProduct(body).unwrap();
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

  if (isEdit && isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? 'Edit Product' : 'New Product'}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
        <Input label="Name" value={form.name} onChange={set('name')} required />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={form.description} onChange={set('description')} rows={3} required
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Category" value={form.category} onChange={set('category')} required />
          <Input label="Brand" value={form.brand} onChange={set('brand')} required />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Input label="Price" type="number" step="0.01" value={form.price} onChange={set('price')} required />
          {hasVariants ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock (total)</label>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                {variantsTotalStock} <span className="text-xs text-gray-400">(suma de colores)</span>
              </div>
            </div>
          ) : (
            <Input label="Stock" type="number" min={0} value={form.stockQuantity} onChange={set('stockQuantity')} required />
          )}
          <Input label="SKU" value={form.sku} onChange={set('sku')} required />
        </div>

        {/* Images generales */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Images</label>
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
                      title="Ver imagen completa"
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
                      title="Eliminar"
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

        {/* Variantes: hojas independientes por color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Colores de esta prenda</label>
          <p className="text-xs text-gray-500 mb-3">
            Cada color es una hoja independiente: precio, tallas, stock y fotos propias. El nombre, descripción,
            categoría, marca y SKU se comparten automáticamente porque es la misma prenda.
          </p>

          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {variants.map((v, i) => {
              const total = v.sizes.reduce((s, sz) => s + (parseInt(sz.stock, 10) || 0), 0);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectVariantTab(i)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                    activeVariantTab === i
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white border-gray-300 text-gray-600 hover:border-indigo-400'
                  }`}
                >
                  {v.color || `Color ${i + 1}`}
                  <span className={activeVariantTab === i ? 'text-indigo-100' : 'text-gray-400'}>({total})</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={addVariant}
              className="flex items-center gap-1 rounded-full border border-dashed border-pink-400 px-3 py-1.5 text-sm font-medium text-pink-600 hover:bg-pink-50"
            >
              <Plus className="h-4 w-4" /> Agregar color
            </button>
          </div>

          {/* Panel del color activo */}
          {activeVariant && activeVariantTab !== null && (
            <div className="rounded-xl border border-gray-200 p-4 space-y-4 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">
                  Hoja de color {activeVariantTab + 1}
                </p>
                <button
                  type="button"
                  onClick={() => removeVariant(activeVariantTab)}
                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Eliminar este color
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Color"
                  value={activeVariant.color}
                  onChange={(e) => updateVariantColor(activeVariantTab, e.target.value)}
                  placeholder="ej. Rojo, Negro"
                />
                <Input
                  label="Precio de este color (opcional)"
                  type="number"
                  step="0.01"
                  value={activeVariant.price}
                  onChange={(e) => updateVariantPrice(activeVariantTab, e.target.value)}
                  placeholder={`Usa el precio general (${form.price || '0'})`}
                />
              </div>

              {/* Tallas */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Tallas disponibles</label>
                <div className="flex flex-wrap gap-2">
                  {STANDARD_SIZES.map((size) => {
                    const active = activeVariant.sizes.some((sz) => sz.size === size);
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleVariantSize(activeVariantTab, size)}
                        className={`h-9 min-w-[2.5rem] px-3 rounded-lg border text-sm font-semibold transition-colors ${
                          active
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'bg-white border-gray-300 text-gray-600 hover:border-indigo-400'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>

                {/* Tallas personalizadas */}
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={customSizeInput}
                    onChange={(e) => setCustomSizeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); addCustomSize(activeVariantTab); }
                    }}
                    placeholder="Otra talla (ej. 36, 38...)"
                    className="w-48 rounded-lg border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => addCustomSize(activeVariantTab)}
                    className="text-xs text-pink-600 hover:text-pink-500 font-medium"
                  >
                    + agregar
                  </button>
                </div>

                {/* Stock por talla seleccionada */}
                {activeVariant.sizes.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {activeVariant.sizes.map((sz) => (
                      <div key={sz.size} className="flex items-center gap-2">
                        <span className="w-20 text-sm font-medium text-gray-700">{sz.size}</span>
                        <input
                          type="number"
                          min={0}
                          value={sz.stock}
                          onChange={(e) => updateVariantSizeStock(activeVariantTab, sz.size, e.target.value)}
                          placeholder="Stock"
                          className="w-28 rounded-lg border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="text-xs text-gray-400">unidades</span>
                        <button
                          type="button"
                          onClick={() => toggleVariantSize(activeVariantTab, sz.size)}
                          className="ml-1 text-gray-400 hover:text-red-500"
                          title="Quitar talla"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Fotos de este color */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Fotos de este color</label>
                <div className="space-y-2">
                  {activeVariant.images.map((img, iIndex) => {
                    const crop = parseImageCrop(img);
                    return (
                      <div key={iIndex}>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={img}
                            onChange={(e) => updateVariantImage(activeVariantTab, iIndex, e.target.value)}
                            placeholder="https://res.cloudinary.com/..."
                            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => setVariantPreviewImage(variantPreviewImage === crop.url ? null : crop.url)}
                            disabled={!img}
                            className="p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                            title="Ver imagen completa"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setVariantEditingCropIndex(variantEditingCropIndex === iIndex ? null : iIndex)}
                            disabled={!img}
                            className="px-2 py-2 rounded-lg border border-gray-300 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                          >
                            Recortar
                          </button>
                          <button
                            type="button"
                            onClick={() => removeVariantImage(activeVariantTab, iIndex)}
                            className="p-2 rounded-lg border border-gray-300 text-red-500 hover:bg-red-50"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {variantEditingCropIndex === iIndex && img && (
                          <div className="mt-2">
                            <CropEditor
                              raw={img}
                              onChange={(newRaw) => updateVariantImage(activeVariantTab, iIndex, newRaw)}
                              onClose={() => setVariantEditingCropIndex(null)}
                            />
                          </div>
                        )}

                        {variantPreviewImage === crop.url && (
                          <div className="mt-2 relative">
                            <img src={variantPreviewImage} alt="preview" className="max-h-64 rounded-lg border border-gray-200" />
                            <button
                              type="button"
                              onClick={() => setVariantPreviewImage(null)}
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
                  onClick={() => addVariantImage(activeVariantTab)}
                  className="mt-2 flex items-center gap-1 text-xs text-pink-600 hover:text-pink-500"
                >
                  <Plus className="h-3 w-3" /> Agregar imagen
                </button>
              </div>
            </div>
          )}

          {!hasVariants && (
            <p className="text-xs text-gray-400 italic">
              Todavía no agregaste ningún color. Si esta prenda solo viene en un color, puedes dejarlo así y usar
              el Stock general de arriba.
            </p>
          )}
        </div>

        <Input label="Tags (comma-separated)" value={form.tags} onChange={set('tags')} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Specifications (one per line)</label>
          <textarea value={form.specifications} onChange={set('specifications')} rows={3}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="rounded border-gray-300" />
          <span className="text-sm text-gray-700">Active</span>
        </label>
        <div className="flex gap-3">
          <Button type="submit" disabled={creating || updating}>
            {creating || updating ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate('/admin/products')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
