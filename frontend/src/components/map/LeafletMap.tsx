import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { LocationItem } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  Navigation,
  Maximize2,
  Layers,
  MapPin,
  Compass,
  Crosshair,
} from 'lucide-react';

interface LeafletMapProps {
  locations?: LocationItem[];
  selectedLocationId?: string | null;
  onSelectLocation?: (id: string) => void;
  interactivePicker?: boolean;
  onPickCoordinates?: (coords: { lat: number; lng: number }) => void;
  center?: [number, number];
  zoom?: number;
  height?: string;
  className?: string;
  showMinimalControls?: boolean;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  locations = [],
  selectedLocationId,
  onSelectLocation,
  interactivePicker = false,
  onPickCoordinates,
  center = [30.2672, -97.7431],
  zoom = 13,
  height = '100%',
  className = '',
  showMinimalControls = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const tempMarkerRef = useRef<L.Marker | null>(null);
  const [activeTileLayer, setActiveTileLayer] = useState<'carto' | 'osm' | 'terrain'>('carto');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [currentZoomLevel, setCurrentZoomLevel] = useState(zoom);

  const { requestUserLocation, showToast, temporaryPin, setTemporaryPin, theme } = useApp();

  // All layers use OpenStreetMap tiles. CARTO's free tiles now return an "API key required"
  // watermark, so dark mode darkens the OSM tiles with CSS instead (see .dark .leaflet-tile-pane).
  const getTileUrl = (_type: string, _currentTheme: 'light' | 'dark') =>
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

  // Dynamically swap map tiles when theme changes without re-initializing the whole map
  useEffect(() => {
    if (tileLayerRef.current) {
      tileLayerRef.current.setUrl(getTileUrl(activeTileLayer, theme));
    }
  }, [theme, activeTileLayer]);

