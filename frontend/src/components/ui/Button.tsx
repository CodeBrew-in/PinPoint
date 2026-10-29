import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-colors select-none focus:outline-none focus:ring-2 focus:ring-[#171717]/20 dark:focus:ring-white/20 disabled:opacity-50 disabled:pointer-events-none cursor-pointer text-left whitespace-nowrap';

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 rounded-[6px] gap-1.5 h-8',
    md: 'text-sm px-3.5 py-2 rounded-[6px] gap-2 h-9',
    lg: 'text-base px-4 py-2.5 rounded-[8px] gap-2.5 h-11',
  };

  const variantStyles = {
    primary:
      'bg-[#C84B31] hover:bg-[#963723] text-white border border-[#963723] shadow-xs active:bg-[#7e2e1c] dark:bg-[#C84B31] dark:hover:bg-[#D45B42] dark:border-[#E26D54]/50',
    secondary:
      'bg-white hover:bg-[#F7F5F0] text-[#171717] border border-[#D9D6CF] active:bg-[#E9E6DE] dark:bg-[#1E2228] dark:hover:bg-[#2A2F38] dark:text-[#F0EDE6] dark:border-[#2D333D] dark:active:bg-[#15171A]',
    outline:
      'bg-transparent hover:bg-white text-[#171717] border border-[#D9D6CF] dark:hover:bg-[#1E2228] dark:text-[#F0EDE6] dark:border-[#2D333D]',
    ghost:
      'bg-transparent hover:bg-[#E9E6DE]/60 text-[#68655F] hover:text-[#171717] dark:text-[#9C978D] dark:hover:bg-[#2A2F38] dark:hover:text-[#F0EDE6]',
    danger:
      'bg-white hover:bg-[#FDF2F0] text-[#C84B31] border border-[#D9D6CF] hover:border-[#C84B31] dark:bg-[#1E2228] dark:hover:bg-[#2E1D1B] dark:text-[#E26D54] dark:border-[#2D333D] dark:hover:border-[#E26D54]',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
