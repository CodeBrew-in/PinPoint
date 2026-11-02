import type { CSSProperties } from 'react';
import { PinMascot } from './Art';

const CHARCOAL = '#2D2D2F';
const ORANGE = '#E5432D';

/** Light land colours for the tiles, tints of the palette. */
export const LANDS = ['#DCE6EC', '#FBEFCB', '#D6EEE5'];
export const landFor = (id: string) => LANDS[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % LANDS.length];

// Small deterministic random generator, so each map gets its own (but stable) drawing.
function rng(seed: string) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
}

export type Pin = { lat: number; lng: number; name?: string };

// Map area is 100 wide x 120 tall. The mascot's tip sits at (0.44, 0.857) of its own box.
const MASCOT_W = 30;
const MASCOT_H = 31.8;

/**
 * A cute, stylised map (roads, a river, parks, a few buildings). Each place becomes a pin at its real
 * relative position, and the first place is marked by the mascot instead of a pin.
 * It is an illustration, not a real map. Pass `absolute` classes via className when positioning it.
 */
export function MapTile({
  pins, seed, land, label, className = '', style,
}: {
  pins: Pin[]; seed: string; land?: string; label?: boolean; className?: string; style?: CSSProperties;
}) {
  const r = rng(seed);
  const roads = Array.from({ length: 5 }, (_, i) => {
    const a = 10 + r() * 100, b = 10 + r() * 100, c = 10 + r() * 100, d = 10 + r() * 100;
    return i % 2 === 0 ? `M-5 ${a} C 30 ${b}, 70 ${c}, 105 ${d}` : `M${a} -5 C ${b} 40, ${c} 80, ${d} 125`;
  });
  const river = `M-5 ${25 + r() * 70} C 25 ${r() * 120}, 70 ${r() * 120}, 105 ${25 + r() * 70}`;
  const parks = Array.from({ length: 3 }, () => ({ x: 4 + r() * 70, y: 6 + r() * 96, w: 14 + r() * 14, h: 10 + r() * 12 }));
  const blocks = Array.from({ length: 7 }, () => ({ x: 4 + r() * 84, y: 6 + r() * 104, s: 5 + r() * 5, c: r() > 0.5 ? '#F2C86B' : '#EBA58F' }));

  const lats = pins.map((p) => p.lat), lngs = pins.map((p) => p.lng);
  const minLat = Math.min(...lats), minLng = Math.min(...lngs);
  const spanLat = Math.max(...lats) - minLat || 1, spanLng = Math.max(...lngs) - minLng || 1;
  const pts = pins.map((p, i) => ({
    n: i + 1,
    name: p.name,
    x: pins.length === 1 ? 50 : 20 + ((p.lng - minLng) / spanLng) * 60,
    y: pins.length === 1 ? 74 : 44 + (1 - (p.lat - minLat) / spanLat) * 58,
  }));
  const first = pts[0];

  return (
    <div
      // Default position and width apply only when the caller has not set their own (classes would fight).
      className={`aspect-[5/6] overflow-hidden rounded-[1.6rem] border-[3px] ${/\babsolute\b/.test(className) ? '' : 'relative'} ${/(^|\s)w-/.test(className) ? '' : 'w-full'} ${className}`}
      style={{ borderColor: CHARCOAL, background: land ?? landFor(seed), boxShadow: '0 14px 0 rgba(0,0,0,0.16)', ...style }}
    >
      <svg viewBox="0 0 100 120" className="absolute inset-0 h-full w-full" aria-hidden>
        {parks.map((p, i) => <rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} rx="5" fill="#BFD9AE" />)}
        {blocks.map((b, i) => <rect key={i} x={b.x} y={b.y} width={b.s} height={b.s} rx="1.2" fill={b.c} opacity="0.8" />)}
        <path d={river} stroke="#9CCBC4" strokeWidth="10" fill="none" strokeLinecap="round" />
        {roads.map((d, i) => <path key={i} d={d} stroke="#fff" strokeWidth="3.4" fill="none" />)}
        {roads.map((d, i) => <path key={`l${i}`} d={d} stroke="#E4DCC6" strokeWidth="0.6" fill="none" strokeDasharray="3 3" />)}
        {pts.slice(1).map((p) => (
          <g key={p.n} transform={`translate(${p.x} ${p.y})`}>
            <ellipse cx="0" cy="0.6" rx="4.2" ry="1.4" fill="#000" opacity="0.2" />
            <path d="M0 0 C-2 -5 -7 -7 -7 -13 A7 7 0 1 1 7 -13 C7 -7 2 -5 0 0Z" fill={ORANGE} stroke={CHARCOAL} strokeWidth="1.3" />
            <circle cy="-13" r="3.6" fill="#fff" />
            <text y="-11.4" textAnchor="middle" fontSize="4.6" fontWeight="800" fill={CHARCOAL} style={{ fontFamily: "'Outfit', sans-serif" }}>{p.n}</text>
          </g>
        ))}
      </svg>

      {first && (
        <>
          <div
            className="pointer-events-none absolute"
            style={{ width: `${MASCOT_W}%`, left: `${first.x - 0.44 * MASCOT_W}%`, top: `${(first.y - 0.857 * MASCOT_H) / 1.2}%` }}
          >
            <PinMascot waving={false} className="w-full drop-shadow-[0_2px_0_rgba(0,0,0,0.18)]" />
          </div>
          {label && first.name && (
            <span
              className="absolute whitespace-nowrap rounded-full border-2 bg-white px-3 py-1 text-[11px] font-bold"
              style={{ borderColor: CHARCOAL, color: CHARCOAL, left: `${Math.min(first.x + 9, 52)}%`, top: `${(first.y - 4) / 1.2}%` }}
            >
              {first.name}
            </span>
          )}
        </>
      )}
    </div>
  );
}
