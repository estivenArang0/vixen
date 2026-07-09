import { Link } from 'react-router-dom';
import { ShoppingBag, Package, Users, Star } from 'lucide-react';
import { useGetOrdersByStatusQuery } from '../../features/orders/ordersApi';
import { useGetAllProductsQuery } from '../../features/products/productsApi';
import { useGetAllUsersQuery } from '../../features/users/usersApi';
import { useGetPendingReviewsQuery } from '../../features/reviews/reviewsApi';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';

function StatCard({ icon: Icon, label, value, color, to }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  to: string;
}) {
  return (
    <Link to={to}>
      <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-center gap-4">
          <div className={`rounded-lg p-3 ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export default function DashboardPage() {
  const { data: pendingOrders } = useGetOrdersByStatusQuery('PENDING');
  const { data: products, isLoading } = useGetAllProductsQuery();
  const { data: users } = useGetAllUsersQuery();
  const { data: pendingReviews } = useGetPendingReviewsQuery({ page: 0, size: 1 });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Panel de control Vixen</h1>
      <p className="mb-8 text-sm text-gray-500">Gestiona tu tienda con una experiencia de marca más completa.</p>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={ShoppingBag} label="Pedidos por preparar" value={pendingOrders?.length ?? 0} color="bg-yellow-500" to="/admin/orders" />
        <StatCard icon={Package} label="Productos disponibles" value={products?.length ?? 0} color="bg-indigo-500" to="/admin/products" />
        <StatCard icon={Users} label="Usuarios registrados" value={users?.length ?? 0} color="bg-green-500" to="/admin/users" />
        <StatCard icon={Star} label="Reseñas pendientes" value={pendingReviews?.totalElements ?? 0} color="bg-purple-500" to="/admin/reviews" />
      </div>
    </div>
  );
}