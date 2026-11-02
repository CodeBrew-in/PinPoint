import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { createMap } from '../store/api';
import { useAppState } from '../store/store';
import type { Visibility } from '../store/types';

const BASE_CATEGORIES = ['Architecture', 'Art', 'Heritage', 'Nature', 'Street food', 'Other'];

export default function CreateMap() {
  const navigate = useNavigate();
  const state = useAppState();
  const categories = useMemo(() => [...new Set([...BASE_CATEGORIES, ...state.maps.map((m) => m.category)])].sort(), [state.maps]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [error, setError] = useState('');

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:px-10">
      <Link to="/my-maps" className="label underline underline-offset-4">← Back to My Maps</Link>
      <h1 className="mt-2 text-5xl">Create a map</h1>
      <p className="mt-2">Give it a theme. You can add places right after.</p>

      <form
        className="mt-6 flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          try {
            const id = createMap({ title, description, category, visibility });
            navigate(`/map/${id}`);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not create the map.');
          }
        }}
      >
        <div>
          <Input label="Map name" maxLength={72} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Old post boxes of London" />
          <p className="label mt-1 text-right">{title.length} / 72</p>
        </div>

        <label className="block">
          <span className="label mb-1 block">Description</span>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What kind of places belong on this map?"
            className="w-full rounded-xl border-2 border-ink bg-cream px-3 py-2 text-[15px] placeholder:text-ink/50 focus:shadow-stamp"
          />
        </label>

        <label className="block">
          <span className="label mb-1 block">Category</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-xl border-2 border-ink bg-cream px-3 py-2 text-[15px] focus:shadow-stamp">
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>

        <fieldset>
          <legend className="label mb-2">Who can see it?</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {([
              ['public', 'Public', 'Anyone signed in can find it and add places. Places are checked for duplicates and tagged from a suggested list.'],
              ['private', 'Private', 'Only you, and people you invite. Custom tags. Never shown in search.'],
            ] as const).map(([v, name, text]) => (
              <label key={v} className={`card flex cursor-pointer gap-3 p-3 ${visibility === v ? '!bg-white' : ''}`}>
                <input type="radio" name="visibility" className="mt-1 h-4 w-4 accent-ink" checked={visibility === v} onChange={() => setVisibility(v)} />
                <span>
                  <span className="block font-display text-xl">{name}</span>
                  <span className="block text-sm">{text}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {error && <p role="alert" className="text-sm font-bold text-danger">{error}</p>}
        <div className="flex gap-3">
          <Button type="submit" variant="primary">Create map</Button>
          <Link to="/my-maps"><Button type="button">Cancel</Button></Link>
        </div>
      </form>
    </div>
  );
}
