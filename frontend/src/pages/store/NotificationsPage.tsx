import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useGetNotificationsQuery, useMarkAsReadMutation, useMarkAllAsReadMutation, useDeleteReadNotificationsMutation } from '../../features/notifications/notificationsApi';
import { formatDateTime } from '../../utils/formatDate';
import { cn } from '../../utils/cn';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: notifications, isLoading } = useGetNotificationsQuery(user!.userId);
  const [markRead] = useMarkAsReadMutation();
  const [markAllRead] = useMarkAllAsReadMutation();
  const [deleteRead] = useDeleteReadNotificationsMutation();

  const hasRead = notifications?.some((n) => n.read) ?? false;

  const handleClick = async (id: string, read: boolean, actionUrl: string | null, sourceId: string) => {
    if (!read) await markRead(id);
    if (actionUrl) {
      const fixedUrl = actionUrl.replace('/orders/', '/account/orders/');
      navigate(fixedUrl);
    } else if (sourceId) {
      navigate(`/account/orders/${sourceId}`);
    }
  };

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  if (!notifications || notifications.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <EmptyState title="Sin notificaciones" description="¡Estás al día!" icon={<Bell className="h-16 w-16" />} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => markAllRead(user!.userId)}>
            <CheckCheck className="h-4 w-4 mr-1" /> Marcar todo como leído
          </Button>
          {hasRead && (
            <Button variant="ghost" size="sm" onClick={() => deleteRead(user!.userId)}>
              <Trash2 className="h-4 w-4 mr-1" /> Eliminar leídas
            </Button>
          )}
        </div>
      </div>
      <div className="space-y-2">
        {notifications.map((n) => (
          <div
            key={n.id}
            onClick={() => handleClick(n.id, n.read, n.actionUrl, n.sourceId)}
            className={cn(
              'rounded-xl border p-4 cursor-pointer transition-colors hover:shadow-sm',
              n.read ? 'border-gray-200 bg-white hover:bg-gray-50' : 'border-pink-200 bg-pink-50 hover:bg-pink-100',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{n.title}</p>
                <p className="mt-1 text-sm text-gray-600">{n.content}</p>
                {(n.actionUrl || n.sourceId) && (
                  <p className="mt-2 text-xs text-pink-600 font-medium">Ver pedido →</p>
                )}
              </div>
              {!n.read && <span className="h-2 w-2 rounded-full bg-pink-500 flex-shrink-0 mt-2" />}
            </div>
            <p className="mt-2 text-xs text-gray-400">{formatDateTime(n.sentAt)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}