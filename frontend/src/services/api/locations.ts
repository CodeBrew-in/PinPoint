import { LocationItem, Category, Author } from '../../types';
import { initialLocations } from '../../data/mockData';

let storedLocations: LocationItem[] = [...initialLocations];

export interface CreateLocationDTO {
  mapId: string;
  title: string;
  description: string;
  category: Category;
  latitude: number;
  longitude: number;
  photos: string[];
  tags?: string[];
  notes?: string;
}

export interface UpdateLocationDTO {
  title?: string;
  description?: string;
  category?: Category;
  latitude?: number;
  longitude?: number;
  photos?: string[];
  tags?: string[];
  notes?: string;
  isVerified?: boolean;
}

/**
 * Locations Service layer
 * Prepared for clean replacement with FastAPI endpoints (/api/locations/...)
 */
export const locationsService = {
  async getLocations(mapId?: string): Promise<LocationItem[]> {
    if (mapId) {
      return storedLocations.filter((loc) => loc.mapId === mapId);
    }
    return [...storedLocations];
  },

  async getLocationById(id: string): Promise<LocationItem | null> {
    const loc = storedLocations.find((l) => l.id === id);
    return loc || null;
  },

  async createLocation(dto: CreateLocationDTO, author: Author): Promise<LocationItem> {
    const newLoc: LocationItem = {
      id: `loc_${Date.now()}`,
      mapId: dto.mapId,
      title: dto.title,
      description: dto.description,
      category: dto.category,
      latitude: Number(dto.latitude.toFixed(6)),
      longitude: Number(dto.longitude.toFixed(6)),
      photos:
        dto.photos && dto.photos.length > 0
          ? dto.photos
          : [
              'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80',
            ],
      author,
      tags: dto.tags || [],
      notes: dto.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    storedLocations = [newLoc, ...storedLocations];
    return newLoc;
  },

  async updateLocation(id: string, updates: UpdateLocationDTO): Promise<LocationItem> {
    const index = storedLocations.findIndex((l) => l.id === id);
    if (index === -1) throw new Error(`Location not found: ${id}`);
    const updated = {
      ...storedLocations[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    storedLocations[index] = updated;
    return updated;
  },

  async deleteLocation(id: string): Promise<void> {
    storedLocations = storedLocations.filter((l) => l.id !== id);
  },
};
