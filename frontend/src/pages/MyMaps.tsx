import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  Folder,
  Plus,
  Search,
  Globe,
  Lock,
  ExternalLink,
  Trash2,
  Edit,
  Share2,
  MapPin,
} from 'lucide-react';

export const MyMaps: React.FC = () => {
  const { maps, user, deleteMap, navigateTo, showToast } = useApp();
  const [search, setSearch] = useState('');

  // User's private maps
  const userMaps = maps.filter((m) => m.author.id === user?.id);

  const filteredMaps = userMaps.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase()) ||
      m.category.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}" and its workspace?`)) {
      deleteMap(id);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] dark:bg-[#15171A] flex flex-col text-left transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-[#1A1D23] border-b border-[#D9D6CF] dark:border-[#2D333D] px-4 md:px-8 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Folder className="w-4 h-4 text-[#C84B31] dark:text-[#E26D54]" />
              <span className="text-xs font-mono uppercase tracking-widest text-[#68655F] dark:text-[#9C978D]">
                Personal Workspaces
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#171717] dark:text-[#F0EDE6] font-bold">
              My Maps
            </h1>
            <p className="text-xs text-[#68655F] dark:text-[#9C978D] mt-1 max-w-xl">
              Your private map workspaces. Create and organize custom collections of locations for research, photography, and personal trips.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="md"
              icon={<Globe className="w-3.5 h-3.5 text-[#3F6B4A] dark:text-[#529E68]" />}
              onClick={() => navigateTo('explore')}
            >
              The Public Map
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={<Plus className="w-3.5 h-3.5 stroke-[2.5]" />}
              onClick={() => navigateTo('create-map')}
            >
              Create Map
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Toolbar & Info Notice */}
      <div className="max-w-6xl mx-auto w-full px-4 md:px-8 pt-6 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#68655F] dark:text-[#9C978D]">
              {userMaps.length} {userMaps.length === 1 ? 'private workspace' : 'private workspaces'}
            </span>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-[#68655F] dark:text-[#9C978D] absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your private maps..."
              className="w-full h-8 pl-8 pr-3 text-xs bg-white dark:bg-[#242930] text-[#171717] dark:text-[#F0EDE6] placeholder:text-[#68655F]/70 dark:placeholder:text-[#9C978D]/70 rounded-[6px] border border-[#D9D6CF] dark:border-[#2D333D] focus:outline-none focus:border-[#171717] dark:focus:border-[#E26D54]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-xs text-[#68655F] dark:text-[#9C978D] hover:text-[#171717] dark:hover:text-[#F0EDE6] cursor-pointer"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Maps Table / List */}
      <div className="max-w-6xl mx-auto w-full p-4 md:p-8 flex-1">
        {filteredMaps.length === 0 ? (
          <div className="bg-white dark:bg-[#1E2228] rounded-[6px] border border-[#D9D6CF] dark:border-[#2D333D] p-12 text-center">
            <Folder className="w-8 h-8 text-[#68655F]/40 dark:text-[#9C978D]/40 mx-auto mb-2" />
            <h3 className="font-serif text-xl text-[#171717] dark:text-[#F0EDE6]">No private maps found</h3>
            <p className="text-xs text-[#68655F] dark:text-[#9C978D] mt-1">
              {search
                ? 'No workspaces match your search query.'
                : 'Create your first private workspace to begin mapping field locations.'}
            </p>
            <Button
              variant="primary"
              size="sm"
              className="mt-4"
              onClick={() => navigateTo('create-map')}
            >
              Create Map
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMaps.map((map) => (
              <div
                key={map.id}
                className="bg-white dark:bg-[#1E2228] rounded-[6px] border border-[#D9D6CF] dark:border-[#2D333D] hover:border-[#171717] dark:hover:border-[#E26D54] transition-all p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs"
              >
                {/* Left: Thumbnail & Details */}
                <div className="flex items-start gap-4 flex-1">
                  <img
                    src={map.coverImage}
                    alt={map.title}
                    className="w-20 h-20 rounded-[4px] object-cover border border-[#D9D6CF] dark:border-[#2D333D] shrink-0 bg-[#E9E6DE] dark:bg-[#242930]"
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-[#F7F5F0] dark:bg-[#242930] text-[#171717] dark:text-[#F0EDE6] rounded-[3px] border border-[#D9D6CF] dark:border-[#2D333D]">
                        {map.category}
                      </span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono bg-[#FAF0ED] dark:bg-[#341B18]/70 text-[#C84B31] dark:text-[#E26D54] rounded-[3px] border border-[#E8BFB5]/50 dark:border-[#52251F]">
                        <Lock className="w-2.5 h-2.5" /> Private Workspace
                      </span>
                    </div>

                    <h3 className="font-serif text-xl font-bold text-[#171717] dark:text-[#F0EDE6]">
                      {map.title}
                    </h3>
                    <p className="text-xs text-[#68655F] dark:text-[#9C978D] mt-1 line-clamp-1 max-w-xl">
                      {map.description}
                    </p>

                    <div className="mt-2 flex items-center gap-4 text-[11px] font-mono text-[#68655F] dark:text-[#9C978D]">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#C84B31] dark:text-[#E26D54]" />
                        {map.locationCount} {map.locationCount === 1 ? 'place' : 'places'}
                      </span>
                      <span>
                        Updated {new Date(map.updatedAt).toLocaleDateString()}
                      </span>
                      <span>
                        Center: {map.center[0].toFixed(2)}°, {map.center[1].toFixed(2)}°
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-[#D9D6CF] dark:border-[#2D333D]">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Plus className="w-3 h-3" />}
                    onClick={() => navigateTo('add-location', { mapId: map.id })}
                  >
                    Add Location
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    icon={<ExternalLink className="w-3.5 h-3.5" />}
                    onClick={() => navigateTo('map-workspace', { mapId: map.id })}
                  >
                    Open Workspace
                  </Button>

                  <button
                    onClick={() => handleDelete(map.id, map.title)}
                    className="p-2 text-[#68655F] dark:text-[#9C978D] hover:text-[#C84B31] dark:hover:text-[#E26D54] rounded-[4px] hover:bg-[#FDF2F0] dark:hover:bg-[#341B18]/60 transition-colors cursor-pointer"
                    title="Delete Map"
                    aria-label="Delete Map"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
