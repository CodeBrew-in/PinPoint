import { useAuth } from '../auth/useAuth';

// Placeholder until the map page arrives in Sprint 2
export default function Home() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-3 text-4xl font-bold text-gray-900">
        {user ? `Welcome back, ${user.email}` : 'Welcome to PinPoint'}
      </h1>
      <p className="text-lg text-gray-600">A community-driven map for mapping local discoveries.</p>
    </div>
  );
}
