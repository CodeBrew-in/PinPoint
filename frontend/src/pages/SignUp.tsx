import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../auth/useAuth';
import api, { getErrorMessage } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { MapPin, ArrowRight, Check } from 'lucide-react';

export const SignUp: React.FC = () => {
  const { navigateTo, showToast, saveProfileDetails } = useApp();
  const auth = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      showToast('Please fill out your name and email.', 'alert');
      return;
    }
    if (password.length < 8) {
      showToast('Password must be at least 8 characters.', 'alert');
      return;
    }
    setSubmitting(true);
    try {
      const created = await api.post('/auth/signup', { email, password });
      // The backend only stores email and password for now, so name and handle stay in this browser.
      // Save them before logging in, so the profile is already there when the app loads the user.
      saveProfileDetails(
        { name, handle: handle || `@${name.toLowerCase().replace(/\s+/g, '')}` },
        created.data.id,
      );
      await auth.login(email, password);
      showToast(`Welcome to PinPoint, ${name}!`, 'success');
      navigateTo('dashboard');
    } catch (err) {
      showToast(getErrorMessage(err, 'Could not create the account. Please try again.'), 'alert');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] dark:bg-[#15171A] flex items-center justify-center p-4 text-left transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-[#1E2228] rounded-[8px] border border-[#D9D6CF] dark:border-[#2D333D] shadow-xs p-8">
        <div className="text-center mb-6">
          <div className="w-9 h-9 bg-[#C84B31] dark:bg-[#E26D54] rounded-[6px] flex items-center justify-center text-white mx-auto mb-3 shadow-xs">
            <MapPin className="w-5 h-5 fill-white text-[#C84B31] dark:text-[#E26D54]" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#171717] dark:text-[#F0EDE6]">
            Join PinPoint
          </h1>
          <p className="text-xs text-[#68655F] dark:text-[#9C978D] mt-1">
            Create an account to start mapping, saving pins, and publishing collections.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name *"
            placeholder="Your full name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!handle) {
                setHandle('@' + e.target.value.toLowerCase().replace(/\s+/g, ''));
              }
            }}
            required
          />

          <Input
            label="Public Handle *"
            placeholder="@yourhandle"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            helperText="Used for attribution on public locations and maps"
            required
          />

          <Input
            label="Email Address *"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Create Password *"
            type="password"
            placeholder="Minimum 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="p-3 bg-[#F7F5F0] dark:bg-[#15171A] rounded-[6px] border border-[#D9D6CF] dark:border-[#2D333D] space-y-1.5 text-[11px] text-[#68655F] dark:text-[#9C978D]">
            <div className="flex items-center gap-1.5 text-[#171717] dark:text-[#F0EDE6]">
              <Check className="w-3 h-3 text-[#3F6B4A] dark:text-[#529E68]" />
              <span>Full free tier access: unlimited public maps</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#171717] dark:text-[#F0EDE6]">
              <Check className="w-3 h-3 text-[#3F6B4A] dark:text-[#529E68]" />
              <span>Unrestricted GeoJSON export</span>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full justify-center"
              icon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Create Account & Enter Workspace
            </Button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-[#D9D6CF] dark:border-[#2D333D] text-center text-xs text-[#68655F] dark:text-[#9C978D]">
          Already have an account?{' '}
          <button
            onClick={() => navigateTo('sign-in')}
            className="text-[#171717] dark:text-[#F0EDE6] font-semibold hover:text-[#C84B31] dark:hover:text-[#E26D54] transition-colors cursor-pointer"
          >
            Sign In →
          </button>
        </div>
      </div>
    </div>
  );
};
