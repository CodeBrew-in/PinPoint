import React from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { MapCard } from '../components/maps/MapCard';
import { LocationCard } from '../components/locations/LocationCard';
import {
  MapPin,
  Folder,
  Camera,
  CheckCircle2,
  Plus,
  Compass,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user, maps, locations, navigateTo } = useApp();

  const userMaps = maps.filter((m) => m.author.id === user?.id);
  const recentLocations = locations.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#F7F5F0] dark:bg-[#15171A] flex flex-col text-left transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-[#1A1D23] border-b border-[#D9D6CF] dark:border-[#2D333D] px-4 md:px-8 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#3F6B4A] dark:bg-[#529E68]" />
              <span className="text-xs font-mono uppercase tracking-widest text-[#68655F] dark:text-[#9C978D]">
                Dashboard
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#171717] dark:text-[#F0EDE6] font-bold">
              Welcome back, {user?.name}
            </h1>
            <p className="text-xs text-[#68655F] dark:text-[#9C978D] mt-1 font-mono">
              {user?.location} • {user?.email}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              icon={<Folder className="w-3.5 h-3.5" />}
              onClick={() => navigateTo('create-map')}
            >
              Create a Map
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<MapPin className="w-3.5 h-3.5" />}
              onClick={() => navigateTo('map-workspace')}
            >
              Open Map Workspace
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="max-w-6xl mx-auto w-full px-4 md:px-8 pt-8 pb-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#1E2228] p-4 rounded-[6px] border border-[#D9D6CF] dark:border-[#2D333D]">
            <span className="text-[11px] font-mono text-[#68655F] dark:text-[#9C978D] uppercase tracking-wider block">
              Maps Created
            </span>
            <span className="font-serif text-3xl font-bold text-[#171717] dark:text-[#F0EDE6] mt-1 block">
              {user?.stats.mapsCreated || userMaps.length}
            </span>
            <span className="text-[10px] text-[#3F6B4A] dark:text-[#529E68] font-medium mt-2 block">
              Personal & shared maps
            </span>
          </div>

          <div className="bg-white dark:bg-[#1E2228] p-4 rounded-[6px] border border-[#D9D6CF] dark:border-[#2D333D]">
            <span className="text-[11px] font-mono text-[#68655F] dark:text-[#9C978D] uppercase tracking-wider block">
              Locations Pinned
            </span>
            <span className="font-serif text-3xl font-bold text-[#171717] dark:text-[#F0EDE6] mt-1 block">
              {user?.stats.locationsPinned || locations.length}
            </span>
            <span className="text-[10px] text-[#68655F] dark:text-[#9C978D] mt-2 block">
              Across your maps
            </span>
          </div>

          <div className="bg-white dark:bg-[#1E2228] p-4 rounded-[6px] border border-[#D9D6CF] dark:border-[#2D333D]">
            <span className="text-[11px] font-mono text-[#68655F] dark:text-[#9C978D] uppercase tracking-wider block">
              Photos Added
            </span>
            <span className="font-serif text-3xl font-bold text-[#171717] dark:text-[#F0EDE6] mt-1 block">
              {user?.stats.photosAttached || 64}
            </span>
            <span className="text-[10px] text-[#68655F] dark:text-[#9C978D] mt-2 block">
              Attached to places
            </span>
          </div>

          <div className="bg-white dark:bg-[#1E2228] p-4 rounded-[6px] border border-[#D9D6CF] dark:border-[#2D333D]">
            <span className="text-[11px] font-mono text-[#68655F] dark:text-[#9C978D] uppercase tracking-wider block">
              Saved Locations
            </span>
            <span className="font-serif text-3xl font-bold text-[#171717] dark:text-[#F0EDE6] mt-1 block">
              {locations.length}
            </span>
            <span className="text-[10px] text-[#3F6B4A] dark:text-[#529E68] font-medium mt-2 block">
              Ready to explore
            </span>
          </div>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="max-w-6xl mx-auto w-full p-4 md:p-8 space-y-10 flex-1">
        {/* Active Collections */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-serif text-2xl text-[#171717] dark:text-[#F0EDE6] font-bold">
                Your Maps
              </h2>
              <p className="text-xs text-[#68655F] dark:text-[#9C978D]">
                Open any map to view pins, add locations, or edit details.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateTo('my-maps')}
            >
              View All Maps ({userMaps.length})
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {userMaps.map((map) => (
              <MapCard
                key={map.id}
                map={map}
                onClick={() => navigateTo('map-workspace', { mapId: map.id })}
                onOpenWorkspace={() =>
                  navigateTo('map-workspace', { mapId: map.id })
                }
              />
            ))}
          </div>
        </div>

        {/* Recently Pinned Locations */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-serif text-2xl text-[#171717] dark:text-[#F0EDE6] font-bold">
                Recent Field Submissions
              </h2>
              <p className="text-xs text-[#68655F] dark:text-[#9C978D]">
                Latest physical places logged with photographic proof.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5 stroke-[2.5]" />}
              onClick={() => navigateTo('add-location')}
            >
              Add New Place
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {recentLocations.map((loc) => (
              <LocationCard
                key={loc.id}
                location={loc}
                onClick={() =>
                  navigateTo('location-details', {
                    mapId: loc.mapId,
                    locationId: loc.id,
                  })
                }
                onViewDetails={() =>
                  navigateTo('location-details', {
                    mapId: loc.mapId,
                    locationId: loc.id,
                  })
                }
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
