import { useAuth } from '../auth/useAuth';

export default function Account() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Your account</h1>
      <dl className="max-w-md space-y-3 rounded-lg bg-white p-6 shadow-sm">
        <div>
          <dt className="text-sm text-gray-500">Email</dt>
          <dd className="font-medium text-gray-900">{user.email}</dd>
        </div>
        {user.created_at && (
          <div>
            <dt className="text-sm text-gray-500">Member since</dt>
            <dd className="font-medium text-gray-900">
              {new Date(user.created_at).toLocaleDateString()}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}
