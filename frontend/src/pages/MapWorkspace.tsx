import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LeafletMap } from '../components/map/LeafletMap';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  MapPin,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
  SlidersHorizontal,
  Globe,
  Lock,
  ArrowUpRight,
  CheckCircle2,
  Share2,
  ExternalLink,
  Layers,
  X,
  Compass,
} from 'lucide-react';

export const MapWorkspace: React.FC = () => {
  const {
    activeMap,
    activeMapLocations,
    currentLocationId,
    setCurrentLocationId,
    navigateTo,
    showToast,
  } = useApp();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  if (!activeMap) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-[#F7F5F0] dark:bg-[#15171A]">
        <div className="text-center max-w-sm">
          <MapPin className="w-8 h-8 text-[#C84B31] dark:text-[#E26D54] mx-auto mb-3" />
          <h2 className="font-serif text-2xl text-[#171717] dark:text-[#F0EDE6] mb-2">No Active Map Selected</h2>
          <p className="text-xs text-[#68655F] dark:text-[#9C978D] mb-4">Select a map from your collection or explore public maps.</p>
          <Button variant="primary" onClick={() => navigateTo('my-maps')}>
            Go to My Maps
          </Button>
        </div>
      </div>
    );
  }

  // Filter locations by search query or selected tag
  const filteredLocations = activeMapLocations.filter((loc) => {
    const matchesSearch =
      loc.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
      loc.description.toLowerCase().includes(filterQuery.toLowerCase()) ||
      loc.category.toLowerCase().includes(filterQuery.toLowerCase());
    const matchesTag = selectedTag ? (loc.tags ?? []).includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  // Extract all unique tags in this map
  const allTags = Array.from(new Set(activeMapLocations.flatMap((l) => l.tags)));

  const selectedLoc = activeMapLocations.find((l) => l.id === currentLocationId);

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    showToast('Map link copied to clipboard', 'info');
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row relative h-[calc(100vh-3.5rem)] overflow-hidden bg-[#E9E6DE] dark:bg-[#15171A]">
      {/* Left Sidebar */}
      <aside
        className={`bg-white dark:bg-[#1A1D23] border-r border-[#D9D6CF] dark:border-[#2D333D] flex flex-col z-20 transition-all duration-300 ${
          sidebarOpen ? 'w-full md:w-96 lg:w-[420px]' : 'w-0 -translate-x-full md:translate-x-0 md:w-0'
        } ${sidebarOpen ? 'relative' : 'absolute'} h-full md:h-auto shadow-xs shrink-0 overflow-hidden`}
      >
        {/* Map Header Summary */}
        <div className="p-4 border-b border-[#D9D6CF] dark:border-[#2D333D] bg-[#F7F5F0]/60 dark:bg-[#1E2228]/80">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-white dark:bg-[#242930] text-[#171717] dark:text-[#F0EDE6] rounded-[3px] border border-[#D9D6CF] dark:border-[#2D333D]">
                {activeMap.category}
              </span>
              {activeMap.isPublic ? (
                <span className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono text-[#68655F] dark:text-[#9C978D]">
                  <Globe className="w-3 h-3" /> Public
                </span>
              ) : (
                <span className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono text-[#C84B31] dark:text-[#E26D54]">
                  <Lock className="w-3 h-3" /> Private
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleShare}
                className="p-1 text-[#68655F] dark:text-[#9C978D] hover:text-[#171717] dark:hover:text-[#F0EDE6] rounded-[4px] hover:bg-[#D9D6CF]/40 dark:hover:bg-[#2D333D] cursor-pointer"
                title="Share Map"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setSidebarOpen(false)}
                className="hidden md:flex p-1 text-[#68655F] dark:text-[#9C978D] hover:text-[#171717] dark:hover:text-[#F0EDE6] rounded-[4px] hover:bg-[#D9D6CF]/40 dark:hover:bg-[#2D333D] cursor-pointer"
                title="Collapse Sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          <h1 className="font-serif text-2xl font-bold text-[#171717] dark:text-[#F0EDE6] leading-tight mb-1">
            {activeMap.title}
          </h1>
          <p className="text-xs text-[#68655F] dark:text-[#9C978D] leading-relaxed line-clamp-2">
            {activeMap.description}
          </p>

          <div className="mt-3 pt-2.5 border-t border-[#D9D6CF] dark:border-[#2D333D] flex items-center justify-between text-xs text-[#68655F] dark:text-[#9C978D]">
            <div className="flex items-center gap-2">
              <img
                src={activeMap.author.avatar}
                alt={activeMap.author.name}
                className="w-5 h-5 rounded-[3px] object-cover border border-[#D9D6CF] dark:border-[#2D333D]"
              />
              <span className="text-[#171717] dark:text-[#F0EDE6] font-medium text-xs">
                {activeMap.author.name}
              </span>
            </div>

            <span className="font-mono text-[11px] text-[#171717] dark:text-[#F0EDE6] font-semibold">
              {filteredLocations.length} {filteredLocations.length === 1 ? 'Location' : 'Locations'}
            </span>
          </div>
        </div>

        {/* Filter & Action Bar */}
        <div className="p-3 border-b border-[#D9D6CF] dark:border-[#2D333D] bg-white dark:bg-[#1A1D23] flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-[#68655F] dark:text-[#9C978D] absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter locations in map..."
                className="w-full h-8 pl-8 pr-3 text-xs bg-[#F7F5F0] dark:bg-[#242930] text-[#171717] dark:text-[#F0EDE6] rounded-[6px] border border-[#D9D6CF] dark:border-[#2D333D] focus:bg-white dark:focus:bg-[#242930] focus:outline-none focus:border-[#171717] dark:focus:border-[#E26D54]"
              />
              {filterQuery && (
                <button
                  onClick={() => setFilterQuery('')}
                  className="absolute right-2 top-2 text-[#68655F] dark:text-[#9C978D] hover:text-[#171717] dark:hover:text-[#F0EDE6] text-xs cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-3 h-3 stroke-[2.5]" />}
              onClick={() => navigateTo('add-location', { mapId: activeMap.id })}
              className="text-xs shrink-0"
            >
              Add Place
            </Button>
          </div>

          {/* Quick Tag Chips */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-2 py-0.5 text-[10px] font-mono rounded-[3px] border transition-colors whitespace-nowrap cursor-pointer ${
                  selectedTag === null
                    ? 'bg-[#171717] dark:bg-[#E26D54] text-white border-[#171717] dark:border-[#E26D54]'
                    : 'bg-[#F7F5F0] dark:bg-[#242930] text-[#68655F] dark:text-[#9C978D] border-[#D9D6CF] dark:border-[#2D333D] hover:text-[#171717] dark:hover:text-[#F0EDE6]'
                }`}
              >
                All
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag ?? null)}
                  className={`px-2 py-0.5 text-[10px] font-mono rounded-[3px] border transition-colors whitespace-nowrap cursor-pointer ${
                    selectedTag === tag
                      ? 'bg-[#171717] dark:bg-[#E26D54] text-white border-[#171717] dark:border-[#E26D54]'
                      : 'bg-[#F7F5F0] dark:bg-[#242930] text-[#68655F] dark:text-[#9C978D] border-[#D9D6CF] dark:border-[#2D333D] hover:text-[#171717] dark:hover:text-[#F0EDE6]'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Location List Scroll Area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredLocations.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MapPin className="w-6 h-6 text-[#68655F]/40 dark:text-[#9C978D]/40 mx-auto mb-2" />
              <p className="text-xs font-medium text-[#171717] dark:text-[#F0EDE6]">No locations found</p>
              <p className="text-[11px] text-[#68655F] dark:text-[#9C978D] mt-1">
                {filterQuery
                  ? 'Try changing your search terms'
                  : 'Start by adding places to this map.'}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 text-xs"
                onClick={() => navigateTo('add-location', { mapId: activeMap.id })}
              >
                Add First Location
              </Button>
            </div>
          ) : (
            filteredLocations.map((loc, index) => {
              const isSelected = loc.id === currentLocationId;
              return (
                <div
                  key={loc.id}
                  onClick={() => setCurrentLocationId(loc.id)}
                  className={`p-3 rounded-[6px] border transition-all cursor-pointer flex gap-3 text-left ${
                    isSelected
                      ? 'bg-[#FAF0ED]/40 dark:bg-[#341B18]/50 border-[#C84B31] dark:border-[#E26D54] ring-1 ring-[#C84B31] dark:ring-[#E26D54]'
                      : 'bg-white dark:bg-[#1E2228] border-[#D9D6CF] dark:border-[#2D333D] hover:border-[#171717] dark:hover:border-[#E26D54]'
                  }`}
                >
                  {/* Photo thumbnail or Index pin */}
                  <div className="w-16 h-16 rounded-[4px] bg-[#E9E6DE] dark:bg-[#242930] overflow-hidden shrink-0 border border-[#D9D6CF] dark:border-[#2D333D] relative">
                    {loc.photos?.[0] ? (
                      <img
                        src={loc.photos[0]}
                        alt={loc.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-mono text-xs text-[#68655F] dark:text-[#9C978D]">
                        #{index + 1}
                      </div>
                    )}
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 rounded-[2px] flex items-center justify-center font-mono text-[9px] font-bold ${
                        isSelected ? 'bg-[#C84B31] dark:bg-[#E26D54] text-white' : 'bg-white/90 dark:bg-[#1E2228]/90 text-[#171717] dark:text-[#F0EDE6]'
                      }`}
                    >
                      {index + 1}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h4
                        className={`text-xs font-semibold leading-tight truncate ${
                          isSelected ? 'text-[#C84B31] dark:text-[#E26D54]' : 'text-[#171717] dark:text-[#F0EDE6]'
                        }`}
                      >
                        {loc.title}
                      </h4>
                      {loc.isVerified && (
                        <CheckCircle2 className="w-3 h-3 text-[#3F6B4A] dark:text-[#529E68] shrink-0" />
                      )}
                    </div>

                    <p className="text-[11px] text-[#68655F] dark:text-[#9C978D] line-clamp-1 mt-0.5 leading-normal">
                      {loc.description}
                    </p>

                    <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-[#68655F] dark:text-[#9C978D]">
                      <span>
                        {loc.latitude.toFixed(4)}°, {loc.longitude.toFixed(4)}°
                      </span>
                      {loc.elevationMeters && (
                        <span>{loc.elevationMeters}m alt</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Location Bottom Quick Preview */}
        {selectedLoc && (
          <div className="p-3 border-t border-[#D9D6CF] dark:border-[#2D333D] bg-[#F7F5F0]/80 dark:bg-[#1E2228]/95 flex items-center justify-between gap-3 shrink-0">
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-mono text-[#68655F] dark:text-[#9C978D] block">
                Selected Place
              </span>
              <p className="text-xs font-semibold text-[#171717] dark:text-[#F0EDE6] truncate">
                {selectedLoc.title}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="secondary"
                size="sm"
                className="text-xs h-7"
                onClick={() =>
                  navigateTo('location-details', {
                    mapId: activeMap.id,
                    locationId: selectedLoc.id,
                  })
                }
              >
                View Details →
              </Button>
            </div>
          </div>
        )}
      </aside>

      {/* Toggle Button when sidebar is closed on desktop */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="hidden md:flex absolute top-4 left-4 z-30 bg-white dark:bg-[#1E2228] border border-[#D9D6CF] dark:border-[#2D333D] p-2 rounded-[6px] shadow-xs text-[#171717] dark:text-[#F0EDE6] hover:bg-[#F7F5F0] dark:hover:bg-[#2A2F38] cursor-pointer"
          title="Open Sidebar"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Mobile Floating Drawer Trigger */}
      <div className="md:hidden absolute top-3 left-3 z-30">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-white dark:bg-[#1E2228] border border-[#D9D6CF] dark:border-[#2D333D] px-3 py-1.5 rounded-[6px] shadow-sm text-xs font-medium text-[#171717] dark:text-[#F0EDE6] flex items-center gap-1.5 cursor-pointer"
        >
          <Layers className="w-3.5 h-3.5 text-[#C84B31] dark:text-[#E26D54]" />
          {sidebarOpen ? 'Hide Places List' : `Show Places (${activeMapLocations.length})`}
        </button>
      </div>

      {/* Main Interactive Map Viewport */}
      <main className="flex-1 h-full md:h-auto relative overflow-hidden">
        <LeafletMap
          locations={filteredLocations}
          selectedLocationId={currentLocationId}
          onSelectLocation={(id) => setCurrentLocationId(id)}
          center={
            selectedLoc
              ? [selectedLoc.latitude, selectedLoc.longitude]
              : activeMap.center
          }
          zoom={activeMap.zoom}
          height="100%"
        />
      </main>
    </div>
  );
};
