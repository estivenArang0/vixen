import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Package, Minus, Plus, ShoppingCart, Check, X, ChevronLeft } from 'lucide-react';
import {
  useGetProductByIdQuery,
  useGetProductBySlugQuery,
  useGetVariantsByProductQuery,
} from '../../features/products/productsApi';
import { useAddToCartMutation } from '../../features/cart/cartApi';
import { useGetReviewsByProductIdQuery, useGetAverageRatingQuery } from '../../features/reviews/reviewsApi';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/formatCurrency';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import StarRating from '../../components/ui/StarRating';
import Badge from '../../components/ui/Badge';
import ReviewCard from './components/ReviewCard';
import ReviewForm from './components/ReviewForm';
import Pagination from '../../components/ui/Pagination';
import { parseImageCrop } from '../../utils/imageCrop';

const ZOOM_FACTOR = 3;
const LENS_SIZE = 150;

export default function ProductDetailPage() {
  const { id, slug } = useParams<{ id?: string; slug?: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Support both /products/:id and /products/slug/:slug routes
  const productById = useGetProductByIdQuery(id ?? '', { skip: !id });
  const productBySlug = useGetProductBySlugQuery(slug ?? '', { skip: !slug });
  const product = id ? productById.data : productBySlug.data;
  const isLoading = id ? productById.isLoading : productBySlug.isLoading;

  const productId = product?.id ?? id ?? '';

  const { data: variants } = useGetVariantsByProductQuery(productId, { skip: !productId });

  const [addToCart, { isLoading: isAdding }] = useAddToCartMutation();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [reviewPage, setReviewPage] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const [lens, setLens] = useState<{ x: number; y: number; bgX: number; bgY: number } | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: reviewsData } = useGetReviewsByProductIdQuery(
    { productId, page: reviewPage, size: 5 },
    { skip: !productId },
  );
  const { data: averageRating } = useGetAverageRatingQuery(productId, { skip: !productId });

  // Derive unique colors and sizes from variants
  const { uniqueColors, uniqueSizes, selectedVariant } = useMemo(() => {
    if (!variants || variants.length === 0) {
      return { uniqueColors: [], uniqueSizes: [], selectedVariant: null };
    }

    const colors = [...new Set(variants.map((v) => v.color).filter(Boolean))];
    const sizes = [...new Set(variants.map((v) => v.size).filter(Boolean))];

    // Auto-select first color if none selected
    const color = selectedColor || colors[0] || null;
    const matching = variants.find((v) => v.color === color && v.size === selectedSize);

    return { uniqueColors: colors, uniqueSizes: sizes, selectedVariant: matching ?? null };
  }, [variants, selectedColor, selectedSize]);

  // Auto-select first color on load
  useEffect(() => {
    if (uniqueColors.length > 0 && selectedColor === null) {
      setSelectedColor(uniqueColors[0]);
    }
  }, [uniqueColors, selectedColor]);

  // Available sizes for selected color
  const availableSizesForColor = useMemo(() => {
    if (!variants || !selectedColor) return [];
    return variants
      .filter((v) => v.color === selectedColor && v.stock > 0)
      .map((v) => v.size);
  }, [variants, selectedColor]);

  // Reset size when color changes
  useEffect(() => {
    if (selectedColor && selectedSize && !availableSizesForColor.includes(selectedSize)) {
      setSelectedSize(null);
    }
  }, [selectedColor, selectedSize, availableSizesForColor]);

  const displayImages = selectedVariant?.images?.length
    ? selectedVariant.images
    : (product?.images ?? []);

  const displayPrice = selectedVariant?.price ?? product?.minPrice ?? 0;
  const displayOriginalPrice = selectedVariant?.originalPrice ?? null;

  const canAddToCart = selectedVariant !== null && selectedVariant.stock > 0;
  const maxQuantity = selectedVariant?.stock ?? 0;

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const clampedX = Math.max(LENS_SIZE / 2, Math.min(rect.width - LENS_SIZE / 2, x));
    const clampedY = Math.max(LENS_SIZE / 2, Math.min(rect.height - LENS_SIZE / 2, y));
    const bgX = -(clampedX * ZOOM_FACTOR - LENS_SIZE / 2);
    const bgY = -(clampedY * ZOOM_FACTOR - LENS_SIZE / 2);
    setLens({ x: clampedX, y: clampedY, bgX, bgY });
  }, []);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!selectedVariant) return;

    const label = product
      ? `${product.name} (${selectedVariant.color}, ${selectedVariant.size})`
      : 'Producto';
    try {
      await addToCart({
        userId: user!.userId,
        item: {
          productId: productId,
          productName: label,
          sku: selectedVariant.sku,
          quantity,
          unitPrice: selectedVariant.price,
          subtotal: selectedVariant.price * quantity,
          imageUrl: displayImages[0] ? parseImageCrop(displayImages[0]).url : null,
        },
      }).unwrap();
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch {
      // silent
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return <div className="py-20 text-center text-gray-500">Producto no encontrado</div>;
  }

  const hasVariants = variants && variants.length > 0;
  const images = displayImages;
  const selectedRaw = images[selectedIndex] ?? '';
  const crop = parseImageCrop(selectedRaw);
  const imageUrl = crop.url;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-1 text-sm text-pink-500 hover:text-gray-900 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" /> Volver
      </button>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* ─── Image ─── */}
        <div>
          <div
            ref={containerRef}
            className="aspect-square overflow-hidden rounded-xl bg-gray-100 flex items-center justify-center relative select-none"
            style={{ cursor: lens ? 'none' : 'default' }}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => imageUrl && setLens((l) => l)}
            onMouseLeave={() => setLens(null)}
            onDoubleClick={() => imageUrl && setLightboxOpen(true)}
          >
            {imageUrl ? (
              <>
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="h-full w-full object-cover"
                  draggable={false}
                  style={{
                    objectPosition: `${crop.offsetX}% ${crop.offsetY}%`,
                    transform: `scale(${crop.zoom / 100})`,
                  }}
                />
                {lens && (
                  <>
                    <div
                      style={{
                        position: 'absolute',
                        left: lens.x - LENS_SIZE / 2,
                        top: lens.y - LENS_SIZE / 2,
                        width: LENS_SIZE,
                        height: LENS_SIZE,
                        borderRadius: '50%',
                        border: '2px solid rgba(255,255,255,0.9)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
                        backgroundImage: `url(${imageUrl})`,
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: `${containerRef.current!.getBoundingClientRect().width * ZOOM_FACTOR}px ${containerRef.current!.getBoundingClientRect().height * ZOOM_FACTOR}px`,
                        backgroundPosition: `${lens.bgX}px ${lens.bgY}px`,
                        pointerEvents: 'none',
                        zIndex: 10,
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 12,
                        right: 12,
                        background: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        fontSize: 11,
                        padding: '3px 10px',
                        borderRadius: 999,
                        pointerEvents: 'none',
                      }}
                    >
                      Doble clic para ampliar
                    </div>
                  </>
                )}
              </>
            ) : (
              <Package className="h-24 w-24 text-gray-300" />
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 mt-4">
              {images.map((img, i) => {
                const thumbCrop = parseImageCrop(img);
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedIndex(i)}
                    className={`h-16 w-16 rounded-lg overflow-hidden border-2 transition-colors flex-shrink-0 ${
                      i === selectedIndex ? 'border-pink-500' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={thumbCrop.url}
                      alt={`${product.name} ${i + 1}`}
                      className="h-full w-full object-cover"
                      style={{
                        objectPosition: `${thumbCrop.offsetX}% ${thumbCrop.offsetY}%`,
                        transform: `scale(${thumbCrop.zoom / 100})`,
                      }}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── Info ─── */}
        <div>
          <p className="text-sm text-gray-500 uppercase tracking-wide">{product.brand}</p>

          <h1 className="mt-1 text-3xl font-bold text-gray-900">{product.name}</h1>

          <div className="mt-3 flex items-center gap-3">
            <StarRating rating={averageRating ?? 0} />
            <span className="text-sm text-gray-500">
              {reviewsData?.totalElements ?? 0} reseñas
            </span>
          </div>

          {/* Price */}
          <div className="mt-4">
            {hasVariants && !selectedVariant ? (
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-gray-900">
                  {formatCurrency(product.minPrice ?? 0)}
                </span>
                {product.maxPrice && product.maxPrice !== product.minPrice && (
                  <>
                    <span className="text-2xl text-gray-400">–</span>
                    <span className="text-3xl font-bold text-gray-900">
                      {formatCurrency(product.maxPrice)}
                    </span>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-gray-900">
                  {formatCurrency(displayPrice)}
                </span>
                {displayOriginalPrice && displayOriginalPrice > displayPrice && (
                  <>
                    <span className="text-xl text-gray-400 line-through">
                      {formatCurrency(displayOriginalPrice)}
                    </span>
                    <Badge variant="danger">
                      -{Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100)}%
                    </Badge>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Color selector */}
          {hasVariants && uniqueColors.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Color</p>
              <div className="flex flex-wrap gap-2">
                {uniqueColors.map((color) => {
                  const sizesForColor = variants?.filter((v) => v.color === color) ?? [];
                  const totalStock = sizesForColor.reduce((s, v) => s + v.stock, 0);
                  return (
                    <button
                      key={color}
                      onClick={() => {
                        setSelectedColor(color);
                        setSelectedSize(null);
                        setQuantity(1);
                      }}
                      disabled={totalStock === 0}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                        selectedColor === color
                          ? 'bg-pink-500 border-pink-500 text-white'
                          : totalStock === 0
                            ? 'border-gray-200 text-gray-300 cursor-not-allowed line-through'
                            : 'border-gray-300 text-gray-600 hover:border-pink-400'
                      }`}
                    >
                      {color}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size selector */}
          {hasVariants && selectedColor && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Talla</p>
              <div className="flex flex-wrap gap-2">
                {uniqueSizes.map((size) => {
                  const stockForSize = variants?.find(
                    (v) => v.color === selectedColor && v.size === size
                  )?.stock ?? 0;
                  return (
                    <button
                      key={size}
                      onClick={() => {
                        setSelectedSize(size);
                        setQuantity(1);
                      }}
                      disabled={stockForSize === 0}
                      className={`h-10 min-w-[2.75rem] px-3 rounded-lg border text-sm font-semibold transition-colors ${
                        selectedSize === size
                          ? 'bg-pink-500 border-pink-500 text-white'
                          : stockForSize === 0
                            ? 'border-gray-200 text-gray-300 cursor-not-allowed line-through'
                            : 'border-gray-300 text-gray-600 hover:border-pink-400'
                      }`}
                      title={stockForSize === 0 ? 'Agotado' : `${stockForSize} disponibles`}
                    >
                      {size}
                    </button>
                  );
                })}
                {uniqueSizes.length === 0 && (
                  <span className="text-sm text-gray-400">Sin tallas disponibles</span>
                )}
              </div>
            </div>
          )}

          {/* Stock badge */}
          <div className="mt-3">
            {hasVariants ? (
              canAddToCart ? (
                <Badge variant="success">
                  Disponible ({selectedVariant!.color} / {selectedVariant!.size}) — {maxQuantity} uds
                </Badge>
              ) : selectedSize ? (
                <Badge variant="danger">Agotado en esta combinación</Badge>
              ) : (
                <Badge>Selecciona color y talla</Badge>
              )
            ) : (
              <Badge variant="success">Disponible</Badge>
            )}
          </div>

          <p className="mt-6 text-gray-600 leading-relaxed">{product.description}</p>

          {/* Attributes */}
          {product.attributes && Object.keys(product.attributes).length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-900 mb-2">Características</h3>
              <table className="text-sm text-gray-600">
                <tbody>
                  {Object.entries(product.attributes).map(([key, value]) => (
                    <tr key={key}>
                      <td className="pr-4 py-1 font-medium text-gray-700">{key}:</td>
                      <td className="py-1">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Add to cart */}
          {canAddToCart && (
            <div className="mt-8 flex items-center gap-4">
              <div className="flex items-center rounded-lg border border-gray-300">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 hover:bg-gray-50"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center text-sm font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                  className="px-3 py-2 hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <Button onClick={handleAddToCart} disabled={isAdding} size="lg" className="flex-1 bg-pink-400 hover:bg-pink-600">
                {added ? (
                  <><Check className="h-5 w-5 mr-2" /> Agregado!</>
                ) : (
                  <><ShoppingCart className="h-5 w-5 mr-2" /> Agregar al Carrito</>
                )}
              </Button>
            </div>
          )}

          <div className="mt-6 space-y-1 text-sm text-gray-500">
            {product.sku && (
              <p>SKU: <span className="text-gray-700">{product.sku}</span></p>
            )}
            {product.weight != null && (
              <p>Peso: <span className="text-gray-700">{product.weight} kg</span></p>
            )}
          </div>

          {product.tags?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          )}

          {product.specifications?.length > 0 && (
            <div className="mt-8">
              <h3 className="font-semibold text-gray-900 mb-3">Especificaciones</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                {product.specifications.map((spec, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                    {spec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && imageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-5 right-5 text-white/70 hover:text-white transition-colors"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="h-8 w-8" />
          </button>
          <img
            src={imageUrl}
            alt={product.name}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Reviews */}
      <section className="mt-16 border-t border-gray-200 pt-12">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Comentarios de Clientes</h2>

        {isAuthenticated && (
          <div className="mb-8">
            <ReviewForm
              productId={productId}
              userId={user!.userId}
              userNickname={user!.username}
              onSuccess={() => setReviewPage(0)}
            />
          </div>
        )}

        {reviewsData && reviewsData.content.length > 0 ? (
          <>
            <div className="space-y-6">
              {reviewsData.content.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
            <Pagination
              currentPage={reviewsData.number}
              totalPages={reviewsData.totalPages}
              onPageChange={setReviewPage}
            />
          </>
        ) : (
          <p className="text-gray-500">
            Aún no hay reseñas. ¡Sé el primero en reseñar este producto!
          </p>
        )}
      </section>
    </div>
  );
}
