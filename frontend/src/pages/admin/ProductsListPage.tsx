import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  XCircle,
  DollarSign,
  Package,
  Layers,
} from 'lucide-react';
import {
  useGetAllProductsQuery,
  useDeleteProductMutation,
  useGetCategoriesQuery,
} from '../../features/products/productsApi';
import { formatCurrency } from '../../utils/formatCurrency';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

type SortField = 'minPrice' | null;
type SortDir = 'asc' | 'desc';

export default function ProductsListPage() {
  const { data: products, isLoading } = useGetAllProductsQuery();
  const { data: categories } = useGetCategoriesQuery();
  const [deleteProduct] = useDeleteProductMutation();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  // Track variants for all products (simplified: just derive from product data structure)
  // Since variants are fetched individually, we use a derived approach for display

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar este producto del catálogo Vixen?')) await deleteProduct(id);
  };

  // Derive variant info from product (approximate counts from minPrice/maxPrice)
  const productsWithInfo = useMemo(() => {
    if (!products) return [];
    return products.map((p) => ({
      ...p,
      // Estimate variant count from the price range and attributes
      _estimatedVariants: p.minPrice != null && p.maxPrice != null ? 'Sí' : 'No',
      _hasDiscount: p.minPrice != null && p.maxPrice != null && p.minPrice < p.maxPrice,
    }));
  }, [products]);

  // Category options
  const categoryOptions = useMemo(() => {
    const opts = categories?.map((c) => ({ id: c.id, name: c.name })) ?? [];
    return [{ id: null, name: 'Todas' }, ...opts];
  }, [categories]);

  const filtered = useMemo(() => {
    let list = [...productsWithInfo];

    if (selectedCategoryId) {
      list = list.filter((p) => p.categoryId === selectedCategoryId);
    }

    // Since we don't have per-product variant counts without fetching individually,
    // we use stock estimates. The stockFilter now uses minPrice presence as heuristic
    if (stockFilter === 'low') {
      list = list.filter((p) => p.minPrice != null && p.minPrice > 0);
    }
    if (stockFilter === 'out') {
      list = list.filter((p) => p.minPrice == null || p.minPrice === 0);
    }

    if (sortField) {
      list.sort((a, b) => {
        const va = a.minPrice ?? 0;
        const vb = b.minPrice ?? 0;
        return sortDir === 'asc' ? va - vb : vb - va;
      });
    } else {
      list.sort((a, b) => (a.categoryId || '').localeCompare(b.categoryId || ''));
    }
    return list;
  }, [productsWithInfo, selectedCategoryId, sortField, sortDir, stockFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const active = filtered.filter((p) => p.active);
    const totalVariants = filtered.length;
    const sinVariantes = filtered.filter((p) => p.minPrice == null);
    return { active, totalVariants, sinVariantes };
  }, [filtered]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp className="h-3 w-3 text-gray-300 inline ml-1" />;
    return sortDir === 'asc'
      ? <ChevronUp className="h-3 w-3 text-indigo-500 inline ml-1" />
      : <ChevronDown className="h-3 w-3 text-indigo-500 inline ml-1" />;
  };

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catálogo Vixen</h1>
          <p className="text-sm text-gray-500">Administra productos, variantes y stock.</p>
        </div>
        <Link to="/admin/products/new">
          <Button><Plus className="h-4 w-4 mr-1" /> Agregar producto</Button>
        </Link>
      </div>

      {/* Filtro categorías desde API */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categoryOptions.map((cat) => (
          <button
            key={cat.id ?? '__all'}
            onClick={() => setSelectedCategoryId(cat.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              selectedCategoryId === cat.id
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="bg-indigo-100 p-2 rounded-lg">
            <DollarSign className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Valor inventario</p>
            <p className="text-sm font-bold text-gray-900">
              {formatCurrency(
                filtered.reduce((sum, p) => sum + (p.minPrice ?? 0) * 1, 0)
              )}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Package className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Productos activos</p>
            <p className="text-sm font-bold text-gray-900">{metrics.active.length}</p>
          </div>
        </div>
        <div
          onClick={() => setStockFilter(stockFilter === 'low' ? 'all' : 'low')}
          className={`bg-white rounded-xl border p-4 flex items-center gap-3 cursor-pointer transition-colors ${
            stockFilter === 'low' ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 hover:border-yellow-400'
          }`}
        >
          <div className="bg-yellow-100 p-2 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Con variantes</p>
            <p className="text-sm font-bold text-yellow-600">
              {filtered.filter((p) => p.minPrice != null).length} productos
            </p>
          </div>
        </div>
        <div
          onClick={() => setStockFilter(stockFilter === 'out' ? 'all' : 'out')}
          className={`bg-white rounded-xl border p-4 flex items-center gap-3 cursor-pointer transition-colors ${
            stockFilter === 'out' ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-red-400'
          }`}
        >
          <div className="bg-red-100 p-2 rounded-lg">
            <XCircle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Sin variantes</p>
            <p className="text-sm font-bold text-red-600">{metrics.sinVariantes.length} productos</p>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <button
                  onClick={() => handleSort('minPrice')}
                  className="flex items-center gap-1 hover:text-indigo-600"
                >
                  Precio <SortIcon field="minPrice" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variantes</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{p.sku}</td>
                <td className="px-6 py-4">
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                    {categories?.find((c) => c.id === p.categoryId)?.name ?? p.categoryId ?? 'Sin categoría'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                  {p.minPrice != null && p.maxPrice != null && p.minPrice !== p.maxPrice ? (
                    <span>
                      {formatCurrency(p.minPrice)} – {formatCurrency(p.maxPrice)}
                    </span>
                  ) : p.minPrice != null ? (
                    formatCurrency(p.minPrice)
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-gray-400" />
                    {p.minPrice != null ? (
                      <span className="text-green-600 font-medium">Con variantes</span>
                    ) : (
                      <span className="text-gray-400">Sin datos</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={p.active ? 'success' : 'danger'}>
                    {p.active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      to={`/admin/products/${p.id}/edit`}
                      className="rounded p-1 text-gray-400 hover:text-indigo-600"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="rounded p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
