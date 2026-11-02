import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import {
  User,
  Settings,
  MapPin,
  Camera,
  CheckCircle2,
  Folder,
  Shield,
  Download,
  Save,
  Compass,
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, updateProfile, showToast, maps, locations } = useApp();

  const [name, setName] = useState(user?.name || '');
  const [handle, setHandle] = useState(user?.handle || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState(user?.location || '');
  const [units, setUnits] = useState<'metric' | 'imperial'>(user?.preferredUnits || 'metric');
  const [defaultLat, setDefaultLat] = useState(user?.defaultCoordinates?.[0]?.toString() || '30.3302');
  const [defaultLng, setDefaultLng] = useState(user?.defaultCoordinates?.[1]?.toString() || '76.4008');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name,
      handle,
      bio,
      location,
      preferredUnits: units,
      defaultCoordinates: [parseFloat(defaultLat) || 30.3302, parseFloat(defaultLng) || 76.4008],
    });
  };

  const handleExportFullArchive = () => {
    const fullArchive = {
      profile: user,
      maps,
      locations,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(fullArchive, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pinpoint_archive_${user?.handle.replace('@', '') || 'user'}.json`;
    link.click();
    showToast('Data exported (JSON)', 'success');
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] dark:bg-[#15171A] flex flex-col text-left transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-[#1A1D23] border-b border-[#D9D6CF] dark:border-[#2D333D] px-4 md:px-8 py-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-[#C84B31] dark:text-[#E26D54]" />
              <span className="text-xs font-mono uppercase tracking-widest text-[#68655F] dark:text-[#9C978D]">
                Profile & Settings
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#171717] dark:text-[#F0EDE6] font-bold">
              Account & Settings
            </h1>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={<Download className="w-3.5 h-3.5" />}
            onClick={handleExportFullArchive}
          >
            Export Data
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full p-4 md:p-8 space-y-8 flex-1">
        {/* Profile Card Summary */}
        <div className="bg-white dark:bg-[#1E2228] rounded-[6px] border border-[#D9D6CF] dark:border-[#2D333D] p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <img
            src={user?.avatar}
            alt={user?.name}
            className="w-20 h-20 rounded-[6px] object-cover border border-[#D9D6CF] dark:border-[#2D333D] bg-[#E9E6DE] dark:bg-[#242930]"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-serif text-2xl font-bold text-[#171717] dark:text-[#F0EDE6] truncate">
                {user?.name}
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-mono bg-[#FAF0ED] dark:bg-[#341B18]/80 text-[#C84B31] dark:text-[#E26D54] rounded-[3px] border border-[#E8BFB5] dark:border-[#52251F]">
                {user?.role}
              </span>
            </div>
            <p className="text-xs font-mono text-[#68655F] dark:text-[#9C978D]">{user?.handle}</p>
            <p className="text-xs text-[#68655F] dark:text-[#9C978D] mt-2 max-w-xl leading-relaxed">
              {user?.bio}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 shrink-0 text-center font-mono text-xs border-l border-[#D9D6CF] dark:border-[#2D333D] pl-6 hidden sm:grid">
            <div className="p-2 bg-[#F7F5F0] dark:bg-[#15171A] rounded-[4px] border border-[#D9D6CF] dark:border-[#2D333D]">
              <span className="text-base font-bold text-[#171717] dark:text-[#F0EDE6] block">
                {user?.stats.mapsCreated}
              </span>
              <span className="text-[10px] text-[#68655F] dark:text-[#9C978D]">Maps</span>
            </div>
            <div className="p-2 bg-[#F7F5F0] dark:bg-[#15171A] rounded-[4px] border border-[#D9D6CF] dark:border-[#2D333D]">
              <span className="text-base font-bold text-[#171717] dark:text-[#F0EDE6] block">
                {user?.stats.locationsPinned}
              </span>
              <span className="text-[10px] text-[#68655F] dark:text-[#9C978D]">Pins</span>
            </div>
          </div>
        </div>

        {/* Profile Settings Form */}
        <form onSubmit={handleSave} className="bg-white dark:bg-[#1E2228] rounded-[6px] border border-[#D9D6CF] dark:border-[#2D333D] p-6 space-y-6">
          <div className="border-b border-[#D9D6CF] dark:border-[#2D333D] pb-3">
            <h3 className="font-serif text-xl text-[#171717] dark:text-[#F0EDE6]">Identity & Bio</h3>
            <p className="text-xs text-[#68655F] dark:text-[#9C978D] mt-0.5">
              Information displayed on your public maps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Display Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Public Handle *"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              required
            />
            <Input
              label="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Patiala, Punjab"
            />
            <Input
              label="Account Email"
              value={user?.email}
              disabled
              helperText="Managed by account security"
            />
          </div>

          <Textarea
            label="Bio"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />

          {/* Map Preferences */}
          <div className="border-t border-[#D9D6CF] dark:border-[#2D333D] pt-6 space-y-4">
            <div>
              <h3 className="font-serif text-xl text-[#171717] dark:text-[#F0EDE6]">
                Map Defaults
              </h3>
              <p className="text-xs text-[#68655F] dark:text-[#9C978D] mt-0.5">
                Default location and measurement units.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-medium text-[#171717] dark:text-[#F0EDE6]">
                  Elevation & Distance Units
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUnits('metric')}
                    className={`px-3 py-2 text-xs rounded-[4px] border font-mono transition-colors cursor-pointer ${
                      units === 'metric'
                        ? 'bg-[#171717] dark:bg-[#E26D54] text-white border-[#171717] dark:border-[#E26D54] font-semibold'
                        : 'bg-white dark:bg-[#1A1D23] text-[#171717] dark:text-[#F0EDE6] border-[#D9D6CF] dark:border-[#2D333D] hover:bg-[#F7F5F0] dark:hover:bg-[#242930]'
                    }`}
                  >
                    Metric (m / km)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnits('imperial')}
                    className={`px-3 py-2 text-xs rounded-[4px] border font-mono transition-colors cursor-pointer ${
                      units === 'imperial'
                        ? 'bg-[#171717] dark:bg-[#E26D54] text-white border-[#171717] dark:border-[#E26D54] font-semibold'
                        : 'bg-white dark:bg-[#1A1D23] text-[#171717] dark:text-[#F0EDE6] border-[#D9D6CF] dark:border-[#2D333D] hover:bg-[#F7F5F0] dark:hover:bg-[#242930]'
                    }`}
                  >
                    Imperial (ft / mi)
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-medium text-[#171717] dark:text-[#F0EDE6]">
                  Default Map Center (Lat / Lng)
                </label>
                <div className="grid grid-cols-2 gap-2 font-mono">
                  <Input
                    value={defaultLat}
                    onChange={(e) => setDefaultLat(e.target.value)}
                    placeholder="30.3302"
                  />
                  <Input
                    value={defaultLng}
                    onChange={(e) => setDefaultLng(e.target.value)}
                    placeholder="76.4008"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#D9D6CF] dark:border-[#2D333D] flex items-center justify-end">
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={<Save className="w-3.5 h-3.5" />}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
