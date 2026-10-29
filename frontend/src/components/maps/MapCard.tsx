import React from 'react';
import { MapCollection } from '../../types';
import { Badge } from '../ui/Badge';
import { MapPin, Globe, Lock, Bookmark, Calendar } from 'lucide-react';

interface MapCardProps {
  map: MapCollection;
  onClick?: () => void;
  onOpenWorkspace?: () => void;
}

export const MapCard: React.FC<MapCardProps> = ({
  map,
  onClick,
  onOpenWorkspace,
}) => {
  return (
    <div
      onClick={onClick}
      className="group bg-white dark:bg-[#1E2228] rounded-[6px] border border-[#D9D6CF] dark:border-[#2D333D] hover:border-[#171717] dark:hover:border-[#E26D54] transition-all cursor-pointer overflow-hidden flex flex-col text-left"
    >
      {/* Cover Image */}
      <div className="relative h-44 bg-[#E9E6DE] dark:bg-[#242930] overflow-hidden">
        <img
          src={map.coverImage}
          alt={map.title}
          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-white/95 dark:bg-[#1E2228]/95 text-[#171717] dark:text-[#F0EDE6] rounded-[3px] border border-[#D9D6CF] dark:border-[#2D333D] shadow-xs">
            {map.category}
          </span>
        </div>

        <div className="absolute top-3 right-3 flex items-center gap-1">
          {map.isPublic ? (
            <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] bg-white/95 dark:bg-[#1E2228]/95 text-[#171717] dark:text-[#F0EDE6] rounded-[3px] border border-[#D9D6CF] dark:border-[#2D333D] shadow-xs">
              <Globe className="w-3 h-3 text-[#68655F] dark:text-[#9C978D]" />
              Public
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] bg-[#FAF0ED]/95 dark:bg-[#341B18]/95 text-[#C84B31] dark:text-[#E26D54] rounded-[3px] border border-[#E8BFB5] dark:border-[#52251F] shadow-xs font-medium">
              <Lock className="w-3 h-3" />
              Private
            </span>
          )}
        </div>

        {/* Location Count pill */}
        <div className="absolute bottom-2.5 left-3 flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono bg-[#171717]/85 dark:bg-[#15171A]/90 text-white rounded-[3px] backdrop-blur-xs">
          <MapPin className="w-3 h-3 text-[#C84B31] dark:text-[#E26D54]" />
          <span>{map.locationCount} {map.locationCount === 1 ? 'place' : 'places'}</span>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-serif text-xl font-bold text-[#171717] dark:text-[#F0EDE6] group-hover:text-[#C84B31] dark:group-hover:text-[#E26D54] transition-colors leading-tight">
            {map.title}
          </h3>
          <p className="text-xs text-[#68655F] dark:text-[#9C978D] mt-1.5 line-clamp-2 leading-relaxed">
            {map.description}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-[#D9D6CF] dark:border-[#2D333D] flex items-center justify-between text-xs text-[#68655F] dark:text-[#9C978D]">
          {/* Author info */}
          <div className="flex items-center gap-2">
            <img
              src={map.author.avatar}
              alt={map.author.name}
              className="w-5 h-5 rounded-[3px] object-cover border border-[#D9D6CF] dark:border-[#2D333D]"
            />
            <span className="text-xs text-[#171717] dark:text-[#F0EDE6] font-medium truncate max-w-[120px]">
              {map.author.name}
            </span>
          </div>

          {onOpenWorkspace ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenWorkspace();
              }}
              className="text-xs font-medium text-[#C84B31] dark:text-[#E26D54] hover:text-[#963723] dark:hover:text-[#F2947D] transition-colors cursor-pointer"
            >
              Open Map →
            </button>
          ) : (
            <span className="text-[11px] font-mono text-[#68655F] dark:text-[#9C978D]">
              {map.savedCount} saves
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
