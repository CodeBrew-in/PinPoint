import React from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { MapCard } from '../components/maps/MapCard';
import { LocationCard } from '../components/locations/LocationCard';
import {
  MapPin,
  Compass,
  ArrowRight,
  CheckCircle2,
  Layers,
  Camera,
  Share2,
  Navigation,
} from 'lucide-react';

export const Home: React.FC = () => {
  const { maps, locations, navigateTo, isAuthenticated } = useApp();

  const featuredMaps = maps.slice(0, 3);
  const featuredLocations = locations.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#F7F5F0] dark:bg-[#15171A] flex flex-col text-left transition-colors">
      {/* Editorial Hero Header */}
      <section className="border-b border-[#D9D6CF] dark:border-[#2D333D] bg-white dark:bg-[#1A1D23] pt-12 pb-16 px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-[#C84B31] dark:bg-[#E26D54]" />
            <span className="text-xs font-mono uppercase tracking-widest text-[#68655F] dark:text-[#9C978D]">
              Location-Based Mapping & Discovery
            </span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#171717] dark:text-[#F0EDE6] tracking-tight leading-[1.08] max-w-3xl font-bold">
            Create custom maps, pin locations, and document your favorite places.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-[#68655F] dark:text-[#9C978D] max-w-2xl leading-relaxed">
            PinPoint is a map-first application for organizing places, saving coordinates, adding photos, and sharing public or private maps with ease.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              size="lg"
              icon={<Compass className="w-4 h-4" />}
              onClick={() => navigateTo('explore')}
            >
              Explore Maps
            </Button>

            <Button
              variant="secondary"
              size="lg"
              icon={<MapPin className="w-4 h-4" />}
              onClick={() => navigateTo(isAuthenticated ? 'map-workspace' : 'sign-up')}
            >
              Open Map Workspace
            </Button>

            <span className="text-xs font-mono text-[#68655F] dark:text-[#9C978D] ml-2 hidden sm:inline">
              Austin, TX (30.2672° N, 97.7431° W)
            </span>
          </div>
        </div>
      </section>

      {/* Philosophy / Core Capabilities Grid */}
      <section className="border-b border-[#D9D6CF] dark:border-[#2D333D] py-12 px-4 md:px-8 bg-[#F7F5F0] dark:bg-[#15171A]">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white dark:bg-[#1E2228] rounded-[6px] border border-[#D9D6CF] dark:border-[#2D333D]">
            <div className="w-8 h-8 rounded-[4px] bg-[#FAF0ED] dark:bg-[#341B18] text-[#C84B31] dark:text-[#E26D54] flex items-center justify-center mb-4">
              <MapPin className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-base text-[#171717] dark:text-[#F0EDE6] mb-2">
              Precise Pin Placement
            </h3>
            <p className="text-xs text-[#68655F] dark:text-[#9C978D] leading-relaxed">
              Capture exact latitude and longitude by clicking anywhere on the interactive map or using your device GPS.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-[#1E2228] rounded-[6px] border border-[#D9D6CF] dark:border-[#2D333D]">
            <div className="w-8 h-8 rounded-[4px] bg-[#FAF0ED] dark:bg-[#341B18] text-[#C84B31] dark:text-[#E26D54] flex items-center justify-center mb-4">
              <Camera className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-base text-[#171717] dark:text-[#F0EDE6] mb-2">
              Photos & Notes
            </h3>
            <p className="text-xs text-[#68655F] dark:text-[#9C978D] leading-relaxed">
              Attach photos, helpful descriptions, and relevant tags to every location you save for easy recall.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-[#1E2228] rounded-[6px] border border-[#D9D6CF] dark:border-[#2D333D]">
            <div className="w-8 h-8 rounded-[4px] bg-[#FAF0ED] dark:bg-[#341B18] text-[#C84B31] dark:text-[#E26D54] flex items-center justify-center mb-4">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-base text-[#171717] dark:text-[#F0EDE6] mb-2">
              Custom Maps
            </h3>
            <p className="text-xs text-[#68655F] dark:text-[#9C978D] leading-relaxed">
              Organize places into themed collections, keep them private for yourself or publish them publicly to share.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Maps Section */}
      <section className="py-14 px-4 md:px-8 border-b border-[#D9D6CF] dark:border-[#2D333D] bg-white dark:bg-[#1A1D23]">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-[#68655F] dark:text-[#9C978D]">
                Collections
              </span>
              <h2 className="font-serif text-3xl text-[#171717] dark:text-[#F0EDE6] mt-1 font-bold">
                Featured Maps
              </h2>
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={<ArrowRight className="w-3.5 h-3.5" />}
              onClick={() => navigateTo('explore')}
            >
              Browse All Maps
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredMaps.map((map) => (
              <MapCard
                key={map.id}
                map={map}
                onClick={() => navigateTo('public-map', { mapId: map.id })}
                onOpenWorkspace={() => navigateTo('map-workspace', { mapId: map.id })}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Recent Field Locations */}
      <section className="py-14 px-4 md:px-8 bg-[#F7F5F0] dark:bg-[#15171A] border-b border-[#D9D6CF] dark:border-[#2D333D]">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-[#68655F] dark:text-[#9C978D]">
                Discover
              </span>
              <h2 className="font-serif text-3xl text-[#171717] dark:text-[#F0EDE6] mt-1 font-bold">
                Recent Locations
              </h2>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigateTo('explore')}
            >
              Explore All Locations
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredLocations.map((loc) => (
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
      </section>

      {/* Restrained Footer */}
      <footer className="bg-white dark:bg-[#1A1D23] py-12 px-4 md:px-8 border-t border-[#D9D6CF] dark:border-[#2D333D]">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 bg-[#C84B31] dark:bg-[#E26D54] rounded-[4px] flex items-center justify-center text-white">
                <MapPin className="w-3 h-3 fill-white" />
              </div>
              <span className="font-serif text-lg font-bold text-[#171717] dark:text-[#F0EDE6]">PinPoint</span>
            </div>
            <p className="text-xs text-[#68655F] dark:text-[#9C978D]">
              A simple, map-first tool to create, discover, and organize places.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-[#68655F] dark:text-[#9C978D]">
            <button onClick={() => navigateTo('explore')} className="hover:text-[#171717] dark:hover:text-[#F0EDE6] cursor-pointer">
              Explore
            </button>
            <button onClick={() => navigateTo('pricing')} className="hover:text-[#171717] dark:hover:text-[#F0EDE6] cursor-pointer">
              Pricing
            </button>
            <button onClick={() => navigateTo('support')} className="hover:text-[#171717] dark:hover:text-[#F0EDE6] cursor-pointer">
              Documentation & Support
            </button>
            <button onClick={() => navigateTo('sign-in')} className="hover:text-[#171717] dark:hover:text-[#F0EDE6] cursor-pointer">
              Sign In
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
