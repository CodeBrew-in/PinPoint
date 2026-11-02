import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { FieldCard } from '../components/FieldCard';
import { Input } from '../components/Input';
import { useSession } from '../components/Layout';
import { shareMap, unshareMap } from '../store/api';
import { LoadError, Loading } from '../components/PageState';
import { placeCountOf } from '../store/helpers';
import { loadMyMaps } from '../store/remote';
import { useAppState } from '../store/store';
import { useLoad } from '../store/useLoad';
import type { MapData } from '../store/types';

function ShareDialog({ map, onClose }: { map: MapData; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const remove = async (address: string) => {
    try {
      await unshareMap(map.id, address);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove access.');
    }
  };

  const invite = async () => {
    try {
      await shareMap(map.id, email);
      setEmail('');
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not share.');
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] grid place-items-center bg-ink/60 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={`Share ${map.title}`} className="card w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-3xl">Share map</h2>
        <p className="mt-1 text-sm">{map.title}. Only people you add can see this private map.</p>
        <div className="mt-4 flex items-end gap-2">
          <div className="flex-1">
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void invite()} />
          </div>
          <Button type="button" onClick={() => void invite()}>Invite</Button>
        </div>
        {error && <p role="alert" className="mt-2 text-sm font-bold text-danger">{error}</p>}
        <p className="label mt-4">People with access</p>
        {map.sharedWith.length === 0 ? (
          <p className="mt-1 text-sm">Only you.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {map.sharedWith.map((e) => (
              <li key={e} className="flex items-center justify-between gap-2 text-sm">
                {e}
                <Button variant="ghost" className="px-2 py-0.5 text-sm" onClick={() => void remove(e)}>
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-5 text-right"><Button variant="primary" onClick={onClose}>Done</Button></div>
      </div>
    </div>
  );
}

export default function MyMaps() {
  const state = useAppState();
  const user = useSession();
  const [tab, setTab] = useState<'mine' | 'shared'>('mine');
  const [sharing, setSharing] = useState<string | null>(null);
  const load = useLoad(loadMyMaps, [user?.id]);

  if (!user) return null;
  if (load.status === 'loading') return <Loading label="Loading your maps…" />;
  if (load.status === 'error') return <LoadError message={load.error} />;
  const mine = state.maps.filter((m) => m.ownerId === user.id);
  // In API mode the server says which private maps are shared with me (it hides who else they are shared with).
  const shared = state.maps.filter((m) => m.ownerId !== user.id && (m.sharedWithMe || (m.visibility === 'private' && m.sharedWith.includes(user.email))));
  const shown = tab === 'mine' ? mine : shared;
  const sharingMap = state.maps.find((m) => m.id === sharing);
  const ownerOf = (m: MapData) => state.users.find((u) => u.id === m.ownerId)?.name ?? 'Unknown';

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Signed in as {user.username}</p>
          <h1 className="mt-1 text-5xl md:text-6xl">My Maps</h1>
        </div>
        <Link to="/maps/new"><Button variant="primary" className="text-xl">Create a map</Button></Link>
      </div>

      <div className="mt-6 flex gap-2" role="group" aria-label="Show">
        <Chip active={tab === 'mine'} onClick={() => setTab('mine')}>Mine ({mine.length})</Chip>
        <Chip active={tab === 'shared'} onClick={() => setTab('shared')}>Shared with me ({shared.length})</Chip>
      </div>

      {shown.length === 0 ? (
        <FieldCard className="mt-6 max-w-md">
          <h2 className="text-3xl">Nothing here yet</h2>
          <p className="mt-2">
            {tab === 'mine' ? 'Create your first map to start adding places.' : 'Private maps that other people share with you will show up here.'}
          </p>
        </FieldCard>
      ) : (
        <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((m) => (
            <li key={m.id}>
              <FieldCard className="flex h-full flex-col">
                <span className="label flex justify-between">
                  <span>{m.visibility === 'public' ? 'Public' : 'Private'}</span>
                  <span>Updated {m.updated}</span>
                </span>
                <Link to={`/map/${m.id}`} className="mt-2 font-display text-2xl leading-tight underline-offset-4 hover:underline">
                  {m.title}
                </Link>
                <span className="label mt-2 flex-1">
                  {placeCountOf(m)} places{tab === 'shared' ? ` · by ${ownerOf(m)}` : ''}
                </span>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link to={`/map/${m.id}`}><Button className="text-base">Open</Button></Link>
                  <Link to={`/map/${m.id}/add`}><Button className="text-base">Add a place</Button></Link>
                  {m.visibility === 'private' && m.ownerId === user.id && (
                    <Button variant="ghost" className="text-base" onClick={() => setSharing(m.id)}>
                      Share ({m.sharedWith.length})
                    </Button>
                  )}
                </div>
              </FieldCard>
            </li>
          ))}
        </ul>
      )}

      {sharingMap && <ShareDialog map={sharingMap} onClose={() => setSharing(null)} />}
    </div>
  );
}
