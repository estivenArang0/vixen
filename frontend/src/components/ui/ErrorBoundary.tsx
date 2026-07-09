import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled UI error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 px-6 py-16 text-slate-100">
          <div className="mx-auto max-w-xl rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-400">Vixen</p>
            <h1 className="mt-3 text-3xl font-semibold">Algo salió mal</h1>
            <p className="mt-4 text-sm text-slate-400">
              La interfaz encontró un error inesperado. Intenta recargar la página o volver a entrar más tarde.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 inline-flex items-center rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
