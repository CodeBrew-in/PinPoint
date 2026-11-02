import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppScreen, Category, LocationItem, MapCollection, UserProfile, PUBLIC_MAP_ID } from '../types';
import { currentUserMock, initialLocations, initialMaps } from '../data/mockData';
import { useAuth } from '../auth/useAuth';

// Each screen has a real URL, so refresh and the back button work.
// Screens that need an id (a map or a location) build it into the path.
const screenFromPath = (pathname: string): AppScreen => {
  if (pathname === '/maps/new') return 'create-map';
  if (pathname === '/locations/new') return 'add-location';
  if (pathname.startsWith('/explore/maps/')) return 'public-map';
  if (pathname.startsWith('/maps/')) return 'map-workspace';
  if (pathname.startsWith('/locations/')) return 'location-details';
  switch (pathname) {
    case '/explore': return 'explore';
    case '/pricing': return 'pricing';
    case '/support': return 'support';
    case '/login': return 'sign-in';
    case '/signup': return 'sign-up';
    case '/dashboard': return 'dashboard';
    case '/my-maps': return 'my-maps';
    case '/profile': return 'profile';
    default: return 'home';
  }
};

const pathForScreen = (screen: AppScreen, mapId: string, locationId: string | null): string => {
  switch (screen) {
    case 'explore': return '/explore';
    case 'public-map': return `/explore/maps/${mapId}`;
    case 'pricing': return '/pricing';
    case 'support': return '/support';
    case 'sign-in': return '/login';
    case 'sign-up': return '/signup';
    case 'dashboard': return '/dashboard';
    case 'my-maps': return '/my-maps';
    case 'map-workspace': return `/maps/${mapId}`;
    case 'location-details': return locationId ? `/locations/${locationId}` : '/my-maps';
    case 'create-map': return '/maps/new';
    case 'add-location': return '/locations/new';
    case 'profile': return '/profile';
    default: return '/';
  }
};

// Name and handle are not stored by the backend yet, so keep them in the browser per user.
const PROFILE_KEY = (id: number) => `pinpoint_profile_${id}`;
const readProfile = (id: number): Partial<UserProfile> => {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY(id)) || '{}');
  } catch {
    return {};
  }
};

interface NavigationParams {
  mapId?: string;
  locationId?: string;
}

interface ToastInfo {
  id: string;
  message: string;
  type: 'info' | 'success' | 'alert';
}

