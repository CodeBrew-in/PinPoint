export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center" role="status" aria-live="polite">
      <p className="font-display text-2xl font-bold">{label}</p>
    </div>
  );
}

export function LoadError({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center" role="alert">
      <h1 className="text-4xl">Could not load this</h1>
      <p className="mt-3">{message}</p>
      <button type="button" className="mt-5 rounded-lg border-2 border-ink bg-cream px-5 py-2 font-display font-bold shadow-stamp" onClick={() => window.location.reload()}>
        Try again
      </button>
    </div>
  );
}
