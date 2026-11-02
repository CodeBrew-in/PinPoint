import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PinGlyph, PinMascot, Sparkle, Wordmark } from '../components/Art';
import { useSession } from '../components/Layout';
import { MapCardLink } from '../components/MapCardLink';
import { LANDS, MapTile } from '../components/MapTile';
import { publicMaps, toCard } from '../store/helpers';
import { loadPublicMaps } from '../store/remote';
import { useLoad } from '../store/useLoad';
import { useAppState } from '../store/store';

const faqs = [
  { q: 'Who can see a private map?', a: 'Only you and the people you share it with by email. It never shows up in Explore or in search.' },
  { q: 'Can anyone add to a public map?', a: 'Anyone signed in can. Before a new place goes up, you see the ones already nearby, so you can add your photo to the existing place instead of making a duplicate.' },
  { q: 'Where is my data saved?', a: 'In this demo, only in your browser. There is no server yet, so clearing your browser data clears your maps.' },
  { q: 'What happens to a wrong place?', a: 'Anyone can report it. A moderator reviews the report, then removes the place or dismisses the report.' },
];

const howItems = [
  { t: 'Photo to pin', d: 'GPS from the photo', icon: 'M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 100-8 4 4 0 000 8z' },
  { t: 'Private or public', d: 'You choose per map', icon: 'M7 11V8a5 5 0 0110 0v3M5 11h14v9H5z' },
  { t: 'Checked by others', d: 'Confirm or report', icon: 'M5 12l4 4 10-10' },
];

/** Giant outlined wordmark used as background texture. */
const Watermark = ({ className = '' }: { className?: string }) => (
  <span
    aria-hidden
    className={`pointer-events-none absolute select-none whitespace-nowrap font-display font-extrabold leading-none text-transparent ${className}`}
    style={{ fontSize: 'clamp(8rem, 24vw, 21rem)', WebkitTextStroke: '2px rgba(255,255,255,0.55)' }}
  >
    PinPoint
  </span>
);

