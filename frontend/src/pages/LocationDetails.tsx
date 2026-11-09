import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LeafletMap } from '../components/map/LeafletMap';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  MapPin,
  ArrowLeft,
  Share2,
  CheckCircle2,
  Calendar,
  Compass,
  Layers,
  Copy,
  Trash2,
  ExternalLink,
  Camera,
  Tag,
  ShieldCheck,
} from 'lucide-react';

export const LocationDetails: React.FC = () => {
  const {
    activeLocation,
    activeMap,
    navigateTo,
    showToast,
    deleteLocation,
    updateLocation,
  } = useApp();

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  if (!activeLocation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-[#F7F5F0] dark:bg-[#15171A]">
        <div className="text-center">
          <h2 className="font-serif text-2xl text-[#171717] dark:text-[#F0EDE6]">Location not found</h2>
          <Button variant="outline" className="mt-4" onClick={() => navigateTo('map-workspace')}>
            Return to Map Workspace
          </Button>
        </div>
      </div>
    );
  }

  const handleCopyCoords = () => {
    const coordsStr = `${activeLocation.latitude.toFixed(6)}, ${activeLocation.longitude.toFixed(6)}`;
    navigator.clipboard?.writeText(coordsStr);
    showToast(`Coordinates copied: ${coordsStr}`, 'info');
  };

  const handleToggleVerification = () => {
    const updatedStatus = !activeLocation.isVerified;
    updateLocation(activeLocation.id, { isVerified: updatedStatus });
    showToast(
      updatedStatus ? 'Place verified as authentic' : 'Verification revoked',
      updatedStatus ? 'success' : 'info'
    );
  };

  const handleDelete = () => {
    deleteLocation(activeLocation.id);
    navigateTo('map-workspace', { mapId: activeLocation.mapId });
  };

  // Convert decimal degrees to degrees minutes seconds (DMS)
  const toDMS = (deg: number, isLat: boolean) => {
    const absolute = Math.abs(deg);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = Math.floor((minutesNotTruncated - minutes) * 60);
    const direction = isLat ? (deg >= 0 ? 'N' : 'S') : deg >= 0 ? 'E' : 'W';
    return `${degrees}°${minutes}'${seconds}" ${direction}`;
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] dark:bg-[#15171A] flex flex-col text-left transition-colors">
      {/* Top Header Bar */}
      <div className="bg-white dark:bg-[#1A1D23] border-b border-[#D9D6CF] dark:border-[#2D333D] px-4 md:px-8 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigateTo('map-workspace', { mapId: activeLocation.mapId })}
            className="text-xs text-[#68655F] dark:text-[#9C978D] hover:text-[#171717] dark:hover:text-[#F0EDE6] flex items-center gap-1.5 font-medium cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Map
          </button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<Copy className="w-3.5 h-3.5" />}
              onClick={handleCopyCoords}
            >
              Copy Coordinates
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<ShieldCheck className="w-3.5 h-3.5" />}
              onClick={handleToggleVerification}
            >
              {activeLocation.isVerified ? 'Verified ✓' : 'Verify Location'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<ExternalLink className="w-3.5 h-3.5" />}
              onClick={() =>
                navigateTo('map-workspace', {
                  mapId: activeLocation.mapId,
                  locationId: activeLocation.id,
                })
              }
            >
              Inspect on Full Map
            </Button>
            <button
              onClick={handleDelete}
              className="p-2 text-[#68655F] dark:text-[#9C978D] hover:text-[#C84B31] dark:hover:text-[#E26D54] rounded-[4px] hover:bg-[#FDF2F0] dark:hover:bg-[#341B18]/60 transition-colors cursor-pointer"
              title="Delete Location Record"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Hero Location Details Title */}
      <div className="bg-white dark:bg-[#1A1D23] border-b border-[#D9D6CF] dark:border-[#2D333D] px-4 md:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-[#FAF0ED] dark:bg-[#341B18]/80 text-[#C84B31] dark:text-[#E26D54] rounded-[3px] border border-[#E8BFB5] dark:border-[#52251F]">
              {activeLocation.category}
            </span>
            {activeLocation.isVerified && (
              <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] bg-[#EEF4F0] dark:bg-[#172D1E] text-[#3F6B4A] dark:text-[#529E68] rounded-[3px] border border-[#BDD3C3] dark:border-[#25422C] font-medium">
                <CheckCircle2 className="w-3 h-3" /> Field Verified
              </span>
            )}
            <span className="text-xs text-[#68655F] dark:text-[#9C978D] font-mono">
              ID: {activeLocation.id}
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl text-[#171717] dark:text-[#F0EDE6] font-bold">
            {activeLocation.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[#68655F] dark:text-[#9C978D]">
            <div className="flex items-center gap-2">
              <img
                src={activeLocation.author.avatar}
                alt={activeLocation.author.name}
                className="w-5 h-5 rounded-[3px] object-cover border border-[#D9D6CF] dark:border-[#2D333D]"
              />
              <span className="text-[#171717] dark:text-[#F0EDE6] font-medium">
                Logged by {activeLocation.author.name}
              </span>
            </div>
            <span>•</span>
            <span className="font-mono">
              Recorded {new Date(activeLocation.createdAt).toLocaleDateString()}
            </span>
            <span>•</span>
            <span className="font-mono text-[#171717] dark:text-[#F0EDE6]">
              {toDMS(activeLocation.latitude, true)}, {toDMS(activeLocation.longitude, false)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-6xl mx-auto w-full p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        {/* Left 2 Cols: Photography & Descriptions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Photo Gallery */}
          <div className="bg-white dark:bg-[#1E2228] rounded-[6px] border border-[#D9D6CF] dark:border-[#2D333D] overflow-hidden">
            <div className="h-80 sm:h-96 bg-[#E9E6DE] dark:bg-[#242930] relative">
              <img
                src={activeLocation.photos[activePhotoIndex]}
                alt={activeLocation.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 text-white rounded-[3px] text-xs font-mono">
                {activePhotoIndex + 1} of {activeLocation.photos.length}
              </div>
            </div>

            {/* Thumbnails row */}
            {activeLocation.photos.length > 1 && (
              <div className="p-3 border-t border-[#D9D6CF] dark:border-[#2D333D] flex items-center gap-2 overflow-x-auto bg-[#F7F5F0]/50 dark:bg-[#1E2228]/50">
                {activeLocation.photos.map((photo, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePhotoIndex(i)}
                    className={`w-16 h-16 rounded-[4px] overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                      activePhotoIndex === i
                        ? 'border-[#C84B31] dark:border-[#E26D54] ring-1 ring-[#C84B31] dark:ring-[#E26D54]'
                        : 'border-[#D9D6CF] dark:border-[#2D333D] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description & Field Notes */}
          <div className="bg-white dark:bg-[#1E2228] rounded-[6px] border border-[#D9D6CF] dark:border-[#2D333D] p-6 space-y-4">
            <h3 className="font-serif text-2xl text-[#171717] dark:text-[#F0EDE6]">Field Observation</h3>
            <p className="text-sm text-[#171717] dark:text-[#F0EDE6] leading-relaxed">
              {activeLocation.description}
            </p>

            {activeLocation.notes && (
              <div className="p-4 bg-[#F7F5F0] dark:bg-[#242930] rounded-[6px] border border-[#D9D6CF] dark:border-[#2D333D] mt-4">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#68655F] dark:text-[#9C978D] block mb-1">
                  Access & Lighting Advisory
                </span>
                <p className="text-xs text-[#171717] dark:text-[#F0EDE6] leading-relaxed">
                  {activeLocation.notes}
                </p>
              </div>
            )}

            {/* Tags */}
            {(activeLocation.tags?.length ?? 0) > 0 && (
              <div className="pt-4 border-t border-[#D9D6CF] dark:border-[#2D333D]">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#68655F] dark:text-[#9C978D] block mb-2">
                  Taxonomic Tags
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeLocation.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 text-xs font-mono bg-[#F7F5F0] dark:bg-[#242930] text-[#171717] dark:text-[#F0EDE6] rounded-[4px] border border-[#D9D6CF] dark:border-[#2D333D]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Geographic Datum & Mini-Map */}
        <div className="space-y-6">
          {/* Mini-Map Preview */}
          <div className="bg-white dark:bg-[#1E2228] rounded-[6px] border border-[#D9D6CF] dark:border-[#2D333D] overflow-hidden">
            <div className="p-3 border-b border-[#D9D6CF] dark:border-[#2D333D] bg-[#F7F5F0]/60 dark:bg-[#242930]/60 flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-[#68655F] dark:text-[#9C978D]">
                Map Preview
              </span>
              <span className="text-xs font-mono text-[#171717] dark:text-[#F0EDE6]">
                {activeLocation.category}
              </span>
            </div>
            <div className="h-64">
              <LeafletMap
                locations={[activeLocation]}
                selectedLocationId={activeLocation.id}
                center={[activeLocation.latitude, activeLocation.longitude]}
                zoom={15}
                height="100%"
                showMinimalControls={false}
              />
            </div>
          </div>

          {/* Coordinates Card */}
          <div className="bg-white dark:bg-[#1E2228] rounded-[6px] border border-[#D9D6CF] dark:border-[#2D333D] p-5">
            <h4 className="font-serif text-lg text-[#171717] dark:text-[#F0EDE6] mb-3">
              Coordinates
            </h4>

            <dl className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-[#D9D6CF]/60 dark:border-[#2D333D] pb-2">
                <dt className="text-[#68655F] dark:text-[#9C978D]">Latitude</dt>
                <dd className="text-[#171717] dark:text-[#F0EDE6] font-semibold">
                  {activeLocation.latitude.toFixed(6)}°
                </dd>
              </div>

              <div className="flex items-center justify-between border-b border-[#D9D6CF]/60 dark:border-[#2D333D] pb-2">
                <dt className="text-[#68655F] dark:text-[#9C978D]">Longitude</dt>
                <dd className="text-[#171717] dark:text-[#F0EDE6] font-semibold">
                  {activeLocation.longitude.toFixed(6)}°
                </dd>
              </div>

              <div className="flex items-center justify-between border-b border-[#D9D6CF]/60 dark:border-[#2D333D] pb-2">
                <dt className="text-[#68655F] dark:text-[#9C978D]">DMS Format</dt>
                <dd className="text-[#171717] dark:text-[#F0EDE6]">
                  {toDMS(activeLocation.latitude, true)}
                </dd>
              </div>

              {activeLocation.elevationMeters && (
                <div className="flex items-center justify-between border-b border-[#D9D6CF]/60 dark:border-[#2D333D] pb-2">
                  <dt className="text-[#68655F] dark:text-[#9C978D]">Elevation</dt>
                  <dd className="text-[#171717] dark:text-[#F0EDE6]">
                    {activeLocation.elevationMeters} m ({Math.round(activeLocation.elevationMeters * 3.28084)} ft)
                  </dd>
                </div>
              )}

              {activeLocation.utmReference && (
                <div className="flex items-center justify-between border-b border-[#D9D6CF]/60 dark:border-[#2D333D] pb-2">
                  <dt className="text-[#68655F] dark:text-[#9C978D]">UTM Grid</dt>
                  <dd className="text-[#171717] dark:text-[#F0EDE6]">{activeLocation.utmReference}</dd>
                </div>
              )}

              {activeLocation.plusCode && (
                <div className="flex items-center justify-between">
                  <dt className="text-[#68655F] dark:text-[#9C978D]">Plus Code</dt>
                  <dd className="text-[#171717] dark:text-[#F0EDE6]">{activeLocation.plusCode}</dd>
                </div>
              )}
            </dl>

            <Button
              variant="outline"
              size="sm"
              className="w-full justify-center mt-4 text-xs font-mono"
              icon={<Copy className="w-3.5 h-3.5" />}
              onClick={handleCopyCoords}
            >
              Copy Coordinates
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