  // Create custom marker icon
  const createPinIcon = (isSelected: boolean, index?: number) => {
    const isDark = theme === 'dark';
    const bg = isSelected ? (isDark ? '#E26D54' : '#171717') : (isDark ? '#D45B42' : '#C84B31');
    const border = isDark ? (isSelected ? '#FFFFFF' : '#1E2228') : '#FFFFFF';
    const size = isSelected ? 34 : 28;

    const html = `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        transform: translate(-50%, -100%);
      ">
        <div style="
          width: ${size}px;
          height: ${size}px;
          background: ${bg};
          border: 2px solid ${border};
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 3px 8px rgba(0,0,0,${isDark ? '0.6' : '0.25'});
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.15s ease, background 0.15s ease;
        ">
          <div style="
            width: ${isSelected ? 10 : 8}px;
            height: ${isSelected ? 10 : 8}px;
            background: #FFFFFF;
            border-radius: 50%;
            transform: rotate(45deg);
          "></div>
        </div>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'pinpoint-marker-custom',
      iconSize: [size, size],
      iconAnchor: [size / 2, size],
      popupAnchor: [0, -size],
    });
  };

  const createTempPickerIcon = () => {
    const html = `
      <div style="
        position: relative;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        transform: translate(-50%, -100%);
      ">
        <div style="
          width: 36px;
          height: 36px;
          background: #C84B31;
          border: 2.5px solid #FFFFFF;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 10px rgba(200, 75, 49, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: bounce 1s infinite alternate;
        ">
          <div style="
            width: 10px;
            height: 10px;
            background: #FFFFFF;
            border-radius: 50%;
            transform: rotate(45deg);
          "></div>
        </div>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'pinpoint-picker-custom',
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    });
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [center[0], center[1]] as L.LatLngTuple,
        zoom: zoom,
        zoomControl: false, // Custom placed zoom controls
        attributionControl: true,
      });

      const tileLayer = L.tileLayer(getTileUrl(activeTileLayer, theme), {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      });
      tileLayer.addTo(map);
      tileLayerRef.current = tileLayer;

      // Layer group for markers
      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      mapInstanceRef.current = map;

      map.on('zoomend', () => {
        setCurrentZoomLevel(map.getZoom());
      });

      // Handle map clicks for interactive coordinates picker
      map.on('click', (e: L.LeafletMouseEvent) => {
        if (interactivePicker || onPickCoordinates) {
          const newCoords = {
            lat: Number(e.latlng.lat.toFixed(6)),
            lng: Number(e.latlng.lng.toFixed(6)),
          };
          if (onPickCoordinates) {
            onPickCoordinates(newCoords);
          }
          if (setTemporaryPin) {
            setTemporaryPin(newCoords);
          }
        }
      });
    }

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update center and zoom when props change
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView(center, zoom);
    }
  }, [center[0], center[1], zoom]);

  // Update Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    locations.forEach((loc, index) => {
      const isSelected = loc.id === selectedLocationId;
      const icon = createPinIcon(isSelected, index + 1);

      const marker = L.marker([loc.latitude, loc.longitude], {
        icon,
        title: loc.title,
        zIndexOffset: isSelected ? 1000 : 100,
      });

      // Popup with authentic PinPoint styling
      const popupContent = document.createElement('div');
      popupContent.className = 'w-64 p-3 bg-white text-left';
      popupContent.innerHTML = `
        ${loc.photos?.[0] ? `
          <div class="w-full h-28 mb-2.5 rounded-[4px] overflow-hidden bg-[#E9E6DE] relative">
            <img src="${loc.photos[0]}" alt="${loc.title}" class="w-full h-full object-cover" />
            <span class="absolute top-2 right-2 px-1.5 py-0.5 text-[9px] uppercase font-mono tracking-wider bg-white/90 text-[#171717] rounded-[3px] border border-[#D9D6CF]">
              ${loc.category}
            </span>
          </div>
        ` : ''}
        <h4 class="font-semibold text-sm text-[#171717] leading-tight mb-1">${loc.title}</h4>
        <p class="text-xs text-[#68655F] line-clamp-2 leading-relaxed mb-2">${loc.description}</p>
        <div class="flex items-center justify-between text-[11px] font-mono text-[#68655F] pt-2 border-t border-[#D9D6CF]">
          <span>${loc.latitude.toFixed(4)}°, ${loc.longitude.toFixed(4)}°</span>
          ${loc.isVerified ? '<span class="text-[#3F6B4A] font-sans font-medium">✓ Verified</span>' : ''}
        </div>
      `;

      marker.bindPopup(popupContent, {
        className: 'pinpoint-popup',
        closeButton: true,
        offset: [0, -10],
      });

      marker.on('click', () => {
        if (onSelectLocation) {
          onSelectLocation(loc.id);
        }
      });

      markersLayerRef.current?.addLayer(marker);

      if (isSelected) {
        // Auto open popup if selected
        marker.openPopup();
      }
    });
  }, [locations, selectedLocationId]);

  // Handle Temporary Pin for Picker Mode
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (tempMarkerRef.current) {
      tempMarkerRef.current.remove();
      tempMarkerRef.current = null;
    }

    if (temporaryPin) {
      const marker = L.marker([temporaryPin.lat, temporaryPin.lng], {
        icon: createTempPickerIcon(),
        draggable: true,
        zIndexOffset: 2000,
      });

      marker.on('dragend', (e) => {
        const markerPos = e.target.getLatLng();
        const coords = {
          lat: Number(markerPos.lat.toFixed(6)),
          lng: Number(markerPos.lng.toFixed(6)),
        };
        if (onPickCoordinates) onPickCoordinates(coords);
        if (setTemporaryPin) setTemporaryPin(coords);
      });

      marker.addTo(mapInstanceRef.current);
      tempMarkerRef.current = marker;
      mapInstanceRef.current.panTo([temporaryPin.lat, temporaryPin.lng]);
    }
  }, [temporaryPin]);

  // Map Resize Observer
  useEffect(() => {
    if (!mapContainerRef.current || !mapInstanceRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      mapInstanceRef.current?.invalidateSize();
    });

    resizeObserver.observe(mapContainerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Map Controls Actions
  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleLocateMe = async () => {
    const coords = await requestUserLocation();
    if (coords && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([coords.lat, coords.lng], 15, { duration: 1.2 });
      if (interactivePicker && onPickCoordinates) {
        onPickCoordinates(coords);
        if (setTemporaryPin) setTemporaryPin(coords);
      }
    }
  };

  const handleFitBounds = () => {
    if (!mapInstanceRef.current || locations.length === 0) return;
    const group = L.featureGroup(
      locations.map((loc) => L.marker([loc.latitude, loc.longitude]))
    );
    mapInstanceRef.current.fitBounds(group.getBounds().pad(0.15));
  };

  return (
    <div className={`relative w-full overflow-hidden bg-[#E9E6DE] dark:bg-[#111315] ${className}`} style={{ height }}>
      {/* The Leaflet Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Instructions for Interactive Picker */}
      {interactivePicker && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-white/95 dark:bg-[#1E2228]/95 border border-[#D9D6CF] dark:border-[#2D333D] px-3.5 py-1.5 rounded-[6px] shadow-sm flex items-center gap-2 text-xs text-[#171717] dark:text-[#F0EDE6] font-medium pointer-events-none backdrop-blur-xs">
          <Crosshair className="w-3.5 h-3.5 text-[#C84B31] dark:text-[#E26D54] animate-pulse" />
          <span>Click anywhere on the map to position the coordinate pin</span>
        </div>
      )}

      {/* Minimal Map Controls (strictly restrained & production-ready) */}
      {showMinimalControls && (
        <div className="absolute right-4 bottom-6 z-20 flex flex-col gap-2">
          {/* Zoom Group */}
          <div className="bg-white dark:bg-[#1E2228] rounded-[6px] border border-[#D9D6CF] dark:border-[#2D333D] shadow-xs flex flex-col overflow-hidden">
            <button
              type="button"
              onClick={handleZoomIn}
              className="w-8 h-8 flex items-center justify-center text-[#171717] dark:text-[#F0EDE6] hover:bg-[#F7F5F0] dark:hover:bg-[#2A2F38] active:bg-[#E9E6DE] dark:active:bg-[#15171A] border-b border-[#D9D6CF] dark:border-[#2D333D] font-mono text-sm font-semibold transition-colors"
              title="Zoom In"
              aria-label="Zoom In"
            >
              +
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="w-8 h-8 flex items-center justify-center text-[#171717] dark:text-[#F0EDE6] hover:bg-[#F7F5F0] dark:hover:bg-[#2A2F38] active:bg-[#E9E6DE] dark:active:bg-[#15171A] font-mono text-sm font-semibold transition-colors"
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              −
            </button>
          </div>

          {/* Current Location GPS Button */}
          <button
            type="button"
            onClick={handleLocateMe}
            className="w-8 h-8 bg-white dark:bg-[#1E2228] hover:bg-[#F7F5F0] dark:hover:bg-[#2A2F38] active:bg-[#E9E6DE] dark:active:bg-[#15171A] text-[#171717] dark:text-[#F0EDE6] rounded-[6px] border border-[#D9D6CF] dark:border-[#2D333D] shadow-xs flex items-center justify-center transition-colors"
            title="Locate My Position (GPS)"
            aria-label="Locate My Position"
          >
            <Navigation className="w-3.5 h-3.5 text-[#68655F] dark:text-[#9C978D]" />
          </button>

          {/* Fit all locations in view */}
          {locations.length > 0 && (
            <button
              type="button"
              onClick={handleFitBounds}
              className="w-8 h-8 bg-white dark:bg-[#1E2228] hover:bg-[#F7F5F0] dark:hover:bg-[#2A2F38] active:bg-[#E9E6DE] dark:active:bg-[#15171A] text-[#171717] dark:text-[#F0EDE6] rounded-[6px] border border-[#D9D6CF] dark:border-[#2D333D] shadow-xs flex items-center justify-center transition-colors"
              title="Fit All Locations in View"
              aria-label="Fit Bounds"
            >
              <Maximize2 className="w-3.5 h-3.5 text-[#68655F] dark:text-[#9C978D]" />
            </button>
          )}
        </div>
      )}

      {/* Coordinate HUD Indicator at Bottom Left */}
      <div className="absolute left-4 bottom-4 z-10 hidden sm:flex items-center gap-2 px-2.5 py-1 bg-white/90 dark:bg-[#1E2228]/90 backdrop-blur-xs border border-[#D9D6CF] dark:border-[#2D333D] rounded-[4px] text-[11px] font-mono text-[#68655F] dark:text-[#9C978D] shadow-xs pointer-events-none">
        <Compass className="w-3 h-3 text-[#171717] dark:text-[#E26D54]" />
        <span>
          {center[0].toFixed(4)}° N, {Math.abs(center[1]).toFixed(4)}° W
        </span>
        <span className="text-[#D9D6CF] dark:text-[#2D333D]">|</span>
        <span>Z{currentZoomLevel}</span>
      </div>
    </div>
  );
};
