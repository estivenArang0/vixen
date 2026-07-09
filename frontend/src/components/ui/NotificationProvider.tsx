import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import NotificationToast from './NotificationToast';
import type { NotificationVariant } from './NotificationToast';

interface NotificationData {
  id: string;
  title: string;
  message: string;
  variant: NotificationVariant;
}

interface NotificationContextValue {
  notify: (notification: Omit<NotificationData, 'id'>) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const notify = (notification: Omit<NotificationData, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setNotifications((current) => [...current, { ...notification, id }]);

    window.setTimeout(() => {
      setNotifications((current) => current.filter((item) => item.id !== id));
    }, 5000);
  };

  const contextValue = useMemo(() => ({ notify }), []);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-5 z-50 flex flex-col items-center gap-3 px-4 sm:top-6">
        {notifications.map((notification) => (
          <div key={notification.id} className="pointer-events-auto w-full max-w-lg">
            <NotificationToast
              title={notification.title}
              message={notification.message}
              variant={notification.variant}
              onDismiss={() => setNotifications((current) => current.filter((item) => item.id !== notification.id))}
            />
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
