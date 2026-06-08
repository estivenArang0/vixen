import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, AlertTriangle, XCircle, DollarSign, Package } from 'lucide-react';
import { useGetAllProductsQuery, useDeleteProductMutation } from '../../features/products/productsApi';
import { formatCurrency } from '../../utils/formatCurrency';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

const CATEGORIES = ['Todos', 'Bodies', 'Faldas', 'Enterizos', 'Conjuntos', 'Leggins', 'Corsets'];

type SortField = 'price' | 'stockQuantity' | null;
type SortDir = 'asc' | 'desc';

export default function ProductsListPage() {
  const { data: products, isLoading } = useGetAllProductsQuery();
  const [deleteProduct] = useDeleteProductMutation();
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar este producto?')) await deleteProduct(id);
  };

  // Productos filtrados por categoría
  const filtered = useMemo(() => {
    let list = [...(products ?? [])];
    if (selectedCategory !== 'Todos') list = list.filter((p) => p.category === selectedCategory);
    if (sortField) {
      list.sort((a, b) => sortDir === 'asc' ? a[sortField] - b[sortField] : b[sortField] - a[sortField]);
    } else {
      list.sort((a, b) => a.category.localeCompare(b.category));
    }
    return list;
  }, [products, selectedCategory, sortField, sortDir]);

  // Métricas del conjunto filtrado
  const metrics = useMemo(() => {
    const totalValue = filtered.reduce((sum, p) => sum + p.price * p.stockQuantity, 0);
    const totalUnits = filtered.reduce((sum, p) => sum + p.stockQuantity, 0);
    const sinStock = filtered.filter((p) => p.stockQuantity === 0);
    const stockBajo = filtered.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= 5);
    return { totalValue, totalUnits, sinStock, stockBajo };
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
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <Link to="/admin/products/new">
          <Button><Plus className="h-4 w-4 mr-1" /> Add Product</Button>
        </Link>
      </div>

      {/* Filtro categorías */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
            }`}
          >
            {cat}
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
            <p className="text-sm font-bold text-gray-900">{formatCurrency(metrics.totalValue)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Package className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Unidades totales</p>
            <p className="text-sm font-bold text-gray-900">{metrics.totalUnits} uds</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="bg-yellow-100 p-2 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Stock bajo (≤5)</p>
            <p className="text-sm font-bold text-yellow-600">{metrics.stockBajo.length} productos</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="bg-red-100 p-2 rounded-lg">
            <XCircle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Sin stock</p>
            <p className="text-sm font-bold text-red-600">{metrics.sinStock.length} productos</p>
          </div>
        </div>
      </div>

      {/* Alertas stock bajo */}
      {metrics.stockBajo.length > 0 && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-yellow-800 mb-1 flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" /> Próximos a agotarse
          </p>
          <div className="flex flex-wrap gap-2 mt-1">
            {metrics.stockBajo.map((p) => (
              <span key={p.id} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                {p.name} — {p.stockQuantity} uds
              </span>
            ))}
          </div>
        </div>
      )}

      {metrics.sinStock.length > 0 && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-red-800 mb-1 flex items-center gap-1">
            <XCircle className="h-4 w-4" /> Sin stock
          </p>
          <div className="flex flex-wrap gap-2 mt-1">
            {metrics.sinStock.map((p) => (
              <span key={p.id} className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                {p.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-indigo-600" onClick={() => handleSort('price')}>
                Precio <SortIcon field="price" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-indigo-600" onClick={() => handleSort('stockQuantity')}>
                Stock <SortIcon field="stockQuantity" />
              </th>
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
                    {p.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatCurrency(p.price)}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`font-semibold ${p.stockQuantity === 0 ? 'text-red-600' : p.stockQuantity <= 5 ? 'text-yellow-600' : 'text-gray-900'}`}>
                    {p.stockQuantity}
                  </span>
                  {p.stockQuantity === 0 && <span className="ml-1 text-xs text-red-500">⛔ agotado</span>}
                  {p.stockQuantity > 0 && p.stockQuantity <= 5 && <span className="ml-1 text-xs text-yellow-500">⚠ bajo</span>}
                </td>
                <td className="px-6 py-4">
                  <Badge variant={p.active ? 'success' : 'danger'}>{p.active ? 'Active' : 'Inactive'}</Badge>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link to={`/admin/products/${p.id}/edit`} className="rounded p-1 text-gray-400 hover:text-indigo-600">
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button onClick={() => handleDelete(p.id)} className="rounded p-1 text-gray-400 hover:text-red-600">
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