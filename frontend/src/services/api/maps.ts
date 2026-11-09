import { MapCollection, Category, Author } from '../../types';
import { initialMaps } from '../../data/mockData';

let storedMaps: MapCollection[] = [...initialMaps];

export interface CreateMapDTO {
  title: string;
  description: string;
  category: Category;
  coverImage?: string;
  isPublic: boolean;
  center?: [number, number];
  zoom?: number;
}

export interface UpdateMapDTO {
  title?: string;
  description?: string;
  category?: Category;
  coverImage?: string;
  isPublic?: boolean;
  center?: [number, number];
  zoom?: number;
}

/**
 * Maps Service layer
 * Prepared for clean replacement with FastAPI endpoints (/api/maps/...)
 */
export const mapsService = {
  async getMaps(options?: {
    category?: Category | 'All';
    search?: string;
    publicOnly?: boolean;
  }): Promise<MapCollection[]> {
    let result = [...storedMaps];
    if (options?.publicOnly) {
      result = result.filter((m) => m.isPublic);
    }
    if (options?.category && options.category !== 'All') {
      result = result.filter((m) => m.category === options.category);
    }
    if (options?.search) {
      const q = options.search.toLowerCase();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q)
      );
    }
    return result;
  },

  async getMapById(id: string): Promise<MapCollection | null> {
    const map = storedMaps.find((m) => m.id === id);
    return map || null;
  },

  async createMap(dto: CreateMapDTO, author: Author): Promise<MapCollection> {
    const newMap: MapCollection = {
      id: `map_${Date.now()}`,
      title: dto.title,
      description: dto.description,
      category: dto.category,
      coverImage:
        dto.coverImage ||
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
      isPublic: dto.isPublic,
      center: dto.center || [30.3302, 76.4008],
      zoom: dto.zoom || 13,
      author,
      locationCount: 0,
      savedCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    storedMaps = [newMap, ...storedMaps];
    return newMap;
  },

  async updateMap(id: string, updates: UpdateMapDTO): Promise<MapCollection> {
    const index = storedMaps.findIndex((m) => m.id === id);
    if (index === -1) throw new Error(`Map not found: ${id}`);
    const updated = {
      ...storedMaps[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    storedMaps[index] = updated;
    return updated;
  },

  async deleteMap(id: string): Promise<void> {
    storedMaps = storedMaps.filter((m) => m.id !== id);
  },
};