interface AppContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  logout: () => void;
  saveProfileDetails: (details: { name: string; handle: string }) => void;
  currentScreen: AppScreen;
  navigateTo: (screen: AppScreen, params?: NavigationParams) => void;
  currentMapId: string;
  setCurrentMapId: (id: string) => void;
  currentLocationId: string | null;
  setCurrentLocationId: (id: string | null) => void;
  maps: MapCollection[];
  locations: LocationItem[];
  activeMap: MapCollection | undefined;
  activeLocation: LocationItem | undefined;
  activeMapLocations: LocationItem[];
  publicLocations: LocationItem[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: Category | 'All';
  setSelectedCategory: (cat: Category | 'All') => void;
  addMap: (mapData: {
    title: string;
    description: string;
    category: Category;
    coverImage?: string;
    isPublic: boolean;
    center?: [number, number];
    zoom?: number;
  }) => string;
  updateMap: (id: string, updates: Partial<MapCollection>) => void;
  deleteMap: (id: string) => void;
  addLocation: (locData: {
    mapId: string;
    title: string;
    category: Category;
    description: string;
    latitude: number;
    longitude: number;
    elevationMeters?: number;
    notes?: string;
    tags: string[];
    photos: string[];
  }) => string;
  updateLocation: (id: string, updates: Partial<LocationItem>) => void;
  deleteLocation: (id: string) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  toasts: ToastInfo[];
  showToast: (message: string, type?: 'info' | 'success' | 'alert') => void;
  removeToast: (id: string) => void;
  temporaryPin: { lat: number; lng: number } | null;
  setTemporaryPin: (coords: { lat: number; lng: number } | null) => void;
  userCoords: { lat: number; lng: number } | null;
  requestUserLocation: () => Promise<{ lat: number; lng: number } | null>;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isAuthenticated = auth.status === 'authenticated';
  const currentScreen = useMemo(() => screenFromPath(pathname), [pathname]);
  const [profileEdits, setProfileEdits] = useState<Partial<UserProfile>>({});
  const [currentMapId, setCurrentMapId] = useState<string>('map_photography_spots');
  const [currentLocationId, setCurrentLocationId] = useState<string | null>('loc_railway_bridge');
  const [maps, setMaps] = useState<MapCollection[]>(initialMaps);
  const [locations, setLocations] = useState<LocationItem[]>(initialLocations);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [toasts, setToasts] = useState<ToastInfo[]>([]);
  const [temporaryPin, setTemporaryPin] = useState<{ lat: number; lng: number } | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pinpoint_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  // The logged-in user: real id and email from the backend, profile text from this browser
  const user: UserProfile | null = useMemo(() => {
    if (!auth.user) return null;
    const prefix = auth.user.email.split('@')[0];
    return {
      ...currentUserMock,
      id: String(auth.user.id),
      email: auth.user.email,
      name: prefix,
      handle: `@${prefix}`,
      bio: '',
      location: '',
      joinedDate: auth.user.created_at ?? currentUserMock.joinedDate,
      stats: {
        mapsCreated: maps.filter((m) => m.author.id === String(auth.user!.id)).length,
        locationsPinned: locations.filter((l) => l.author.id === String(auth.user!.id)).length,
        photosAttached: locations
          .filter((l) => l.author.id === String(auth.user!.id))
          .reduce((n, l) => n + l.photos.length, 0),
        contributionsVerified: 0,
      },
      ...profileEdits,
    };
  }, [auth.user, profileEdits, maps, locations]);

  useEffect(() => {
    setProfileEdits(auth.user ? readProfile(auth.user.id) : {});
  }, [auth.user]);

  // Keep the selected map / location in step with the URL (refresh, back, shared links)
  useEffect(() => {
    const mapMatch = pathname.match(/^\/(?:explore\/)?maps\/([^/]+)$/);
    if (mapMatch && mapMatch[1] !== 'new') setCurrentMapId(mapMatch[1]);
    const locMatch = pathname.match(/^\/locations\/([^/]+)$/);
    if (locMatch && locMatch[1] !== 'new') setCurrentLocationId(locMatch[1]);
    window.scrollTo({ top: 0 });
  }, [pathname]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('pinpoint_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
  };

  const showToast = (message: string, type: 'info' | 'success' | 'alert' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const navigateTo = (screen: AppScreen, params?: NavigationParams) => {
    const mapId = params?.mapId ?? currentMapId;
    const locationId = params?.locationId !== undefined ? params.locationId : currentLocationId;
    if (params?.mapId) {
      setCurrentMapId(params.mapId);
    }
    if (params?.locationId !== undefined) {
      setCurrentLocationId(params.locationId);
    }
    navigate(pathForScreen(screen, mapId, locationId));
  };

  const logout = () => {
    auth.logout();
    navigate('/');
    showToast('Signed out of PinPoint', 'info');
  };

  const saveProfileDetails = (details: { name: string; handle: string }) => {
    if (!auth.user) return;
    const handle = details.handle.startsWith('@') ? details.handle : `@${details.handle}`;
    const edits = { name: details.name, handle };
    localStorage.setItem(PROFILE_KEY(auth.user.id), JSON.stringify(edits));
    setProfileEdits(edits);
  };

  const publicLocations = locations.filter((l) => l.mapId === PUBLIC_MAP_ID || l.isPublic);

  const publicMapCollection: MapCollection = {
    id: PUBLIC_MAP_ID,
    title: 'The Public Map',
    description: 'The single shared global map contributed by the PinPoint community.',
    category: 'Urban Exploration',
    coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    isPublic: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: new Date().toISOString(),
    locationCount: publicLocations.length,
    center: [30.2672, -97.7431],
    zoom: 13,
    author: {
      id: 'pinpoint_community',
      name: 'PinPoint Community',
      role: 'Global',
    },
  };

  const activeMap =
    currentMapId === PUBLIC_MAP_ID
      ? publicMapCollection
      : maps.find((m) => m.id === currentMapId) || maps[0] || publicMapCollection;

  const activeLocation = locations.find((l) => l.id === currentLocationId);

  const activeMapLocations =
    currentMapId === PUBLIC_MAP_ID
      ? publicLocations
      : locations.filter((l) => l.mapId === currentMapId);

  const addMap = (mapData: {
    title: string;
    description: string;
    category: Category;
    coverImage?: string;
    isPublic: boolean;
    center?: [number, number];
    zoom?: number;
  }) => {
    const id = `map_${Date.now()}`;
    const newMap: MapCollection = {
      id,
      title: mapData.title,
      description: mapData.description,
      category: mapData.category,
      coverImage:
        mapData.coverImage ||
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
      isPublic: mapData.isPublic,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      locationCount: 0,
      center: mapData.center || [30.2672, -97.7431],
      zoom: mapData.zoom || 13,
      author: {
        id: user?.id || 'usr_guest',
        name: user?.name || 'Anonymous User',
        avatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80',
        role: 'Creator',
      },
      savedCount: 0,
    };

    setMaps((prev) => [newMap, ...prev]);
    showToast(`Created new map: "${newMap.title}"`, 'success');
    return id;
  };

  const updateMap = (id: string, updates: Partial<MapCollection>) => {
    setMaps((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m
      )
    );
    showToast('Map details updated', 'info');
  };

  const deleteMap = (id: string) => {
    const mapToDelete = maps.find((m) => m.id === id);
    setMaps((prev) => prev.filter((m) => m.id !== id));
    setLocations((prev) => prev.filter((l) => l.mapId !== id));
    if (currentMapId === id) {
      const remaining = maps.filter((m) => m.id !== id);
      if (remaining.length > 0) {
        setCurrentMapId(remaining[0].id);
      }
    }
    showToast(`Deleted map "${mapToDelete?.title || 'Map'}"`, 'info');
  };

  const addLocation = (locData: {
    mapId: string;
    title: string;
    category: Category;
    description: string;
    latitude: number;
    longitude: number;
    elevationMeters?: number;
    notes?: string;
    tags: string[];
    photos: string[];
  }) => {
    const id = `loc_${Date.now()}`;
    const isContributedToPublic = locData.mapId === PUBLIC_MAP_ID;
    const newLoc: LocationItem = {
      id,
      mapId: locData.mapId,
      title: locData.title,
      category: locData.category,
      description: locData.description,
      latitude: Number(locData.latitude.toFixed(6)),
      longitude: Number(locData.longitude.toFixed(6)),
      elevationMeters: locData.elevationMeters || 150,
      utmReference: `14R ${Math.round(600000 + Math.random() * 30000)} ${Math.round(3340000 + Math.random() * 15000)}`,
      plusCode: `8624${Math.floor(1000 + Math.random() * 9000)}+${Math.floor(10 + Math.random() * 90)}`,
      photos: locData.photos.length > 0 ? locData.photos : [
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80'
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: {
        id: user?.id || 'usr_guest',
        name: user?.name || 'Explorer',
        avatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80',
      },
      isVerified: false,
      isPublic: isContributedToPublic,
      notes: locData.notes,
      tags: locData.tags,
    };

    setLocations((prev) => [newLoc, ...prev]);
    // update locationCount on parent map if it's a private workspace
    if (!isContributedToPublic) {
      setMaps((prev) =>
        prev.map((m) =>
          m.id === locData.mapId
            ? { ...m, locationCount: m.locationCount + 1, updatedAt: new Date().toISOString() }
            : m
        )
      );
    }
    setTemporaryPin(null);
    if (isContributedToPublic) {
      showToast(`Contributed "${newLoc.title}" to The Public Map!`, 'success');
    } else {
      showToast(`Added location "${newLoc.title}" to private workspace`, 'success');
    }
    return id;
  };

  const updateLocation = (id: string, updates: Partial<LocationItem>) => {
    setLocations((prev) =>
      prev.map((loc) =>
        loc.id === id ? { ...loc, ...updates, updatedAt: new Date().toISOString() } : loc
      )
    );
    showToast('Location updated', 'info');
  };

  const deleteLocation = (id: string) => {
    const locToDelete = locations.find((l) => l.id === id);
    if (locToDelete) {
      setMaps((prev) =>
        prev.map((m) =>
          m.id === locToDelete.mapId
            ? { ...m, locationCount: Math.max(0, m.locationCount - 1) }
            : m
        )
      );
    }
    setLocations((prev) => prev.filter((loc) => loc.id !== id));
    if (currentLocationId === id) {
      setCurrentLocationId(null);
    }
    showToast(`Deleted location "${locToDelete?.title || 'Location'}"`, 'info');
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    if (auth.user) {
      const edits = { ...readProfile(auth.user.id), ...updates };
      localStorage.setItem(PROFILE_KEY(auth.user.id), JSON.stringify(edits));
      setProfileEdits(edits);
    }
    showToast('Profile preferences updated', 'success');
  };

  const requestUserLocation = async (): Promise<{ lat: number; lng: number } | null> => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'alert');
      return null;
    }
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            lat: Number(pos.coords.latitude.toFixed(6)),
            lng: Number(pos.coords.longitude.toFixed(6)),
          };
          setUserCoords(coords);
          showToast(`Location acquired: ${coords.lat}, ${coords.lng}`, 'success');
          resolve(coords);
        },
        (err) => {
          console.warn('Geolocation error:', err.message);
          // Fallback to default Austin coordinates for demo
          const fallback = { lat: 30.2672, lng: -97.7431 };
          setUserCoords(fallback);
          showToast('Using local spatial reference (Austin, TX)', 'info');
          resolve(fallback);
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    });
  };

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthenticated,
        logout,
        saveProfileDetails,
        currentScreen,
        navigateTo,
        currentMapId,
        setCurrentMapId,
        currentLocationId,
        setCurrentLocationId,
        maps,
        locations,
        activeMap,
        activeLocation,
        activeMapLocations,
        publicLocations,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        addMap,
        updateMap,
        deleteMap,
        addLocation,
        updateLocation,
        deleteLocation,
        updateProfile,
        toasts,
        showToast,
        removeToast,
        temporaryPin,
        setTemporaryPin,
        userCoords,
        requestUserLocation,
        theme,
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
