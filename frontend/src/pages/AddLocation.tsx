import React, { useState, useRef } from 'react';
import exifr from 'exifr';
import { useApp } from '../context/AppContext';
import { Category, PUBLIC_MAP_ID } from '../types';
import { LeafletMap } from '../components/map/LeafletMap';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import {
  MapPin,
  ArrowLeft,
  Navigation,
  Upload,
  Camera,
  X,
  Crosshair,
  Image as ImageIcon,
  Globe,
  Lock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';

const CATEGORIES: Category[] = [
  'Photography',
  'Nature & Trails',
  'Street Art',
  'Historic',
  'Urban Exploration',
  'Food & Drinks',
];

interface SampleGeotaggedPhoto {
  name: string;
  title: string;
  description: string;
  category: Category;
  lat: number;
  lng: number;
  elevation: number;
  url: string;
  tags: string[];
}

const SAMPLE_GEOTAGGED_PHOTOS: SampleGeotaggedPhoto[] = [
  {
    name: 'Bat Bridge Sunset',
    title: 'South Congress Bat Bridge Overlook',
    description: 'Scenic viewpoint along the Congress Avenue bridge where thousands of Mexican free-tailed bats emerge at dusk.',
    category: 'Photography',
    lat: 30.2625,
    lng: -97.7431,
    elevation: 148,
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    tags: ['Bridges', 'Skyline', 'Sunset', 'Photography'],
  },
  {
    name: 'Barton Springs',
    title: 'Barton Springs Limestone Outflow',
    description: 'Natural freshwater spring fed by the Edwards Aquifer maintaining a 68-degree temperature year-round.',
    category: 'Nature & Trails',
    lat: 30.2638,
    lng: -97.7712,
    elevation: 142,
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
    tags: ['Springs', 'Limestone', 'Nature', 'FieldStudy'],
  },
  {
    name: 'East Austin Mural',
    title: 'Historic Rail Corridor Murals',
    description: 'Large-scale spray mural series spanning industrial warehouse walls in the historic railroad district.',
    category: 'Street Art',
    lat: 30.2598,
    lng: -97.7289,
    elevation: 155,
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    tags: ['StreetArt', 'Murals', 'EastAustin'],
  },
  {
    name: 'Pennybacker 360',
    title: 'Pennybacker 360 Bridge Cliff',
    description: 'Elevated limestone cliff overlooking the rust-red arched bridge spanning the Colorado River channel.',
    category: 'Photography',
    lat: 30.3524,
    lng: -97.7972,
    elevation: 240,
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    tags: ['ScenicOverlook', 'ArchBridge', 'SunsetView'],
  },
];

export const AddLocation: React.FC = () => {
  const {
    maps,
    user,
    currentMapId,
    addLocation,
    navigateTo,
    showToast,
    requestUserLocation,
    temporaryPin,
    setTemporaryPin,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Private maps owned by the user
  const userPrivateMaps = maps.filter((m) => m.author.id === user?.id);

  // Destination selection: Public Map vs Private Map Workspace
  const initialDestinationType = currentMapId === PUBLIC_MAP_ID ? 'public' : 'private';
  const [destinationType, setDestinationType] = useState<'public' | 'private'>(initialDestinationType);
  const [selectedPrivateMapId, setSelectedPrivateMapId] = useState<string>(
    currentMapId && currentMapId !== PUBLIC_MAP_ID
      ? currentMapId
      : userPrivateMaps[0]?.id || maps[0]?.id
  );

  // Initial photo and coordinates from default sample
  const initialSample = SAMPLE_GEOTAGGED_PHOTOS[0];
  const [photos, setPhotos] = useState<string[]>([initialSample.url]);
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');
  const [isParsingExif, setIsParsingExif] = useState(false);
  const [gpsExtracted, setGpsExtracted] = useState<boolean>(true);
  const [gpsSource, setGpsSource] = useState<'exif' | 'map' | 'device'>('exif');

  // Coordinates (read-only in normal workflow)
  const [latitude, setLatitude] = useState<number>(temporaryPin?.lat || initialSample.lat);
  const [longitude, setLongitude] = useState<number>(temporaryPin?.lng || initialSample.lng);
  const [elevation, setElevation] = useState<string>(initialSample.elevation.toString());

  // Location info fields
  const [title, setTitle] = useState(initialSample.title);
  const [category, setCategory] = useState<Category>(initialSample.category);
  const [description, setDescription] = useState(initialSample.description);
  const [notes, setNotes] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(initialSample.tags);
  const [isDragOver, setIsDragOver] = useState(false);

  // Handle image upload and parse EXIF via exifr
  const processImageFile = async (file: File) => {
    setIsParsingExif(true);
    try {
      // 1. Create a data URL / object preview
      const objectUrl = URL.createObjectURL(file);
      setPhotos((prev) => [objectUrl, ...prev]);

      // 2. Extract GPS from image EXIF metadata
      const gps = await exifr.gps(file);
      if (gps && typeof gps.latitude === 'number' && typeof gps.longitude === 'number') {
        const lat = Number(gps.latitude.toFixed(6));
        const lng = Number(gps.longitude.toFixed(6));
        setLatitude(lat);
        setLongitude(lng);
        setTemporaryPin({ lat, lng });
        setGpsExtracted(true);
        setGpsSource('exif');
        showToast(`GPS extracted from photo EXIF: ${lat}°, ${lng}°`, 'success');
      } else {
        setGpsExtracted(false);
        setGpsSource('map');
        showToast('Photo attached. No GPS metadata found in EXIF; pin placed on map.', 'info');
      }
    } catch (err) {
      console.warn('EXIF extraction error:', err);
      setGpsExtracted(false);
      setGpsSource('map');
      showToast('Photo attached. Click on map to place pin.', 'info');
    } finally {
      setIsParsingExif(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  // Select one of the preset geotagged field samples
  const handleSelectSample = (sample: SampleGeotaggedPhoto) => {
    setPhotos([sample.url, ...photos.filter((p) => p !== sample.url)]);
    setLatitude(sample.lat);
    setLongitude(sample.lng);
    setElevation(sample.elevation.toString());
    setTemporaryPin({ lat: sample.lat, lng: sample.lng });
    setGpsExtracted(true);
    setGpsSource('exif');
    setTitle(sample.title);
    setDescription(sample.description);
    setCategory(sample.category);
    setTags(sample.tags);
    showToast(`Loaded "${sample.title}" with GPS metadata`, 'success');
  };

  // Interactive map click
  const handlePickFromMap = (coords: { lat: number; lng: number }) => {
    setLatitude(coords.lat);
    setLongitude(coords.lng);
    setGpsSource('map');
    setGpsExtracted(false);
  };

  // Device GPS
  const handleDetectDeviceGPS = async () => {
    const coords = await requestUserLocation();
    if (coords) {
      setLatitude(coords.lat);
      setLongitude(coords.lng);
      setTemporaryPin(coords);
      setGpsSource('device');
      setGpsExtracted(false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const cleanTag = tagInput.trim().replace(/^#/, '');
      if (!tags.includes(cleanTag)) {
        setTags([...tags, cleanTag]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleAddPhotoUrl = () => {
    if (customPhotoUrl.trim()) {
      setPhotos([...photos, customPhotoUrl.trim()]);
      setCustomPhotoUrl('');
      showToast('Photo attached', 'info');
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Please provide a title for the location.', 'alert');
      return;
    }

    const targetMapId = destinationType === 'public' ? PUBLIC_MAP_ID : selectedPrivateMapId;
    if (!targetMapId) {
      showToast('Please select a destination map.', 'alert');
      return;
    }

    const newLocId = addLocation({
      mapId: targetMapId,
      title: title.trim(),
      category,
      description: description.trim(),
      latitude: Number(latitude),
      longitude: Number(longitude),
      elevationMeters: parseInt(elevation) || 150,
      notes: notes.trim(),
      tags,
      photos,
    });

    if (destinationType === 'public') {
      navigateTo('explore');
    } else {
      navigateTo('map-workspace', {
        mapId: targetMapId,
        locationId: newLocId,
      });
    }
  };

  const activePrivateMap = maps.find((m) => m.id === selectedPrivateMapId);

  return (
    <div className="min-h-screen bg-[#F7F5F0] dark:bg-[#15171A] flex flex-col text-left transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-[#1A1D23] border-b border-[#D9D6CF] dark:border-[#2D333D] px-4 md:px-8 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() =>
              destinationType === 'public'
                ? navigateTo('explore')
                : navigateTo('my-maps')
            }
            className="text-xs text-[#68655F] dark:text-[#9C978D] hover:text-[#171717] dark:hover:text-[#F0EDE6] flex items-center gap-1.5 font-medium cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <span className="text-xs font-mono text-[#68655F] dark:text-[#9C978D]">Photo-First Location Pinning</span>
        </div>
      </div>

      {/* Main Content Form */}
      <div className="max-w-4xl mx-auto w-full p-4 md:p-8 flex-1">
        <div className="bg-white dark:bg-[#1E2228] rounded-[8px] border border-[#D9D6CF] dark:border-[#2D333D] p-6 sm:p-8 shadow-xs">
          <div className="mb-6 pb-4 border-b border-[#D9D6CF] dark:border-[#2D333D]">
            <div className="flex items-center gap-2 mb-1">
              <Camera className="w-4 h-4 text-[#C84B31] dark:text-[#E26D54]" />
              <span className="text-xs font-mono uppercase tracking-widest text-[#68655F] dark:text-[#9C978D]">
                Photo-First Flow
              </span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-[#171717] dark:text-[#F0EDE6]">
              Add Location
            </h1>
            <p className="text-xs text-[#68655F] dark:text-[#9C978D] mt-1">
              Upload or select a photo. PinPoint automatically reads the GPS coordinates from EXIF metadata and pins the map.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Step 1: Destination Selection */}
            <div className="space-y-3">
              <label className="text-xs font-medium text-[#171717] dark:text-[#F0EDE6] block">
                1. Destination — Where should this location be saved? *
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option: The Public Map */}
                <div
                  onClick={() => setDestinationType('public')}
                  className={`p-3.5 rounded-[6px] border cursor-pointer flex items-start gap-3 transition-all ${
                    destinationType === 'public'
                      ? 'bg-[#FBFDFB] dark:bg-[#172D1E]/40 border-[#3F6B4A] dark:border-[#529E68] ring-1 ring-[#3F6B4A] dark:ring-[#529E68]'
                      : 'bg-[#F7F5F0]/60 dark:bg-[#1A1D23] border-[#D9D6CF] dark:border-[#2D333D] hover:border-[#68655F] dark:hover:border-[#9C978D]'
                  }`}
                >
                  <div className="w-8 h-8 rounded-[4px] bg-[#EBF3ED] dark:bg-[#172D1E] text-[#3F6B4A] dark:text-[#529E68] flex items-center justify-center shrink-0 mt-0.5">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#171717] dark:text-[#F0EDE6]">
                        The Public Map
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#EBF3ED] dark:bg-[#172D1E] text-[#3F6B4A] dark:text-[#529E68] rounded-[3px]">
                        Global
                      </span>
                    </div>
                    <p className="text-[11px] text-[#68655F] dark:text-[#9C978D] leading-tight mt-1">
                      Contribute to the single shared map open to all explorers worldwide.
                    </p>
                  </div>
                </div>

                {/* Option: Private Workspace Map */}
                <div
                  onClick={() => setDestinationType('private')}
                  className={`p-3.5 rounded-[6px] border cursor-pointer flex items-start gap-3 transition-all ${
                    destinationType === 'private'
                      ? 'bg-[#FAF0ED] dark:bg-[#341B18]/40 border-[#C84B31] dark:border-[#E26D54] ring-1 ring-[#C84B31] dark:ring-[#E26D54]'
                      : 'bg-[#F7F5F0]/60 dark:bg-[#1A1D23] border-[#D9D6CF] dark:border-[#2D333D] hover:border-[#68655F] dark:hover:border-[#9C978D]'
                  }`}
                >
                  <div className="w-8 h-8 rounded-[4px] bg-[#FAF0ED] dark:bg-[#341B18] text-[#C84B31] dark:text-[#E26D54] flex items-center justify-center shrink-0 mt-0.5">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#171717] dark:text-[#F0EDE6]">
                        Private Workspace
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#FDF2F0] dark:bg-[#341B18] text-[#C84B31] dark:text-[#E26D54] rounded-[3px]">
                        Private
                      </span>
                    </div>
                    <p className="text-[11px] text-[#68655F] dark:text-[#9C978D] leading-tight mt-1">
                      Save to your personal, private workspace map.
                    </p>
                  </div>
                </div>
              </div>

              {/* Private Map Selector (if Private is chosen) */}
              {destinationType === 'private' && (
                <div className="pt-2">
                  <div className="flex flex-col gap-1.5 text-left max-w-md">
                    <label className="text-[11px] font-mono text-[#68655F] dark:text-[#9C978D]">
                      Select Private Workspace:
                    </label>
                    <select
                      value={selectedPrivateMapId}
                      onChange={(e) => setSelectedPrivateMapId(e.target.value)}
                      className="h-9 px-3 text-xs bg-white dark:bg-[#1A1D23] text-[#171717] dark:text-[#F0EDE6] rounded-[6px] border border-[#D9D6CF] dark:border-[#2D333D] focus:outline-none focus:border-[#171717] dark:focus:border-[#E26D54]"
                    >
                      {userPrivateMaps.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title} ({m.category})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Photo Upload & EXIF GPS Extraction */}
            <div className="space-y-3 pt-4 border-t border-[#D9D6CF] dark:border-[#2D333D]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-[#171717] dark:text-[#F0EDE6] flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-[#C84B31] dark:text-[#E26D54]" />
                  <span>2. Photo & GPS Metadata Extraction *</span>
                </label>
                <span className="text-[11px] font-mono text-[#68655F] dark:text-[#9C978D]">
                  Auto-extracts GPS from EXIF
                </span>
              </div>

              {/* Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-[8px] cursor-pointer transition-colors text-center ${
                  isDragOver
                    ? 'border-[#C84B31] dark:border-[#E26D54] bg-[#FAF0ED] dark:bg-[#341B18]/30'
                    : 'border-[#D9D6CF] dark:border-[#2D333D] hover:border-[#171717] dark:hover:border-[#F0EDE6] bg-[#F7F5F0]/50 dark:bg-[#1A1D23]/50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  accept="image/*"
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 rounded-[6px] bg-white dark:bg-[#242930] border border-[#D9D6CF] dark:border-[#2D333D] flex items-center justify-center text-[#C84B31] dark:text-[#E26D54]">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#171717] dark:text-[#F0EDE6]">
                      {isParsingExif
                        ? 'Extracting EXIF GPS coordinates...'
                        : 'Click to upload photo or drag & drop here'}
                    </p>
                    <p className="text-[11px] text-[#68655F] dark:text-[#9C978D] mt-0.5">
                      Camera photos with location tags will automatically place the map pin.
                    </p>
                  </div>
                </div>
              </div>

              {/* Geotagged Field Samples for Instant Testing */}
              <div className="p-3 bg-[#F7F5F0] dark:bg-[#1A1D23] rounded-[6px] border border-[#D9D6CF] dark:border-[#2D333D] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-medium text-[#171717] dark:text-[#F0EDE6] flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#C84B31] dark:text-[#E26D54]" /> Quick Field Samples (Click to test GPS extraction):
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SAMPLE_GEOTAGGED_PHOTOS.map((sample, i) => (
                    <button
                      type="button"
                      key={i}
                      onClick={() => handleSelectSample(sample)}
                      className={`p-2 rounded-[4px] border text-left flex items-center gap-2 transition-all cursor-pointer ${
                        latitude === sample.lat && longitude === sample.lng
                          ? 'bg-white dark:bg-[#242930] border-[#171717] dark:border-[#E26D54] shadow-xs'
                          : 'bg-white/80 dark:bg-[#1E2228] border-[#D9D6CF] dark:border-[#2D333D] hover:bg-white dark:hover:bg-[#242930]'
                      }`}
                    >
                      <img
                        src={sample.url}
                        alt={sample.name}
                        className="w-8 h-8 rounded-[2px] object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-[10px] font-semibold text-[#171717] dark:text-[#F0EDE6] block truncate">
                          {sample.name}
                        </span>
                        <span className="text-[9px] font-mono text-[#68655F] dark:text-[#9C978D] block">
                          {sample.lat.toFixed(3)}°, {sample.lng.toFixed(3)}°
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Photos Preview Strip */}
              {photos.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {photos.map((photo, index) => (
                    <div
                      key={index}
                      className="relative w-20 h-20 rounded-[4px] overflow-hidden border border-[#D9D6CF] dark:border-[#2D333D] group"
                    >
                      <img src={photo} alt="" className="w-full h-full object-cover" />
                      {index === 0 && (
                        <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[9px] font-mono text-center py-0.5">
                          Primary
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute top-1 right-1 p-1 bg-black/70 text-white rounded-[2px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Step 3: Interactive Pin Placement Map (Read-Only Coordinates Display) */}
            <div className="space-y-3 pt-4 border-t border-[#D9D6CF] dark:border-[#2D333D]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-[#171717] dark:text-[#F0EDE6] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#C84B31] dark:text-[#E26D54]" />
                  <span>3. Location Pin & Coordinates</span>
                </label>
                <button
                  type="button"
                  onClick={handleDetectDeviceGPS}
                  className="text-xs text-[#C84B31] dark:text-[#E26D54] hover:text-[#963723] dark:hover:text-[#F0EDE6] flex items-center gap-1 font-medium cursor-pointer"
                >
                  <Navigation className="w-3 h-3" /> Use Device GPS
                </button>
              </div>

              {/* Leaflet Map */}
              <div className="h-64 sm:h-72 rounded-[6px] border border-[#D9D6CF] dark:border-[#2D333D] overflow-hidden">
                <LeafletMap
                  interactivePicker={true}
                  onPickCoordinates={handlePickFromMap}
                  center={[latitude, longitude]}
                  zoom={15}
                  height="100%"
                />
              </div>

              {/* READ-ONLY COORDINATE STATUS BADGE (No manual typing required) */}
              <div className="bg-[#F7F5F0] dark:bg-[#1A1D23] rounded-[6px] border border-[#D9D6CF] dark:border-[#2D333D] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#171717] dark:text-[#F0EDE6]">
                      {latitude.toFixed(6)}° N, {Math.abs(longitude).toFixed(6)}° {longitude >= 0 ? 'E' : 'W'}
                    </span>
                    {gpsExtracted ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-[#3F6B4A] dark:text-[#529E68] bg-[#EBF3ED] dark:bg-[#172D1E] px-1.5 py-0.5 rounded-[3px] font-mono">
                        <CheckCircle2 className="w-3 h-3" /> Extracted from Photo EXIF
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-[#68655F] dark:text-[#9C978D] bg-white dark:bg-[#242930] px-1.5 py-0.5 rounded-[3px] border border-[#D9D6CF] dark:border-[#2D333D] font-mono">
                        <Crosshair className="w-3 h-3 text-[#C84B31] dark:text-[#E26D54]" /> Map Pin Selected
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#68655F] dark:text-[#9C978D] mt-0.5">
                    Click anywhere on the map above to reposition the pin if needed.
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-[#68655F] dark:text-[#9C978D]">
                    Elevation: ~{elevation}m
                  </span>
                </div>
              </div>

              {/* Collapsible Advanced Coordinate Overrides (Hidden by default) */}
              <details className="text-xs text-[#68655F] dark:text-[#9C978D] pt-1">
                <summary className="cursor-pointer hover:text-[#171717] dark:hover:text-[#F0EDE6] font-medium inline-flex items-center gap-1">
                  <SlidersHorizontal className="w-3 h-3" /> Advanced: Fine-tune coordinate numbers
                </summary>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-white dark:bg-[#1A1D23] rounded-[6px] border border-[#D9D6CF] dark:border-[#2D333D]">
                  <Input
                    label="Latitude"
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                  />
                  <Input
                    label="Longitude"
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                  />
                  <Input
                    label="Elevation (m)"
                    type="number"
                    value={elevation}
                    onChange={(e) => setElevation(e.target.value)}
                  />
                </div>
              </details>
            </div>

            {/* Step 4: Details Form */}
            <div className="space-y-4 pt-4 border-t border-[#D9D6CF] dark:border-[#2D333D]">
              <label className="text-xs font-medium text-[#171717] dark:text-[#F0EDE6] block">
                4. Location Details
              </label>

              <Input
                label="Location Title *"
                placeholder="e.g. South Congress Bat Bridge, Barton Springs Outflow"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-medium text-[#171717] dark:text-[#F0EDE6]">
                  Category *
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
                placeholder="Describe this location, what makes it interesting, or field observations..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />

              <Textarea
                label="Notes & Tips (Optional)"
                rows={2}
                placeholder="Helpful field notes like best time to visit, gear needed, or access..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              {/* Tags */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#171717] dark:text-[#F0EDE6]">
                  Descriptive Tags
                </label>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono bg-[#F7F5F0] dark:bg-[#242930] text-[#171717] dark:text-[#F0EDE6] rounded-[4px] border border-[#D9D6CF] dark:border-[#2D333D]"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-[#68655F] dark:text-[#9C978D] hover:text-[#C84B31] dark:hover:text-[#E26D54] cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Type a tag and press Enter (e.g. Limestone, SunsetSpot)..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="w-full h-8 px-3 text-xs bg-white dark:bg-[#1A1D23] text-[#171717] dark:text-[#F0EDE6] rounded-[6px] border border-[#D9D6CF] dark:border-[#2D333D] focus:outline-none focus:border-[#171717] dark:focus:border-[#E26D54]"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-[#D9D6CF] dark:border-[#2D333D] flex items-center justify-between">
              <span className="text-xs font-mono text-[#68655F] dark:text-[#9C978D]">
                Target: {destinationType === 'public' ? 'The Public Map' : `Workspace: ${activePrivateMap?.title || 'Private'}`}
              </span>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    destinationType === 'public'
                      ? navigateTo('explore')
                      : navigateTo('my-maps')
                  }
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  icon={
                    destinationType === 'public' ? (
                      <Globe className="w-3.5 h-3.5" />
                    ) : (
                      <Lock className="w-3.5 h-3.5" />
                    )
                  }
                >
                  {destinationType === 'public'
                    ? 'Contribute to Public Map'
                    : `Save to ${activePrivateMap?.title || 'Private Map'}`}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