export default function Landing() {
  const state = useAppState();
  const user = useSession();
  useLoad(loadPublicMaps, []); // a failure just leaves the sample list empty
  // The three biggest public maps; their real places drive the pins drawn on each tile.
  const maps = publicMaps(state)
    .map((m) => toCard(state, m))
    .sort((a, b) => b.places - a.places || b.updated.localeCompare(a.updated))
    .slice(0, 3);
  const [open, setOpen] = useState(0);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-sage">
        <Watermark className="-bottom-6 left-[30%]" />
        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-4 px-5 pb-16 pt-6 md:grid-cols-[1fr_1.05fr] md:px-10 md:pb-24 md:pt-10">
          <div>
            <h1 className="text-[clamp(2.7rem,6.6vw,5.2rem)] leading-[0.95]">
              Pin your
              <br />
              favourite
              <span className="ml-3 inline-grid h-7 w-7 -translate-y-[0.6em] place-items-center rounded-full bg-orange align-middle">
                <Sparkle className="h-4 w-4" color="#1D1D1F" />
              </span>
              <br />
              spots.
            </h1>
            <div className="mt-8 flex gap-2" aria-hidden>
              {Array.from({ length: 6 }).map((_, i) => (
                <span key={i} className="h-[3px] w-6 bg-orange" />
              ))}
            </div>
            <p className="mt-8 max-w-sm text-[15px] leading-relaxed text-ink/80">
              A map you fill in with other people. Add a place with a photo, and the pin drops itself if the photo
              has GPS data. Keep a map private, or make it public.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
              {user ? (
                // Already have an account: no sign-up prompt, just the way back to your maps.
                <Link to="/my-maps" className="group inline-flex items-center gap-4">
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-orange text-white transition-transform group-hover:translate-x-1">
                    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M4 12h16M14 6l6 6-6 6" />
                    </svg>
                  </span>
                  <span className="text-lg font-medium text-orange-dark">Open My Maps</span>
                </Link>
              ) : (
                <>
                  <Link to="/signup" className="group inline-flex items-center gap-4">
                    <span className="grid h-16 w-16 place-items-center rounded-full bg-orange text-white transition-transform group-hover:translate-x-1">
                      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M4 12h16M14 6l6 6-6 6" />
                      </svg>
                    </span>
                    <span className="text-lg font-medium text-orange-dark">Create account</span>
                  </Link>
                  <Link to="/explore" className="text-sm font-medium underline underline-offset-4">Browse maps</Link>
                </>
              )}
            </div>
          </div>

          {/* three maps fanned out, the middle one on top */}
          <div className="relative mx-auto mt-6 h-[380px] w-full max-w-[560px] md:mt-0 md:h-[540px]">
            {[
              { i: 0, cls: 'left-[0%] top-[16%] w-[44%] -rotate-[12deg]', label: false },
              { i: 2, cls: 'right-[0%] top-[16%] w-[44%] rotate-[12deg]', label: false },
              { i: 1, cls: 'left-[20%] top-[0%] z-10 w-[60%] -rotate-[2deg]', label: true },
            ].map(({ i, cls, label }) =>
              maps[i] ? (
                <MapTile key={maps[i].id} pins={maps[i].pins} seed={maps[i].id} land={LANDS[i]} label={label} className={`absolute ${cls}`} />
              ) : null,
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-page">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-20 md:grid-cols-2 md:px-10">
          <div className="relative mx-auto h-[300px] w-[300px] md:h-[360px] md:w-[360px]">
            <div className="absolute inset-0 rounded-full bg-ink" />
            <PinMascot className="absolute -right-6 bottom-[-6%] z-10 w-[78%]" />
            <Sparkle className="absolute left-[14%] top-[18%] h-10 w-10" color="#E8B54A" />
          </div>
          <div>
            <h2 className="font-wide text-2xl font-normal tracking-[0.08em] md:text-3xl">How it works</h2>
            <p className="mt-6 text-lg font-medium">A map fills up one photo at a time.</p>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink/80">
              Before a place goes on a public map, we show you the ones already nearby, so the same stall
              does not get added twice.
            </p>
            <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-5">
              {howItems.map((i) => (
                <li key={i.t} className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-ink text-white">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={i.icon} /></svg>
                  </span>
                  <span className="text-xs leading-tight"><b className="block text-[13px]">{i.t}</b><span className="text-ink/70">{i.d}</span></span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Sample maps */}
      <section className="bg-page">
        <div className="mx-auto max-w-7xl px-5 pb-24 pt-6 md:px-10">
          <h2 className="text-center font-wide text-2xl font-normal tracking-[0.08em] md:text-3xl">Sample maps</h2>
          <ul className="mt-12 grid gap-10 sm:grid-cols-3">
            {maps.map((m) => (
              <li key={m.id} className="mx-auto w-full max-w-[300px]"><MapCardLink map={m} /></li>
            ))}
          </ul>
          <p className="mt-10 text-center text-sm text-ink/70">Demo maps, saved only in your browser.</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative overflow-hidden bg-sage">
        <Watermark className="-bottom-10 -left-10 opacity-70" />
        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-5 py-20 md:grid-cols-[0.9fr_1.1fr] md:px-10">
          <div>
            <h2 className="font-wide text-2xl font-normal leading-snug tracking-[0.08em] md:text-3xl">Questions</h2>
            <PinMascot className="mt-8 w-[220px] md:w-[280px]" />
          </div>
          <div className="flex flex-col gap-4">
            {faqs.map((f, i) => {
              const isOpen = open === i;
              return (
                <div key={f.q} className="rounded-md bg-[#2D2D2F] text-white shadow-[0_6px_10px_rgba(0,0,0,0.25)]">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    className="flex w-full items-center gap-4 px-4 py-4 text-left"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-sm bg-white/10 font-display text-lg font-bold">Q</span>
                    <span className="flex-1 border-l border-white/30 pl-4 text-[15px]">{f.q}</span>
                    <svg viewBox="0 0 24 24" className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M6 9l6 6 6-6" /></svg>
                  </button>
                  {isOpen && (
                    <div className="mx-4 flex items-start gap-4 border-t border-white/30 py-4">
                      <span className="grid h-8 w-8 shrink-0 place-items-center font-display text-lg font-bold">A</span>
                      <p className="border-l border-white/30 pl-4 text-[14px] leading-relaxed text-white/90">{f.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#17171A] text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-12 md:flex-row md:items-start md:justify-between md:px-10">
          <div>
            <Wordmark light />
            <p className="mt-4 max-w-[16rem] text-xs text-white/60">A map you fill in with other people.</p>
          </div>
          <nav className="flex flex-wrap items-center gap-x-10 gap-y-3 text-[15px] font-medium" aria-label="Footer">
            <PinGlyph className="hidden h-6 w-5 opacity-0 md:block" />
            <Link to="/explore" className="hover:underline">Explore</Link>
            {user ? (
              <>
                <Link to="/my-maps" className="hover:underline">My Maps</Link>
                <Link to="/profile" className="hover:underline">Profile</Link>
              </>
            ) : (
              <>
                <Link to="/signin" className="hover:underline">Sign in</Link>
                <Link to="/signup" className="hover:underline">Create account</Link>
              </>
            )}
          </nav>
        </div>
      </footer>
    </div>
  );
}
