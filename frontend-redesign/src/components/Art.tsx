/** Decorative SVG art. All original. */

const INK = '#2D2D2F';

export function Sparkle({ className = '', color = '#E5432D' }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <path d="M20 2 C21.5 14 26 18.5 38 20 C26 21.5 21.5 26 20 38 C18.5 26 14 21.5 2 20 C14 18.5 18.5 14 20 2Z" fill={color} />
    </svg>
  );
}

/** A friendly map-pin character in a cap, carrying a folded map. The tip of the pin is at (0.44, 0.857) of the box. */
export function PinMascot({
  className = '',
  waving = true,
  body = '#E5432D',
  shine = '#F07A63',
}: {
  className?: string;
  waving?: boolean;
  body?: string;
  shine?: string;
}) {
  return (
    <svg viewBox="0 0 264 280" className={className} role="img" aria-label="PinPoint pin mascot">
      <ellipse cx="116" cy="268" rx="62" ry="8" fill={INK} opacity="0.18" />

      {/* legs and boots */}
      <path d="M96 222 v30" stroke={INK} strokeWidth="10" strokeLinecap="round" />
      <path d="M134 222 v30" stroke={INK} strokeWidth="10" strokeLinecap="round" />
      <path d="M80 256 q0 -12 16 -12 h12 q8 0 8 12z" fill="#4FA391" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
      <path d="M120 256 q0 -12 16 -12 h12 q8 0 8 12z" fill="#4FA391" stroke={INK} strokeWidth="5" strokeLinejoin="round" />

      {/* waving arm */}
      <g style={waving ? { transformOrigin: '34px 120px', animation: 'wave 2.4s ease-in-out infinite' } : undefined}>
        <path d="M38 122 C16 116 10 96 18 78" stroke={INK} strokeWidth="14" strokeLinecap="round" fill="none" />
        <path d="M38 122 C16 116 10 96 18 78" stroke="#4FA391" strokeWidth="6" strokeLinecap="round" fill="none" />
        <circle cx="18" cy="74" r="11" fill="#FFFCF3" stroke={INK} strokeWidth="5" />
      </g>

      {/* body: map pin */}
      <path
        d="M116 18 C64 18 30 58 30 104 C30 156 88 196 116 240 C144 196 202 156 202 104 C202 58 168 18 116 18Z"
        fill={body} stroke={INK} strokeWidth="7" strokeLinejoin="round"
      />
      <path d="M52 96 C54 62 78 38 104 32" stroke={shine} strokeWidth="8" strokeLinecap="round" fill="none" />

      {/* face */}
      <circle cx="116" cy="108" r="50" fill="#FFFCF3" stroke={INK} strokeWidth="6" />
      <circle cx="98" cy="102" r="6" fill={INK} />
      <circle cx="134" cy="102" r="6" fill={INK} />
      <circle cx="88" cy="120" r="8" fill="#F4A48E" />
      <circle cx="144" cy="120" r="8" fill="#F4A48E" />
      <path d="M100 122 Q116 142 132 122" stroke={INK} strokeWidth="6" strokeLinecap="round" fill="none" />

      {/* cap */}
      <path d="M68 70 C70 36 162 36 164 70Z" fill="#E8B54A" stroke={INK} strokeWidth="6" strokeLinejoin="round" />
      <path d="M160 66 q36 0 40 16 q-28 6 -48 -6z" fill="#E8B54A" stroke={INK} strokeWidth="6" strokeLinejoin="round" />
      <path d="M116 44 l4.5 9 10 1.5 -7.3 7 1.8 10 -9 -4.8 -9 4.8 1.8 -10 -7.3 -7 10 -1.5z" fill="#E5432D" stroke={INK} strokeWidth="3" strokeLinejoin="round" />

      {/* arm holding a folded map */}
      <path d="M200 132 C222 132 228 150 220 166" stroke={INK} strokeWidth="14" strokeLinecap="round" fill="none" />
      <path d="M200 132 C222 132 228 150 220 166" stroke="#4FA391" strokeWidth="6" strokeLinecap="round" fill="none" />
      <g transform="rotate(14 214 188)">
        <rect x="190" y="164" width="52" height="44" rx="4" fill="#FFFCF3" stroke={INK} strokeWidth="5" />
        <path d="M207 164 v44 M225 164 v44" stroke={INK} strokeWidth="3" />
        <path d="M196 190 q7 -9 14 0 t14 0 t14 0" stroke="#4FA391" strokeWidth="3" fill="none" />
        <path d="M232 176 l8 8 M240 176 l-8 8" stroke="#E5432D" strokeWidth="4" strokeLinecap="round" />
      </g>
      <circle cx="220" cy="168" r="9" fill="#FFFCF3" stroke={INK} strokeWidth="5" />
    </svg>
  );
}

export function PinGlyph({ className = '', color = '#E5432D' }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 30" className={className} aria-hidden>
      <path d="M12 1C6 1 2 5.5 2 11c0 7 7.5 12 10 18 2.5-6 10-11 10-18C22 5.5 18 1 12 1Z" fill={color} />
      <circle cx="12" cy="11" r="4" fill="#fff" />
    </svg>
  );
}

export function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <PinGlyph className="h-7 w-6" />
      <span className={`font-display text-2xl font-extrabold leading-none ${light ? 'text-white' : 'text-ink'}`}>PinPoint</span>
    </span>
  );
}
