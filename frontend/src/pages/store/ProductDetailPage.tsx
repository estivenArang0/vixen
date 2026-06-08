import { useParams, useNavigate } from 'react-router-dom';
import { useState, useRef, useCallback } from 'react';
import { Package, Minus, Plus, ShoppingCart, Check, X } from 'lucide-react';
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

  const [lens, setLens] = useState<{ x: number; y: number; bgX: number; bgY: number } | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: reviewsData } = useGetReviewsByProductIdQuery(
    { productId: id!, page: reviewPage, size: 5 },
    { skip: !id },
  );
  const { data: averageRating } = useGetAverageRatingQuery(id!, { skip: !id });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clampedX = Math.max(LENS_SIZE / 2, Math.min(rect.width  - LENS_SIZE / 2, x));
    const clampedY = Math.max(LENS_SIZE / 2, Math.min(rect.height - LENS_SIZE / 2, y));

    // background-position: move the zoomed image so the hovered spot is centered in the lens
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

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await addToCart({
        userId: user!.userId,
        item: {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          quantity,
          unitPrice: product.price,
          subtotal: product.price * quantity,
          imageUrl: product.images?.[0] || null,
        },
      }).unwrap();
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch {
    }
  };

  const imageUrl = product.images?.[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">

        {/* Image */}
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
              />

              {lens && (
                <>
                  {/* Lens circle — uses background-image to show the zoomed portion */}
                  <div
                    style={{
                      position: 'absolute',
                      left: lens.x - LENS_SIZE / 2,
                      top:  lens.y - LENS_SIZE / 2,
                      width:  LENS_SIZE,
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

        {/* Info */}
        <div>
          <p className="text-sm text-gray-500 uppercase tracking-wide">{product.brand}</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">{product.name}</h1>

          <div className="mt-3 flex items-center gap-3">
            <StarRating rating={averageRating ?? 0} />
            <span className="text-sm text-gray-500">
              {reviewsData?.totalElements ?? 0} reviews
            </span>
          </div>

          <p className="mt-4 text-3xl font-bold text-gray-900">{formatCurrency(product.price)}</p>

          <div className="mt-3">
            {product.stockQuantity > 0 ? (
              <Badge variant="success">In Stock ({product.stockQuantity})</Badge>
            ) : (
              <Badge variant="danger">Out of Stock</Badge>
            )}
          </div>

          <p className="mt-6 text-gray-600 leading-relaxed">{product.description}</p>

          {product.stockQuantity > 0 && (
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
                  onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                  className="px-3 py-2 hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <Button onClick={handleAddToCart} disabled={isAdding} size="lg" className="flex-1">
                {added ? (
                  <><Check className="h-5 w-5 mr-2" /> Added!</>
                ) : (
                  <><ShoppingCart className="h-5 w-5 mr-2" /> Add to Cart</>
                )}
              </Button>
            </div>
          )}

          {product.category && (
            <div className="mt-6 text-sm text-gray-500">
              Category: <span className="text-gray-700">{product.category}</span>
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
              <h3 className="font-semibold text-gray-900 mb-3">Specifications</h3>
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
        <h2 className="text-xl font-bold text-gray-900 mb-6">Customer Reviews</h2>

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
          <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
        )}
      </section>
    </div>
  );
}