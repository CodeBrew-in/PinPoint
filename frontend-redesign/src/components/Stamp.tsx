/** Rotating circular "ADD A PLACE" action. */
export function Stamp({
  onClick,
  text = 'ADD A PLACE • PINPOINT • EXPLORE • ',
}: {
  onClick?: () => void;
  text?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Add a place"
      className="relative h-28 w-28 rounded-full border-2 border-ink bg-cream shadow-stamp active:translate-y-0.5 active:shadow-stamp-press"
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 animate-[spin_18s_linear_infinite] motion-reduce:animate-none" aria-hidden>
        <defs>
          <path id="ring" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
        </defs>
        <text className="fill-ink font-body" fontSize="8.5" fontWeight="700" letterSpacing="1">
          <textPath href="#ring">{text}</textPath>
        </text>
      </svg>
      <span className="absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-ink bg-orange font-body text-3xl font-bold leading-none text-white">
        +
      </span>
    </button>
  );
}
