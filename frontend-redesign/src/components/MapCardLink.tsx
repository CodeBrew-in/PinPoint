import { Link } from 'react-router-dom';
import type { MapCard } from '../store/helpers';
import { MapTile } from './MapTile';

/** A map as a tile with its title underneath. Maps with no places yet show an empty tile. */
export function MapCardLink({ map }: { map: MapCard }) {
  return (
    <Link
      to={`/map/${map.id}`}
      aria-label={`${map.title}, ${map.places} places`}
      className="group block transition-transform hover:-translate-y-1"
    >
      {map.pins.length > 0 ? (
        <MapTile pins={map.pins} seed={map.id} />
      ) : (
        <div className="grid aspect-[5/6] w-full place-items-center rounded-[1.6rem] border-[3px] border-ink bg-cream text-sm font-bold shadow-[0_14px_0_rgba(0,0,0,0.16)]">
          No places yet
        </div>
      )}
      <p className="mt-5 text-center font-display text-lg font-bold leading-tight">{map.title}</p>
      <p className="label mt-1 text-center text-ink/70">
        {map.category} · {map.places} places
      </p>
    </Link>
  );
}
