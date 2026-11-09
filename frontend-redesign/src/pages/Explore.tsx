import { useMemo, useState } from 'react';
import { Chip } from '../components/Chip';
import { Input } from '../components/Input';
import { MapCardLink } from '../components/MapCardLink';
import { LoadError, Loading } from '../components/PageState';
import { publicMaps, toCard } from '../store/helpers';
import { loadPublicMaps } from '../store/remote';
import { useLoad } from '../store/useLoad';
import { useAppState } from '../store/store';

type Sort = 'recent' | 'places';

const sorts: { id: Sort; label: string }[] = [
  { id: 'recent', label: 'Recently updated' },
  { id: 'places', label: 'Most places' },
];

export default function Explore() {
  const state = useAppState();
  const load = useLoad(loadPublicMaps, [], publicMaps(state).length > 0);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>('recent');

  const allMaps = useMemo(() => publicMaps(state).map((m) => toCard(state, m)), [state]);
  const categories = useMemo(() => [...new Set(allMaps.map((m) => m.category))].sort(), [allMaps]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allMaps
      .filter((m) => !category || m.category === category)
      .filter((m) => !q || `${m.title} ${m.blurb} ${m.category}`.toLowerCase().includes(q))
      .sort((a, b) => (sort === 'places' ? b.places - a.places : b.updated.localeCompare(a.updated)));
  }, [allMaps, query, category, sort]);

  if (load.status === 'loading') return <Loading label="Loading maps…" />;
  if (load.status === 'error' && allMaps.length === 0) return <LoadError message={load.error} />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-10">
      <p className="label">Public maps</p>
      <h1 className="mt-1 text-5xl md:text-6xl">Explore</h1>
      <p className="mt-2 max-w-xl">Public maps. Open one to see its places, or add to it.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <Input
          aria-label="Search maps"
          placeholder="Search maps by name or topic"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <label className="block">
          <span className="label mb-1 block">Sort by</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="w-full rounded-xl border-2 border-ink bg-cream px-3 py-2 text-[15px] focus:shadow-stamp md:w-52"
          >
            {sorts.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
        <Chip active={category === null} onClick={() => setCategory(null)}>All ({allMaps.length})</Chip>
        {categories.map((c) => (
          <Chip key={c} active={category === c} onClick={() => setCategory(category === c ? null : c)}>
            {c} ({allMaps.filter((m) => m.category === c).length})
          </Chip>
        ))}
      </div>

      <p className="label mt-6" role="status">
        {shown.length} {shown.length === 1 ? 'map' : 'maps'}
      </p>

      {shown.length === 0 ? (
        <div className="card mt-3 max-w-md p-6">
          <h2 className="text-3xl">No maps found</h2>
          <p className="mt-2">Nothing matches that search. Try a different word, or clear the filter.</p>
        </div>
      ) : (
        <ul className="mt-3 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((m) => (
            <li key={m.id}><MapCardLink map={m} /></li>
          ))}
        </ul>
      )}
    </div>
  );
}
