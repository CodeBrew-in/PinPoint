import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Category, PUBLIC_MAP_ID } from '../types';
import { LocationCard } from '../components/locations/LocationCard';
import { LeafletMap } from '../components/map/LeafletMap';
import { Button } from '../components/ui/Button';
import {
  Globe,
  Search,
  Grid,
  Map as MapIcon,
  Plus,
  Layers,
  MapPin,
} from 'lucide-react';

const CATEGORIES: (Category | 'All')[] = [
  'All',
  'Photography',
  'Nature & Trails',
  'Street Art',
  'Historic',
  'Urban Exploration',
  'Food & Drinks',
];

export const Explore: React.FC = () => {
  const {
    locations,
    navigateTo,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
  } = useApp();

  const [viewTab, setViewTab] = useState<'map-view' | 'locations'>('map-view');

  // Filter public locations (all locations with isPublic: true or matching PUBLIC_MAP_ID)
  const publicLocations = locations.filter((l) => l.isPublic !== false);

  const filteredLocations = publicLocations.filter((loc) => {
    const matchesCategory =
      selectedCategory === 'All' || loc.category === selectedCategory;
    const matchesSearch =
      loc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (loc.tags ?? []).some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#F7F5F0] dark:bg-[#15171A] flex flex-col text-left transition-colors">
      {/* Page Header */}
      <div className="bg-white dark:bg-[#1A1D23] border-b border-[#D9D6CF] dark:border-[#2D333D] px-4 md:px-8 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Globe className="w-4 h-4 text-[#3F6B4A] dark:text-[#529E68]" />
                <span className="text-xs font-mono uppercase tracking-widest text-[#68655F] dark:text-[#9C978D]">
                  Global Community Map
                </span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl text-[#171717] dark:text-[#F0EDE6] font-bold">
                The Public Map
              </h1>
              <p className="text-xs sm:text-sm text-[#68655F] dark:text-[#9C978D] mt-1.5 max-w-2xl leading-relaxed">
                The shared global map of geographic discoveries contributed by explorers worldwide. Everyone contributes to this same public map.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                size="md"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => navigateTo('add-location', { mapId: PUBLIC_MAP_ID })}
              >
                Add to Public Map
              </Button>
            </div>
          </div>

          {/* Search and Filter Row */}
          <div className="mt-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-4 border-t border-[#D9D6CF] dark:border-[#2D333D]">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#68655F] dark:text-[#9C978D] absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search The Public Map by title, tag, or keyword..."
                className="w-full h-9 pl-9 pr-3 text-xs bg-[#F7F5F0] dark:bg-[#242930] text-[#171717] dark:text-[#F0EDE6] placeholder:text-[#68655F]/70 dark:placeholder:text-[#9C978D]/70 rounded-[6px] border border-[#D9D6CF] dark:border-[#2D333D] focus:bg-white dark:focus:bg-[#242930] focus:outline-none focus:border-[#171717] dark:focus:border-[#E26D54]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-xs text-[#68655F] dark:text-[#9C978D] hover:text-[#171717] dark:hover:text-[#F0EDE6] cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#F7F5F0] dark:bg-[#242930] p-1 rounded-[6px] border border-[#D9D6CF] dark:border-[#2D333D] self-start md:self-auto">
              <button
                onClick={() => setViewTab('map-view')}
                className={`px-3 py-1 text-xs font-medium rounded-[4px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                  viewTab === 'map-view'
                    ? 'bg-white dark:bg-[#1E2228] text-[#171717] dark:text-[#F0EDE6] shadow-xs font-semibold'
                    : 'text-[#68655F] dark:text-[#9C978D] hover:text-[#171717] dark:hover:text-[#F0EDE6]'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                Live Map ({filteredLocations.length})
              </button>
              <button
                onClick={() => setViewTab('locations')}
                className={`px-3 py-1 text-xs font-medium rounded-[4px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                  viewTab === 'locations'
                    ? 'bg-white dark:bg-[#1E2228] text-[#171717] dark:text-[#F0EDE6] shadow-xs font-semibold'
                    : 'text-[#68655F] dark:text-[#9C978D] hover:text-[#171717] dark:hover:text-[#F0EDE6]'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                Directory List
              </button>
            </div>
          </div>

          {/* Category Chips */}
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 text-xs rounded-[4px] border transition-colors whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#171717] dark:bg-[#E26D54] text-white border-[#171717] dark:border-[#E26D54] font-medium'
                    : 'bg-white dark:bg-[#1E2228] text-[#68655F] dark:text-[#9C978D] border-[#D9D6CF] dark:border-[#2D333D] hover:text-[#171717] dark:hover:text-[#F0EDE6]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-6xl mx-auto w-full p-4 md:p-8 flex-1">
        {viewTab === 'map-view' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-[#1E2228] rounded-[8px] border border-[#D9D6CF] dark:border-[#2D333D] overflow-hidden h-[620px] shadow-xs">
              <LeafletMap
                locations={filteredLocations}
                onSelectLocation={(id) => {
                  const found = locations.find((l) => l.id === id);
                  if (found) {
                    navigateTo('location-details', {
                      mapId: found.mapId,
                      locationId: found.id,
                    });
                  }
                }}
                center={[30.3302, 76.4008]}
                zoom={13}
                height="100%"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-[#68655F] dark:text-[#9C978D] px-1 font-mono">
              <span>Showing {filteredLocations.length} locations on The Public Map</span>
              <span>Click any marker to inspect location details</span>
            </div>
          </div>
        )}

        {viewTab === 'locations' && (
          <div>
            {filteredLocations.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-[#1E2228] rounded-[6px] border border-[#D9D6CF] dark:border-[#2D333D]">
                <MapPin className="w-8 h-8 text-[#68655F]/40 dark:text-[#9C978D]/40 mx-auto mb-2" />
                <h3 className="font-serif text-xl text-[#171717] dark:text-[#F0EDE6]">No locations found</h3>
                <p className="text-xs text-[#68655F] dark:text-[#9C978D] mt-1">
                  Try adjusting your query or exploring other categories.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLocations.map((loc) => (
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
            )}
          </div>
        )}
      </div>
    </div>
  );
};
