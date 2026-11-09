import exifr from 'exifr';
import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { FieldCard } from '../components/FieldCard';
import { Input } from '../components/Input';
import { PhotoPlate } from '../components/PhotoPlate';
import { placePinIcon } from '../components/PlacePin';
import { addPlace, addToExistingPlace, fileToDataUrl } from '../store/api';
import { findMap, findPossibleDuplicates, suggestTags } from '../store/helpers';
import { useAppState } from '../store/store';
import type { MapData } from '../store/types';
import { LoadError, Loading } from '../components/PageState';
import { loadMap } from '../store/remote';
import { useLoad } from '../store/useLoad';
import NotFound from './NotFound';

type Step = 'details' | 'duplicates' | 'done';

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    map.setView([lat, lng], Math.max(map.getZoom(), 12), { animate: false });
  }, [map, lat, lng]);
  return null;
}

function PickPoint({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

export default function AddPlace() {
  const { id } = useParams();
  const map = findMap(useAppState(), id);
  const load = useLoad(() => loadMap(id ?? ''), [id], Boolean(map?.loaded));
  if (load.status === 'loading') return <Loading label="Loading map…" />;
  if (load.status === 'error') return <LoadError message={load.error} />;
  if (!map || load.result === 'missing') return <NotFound />;
  return <AddPlaceForm key={map.id} map={map} />;
}

function AddPlaceForm({ map }: { map: MapData }) {
  const isPublic = map.visibility === 'public';
  const start = map.places[0];

  const [step, setStep] = useState<Step>('details');
  const [resultPlaceId, setResultPlaceId] = useState<number>();
  const [merged, setMerged] = useState(false);
  const [photo, setPhoto] = useState<string>();
  const [photoNote, setPhotoNote] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  // Empty maps start on Patiala.
  const [lat, setLat] = useState(start ? String(start.lat) : '30.3398');
  const [lng, setLng] = useState(start ? String(start.lng) : '76.3869');
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [mergeInto, setMergeInto] = useState<string>('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false); // stops a double click from adding the place twice

  const latN = Number(lat);
  const lngN = Number(lng);
  const coordsOk = lat !== '' && lng !== '' && Math.abs(latN) <= 90 && Math.abs(lngN) <= 180;
  const suggestions = useMemo(() => suggestTags(`${name} ${description}`), [name, description]);
  // Public maps only accept suggested tags, so a tag that stopped being suggested no longer counts.
  const chosenTags = isPublic ? tags.filter((t) => suggestions.includes(t)) : tags;
  const canContinue = name.trim() !== '' && coordsOk && chosenTags.length > 0 && Boolean(photo);

  const dupes = useMemo(
    () => (isPublic && coordsOk ? findPossibleDuplicates(map.places, latN, lngN, name) : []),
    [isPublic, coordsOk, map.places, latN, lngN, name],
  );

  async function onPhoto(file?: File) {
    if (!file) return;
    setError('');
    try {
      setPhoto(await fileToDataUrl(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read the photo.');
      return;
    }
    try {
      const gps = await exifr.gps(file);
      if (gps && typeof gps.latitude === 'number') {
        setLat(gps.latitude.toFixed(5));
        setLng(gps.longitude.toFixed(5));
        setPhotoNote(`Coordinates taken from the photo: ${gps.latitude.toFixed(5)}, ${gps.longitude.toFixed(5)}`);
        return;
      }
    } catch {
      /* unreadable EXIF: fall through to the manual message */
    }
    setPhotoNote('No location found in this photo. Click the map or type coordinates.');
  }

  const toggleTag = (t: string) => setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  const addCustom = () => {
    const t = customTag.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setCustomTag('');
  };

  async function publishNew() {
    if (busy) return;
    setBusy(true);
    try {
      const placeId = await addPlace(map.id, { name, description, lat: latN, lng: lngN, tags: chosenTags, photo });
      setResultPlaceId(placeId);
      setMerged(false);
      setStep('done');
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not publish.');
    } finally {
      setBusy(false);
    }
  }

  async function mergeExisting(placeId: number) {
    if (busy) return;
    setBusy(true);
    try {
      await addToExistingPlace(map.id, placeId, { photo, note: description });
      setResultPlaceId(placeId);
      setMerged(true);
      setStep('done');
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add to the place.');
    } finally {
      setBusy(false);
    }
  }

  function next() {
    if (dupes.length > 0) return setStep('duplicates');
    void publishNew();
  }

  function reset() {
    setStep('details');
    setName('');
    setDescription('');
    setTags([]);
    setPhoto(undefined);
    setPhotoNote('');
    setMergeInto('');
    setResultPlaceId(undefined);
  }

  if (step === 'done') {
    return (
      <div className="mx-auto max-w-xl p-6 md:p-10">
        <FieldCard>
          <h1 className="text-4xl">{merged ? 'Added to the place' : 'Place published'}</h1>
          <p className="mt-2">
            {merged ? 'Your photo and notes were added to the existing place.' : `${name} is now on ${map.title}.`}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {resultPlaceId !== undefined && (
              <Link to={`/map/${map.id}/place/${resultPlaceId}`}><Button variant="primary">View place</Button></Link>
            )}
            <Link to={`/map/${map.id}`}><Button>Back to map</Button></Link>
            <Button variant="ghost" onClick={reset}>Add another</Button>
          </div>
        </FieldCard>
      </div>
    );
  }

  if (step === 'duplicates') {
    return (
      <div className="mx-auto max-w-2xl p-6 md:p-10">
        <p className="label">Step 2 of 2 · Check nearby</p>
        <h1 className="mt-1 text-4xl">Is it one of these?</h1>
        <p className="mt-2">We found places close to yours on this map. Pick one if it is the same place.</p>
        <ul className="mt-5 flex flex-col gap-3">
          {dupes.map(({ place, distanceKm }) => (
            <li key={place.id}>
              <label className={`card flex cursor-pointer items-start gap-3 p-3 ${mergeInto === String(place.id) ? '!bg-white' : ''}`}>
                <input
                  type="radio"
                  name="dupe"
                  className="mt-1 h-4 w-4 accent-ink"
                  checked={mergeInto === String(place.id)}
                  onChange={() => setMergeInto(String(place.id))}
                />
                <span>
                  <span className="block font-display text-xl">{place.name}</span>
                  <span className="label block">
                    {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m away` : `${distanceKm.toFixed(1)} km away`} · {place.photos.length} photos
                  </span>
                  <span className="block text-sm">{place.description}</span>
                </span>
              </label>
            </li>
          ))}
          <li>
            <label className={`card flex cursor-pointer items-center gap-3 p-3 ${mergeInto === 'new' ? '!bg-white' : ''}`}>
              <input type="radio" name="dupe" className="h-4 w-4 accent-ink" checked={mergeInto === 'new'} onChange={() => setMergeInto('new')} />
              <span className="font-display text-xl">None of these, it is a new place</span>
            </label>
          </li>
        </ul>
        {error && <p role="alert" className="mt-3 text-sm font-bold text-danger">{error}</p>}
        <div className="mt-5 flex gap-2">
          <Button onClick={() => setStep('details')}>Back</Button>
          <Button
            variant="primary"
            disabled={!mergeInto || busy}
            className="disabled:opacity-40"
            onClick={() => (mergeInto === 'new' ? publishNew() : mergeExisting(Number(mergeInto)))}
          >
            {mergeInto && mergeInto !== 'new' ? 'Add my photo to it' : 'Publish as new place'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 p-4 md:grid-cols-2 md:p-10">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => { e.preventDefault(); if (canContinue) next(); }}
      >
        <div>
          <Link to={`/map/${map.id}`} className="label underline underline-offset-4">← Back to map</Link>
          <h1 className="mt-2 text-4xl">Add a place</h1>
          <p className="mt-1 text-sm">
            To: {map.title} ({isPublic ? 'public map' : 'private map'})
          </p>
        </div>

        <div>
          <span className="label mb-1 block">Photo</span>
          <label className="card flex cursor-pointer flex-col items-center gap-2 border-dashed p-5 text-center">
            <span className="font-display text-xl">{photo ? 'Change photo' : 'Choose a photo'}</span>
            <span className="text-sm">JPG or PNG. If it has a location, we use it.</span>
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => void onPhoto(e.target.files?.[0])} />
          </label>
          {photo && (
            <div className="mt-3 flex items-center gap-4">
              <PhotoPlate src={photo} alt="Your photo" className="w-40" tilt={-2} />
              <p className="text-sm" role="status">{photoNote}</p>
            </div>
          )}
        </div>

        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Qila Mubarak" required />

        <label className="block">
          <span className="label mb-1 block">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="What is here, and why is it worth visiting?"
            className="w-full rounded-xl border-2 border-ink bg-cream px-3 py-2 text-[15px] placeholder:text-ink/50 focus:shadow-stamp"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Latitude" inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value)} />
          <Input label="Longitude" inputMode="decimal" value={lng} onChange={(e) => setLng(e.target.value)} />
        </div>
        {!coordsOk && <p className="text-sm font-bold text-danger" role="alert">Enter a valid latitude (−90 to 90) and longitude (−180 to 180).</p>}

        <div>
          <span className="label mb-1 block">{isPublic ? 'Tags (suggested for you)' : 'Tags'}</span>
          <div className="flex flex-wrap gap-2">
            {(isPublic ? suggestions : [...new Set([...suggestions, ...tags])]).map((t) => (
              <Chip key={t} active={tags.includes(t)} onClick={() => toggleTag(t)}>{t}</Chip>
            ))}
          </div>
          {isPublic ? (
            <p className="mt-2 text-sm">Public maps only allow the suggested tags. They update as you type.</p>
          ) : (
            <div className="mt-2 flex gap-2">
              <Input
                aria-label="Custom tag"
                placeholder="Your own tag"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
              />
              <Button type="button" onClick={addCustom}>Add</Button>
            </div>
          )}
        </div>

        {error && <p role="alert" className="text-sm font-bold text-danger">{error}</p>}
        <div className="flex items-center gap-3">
          <Button type="submit" variant="primary" disabled={!canContinue || busy} className="disabled:opacity-40">
            {isPublic ? 'Check nearby' : 'Publish'}
          </Button>
          {!canContinue && <span className="text-sm">Needs a photo, a name, valid coordinates and at least one tag.</span>}
        </div>
      </form>

      <div className="flex flex-col gap-2">
        <span className="label">Click the map to set the location</span>
        <div className="card h-[420px] overflow-hidden md:h-[560px]">
          <MapContainer center={[latN || 20, lngN || 78]} zoom={12} className="h-full w-full">
            <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <PickPoint onPick={(a, b) => { setLat(a.toFixed(5)); setLng(b.toFixed(5)); }} />
            {coordsOk && <Recenter lat={latN} lng={lngN} />}
            {coordsOk && <Marker position={[latN, lngN]} icon={placePinIcon(0, true)} zIndexOffset={1000} />}
            {map.places.map((p) => (
              <Marker key={p.id} position={[p.lat, p.lng]} icon={placePinIcon(p.id, false)} />
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
