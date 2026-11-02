export function Chip({
  children,
  active = false,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full border-2 border-ink px-3.5 py-1 text-sm font-bold ${
        active ? 'bg-ink text-white' : 'bg-cream text-ink hover:bg-white'
      }`}
    >
      {active && <span className="h-2 w-2 rounded-full bg-orange" aria-hidden />}
      {children}
    </button>
  );
}
