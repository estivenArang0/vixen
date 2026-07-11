import { useState, useMemo } from 'react';
import { useGetProductsPageQuery, useGetCategoryTreeQuery } from '../../features/products/productsApi';
import ProductCard from './components/ProductCard';
import Pagination from '../../components/ui/Pagination';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronDown, ChevronRight } from 'lucide-react';
import type { CategoryDTO } from '../../features/products/productsTypes';

/** Recursively render category tree as nested buttons */
function CategoryTreeButton({
  node,
  selectedId,
  depth,
  onSelect,
}: {
  node: CategoryDTO;
  selectedId: string | null;
  depth: number;
  onSelect: (id: string | null) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <div className="flex items-center gap-1">
        {hasChildren && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-0.5 text-gray-400 hover:text-gray-600"
          >
            {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
        )}
        {!hasChildren && <span className="w-4" />}
        <button
          onClick={() => onSelect(selectedId === node.id ? null : node.id)}
          className={`text-sm font-medium rounded-full px-3 py-1 border transition-colors ${
            selectedId === node.id
              ? 'bg-black text-white border-black'
              : 'bg-white text-gray-700 border-gray-300 hover:border-black'
          }`}
        >
          {node.name}
        </button>
      </div>
      {hasChildren && expanded && (
        <div className="ml-4 mt-1 space-y-1">
          {node.children.map((child) => (
            <CategoryTreeButton
              key={child.id}
              node={child}
              selectedId={selectedId}
              depth={depth + 1}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductListPage() {
  const navigate = useNavigate();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 12;

  const { data: categoryTree } = useGetCategoryTreeQuery();

  const allProductsQuery = useGetProductsPageQuery({ page, size: pageSize });

  // Clientside filter by category when tree is loaded
  const filteredProducts = useMemo(() => {
    if (!allProductsQuery.data) return null;
    if (!selectedCategoryId) return allProductsQuery.data;

    // Get the selected category node and all its descendant IDs
    const findCategoryAndDescendants = (cats: CategoryDTO[], targetId: string): Set<string> => {
      const ids = new Set<string>();
      const walk = (nodes: CategoryDTO[]) => {
        for (const c of nodes) {
          ids.add(c.id);
          if (c.id === targetId) {
            // Found target, now collect all descendants
            const collectDescendants = (node: CategoryDTO) => {
              ids.add(node.id);
              if (node.children) node.children.forEach(collectDescendants);
            };
            // Collect already-added descendants
            if (c.children) c.children.forEach(collectDescendants);
            return true;
          }
          if (c.children) {
            if (walk(c.children)) return true;
          }
          ids.delete(c.id);
        }
        return false;
      };
      walk(cats);
      return ids;
    };

    const relevantIds = categoryTree
      ? findCategoryAndDescendants(categoryTree, selectedCategoryId)
      : new Set([selectedCategoryId]);

    const filtered = allProductsQuery.data.content.filter((p) => relevantIds.has(p.categoryId));
    return {
      ...allProductsQuery.data,
      content: filtered,
      totalElements: filtered.length,
      totalPages: Math.ceil(filtered.length / pageSize),
    };
  }, [allProductsQuery.data, selectedCategoryId, categoryTree, pageSize]);

  const isLoading = allProductsQuery.isLoading;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Build flattened option list for mobile dropdown
  const flatOptions = useMemo(() => {
    const flatten = (cats: CategoryDTO[], prefix = ''): { id: string; name: string; label: string }[] => {
      const result: { id: string; name: string; label: string }[] = [];
      for (const c of cats) {
        result.push({ id: c.id, name: c.name, label: prefix + c.name });
        if (c.children) result.push(...flatten(c.children, prefix + '  '));
      }
      return result;
    };
    return categoryTree ? flatten(categoryTree) : [];
  }, [categoryTree]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-1 text-sm text-pink-500 hover:text-gray-900 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" /> Volver
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Colección Vixen</h1>

      {/* Filtro de categorías desde API */}
      <div className="mb-8">
        {/* Mobile: dropdown */}
        <div className="sm:hidden mb-4">
          <select
            value={selectedCategoryId ?? ''}
            onChange={(e) => {
              setSelectedCategoryId(e.target.value || null);
              setPage(0);
            }}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Todas las categorías</option>
            {flatOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Desktop: tree */}
        <div className="hidden sm:flex sm:flex-wrap gap-2">
          <button
            onClick={() => {
              setSelectedCategoryId(null);
              setPage(0);
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              selectedCategoryId === null
                ? 'bg-black text-white border-black'
                : 'bg-white text-gray-700 border-gray-300 hover:border-black'
            }`}
          >
            Todas
          </button>
          {categoryTree?.map((cat) => (
            <CategoryTreeButton
              key={cat.id}
              node={cat}
              selectedId={selectedCategoryId}
              depth={0}
              onSelect={(id) => {
                setSelectedCategoryId(id);
                setPage(0);
              }}
            />
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : !filteredProducts || filteredProducts.content.length === 0 ? (
        <EmptyState
          title="No hay productos"
          description="Vuelve pronto para descubrir nuevas colecciones de Vixen."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.content.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <Pagination
            currentPage={filteredProducts.number}
            totalPages={filteredProducts.totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}
