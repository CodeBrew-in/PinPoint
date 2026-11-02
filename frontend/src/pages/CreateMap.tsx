import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Category } from '../types';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import {
  Folder,
  ArrowLeft,
  Globe,
  Lock,
  Compass,
  Navigation,
  Image as ImageIcon,
} from 'lucide-react';

const CATEGORIES: Category[] = [
  'Photography',
  'Nature & Trails',
  'Street Art',
  'Historic',
  'Urban Exploration',
  'Food & Drinks',
];

const SAMPLE_COVERS = [
  {
    name: 'Industrial Architecture',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Limestone Trails',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Urban Murals',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'River Basin Landscape',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
  },
];

export const CreateMap: React.FC = () => {
  const { addMap, navigateTo, showToast, requestUserLocation } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Photography');
  const [coverImage, setCoverImage] = useState(SAMPLE_COVERS[0].url);
  const [lat, setLat] = useState('30.3302');
  const [lng, setLng] = useState('76.4008');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Please enter a map title.', 'alert');
      return;
    }

    const newMapId = addMap({
      title: title.trim(),
      description: description.trim(),
      category,
      isPublic: false,
      coverImage,
      center: [parseFloat(lat) || 30.3302, parseFloat(lng) || 76.4008],
      zoom: 13,
    });

    navigateTo('map-workspace', { mapId: newMapId });
  };

  const handleDetectLocation = async () => {
    const coords = await requestUserLocation();
    if (coords) {
      setLat(coords.lat.toString());
      setLng(coords.lng.toString());
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] dark:bg-[#15171A] flex flex-col text-left transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-[#1A1D23] border-b border-[#D9D6CF] dark:border-[#2D333D] px-4 md:px-8 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigateTo('my-maps')}
            className="text-xs text-[#68655F] dark:text-[#9C978D] hover:text-[#171717] dark:hover:text-[#F0EDE6] flex items-center gap-1.5 font-medium cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to My Maps
          </button>
          <span className="text-xs font-mono text-[#68655F] dark:text-[#9C978D]">New Map</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto w-full p-4 md:p-8 flex-1">
        <div className="bg-white dark:bg-[#1E2228] rounded-[8px] border border-[#D9D6CF] dark:border-[#2D333D] p-6 sm:p-8 shadow-xs">
          <div className="mb-6 pb-4 border-b border-[#D9D6CF] dark:border-[#2D333D]">
            <div className="flex items-center gap-2 mb-1">
              <Folder className="w-4 h-4 text-[#C84B31] dark:text-[#E26D54]" />
              <span className="text-xs font-mono uppercase tracking-widest text-[#68655F] dark:text-[#9C978D]">
                New Map
              </span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-[#171717] dark:text-[#F0EDE6]">
              Create a Map
            </h1>
            <p className="text-xs text-[#68655F] dark:text-[#9C978D] mt-1">
              Add a title, category, and initial location to start organizing places.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title & Category */}
            <div className="space-y-4">
              <Input
                label="Map Title *"
                placeholder="e.g. Historic Granite Quarries"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#171717] dark:text-[#F0EDE6]">
                  Primary Category *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-2 text-xs text-left rounded-[6px] border transition-colors cursor-pointer ${
                        category === cat
                          ? 'bg-[#171717] dark:bg-[#E26D54] text-white border-[#171717] dark:border-[#E26D54] font-semibold'
                          : 'bg-white dark:bg-[#1A1D23] text-[#171717] dark:text-[#F0EDE6] border-[#D9D6CF] dark:border-[#2D333D] hover:bg-[#F7F5F0] dark:hover:bg-[#242930]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <Textarea
                label="Description *"
                rows={3}
                placeholder="Describe what kind of locations belong on this map..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            {/* Workspace Privacy Notice */}
            <div className="p-4 bg-[#FAF0ED] dark:bg-[#341B18]/40 rounded-[6px] border border-[#E8BFB5]/60 dark:border-[#52251F] flex items-start gap-3">
              <Lock className="w-4 h-4 text-[#C84B31] dark:text-[#E26D54] shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-[#171717] dark:text-[#F0EDE6] block">
                  Private Workspace
                </span>
                <span className="text-[11px] text-[#68655F] dark:text-[#9C978D] leading-relaxed block mt-0.5">
                  This creates your personal, private map workspace. All locations added here remain exclusively yours.
                  To share places with the world, you can contribute locations directly to <strong>The Public Map</strong> at any time.
                </span>
              </div>
            </div>

            {/* Starting Coordinates */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-[#171717] dark:text-[#F0EDE6]">
                  Center Coordinates
                </label>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  className="text-xs text-[#C84B31] dark:text-[#E26D54] hover:text-[#963723] dark:hover:text-[#F0EDE6] flex items-center gap-1 font-medium cursor-pointer"
                >
                  <Navigation className="w-3 h-3" /> Use Current Location
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <Input
                  label="Latitude"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="30.3302"
                  required
                />
                <Input
                  label="Longitude"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="76.4008"
                  required
                />
              </div>
            </div>

            {/* Cover Imagery */}
            <div>
              <label className="text-xs font-medium text-[#171717] dark:text-[#F0EDE6] block mb-2">
                Cover Photo
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {SAMPLE_COVERS.map((cov) => (
                  <div
                    key={cov.url}
                    onClick={() => setCoverImage(cov.url)}
                    className={`group relative h-20 rounded-[4px] overflow-hidden border cursor-pointer ${
                      coverImage === cov.url
                        ? 'border-[#C84B31] dark:border-[#E26D54] ring-2 ring-[#C84B31] dark:ring-[#E26D54]'
                        : 'border-[#D9D6CF] dark:border-[#2D333D] opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img src={cov.url} alt={cov.name} className="w-full h-full object-cover" />
                    <span className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[9px] px-1 py-0.5 truncate text-center">
                      {cov.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit buttons */}
            <div className="pt-4 border-t border-[#D9D6CF] dark:border-[#2D333D] flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigateTo('my-maps')}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md">
                Create Map
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
