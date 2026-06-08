import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Package } from 'lucide-react';
import { useGetOrderByIdQuery } from '../../features/orders/ordersApi';
import { useGetShipmentByOrderIdQuery } from '../../features/shipments/shipmentsApi';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Card from '../../components/ui/Card';

const statusVariant = (status: string | null) => {
  switch (status?.toUpperCase()) {
    case 'PENDING': return 'warning' as const;
    case 'PROCESSING': return 'info' as const;
    case 'SHIPPED': return 'info' as const;
    case 'DELIVERED': return 'success' as const;
    case 'CANCELLED': return 'danger' as const;
    default: return 'default' as const;
  }
};

const statusLabel = (status: string | null) => {
  switch (status?.toUpperCase()) {
    case 'PENDING': return 'Pendiente';
    case 'PROCESSING': return 'En proceso';
    case 'SHIPPED': return 'Enviado';
    case 'DELIVERED': return 'Entregado';
    case 'CANCELLED': return 'Cancelado';
    default: return 'Pendiente';
  }
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: order, isLoading } = useGetOrderByIdQuery(id!);
  const { data: shipment } = useGetShipmentByOrderIdQuery(id!, { skip: !order });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!order) return <div className="py-20 text-center text-gray-500">Pedido no encontrado</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">

      {/* Botón volver */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-1 text-sm text-pink-500 hover:text-gray-900 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" /> Volver
      </button>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedido #{order.orderNumber}</h1>
          <p className="text-sm text-gray-500">{formatDate(order.orderDate)}</p>
        </div>
        <Badge variant={statusVariant(order.orderStatus)}>
          {statusLabel(order.orderStatus)}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Productos</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.productId} className="flex items-center gap-4">
                  {/* Foto del producto */}
                  <Link to={`/products/${item.productId}`} className="flex-shrink-0">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="h-16 w-16 rounded-lg object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                        <Package className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </Link>
                  <div className="flex-1">
                    <Link to={`/products/${item.productId}`} className="text-sm font-medium text-gray-900 hover:text-pink-600">
                      {item.productName}
                    </Link>
                    <p className="text-xs text-gray-500">Cantidad: {item.quantity} x {formatCurrency(item.unitPrice)}</p>
                  </div>
                  <p className="text-sm font-semibold">{formatCurrency(item.subtotal)}</p>
                </div>
              ))}
            </div>
          </Card>

          {shipment && (
            <Card className="p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Envío</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-gray-500">Transportadora</p><p className="font-medium">{shipment.carrier}</p></div>
                <div><p className="text-gray-500">Número de guía</p><p className="font-medium">{shipment.trackingNumber || 'Pendiente'}</p></div>
                <div><p className="text-gray-500">Estado</p><Badge variant={statusVariant(shipment.status)}>{statusLabel(shipment.status)}</Badge></div>
                <div><p className="text-gray-500">Entrega estimada</p><p className="font-medium">{formatDate(shipment.estimatedDeliveryDate)}</p></div>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Resumen</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Impuesto</span><span>{formatCurrency(order.tax)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Envío</span><span>{formatCurrency(order.shippingCost)}</span></div>
              <hr />
              <div className="flex justify-between font-semibold"><span>Total</span><span>{formatCurrency(order.total)}</span></div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold text-gray-900 mb-3">Direcciones</h2>
            <div className="text-sm space-y-3">
              <div><p className="text-gray-500">Dirección de envío</p><p className="text-gray-700">{order.shippingAddress}</p></div>
              <div><p className="text-gray-500">Dirección de facturación</p><p className="text-gray-700">{order.billingAddress}</p></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}