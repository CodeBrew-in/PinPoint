import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteMap } from '../store/api';
import type { MapData } from '../store/types';
import { Button } from './Button';
import { useSession } from './Layout';

/** Shown to the owner of a map only. Deleting removes every place on it, also places other people added. */
export function DeleteMapButton({ map }: { map: MapData }) {
  const user = useSession();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  if (!user || map.ownerId !== user.id) return null;

  return (
    <div>
      <Button
        variant="ghost"
        className="text-base text-danger"
        onClick={async () => {
          if (!window.confirm(`Delete the map "${map.title}" with all its places and photos? This cannot be undone.`)) return;
          try {
            await deleteMap(map.id);
            navigate('/my-maps');
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not delete the map.');
          }
        }}
      >
        Delete map
      </Button>
      {error && <p role="alert" className="mt-1 text-sm font-bold text-danger">{error}</p>}
    </div>
  );
}
