import { useState } from 'react';
import { Button } from '../components/Button';
import { FieldCard } from '../components/FieldCard';
import { useSession } from '../components/Layout';
import { resolveReport } from '../store/api';
import { LoadError, Loading } from '../components/PageState';
import { loadReports } from '../store/remote';
import { useAppState } from '../store/store';
import { useLoad } from '../store/useLoad';

export default function ReviewQueue() {
  const state = useAppState();
  const user = useSession();
  const [error, setError] = useState('');
  const load = useLoad(() => (user?.role === 'moderator' ? loadReports() : Promise.resolve()), [user?.id]);

  if (user?.role !== 'moderator') {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-5xl">No access</h1>
        <p className="mt-3">Only moderators can see the review queue.</p>
      </div>
    );
  }

  if (load.status === 'loading') return <Loading label="Loading reports…" />;
  if (load.status === 'error') return <LoadError message={load.error} />;

  const open = state.reports.filter((r) => r.status === 'open');
  const done = state.reports.filter((r) => r.status !== 'open');

  const resolve = async (id: string, action: 'dismissed' | 'removed') => {
    try {
      await resolveReport(id, action);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not resolve.');
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-10">
      <p className="label">Moderators</p>
      <h1 className="mt-1 text-5xl md:text-6xl">Needs review</h1>
      <p className="mt-2 max-w-xl">Reports about places. A moderator decides; nothing is removed automatically.</p>
      <p className="label mt-6" role="status">{open.length} open</p>
      {error && <p role="alert" className="mt-2 text-sm font-bold text-danger">{error}</p>}

      {open.length === 0 ? (
        <FieldCard className="mt-3 max-w-md">
          <h2 className="text-3xl">All clear</h2>
          <p className="mt-2">Nothing needs review right now.</p>
        </FieldCard>
      ) : (
        <ul className="mt-3 flex flex-col gap-4">
          {open.map((r) => (
            <li key={r.id}>
              <FieldCard>
                <p className="label flex justify-between"><span>{r.kind}</span><span>{r.date}</span></p>
                <h2 className="mt-1 text-2xl">{r.placeName}</h2>
                <p className="label mt-1">{r.mapTitle} · reported by {r.by}</p>
                {r.note && <p className="mt-2">{r.note}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button className="text-base" onClick={() => resolve(r.id, 'dismissed')}>Dismiss</Button>
                  <Button variant="primary" className="text-base" onClick={() => resolve(r.id, 'removed')}>Remove place</Button>
                </div>
              </FieldCard>
            </li>
          ))}
        </ul>
      )}

      {done.length > 0 && (
        <>
          <h2 className="mt-10 text-3xl">Resolved</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {done.map((r) => (
              <li key={r.id}>{r.status === 'removed' ? 'Place removed' : 'Dismissed'}: {r.placeName} ({r.kind})</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
