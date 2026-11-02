import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { FieldCard } from '../components/FieldCard';
import { Input } from '../components/Input';
import { useSession } from '../components/Layout';
import { PasswordField } from '../components/PasswordField';
import { changePassword, updateProfile } from '../store/api';
import { resetDemoData } from '../store/store';

export default function Profile() {
  const user = useSession();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:px-10">
      <h1 className="text-5xl">Profile</h1>
      <p className="label mt-1">@{user.username} · {user.role}</p>

      <form
        className="mt-6 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          try {
            updateProfile({ name, email, bio });
            setProfileMsg({ ok: true, text: 'Saved.' });
          } catch (err) {
            setProfileMsg({ ok: false, text: err instanceof Error ? err.message : 'Could not save.' });
          }
        }}
      >
        <FieldCard className="flex flex-col gap-4">
          <h2 className="text-2xl">Your details</h2>
          <Input label="Name" value={name} onChange={(e) => { setName(e.target.value); setProfileMsg(null); }} />
          <Input label="Email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setProfileMsg(null); }} />
          <label className="block">
            <span className="label mb-1 block">About you</span>
            <textarea
              rows={3}
              maxLength={180}
              value={bio}
              onChange={(e) => { setBio(e.target.value); setProfileMsg(null); }}
              className="w-full rounded-xl border-2 border-ink bg-cream px-3 py-2 text-[15px] focus:shadow-stamp"
            />
            <span className="label mt-1 block text-right">{bio.length} / 180</span>
          </label>
          <div className="flex items-center gap-3">
            <Button type="submit" variant="primary">Save changes</Button>
            {profileMsg && (
              <span role={profileMsg.ok ? 'status' : 'alert'} className={`text-sm font-bold ${profileMsg.ok ? '' : 'text-danger'}`}>{profileMsg.text}</span>
            )}
          </div>
        </FieldCard>
      </form>

      <form
        className="mt-6"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await changePassword(current, next);
            setPwMsg({ ok: true, text: 'Password changed.' });
            setCurrent('');
            setNext('');
          } catch (err) {
            setPwMsg({ ok: false, text: err instanceof Error ? err.message : 'Could not change the password.' });
          }
        }}
      >
        <FieldCard className="flex flex-col gap-4">
          <h2 className="text-2xl">Change password</h2>
          <Input label="Current password" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
          <PasswordField
            label="New password"
            autoComplete="new-password"
            value={next}
            onChange={setNext}
            showRules
            context={{ username: user.username, email: user.email }}
          />
          {pwMsg && <p role={pwMsg.ok ? 'status' : 'alert'} className={`text-sm font-bold ${pwMsg.ok ? '' : 'text-danger'}`}>{pwMsg.text}</p>}
          <div><Button type="submit">Change password</Button></div>
        </FieldCard>
      </form>

      <div className="mt-10 border-t-2 border-ink pt-4">
        <p className="label">Demo data</p>
        <p className="mt-1 text-sm">Everything is saved only in this browser. Resetting restores the sample maps and signs you out.</p>
        <Button
          variant="ghost"
          className="mt-2 text-base"
          onClick={() => {
            if (window.confirm('Reset all demo data? Your maps, places and accounts in this browser will be deleted.')) {
              resetDemoData();
              navigate('/');
            }
          }}
        >
          Reset demo data
        </Button>
      </div>
    </div>
  );
}
