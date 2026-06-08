import { useState } from 'react';
import { useGetProductsByCategoryQuery, useGetProductsPageQuery } from '../../features/products/productsApi';
import ProductCard from './components/ProductCard';
import Pagination from '../../components/ui/Pagination';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

const CATEGORIES = [
  { label: 'Todos', value: null },
  { label: 'Faldas', value: 'Faldas' },
  { label: 'Bodies', value: 'Bodies' },
  { label: 'Enterizos', value: 'Enterizos' },
  { label: 'Conjuntos', value: 'Conjuntos' },
  { label: 'Leggins', value: 'Leggins' },
  { label: 'Corsets', value: 'Corsets' },
];

export default function ProductListPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 12;

  const allProductsQuery = useGetProductsPageQuery(
    { page, size: pageSize },
    { skip: selectedCategory !== null }
  );

  const categoryQuery = useGetProductsByCategoryQuery(
    selectedCategory ?? '',
    { skip: selectedCategory === null }
  );

  const isLoading = allProductsQuery.isLoading || categoryQuery.isLoading;
  const categoryProducts = categoryQuery.data ?? [];
  const pagedData = allProductsQuery.data;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Productos</h1>

      {/* Filtro de categorías */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.label}
            onClick={() => {
              setSelectedCategory(cat.value);
              setPage(0);
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              selectedCategory === cat.value
                ? 'bg-black text-white border-black'
                : 'bg-white text-gray-700 border-gray-300 hover:border-black'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : selectedCategory !== null ? (
        // Vista por categoría
        categoryProducts.length === 0 ? (
          <EmptyState title="Sin productos" description="No hay productos en esta categoría." />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {categoryProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )
      ) : (
        // Vista paginada - Todos
        !pagedData || pagedData.content.length === 0 ? (
          <EmptyState title="No hay productos" description="Vuelve pronto para ver novedades." />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {pagedData.content.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <Pagination
              currentPage={pagedData.number}
              totalPages={pagedData.totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )
      )}
    </div>
  );
}