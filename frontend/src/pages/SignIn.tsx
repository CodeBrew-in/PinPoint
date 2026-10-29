import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../auth/useAuth';
import { getErrorMessage } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { MapPin, ArrowRight } from 'lucide-react';

export const SignIn: React.FC = () => {
  const { navigateTo, showToast } = useApp();
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Where to go after logging in: the page the user wanted, else the dashboard
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  useEffect(() => {
    if (auth.status === 'authenticated') navigate(from, { replace: true });
  }, [auth.status, from, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await auth.login(email, password);
      showToast('Signed in to PinPoint', 'success');
    } catch (err) {
      showToast(getErrorMessage(err, 'Could not sign in. Please try again.'), 'alert');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] dark:bg-[#15171A] flex items-center justify-center p-4 text-left transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-[#1E2228] rounded-[8px] border border-[#D9D6CF] dark:border-[#2D333D] shadow-xs p-8">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-9 h-9 bg-[#C84B31] dark:bg-[#E26D54] rounded-[6px] flex items-center justify-center text-white mx-auto mb-3 shadow-xs">
            <MapPin className="w-5 h-5 fill-white text-[#C84B31] dark:text-[#E26D54]" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#171717] dark:text-[#F0EDE6]">
            Sign in to PinPoint
          </h1>
          <p className="text-xs text-[#68655F] dark:text-[#9C978D] mt-1">
            Access your spatial field archives and private map workspaces.
          </p>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-[#68655F] dark:text-[#9C978D]">
              <input
                type="checkbox"
                defaultChecked
                className="rounded-[3px] text-[#C84B31] dark:text-[#E26D54] focus:ring-[#C84B31]"
              />
              Remember session
            </label>

            <button
              type="button"
              className="text-[#68655F] dark:text-[#9C978D] hover:text-[#171717] dark:hover:text-[#F0EDE6] underline underline-offset-2 cursor-pointer"
            >
              Forgot password?
            </button>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="secondary"
              size="md"
              className="w-full justify-center"
              disabled={submitting}
              icon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              {submitting ? 'Signing in…' : 'Sign In with Email'}
            </Button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-[#D9D6CF] dark:border-[#2D333D] text-center text-xs text-[#68655F] dark:text-[#9C978D]">
          Don't have an account yet?{' '}
          <button
            onClick={() => navigateTo('sign-up')}
            className="text-[#171717] dark:text-[#F0EDE6] font-semibold hover:text-[#C84B31] dark:hover:text-[#E26D54] transition-colors cursor-pointer"
          >
            Create an Account →
          </button>
        </div>
      </div>
    </div>
  );
};
