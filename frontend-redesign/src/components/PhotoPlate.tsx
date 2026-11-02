/** Tilted photo with cream frame and tape corner. Shows a flat placeholder when there is no src. */
export function PhotoPlate({
  src,
  alt,
  tilt = -2,
  className = '',
}: {
  src?: string;
  alt: string;
  tilt?: number;
  className?: string;
}) {
  return (
    <figure className={`relative inline-block ${className}`} style={{ transform: `rotate(${tilt}deg)` }}>
      <span aria-hidden className="absolute -top-2 left-3 z-10 h-4 w-12 -rotate-6 rounded-sm border-2 border-ink bg-gold/90" />
      <div className="rounded-xl border-2 border-ink bg-cream p-1.5 shadow-stamp">
        {src ? (
          <img src={src} alt={alt} className="block h-28 w-full rounded-lg object-cover" />
        ) : (
          <div role="img" aria-label={alt} className="grid h-28 w-full place-items-center rounded-lg bg-sage px-1 text-center text-xs font-bold text-ink/70">
            No photo yet
          </div>
        )}
      </div>
    </figure>
  );
}
