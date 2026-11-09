import L from 'leaflet';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { useSession } from '../components/Layout';
import { FieldCard } from '../components/FieldCard';
import { Input } from '../components/Input';
import { PhotoPlate } from '../components/PhotoPlate';
import { placePinIcon } from '../components/PlacePin';
import { Stamp } from '../components/Stamp';
import { verifyPlace } from '../store/api';
import { contributorCount, findMap, fmtCoords, ownerName } from '../store/helpers';
import { useAppState } from '../store/store';
import type { MapData, Place } from '../store/types';
import { LoadError, Loading } from '../components/PageState';
import { loadMap } from '../store/remote';
import { useLoad } from '../store/useLoad';
import NotFound from './NotFound';

/** Fits all places on first render, then flies to the selected place. */
function Viewport({ places, active }: { places: Place[]; active: Place }) {
  const map = useMap();
  const lastId = useRef<number | null>(null);
  useEffect(() => {
    if (lastId.current === active.id) return; // also skips React StrictMode's second effect run
    const isFirst = lastId.current === null;
    lastId.current = active.id;
    if (isFirst) {
      map.invalidateSize(); // the container may not have its final size on first render
      map.fitBounds(L.latLngBounds(places.map((p) => [p.lat, p.lng] as [number, number])), {
        // Leave room at the bottom so pins are not hidden behind the place card.
        paddingTopLeft: [60, 70],
        paddingBottomRight: [60, window.innerWidth >= 768 ? 290 : 200],
        maxZoom: 14,
      });
      return;
    }
    map.flyTo([active.lat, active.lng], Math.max(map.getZoom(), 8), { duration: 0.6 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, active.id]);
  return null;
}

export default function MapView() {
  const { id } = useParams();
  const state = useAppState();
  const map = findMap(state, id);
  const load = useLoad(() => loadMap(id ?? ''), [id], Boolean(map?.loaded));
  if (load.status === 'loading') return <Loading label="Loading map…" />;
  if (load.status === 'error') return <LoadError message={load.error} />;
  if (!map || load.result === 'missing') return <NotFound />;
  return <MapViewInner key={map.id} map={map} owner={ownerName(state, map)} contributors={contributorCount(state, map)} />;
}

function EmptyMap({ map, owner }: { map: MapData; owner: string }) {
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <p className="label">{map.visibility === 'public' ? 'Public map' : 'Private map'} · by {owner}</p>
      <h1 className="mt-2 text-5xl">{map.title}</h1>
      <p className="mt-3 text-lg">No places yet. Add the first one.</p>
      <div className="mt-6">
        <Button variant="primary" className="text-xl" onClick={() => navigate(`/map/${map.id}/add`)}>Add a place</Button>
      </div>
    </div>
  );
}

function MapViewInner({ map, owner, contributors }: { map: MapData; owner: string; contributors: number }) {
  if (map.places.length === 0) return <EmptyMap map={map} owner={owner} />;
  return <MapWithPlaces map={map} owner={owner} contributors={contributors} />;
}

function MapWithPlaces({ map, owner, contributors }: { map: MapData; owner: string; contributors: number }) {
  const id = map.id;
  const navigate = useNavigate();
  const user = useSession();
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState<string | null>(null);
  const [activeId, setActiveId] = useState(map.places[0].id);
  const [showList, setShowList] = useState(false); // phones only: list is a panel over the map
  const [error, setError] = useState('');

  const tags = useMemo(() => [...new Set(map.places.flatMap((p) => p.tags))], [map]);
  const shown = map.places.filter(
    (p) => `${p.name} ${p.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()) && (!tag || p.tags.includes(tag)),
  );
  const active = map.places.find((p) => p.id === activeId) ?? map.places[0];

  return (
    <div className="relative h-[calc(100vh-58px)] md:grid md:grid-cols-[360px_1fr]">
      <aside
        className={`${showList ? 'flex' : 'hidden'} absolute inset-0 z-[600] min-h-0 flex-col gap-3 overflow-y-auto border-r-2 border-ink bg-page p-4 md:static md:z-auto md:flex`}
      >
        <Button className="self-start text-base md:hidden" onClick={() => setShowList(false)}>
          ← Show map
        </Button>
        <div>
          <p className="label">{map.visibility === 'public' ? 'Public map' : 'Private map'}</p>
          <h1 className="text-3xl">{map.title}</h1>
          <p className="mt-1 text-sm">
            {map.places.length} places · {contributors} contributors · by {owner}
          </p>
        </div>
        <Input
          aria-label="Search places"
          placeholder="Search by place or tag"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <Chip active={tag === null} onClick={() => setTag(null)}>
            All ({map.places.length})
          </Chip>
          {tags.map((t) => (
            <Chip key={t} active={tag === t} onClick={() => setTag(tag === t ? null : t)}>
              {t}
            </Chip>
          ))}
        </div>
        <ul className="flex flex-col gap-3">
          {shown.length === 0 && <li className="card p-4 text-sm">No places match that search.</li>}
          {shown.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => {
                  setActiveId(p.id);
                  setShowList(false);
                }}
                className={`card w-full p-3 text-left ${p.id === activeId ? '!bg-white' : ''}`}
              >
                <span className="label flex justify-between gap-2">
                  <span>#{String(p.id).padStart(2, '0')}</span>
                  <span>{fmtCoords(p.lat, p.lng)}</span>
                </span>
                <span className="mt-1 block font-display text-xl leading-tight">{p.name}</span>
                <span className="mt-1 block text-sm">
                  Added by {p.addedBy}
                  {p.verifiedOn ? ' · Verified' : ''}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="relative isolate h-full">
        <MapContainer center={[active.lat, active.lng]} zoom={6} className="h-full w-full" scrollWheelZoom>
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Viewport places={map.places} active={active} />
          {map.places.map((p) => (
            <Marker
              key={p.id}
              position={[p.lat, p.lng]}
              icon={placePinIcon(p.id, p.id === activeId)}
              zIndexOffset={p.id === activeId ? 1000 : 0}
              eventHandlers={{ click: () => setActiveId(p.id) }}
            />
          ))}
        </MapContainer>

        <div className="pointer-events-none absolute inset-0 z-[500] p-4">
          <div className="pointer-events-auto absolute left-1/2 top-3 -translate-x-1/2 md:hidden">
            <Button className="text-base" onClick={() => setShowList(true)}>
              List ({map.places.length})
            </Button>
          </div>
          <div className="pointer-events-auto absolute right-3 top-3 origin-top-right scale-75 md:bottom-4 md:right-4 md:top-auto md:origin-bottom-right md:scale-100">
            <Stamp onClick={() => navigate(`/map/${id}/add`)} />
          </div>
          <div className="pointer-events-auto absolute inset-x-3 bottom-3 md:inset-x-auto md:bottom-4 md:left-4 md:w-[min(380px,calc(100%-9rem))]">
            <FieldCard coords={fmtCoords(active.lat, active.lng)}>
              <div className="flex gap-3">
                <PhotoPlate src={active.photos[0]} alt={`Photo of ${active.name}`} className="hidden w-28 shrink-0 md:inline-block" tilt={-2} />
                <div>
                  <h2 className="text-xl md:text-2xl">{active.name}</h2>
                  <p className="label mt-1">
                    {active.verifiedOn ? `Verified · last ${active.verifiedOn}` : 'Not verified yet'}
                  </p>
                </div>
              </div>
              <p className="mt-3 hidden text-[15px] md:block">{active.description}</p>
              {error && <p role="alert" className="mt-2 text-sm font-bold text-danger">{error}</p>}
              <div className="mt-2 flex flex-wrap gap-2 md:mt-3">
                <Button
                  variant="primary"
                  className="text-base"
                  onClick={async () => {
                    // Browsing is open to everyone; confirming a place needs an account.
                    if (!user) return navigate('/signin', { state: { from: `/map/${id}` } });
                    try {
                      await verifyPlace(id, active.id);
                      setError('');
                    } catch (e) {
                      setError(e instanceof Error ? e.message : 'Could not verify.');
                    }
                  }}
                >
                  Still here
                </Button>
                <Button className="text-base" onClick={() => navigate(`/map/${id}/place/${active.id}`)}>
                  Details
                </Button>
                <Button variant="ghost" className="text-base" onClick={() => navigate(`/map/${id}/place/${active.id}?report=1`)}>
                  Report
                </Button>
              </div>
            </FieldCard>
          </div>
        </div>
      </section>
    </div>
  );
}
