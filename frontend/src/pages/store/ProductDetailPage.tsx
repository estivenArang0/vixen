import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Package, Minus, Plus, ShoppingCart, Check, X, ChevronLeft } from 'lucide-react';
import { useGetProductByIdQuery } from '../../features/products/productsApi';
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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { data: product, isLoading } = useGetProductByIdQuery(id!);
  const [addToCart, { isLoading: isAdding }] = useAddToCartMutation();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [reviewPage, setReviewPage] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedColorIndex, setSelectedColorIndex] = useState<number | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const [lens, setLens] = useState<{ x: number; y: number; bgX: number; bgY: number } | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: reviewsData } = useGetReviewsByProductIdQuery(
    { productId: id!, page: reviewPage, size: 5 },
    { skip: !id },
  );
  const { data: averageRating } = useGetAverageRatingQuery(id!, { skip: !id });

  useEffect(() => {
    if (product?.variants && product.variants.length > 0 && selectedColorIndex === null) {
      setSelectedColorIndex(0);
    }
  }, [product, selectedColorIndex]);

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

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return <div className="py-20 text-center text-gray-500">Product not found</div>;
  }

  const hasVariants = !!product.variants && product.variants.length > 0;
  const activeVariant = hasVariants && selectedColorIndex !== null ? product.variants[selectedColorIndex] : null;
  const displayImages = activeVariant && activeVariant.images.length > 0 ? activeVariant.images : (product.images ?? []);
  const displayPrice = activeVariant?.price ?? product.price;
  const sizesForActiveColor = activeVariant?.sizes ?? {};
  const stockForSelectedSize = selectedSize ? (sizesForActiveColor[selectedSize] ?? 0) : null;
  const canAddToCart = hasVariants
    ? selectedColorIndex !== null && !!selectedSize && (stockForSelectedSize ?? 0) > 0
    : product.stockQuantity > 0;
  const maxQuantity = hasVariants ? (stockForSelectedSize ?? 0) : product.stockQuantity;

  const selectColor = (index: number) => {
    setSelectedColorIndex(index);
    setSelectedSize(null);
    setSelectedIndex(0);
    setQuantity(1);
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (hasVariants && (selectedColorIndex === null || !selectedSize)) {
      return;
    }
    const cartLabel = activeVariant
      ? `${product.name} (${activeVariant.color}, talla ${selectedSize})`
      : product.name;
    try {
      await addToCart({
        userId: user!.userId,
        item: {
          productId: product.id,
          productName: cartLabel,
          sku: product.sku,
          quantity,
          unitPrice: displayPrice,
          subtotal: displayPrice * quantity,
          imageUrl: displayImages[0] ? parseImageCrop(displayImages[0]).url : null,
        },
      }).unwrap();
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch {
    }
  };

  const images = displayImages;
  const selectedRaw = images[selectedIndex] ?? '';
  const crop = parseImageCrop(selectedRaw);
  const imageUrl = crop.url;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Botón volver */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-1 text-sm text-pink-500 hover:text-gray-900 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" /> Volver
      </button>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">

        {/* Image */}
        <div>
          <div
            ref={containerRef}
            className="aspect-square overflow-hidden rounded-xl bg-gray-100 flex items-center justify-center relative select-none"
            style={{ cursor: lens ? 'none' : 'default' }}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => imageUrl && setLens(l => l)}
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
                  style={{ objectPosition: `${crop.offsetX}% ${crop.offsetY}%`, transform: `scale(${crop.zoom / 100})` }}
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
        </div>

        {/* Info */}
        <div>
          <p className="text-sm text-gray-500 uppercase tracking-wide">{product.brand}</p>

          <div className="mt-1 flex items-start justify-between gap-4">
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

            {images.length > 1 && (
              <div className="flex gap-2 flex-shrink-0">
                {images.map((img, i) => {
                  const thumbCrop = parseImageCrop(img);
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedIndex(i)}
                      className={`h-16 w-16 rounded-lg overflow-hidden border-2 transition-colors flex-shrink-0 ${i === selectedIndex ? 'border-pink-500' : 'border-gray-200'
                        }`}
                    >
                      <img
                        src={thumbCrop.url}
                        alt={`${product.name} ${i + 1}`}
                        className="h-full w-full object-cover"
                        style={{ objectPosition: `${thumbCrop.offsetX}% ${thumbCrop.offsetY}%`, transform: `scale(${thumbCrop.zoom / 100})` }}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center gap-3">
            <StarRating rating={averageRating ?? 0} />
            <span className="text-sm text-gray-500">
              {reviewsData?.totalElements ?? 0} reviews
            </span>
          </div>

          <p className="mt-4 text-3xl font-bold text-gray-900">{formatCurrency(displayPrice)}</p>

          {hasVariants && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Color</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v, i) => {
                  const variantStock = Object.values(v.sizes || {}).reduce((s, n) => s + n, 0);
                  return (
                    <button
                      key={i}
                      onClick={() => selectColor(i)}
                      disabled={variantStock === 0}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                        selectedColorIndex === i
                          ? 'bg-pink-500 border-pink-500 text-white'
                          : variantStock === 0
                            ? 'border-gray-200 text-gray-300 cursor-not-allowed line-through'
                            : 'border-gray-300 text-gray-600 hover:border-pink-400'
                      }`}
                    >
                      {v.color}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {hasVariants && activeVariant && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Talla</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(sizesForActiveColor).map(([size, stock]) => (
                  <button
                    key={size}
                    onClick={() => stock > 0 && (setSelectedSize(size), setQuantity(1))}
                    disabled={stock === 0}
                    className={`h-10 min-w-[2.75rem] px-3 rounded-lg border text-sm font-semibold transition-colors ${
                      selectedSize === size
                        ? 'bg-pink-500 border-pink-500 text-white'
                        : stock === 0
                          ? 'border-gray-200 text-gray-300 cursor-not-allowed line-through'
                          : 'border-gray-300 text-gray-600 hover:border-pink-400'
                    }`}
                    title={stock === 0 ? 'Agotado' : `${stock} disponibles`}
                  >
                    {size}
                  </button>
                ))}
                {Object.keys(sizesForActiveColor).length === 0 && (
                  <span className="text-sm text-gray-400">Sin tallas cargadas para este color</span>
                )}
              </div>
              {selectedSize && (
                <p className="mt-2 text-xs text-gray-500">
                  {stockForSelectedSize} disponibles en {activeVariant.color} / {selectedSize}
                </p>
              )}
            </div>
          )}

          <div className="mt-3">
            {hasVariants ? (
              canAddToCart ? (
                <Badge variant="success">Disponible ({stockForSelectedSize})</Badge>
              ) : selectedSize ? (
                <Badge variant="danger">Agotado en esta talla</Badge>
              ) : (
                <Badge>Selecciona color y talla</Badge>
              )
            ) : product.stockQuantity > 0 ? (
              <Badge variant="success">In Stock ({product.stockQuantity})</Badge>
            ) : (
              <Badge variant="danger">Out of Stock</Badge>
            )}
          </div>

          <p className="mt-6 text-gray-600 leading-relaxed">{product.description}</p>

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

          {product.category && (
            <div className="mt-6 text-sm text-gray-500">
              Categoría: <span className="text-gray-700">{product.category}</span>
            </div>
          )}
          {product.sku && (
            <div className="text-sm text-gray-500">
              SKU: <span className="text-gray-700">{product.sku}</span>
            </div>
          )}

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
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {/* Reviews */}
      <section className="mt-16 border-t border-gray-200 pt-12">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Comentarios de Clientes</h2>

        {isAuthenticated && (
          <div className="mb-8">
            <ReviewForm
              productId={product.id}
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
            Aún no hay reseñas. ¡Sé el primero en reseñar este producto!</p>
        )}
      </section>
    </div>
  );
}