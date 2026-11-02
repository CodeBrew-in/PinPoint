import React from 'react';
import { useApp } from '../context/AppContext';
import { LeafletMap } from '../components/map/LeafletMap';
import { LocationCard } from '../components/locations/LocationCard';
import { Button } from '../components/ui/Button';
import {
  MapPin,
  Share2,
  Bookmark,
  Calendar,
  Layers,
  ArrowLeft,
  Download,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';

export const PublicMapDetails: React.FC = () => {
  const {
    activeMap,
    locations,
    navigateTo,
    showToast,
    isAuthenticated,
  } = useApp();

  if (!activeMap) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-[#F7F5F0] dark:bg-[#15171A]">
        <div className="text-center">
          <h2 className="font-serif text-2xl text-[#171717] dark:text-[#F0EDE6]">Map not found</h2>
          <Button variant="outline" className="mt-4" onClick={() => navigateTo('explore')}>
            Return to Explore
          </Button>
        </div>
      </div>
    );
  }

  const mapLocations = locations.filter((l) => l.mapId === activeMap.id);

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    showToast('Public map URL copied to clipboard', 'info');
  };

  const handleExportGeoJSON = () => {
    const geojson = {
      type: 'FeatureCollection',
      name: activeMap.title,
      description: activeMap.description,
      features: mapLocations.map((loc) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [loc.longitude, loc.latitude],
        },
        properties: {
          title: loc.title,
          category: loc.category,
          description: loc.description,
          elevation: loc.elevationMeters,
          utm: loc.utmReference,
          plusCode: loc.plusCode,
          verified: loc.isVerified,
        },
      })),
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], {
      type: 'application/geo+json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeMap.title.toLowerCase().replace(/\s+/g, '_')}.geojson`;
    link.click();
    showToast('GeoJSON exported successfully', 'success');
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] dark:bg-[#15171A] flex flex-col text-left transition-colors">
      {/* Top Banner Navigation */}
      <div className="bg-white dark:bg-[#1A1D23] border-b border-[#D9D6CF] dark:border-[#2D333D] px-4 md:px-8 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigateTo('explore')}
            className="text-xs text-[#68655F] dark:text-[#9C978D] hover:text-[#171717] dark:hover:text-[#F0EDE6] flex items-center gap-1.5 font-medium cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Directory
          </button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<Download className="w-3.5 h-3.5" />}
              onClick={handleExportGeoJSON}
            >
              Export GeoJSON
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Share2 className="w-3.5 h-3.5" />}
              onClick={handleShare}
            >
              Share
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<ExternalLink className="w-3.5 h-3.5" />}
              onClick={() => navigateTo('map-workspace', { mapId: activeMap.id })}
            >
              Open in Workspace
            </Button>
          </div>
        </div>
      </div>

      {/* Map Header Hero */}
      <div className="bg-white dark:bg-[#1A1D23] border-b border-[#D9D6CF] dark:border-[#2D333D] px-4 md:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-[#F7F5F0] dark:bg-[#242930] text-[#171717] dark:text-[#F0EDE6] rounded-[3px] border border-[#D9D6CF] dark:border-[#2D333D]">
              {activeMap.category}
            </span>
            <span className="text-xs font-mono text-[#68655F] dark:text-[#9C978D]">
              Published by {activeMap.author.name}
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl text-[#171717] dark:text-[#F0EDE6] font-bold">
            {activeMap.title}
          </h1>

          <p className="text-sm text-[#68655F] dark:text-[#9C978D] mt-2 max-w-3xl leading-relaxed">
            {activeMap.description}
          </p>

          <div className="mt-6 pt-4 border-t border-[#D9D6CF] dark:border-[#2D333D] flex flex-wrap items-center justify-between gap-4 text-xs text-[#68655F] dark:text-[#9C978D]">
            <div className="flex items-center gap-3">
              <img
                src={activeMap.author.avatar}
                alt={activeMap.author.name}
                className="w-7 h-7 rounded-[4px] object-cover border border-[#D9D6CF] dark:border-[#2D333D]"
              />
              <div>
                <span className="font-semibold text-[#171717] dark:text-[#F0EDE6] block">
                  {activeMap.author.name}
                </span>
                <span className="text-[11px] text-[#68655F] dark:text-[#9C978D]">
                  Author
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6 font-mono text-xs text-[#171717] dark:text-[#F0EDE6]">
              <span>
                <strong className="font-bold">{mapLocations.length}</strong> Locations
              </span>
              <span>
                Center: {activeMap.center[0].toFixed(2)}° N, {Math.abs(activeMap.center[1]).toFixed(2)}° W
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Map Viewport */}
      <div className="max-w-6xl mx-auto w-full p-4 md:p-8 space-y-8">
        <div className="bg-white dark:bg-[#1E2228] rounded-[6px] border border-[#D9D6CF] dark:border-[#2D333D] overflow-hidden shadow-xs h-96 sm:h-[450px]">
          <LeafletMap
            locations={mapLocations}
            onSelectLocation={(id) =>
              navigateTo('location-details', {
                mapId: activeMap.id,
                locationId: id,
              })
            }
            center={activeMap.center}
            zoom={activeMap.zoom}
            height="100%"
          />
        </div>

        {/* Location Records Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-2xl text-[#171717] dark:text-[#F0EDE6]">
              Locations ({mapLocations.length})
            </h2>
            <span className="text-xs text-[#68655F] dark:text-[#9C978D]">
              Select a location to view photos and notes
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mapLocations.map((loc) => (
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
