export type Category = 
  | 'Architecture' 
  | 'Nature & Trails' 
  | 'Street Art' 
  | 'Photography' 
  | 'Historic' 
  | 'Food & Drinks' 
  | 'Urban Exploration';

export interface Author {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
}

export const PUBLIC_MAP_ID = 'public_map';

export interface LocationItem {
  id: string;
  mapId: string; // 'public_map' for the single shared Public Map, or a user's private map ID
  title: string;
  description: string;
  category: Category;
  latitude: number;
  longitude: number;
  elevationMeters?: number;
  utmReference?: string;
  plusCode?: string;
  photos: string[];
  author: Author;
  tags?: string[];
  notes?: string;
  isVerified?: boolean;
  isPublic?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MapCollection {
  id: string;
  title: string;
  description: string;
  category: Category;
  coverImage: string;
  isPublic: boolean;
  center: [number, number]; // [lat, lng]
  zoom: number;
  author: Author;
  locationCount: number;
  savedCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  handle: string;
  avatar: string;
  bio: string;
  location: string;
  joinedDate: string;
  preferredUnits?: 'metric' | 'imperial';
  defaultCoordinates?: [number, number];
  role?: string;
  stats: {
    mapsCreated: number;
    locationsPinned: number;
    photosAttached: number;
    contributionsVerified?: number;
  };
}

export type AppScreen =
  // Public screens
  | 'home'
  | 'explore'
  | 'public-map'
  | 'pricing'
  | 'support'
  | 'sign-in'
  | 'sign-up'
  // Authenticated screens
  | 'dashboard'
  | 'my-maps'
  | 'map-workspace'
  | 'location-details'
  | 'create-map'
  | 'add-location'
  | 'profile';
