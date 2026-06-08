import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag, Truck, Shield } from 'lucide-react';
import { useGetProductsQuery } from '../../features/products/productsApi';
import ProductCard from './components/ProductCard';
import Spinner from '../../components/ui/Spinner';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

const slides = [
  {
    title: 'Descubre tu estilo',
    subtitle: 'Los mejores bodis y blusas con entrega rápida.',
    bg: 'https://i.imgur.com/kUyyqId.png',
    position: 'center 40%',
    height: '250px',
  },
  {
    title: 'Nueva colección',
    subtitle: 'Conjuntos exclusivos para mujeres elegantes.',
    bg: 'https://i.imgur.com/kUyyqId.png',
    position: 'center 50%',
    height: '250px',
  },
  {
    title: 'Envío a todo Colombia',
    subtitle: 'Recibe tu pedido en la puerta de tu casa.',
    bg: 'https://i.imgur.com/WPNaUHY.jpeg',
    position: 'center 75%',
    height: '250px',
  },
];

export default function HomePage() {
  const { data: products, isLoading } = useGetProductsQuery();
  const [emblaRef] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 3000 })]);

  const featured = products?.slice(0, 8) ?? [];

  return (
    <div>
      {/* Carrusel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {slides.map((slide, i) => (
            <div
              key={i}
              className="min-w-full text-white py-12 px-8"
              style={{
                backgroundImage: `url(${slide.bg})`,
                backgroundSize: 'cover',
                backgroundPosition: slide.position,
                backgroundColor: '#000',
                minHeight: slide.height,
              }}

            >
              <div className="mx-auto max-w-7xl">
                <h1 className="text-3xl font-bold">{slide.title}</h1>
                <p className="mt-2 text-sm text-gray-200">{slide.subtitle}</p>
                <Link
                  to="/products"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-pink-500 px-5 py-2 text-sm font-semibold text-white hover:bg-pink-400 transition-colors"
                >
                  Ver tienda <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="flex items-center gap-3">
              <Truck className="h-8 w-8 text-pink-500" />
              <div>
                <p className="font-medium text-gray-900">Envío gratis</p>
                <p className="text-sm text-gray-500">En pedidos mayores a $100,000</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-pink-500" />
              <div>
                <p className="font-medium text-gray-900">Pagos seguros</p>
                <p className="text-sm text-gray-500">100% seguro</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-8 w-8 text-pink-500" />
              <div>
                <p className="font-medium text-gray-900">Devoluciones fáciles</p>
                <p className="text-sm text-gray-500">Política de 30 días</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Productos destacados</h2>
          <Link to="/products" className="flex items-center gap-1 text-sm font-medium text-pink-500 hover:text-pink-400">
            Ver todos <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div >
  );
}
