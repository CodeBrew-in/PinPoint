export function FieldCard({
  coords,
  children,
  className = '',
  tilt = 0,
}: {
  coords?: string;
  children: React.ReactNode;
  className?: string;
  tilt?: number;
}) {
  return (
    <div className={`card p-4 ${className}`} style={tilt ? { transform: `rotate(${tilt}deg)` } : undefined}>
      {coords && <p className="label mb-2 text-right">{coords}</p>}
      {children}
    </div>
  );
}
