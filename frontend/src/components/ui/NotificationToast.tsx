import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export type NotificationVariant = 'success' | 'error' | 'info';

interface NotificationToastProps {
  title: string;
  message: string;
  variant: NotificationVariant;
  onDismiss: () => void;
}

const variantStyles: Record<NotificationVariant, string> = {
  success: 'border-emerald-500 bg-emerald-600 text-white',
  error: 'border-red-500 bg-red-600 text-white',
  info: 'border-slate-500 bg-slate-800 text-white',
};

const icons: Record<NotificationVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
};

export default function NotificationToast({ title, message, variant, onDismiss }: NotificationToastProps) {
  const Icon = icons[variant];

  return (
    <div
      className={cn(
        'flex w-full max-w-md items-start gap-3 overflow-hidden rounded-3xl border p-4 shadow-xl ring-1 ring-black/5',
        variantStyles[variant],
      )}
      role="status"
      aria-live="polite"
    >
      <div className="mt-0.5">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-sm leading-5 opacity-90">{message}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded-full p-1 text-white transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/80"
        aria-label="Cerrar notificación"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
