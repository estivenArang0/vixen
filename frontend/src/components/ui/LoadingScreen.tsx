export function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-violet-500/30 bg-violet-500/10">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
        </div>
        <p className="mt-5 text-sm font-semibold uppercase tracking-[0.3em] text-violet-400">Vixen</p>
        <h1 className="mt-2 text-2xl font-semibold">Cargando tu experiencia</h1>
        <p className="mt-3 text-sm text-slate-400">
          Estamos preparando la tienda y la administración para que entres sin interrupciones.
        </p>
      </div>
    </div>
  );
}
