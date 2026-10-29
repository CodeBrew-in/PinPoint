import React from 'react';
import { LocationItem } from '../../types';
import { Badge } from '../ui/Badge';
import { MapPin, CheckCircle2, Clock, Image as ImageIcon } from 'lucide-react';

interface LocationCardProps {
  location: LocationItem;
  isSelected?: boolean;
  onClick?: () => void;
  onViewDetails?: () => void;
}

export const LocationCard: React.FC<LocationCardProps> = ({
  location,
  isSelected = false,
  onClick,
  onViewDetails,
}) => {
  return (
    <div
      onClick={onClick}
      className={`group bg-white dark:bg-[#1E2228] rounded-[6px] border ${
        isSelected
          ? 'border-[#171717] dark:border-[#E26D54] ring-1 ring-[#171717] dark:ring-[#E26D54]'
          : 'border-[#D9D6CF] dark:border-[#2D333D]'
      } hover:border-[#171717] dark:hover:border-[#E26D54] transition-all cursor-pointer overflow-hidden flex flex-col text-left`}
    >
      {/* Card Header Media */}
      <div className="relative h-44 bg-[#E9E6DE] dark:bg-[#242930] overflow-hidden">
        {location.photos?.[0] ? (
          <img
            src={location.photos[0]}
            alt={location.title}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#68655F] dark:text-[#9C978D]">
            <ImageIcon className="w-8 h-8 opacity-40" />
          </div>
        )}

        {/* Category Badge Floating */}
        <div className="absolute top-3 left-3">
          <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-white/95 dark:bg-[#1E2228]/95 text-[#171717] dark:text-[#F0EDE6] rounded-[3px] border border-[#D9D6CF] dark:border-[#2D333D] shadow-xs">
            {location.category}
          </span>
        </div>

        {/* Verification Status */}
        {location.isVerified && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 text-[10px] bg-[#EEF4F0]/95 dark:bg-[#1C2C20]/95 text-[#3F6B4A] dark:text-[#529E68] rounded-[3px] border border-[#BDD3C3] dark:border-[#25422C] shadow-xs font-medium">
            <CheckCircle2 className="w-3 h-3" />
            Verified
          </div>
        )}

        {/* Photo count indicator */}
        {location.photos?.length > 1 && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 text-[10px] font-mono bg-black/60 text-white rounded-[3px]">
            {location.photos.length} photos
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-base text-[#171717] dark:text-[#F0EDE6] group-hover:text-[#C84B31] dark:group-hover:text-[#E26D54] transition-colors leading-snug">
            {location.title}
          </h3>
          <p className="text-xs text-[#68655F] dark:text-[#9C978D] mt-1.5 line-clamp-2 leading-relaxed">
            {location.description}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-[#D9D6CF] dark:border-[#2D333D] flex items-center justify-between text-[11px] text-[#68655F] dark:text-[#9C978D]">
          <span className="font-mono flex items-center gap-1 text-[#171717] dark:text-[#F0EDE6]">
            <MapPin className="w-3 h-3 text-[#C84B31] dark:text-[#E26D54]" />
            {location.latitude.toFixed(4)}°, {location.longitude.toFixed(4)}°
          </span>

          {onViewDetails && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails();
              }}
              className="text-[#171717] dark:text-[#F0EDE6] font-medium hover:text-[#C84B31] dark:hover:text-[#E26D54] transition-colors underline underline-offset-2"
            >
              View Details →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
