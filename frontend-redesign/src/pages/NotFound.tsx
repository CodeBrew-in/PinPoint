import { Link } from 'react-router-dom';
import { Button } from '../components/Button';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <p className="label">Error 404</p>
      <h1 className="mt-2 text-6xl">Not found</h1>
      <p className="mt-3 text-lg">We could not find that page, map or place. It may have been removed or made private.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link to="/"><Button variant="primary">Go home</Button></Link>
        <Link to="/explore"><Button>Explore maps</Button></Link>
      </div>
    </div>
  );
}
