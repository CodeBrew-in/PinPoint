import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { FieldCard } from '../components/FieldCard';
import { useSession } from '../components/Layout';
import { PhotoPlate } from '../components/PhotoPlate';
import { addPhoto, fileToDataUrl, reportPlace, verifyPlace } from '../store/api';
import { findMap } from '../store/helpers';
import { useAppState } from '../store/store';
import { REPORT_KINDS, type ReportKind } from '../store/types';
import NotFound from './NotFound';

export default function PlacePage() {
  const { id, placeId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSession();
  const state = useAppState();
  const map = findMap(state, id);
  const place = map?.places.find((p) => String(p.id) === placeId);

  const [reporting, setReporting] = useState(params.get('report') === '1');
  const [kind, setKind] = useState<ReportKind>(REPORT_KINDS[0]);
  const [note, setNote] = useState('');
  const [reported, setReported] = useState(false);
  const [error, setError] = useState('');

  if (!map || !place) return <NotFound />;

  // Anyone can look at a public place. Confirming, adding photos or reporting needs an account.
  const needLogin = () => navigate('/signin', { state: { from: location.pathname + location.search } });

  const run = (fn: () => void) => {
    if (!user) return needLogin();
    try {
      fn();
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    }
  };

  const onPhoto = async (file?: File) => {
    if (!file) return;
    if (!user) return needLogin();
    try {
      addPhoto(map.id, place.id, await fileToDataUrl(file));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add the photo.');
    }
  };

  const tilts = [-2, 2.5, -1.5, 2];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-10">
      <Link to={`/map/${map.id}`} className="label underline underline-offset-4">← Back to {map.title}</Link>

      <div className="mt-4 grid gap-8 md:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="label">{place.tags.join(' · ')}</p>
          <h1 className="mt-1 text-5xl">{place.name}</h1>
          <p className="label mt-3">
            {place.verifiedOn ? `Verified by ${place.verifiedBy} · last ${place.verifiedOn}` : 'Not verified yet'}
          </p>
          <p className="mt-4 text-lg">{place.description || 'No description yet.'}</p>

          {place.notes.length > 0 && (
            <div className="mt-4">
              <p className="label">More information</p>
              <ul className="mt-1 flex flex-col gap-1 text-[15px]">
                {place.notes.map((n, i) => (
                  <li key={i}>{n.text} <span className="label">({n.by}, {n.date})</span></li>
                ))}
              </ul>
            </div>
          )}

          <dl className="mt-5 grid grid-cols-2 gap-3">
            <div className="card p-3"><dt className="label">Latitude</dt><dd className="mt-1 font-mono">{place.lat.toFixed(4)}</dd></div>
            <div className="card p-3"><dt className="label">Longitude</dt><dd className="mt-1 font-mono">{place.lng.toFixed(4)}</dd></div>
            <div className="card p-3"><dt className="label">Added by</dt><dd className="mt-1">{place.addedBy}</dd></div>
            <div className="card p-3"><dt className="label">Photos</dt><dd className="mt-1">{place.photos.length}</dd></div>
          </dl>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => run(() => verifyPlace(map.id, place.id))}>
              {place.verifiedOn ? 'Confirm again' : 'Still here'}
            </Button>
            <label>
              <span className="inline-block cursor-pointer rounded-xl border-2 border-ink bg-cream px-4 py-2 font-display text-lg tracking-wide shadow-stamp">Add photo</span>
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => { void onPhoto(e.target.files?.[0]); e.target.value = ''; }} />
            </label>
            <Button variant="ghost" onClick={() => (user ? setReporting((r) => !r) : needLogin())} aria-expanded={reporting}>Report</Button>
          </div>
          {!user && (
            <p className="mt-3 text-sm text-ink/70">
              <Link to="/signin" state={{ from: location.pathname + location.search }} className="font-bold underline">Sign in</Link>{' '}
              to confirm this place, add a photo or report it.
            </p>
          )}
          {error && <p role="alert" className="mt-3 text-sm font-bold text-danger">{error}</p>}

          {reporting && !reported && (
            <FieldCard className="mt-4">
              <p className="label mb-2">What is wrong?</p>
              <div className="flex flex-wrap gap-2">
                {REPORT_KINDS.map((r) => <Chip key={r} active={kind === r} onClick={() => setKind(r)}>{r}</Chip>)}
              </div>
              <label className="mt-3 block">
                <span className="label mb-1 block">Details (optional)</span>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-xl border-2 border-ink bg-cream px-3 py-2 text-[15px] focus:shadow-stamp"
                />
              </label>
              <div className="mt-3 flex gap-2">
                <Button
                  variant="primary"
                  className="text-base"
                  onClick={() => run(() => { reportPlace(map.id, place.id, kind, note); setReported(true); })}
                >
                  Send report
                </Button>
                <Button className="text-base" onClick={() => setReporting(false)}>Cancel</Button>
              </div>
            </FieldCard>
          )}
          {reported && <p role="status" className="mt-4 font-bold">Thanks. A moderator will look at this.</p>}
        </div>

        <div className="flex flex-wrap content-start gap-6">
          {place.photos.length === 0 && <PhotoPlate alt="No photo yet" tilt={-2} className="w-44" />}
          {place.photos.map((src, i) => (
            <PhotoPlate key={i} src={src} alt={`Photo ${i + 1} of ${place.name}`} tilt={tilts[i % tilts.length]} className="w-44" />
          ))}
        </div>
      </div>
    </div>
  );
}
