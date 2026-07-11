import { Link } from 'react-router-dom';
import { Package, Tag } from 'lucide-react';
import type { ProductDTO } from '../../../features/products/productsTypes';
import { useGetAverageRatingQuery, useGetReviewCountQuery } from '../../../features/reviews/reviewsApi';
import { formatCurrency } from '../../../utils/formatCurrency';
import StarRating from '../../../components/ui/StarRating';
import Badge from '../../../components/ui/Badge';
import { parseImageCrop } from '../../../utils/imageCrop';

interface ProductCardProps {
  product: ProductDTO;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { data: averageRating } = useGetAverageRatingQuery(product.id);
  const { data: reviewCount } = useGetReviewCountQuery(product.id);

  const hasDiscount =
    product.minPrice != null &&
    product.maxPrice != null &&
    product.minPrice < product.maxPrice;

  // Determine link: prefer slug, fallback to id
  const linkTo = product.slug ? `/products/slug/${product.slug}` : `/products/${product.id}`;

  return (
    <Link to={linkTo} className="group relative">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-md">
        {/* Discount badge */}
        {hasDiscount && (
          <div className="absolute top-2 left-2 z-10">
            <Badge variant="danger">
              <Tag className="h-3 w-3 mr-1" />
              Rango de precios
            </Badge>
          </div>
        )}

        <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
          {product.images?.[0] ? (
            <img
              src={parseImageCrop(product.images[0]).url}
              alt={product.name}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform"
              style={{
                objectPosition: `${parseImageCrop(product.images[0]).offsetX}% ${parseImageCrop(product.images[0]).offsetY}%`,
                transform: `scale(${parseImageCrop(product.images[0]).zoom / 100})`,
              }}
            />
          ) : (
            <Package className="h-16 w-16 text-gray-400" />
          )}
        </div>
        <div className="p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">{product.brand}</p>
          <h3 className="mt-1 font-medium text-gray-900 line-clamp-1 group-hover:text-pink-600">
            {product.name}
          </h3>
          <div className="mt-1 flex items-center gap-2">
            <StarRating rating={averageRating ?? 0} size="sm" />
            {reviewCount != null && reviewCount > 0 && (
              <span className="text-xs text-gray-500">({reviewCount})</span>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-lg font-semibold text-gray-900">
              {product.minPrice != null && product.maxPrice != null ? (
                product.minPrice === product.maxPrice ? (
                  formatCurrency(product.minPrice)
                ) : (
                  <>
                    {formatCurrency(product.minPrice)}
                    <span className="text-sm text-gray-400 font-normal"> – </span>
                    {formatCurrency(product.maxPrice)}
                  </>
                )
              ) : (
                <span className="text-gray-400 text-sm">Consultar</span>
              )}
            </p>
            {product.minPrice == null && (
              <span className="text-xs font-medium text-gray-400">Sin stock</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
