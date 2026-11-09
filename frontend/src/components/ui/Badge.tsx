import React from 'react';

export interface BadgeProps {
  variant?: 'neutral' | 'accent' | 'success' | 'outline';
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  className = '',
  icon,
}) => {
  const baseStyles =
    'inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-[4px] border uppercase tracking-wider select-none';

  const variantStyles = {
    neutral:
      'bg-[#F7F5F0] dark:bg-[#242930] text-[#68655F] dark:text-[#9C978D] border-[#D9D6CF] dark:border-[#2D333D]',
    accent:
      'bg-[#FAF0ED] dark:bg-[#341B18] text-[#C84B31] dark:text-[#E26D54] border-[#E8BFB5] dark:border-[#52251F]',
    success:
      'bg-[#EEF4F0] dark:bg-[#1C2C20] text-[#3F6B4A] dark:text-[#529E68] border-[#BDD3C3] dark:border-[#25422C]',
    outline:
      'bg-white dark:bg-[#1E2228] text-[#171717] dark:text-[#F0EDE6] border-[#D9D6CF] dark:border-[#2D333D]',
  };

  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
};
