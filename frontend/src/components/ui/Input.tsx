import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  error,
  icon,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5 text-left">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-[#171717] dark:text-[#F0EDE6] flex items-center justify-between"
        >
          <span>{label}</span>
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <span className="absolute left-3 text-[#68655F] dark:text-[#9C978D] pointer-events-none flex items-center">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={`w-full bg-white dark:bg-[#1E2228] text-[#171717] dark:text-[#F0EDE6] placeholder:text-[#68655F]/60 dark:placeholder:text-[#9C978D]/60 text-sm rounded-[6px] border ${
            error ? 'border-[#C84B31] dark:border-[#E26D54]' : 'border-[#D9D6CF] dark:border-[#2D333D]'
          } px-3 py-2 ${icon ? 'pl-9' : ''} focus:outline-none focus:border-[#171717] dark:focus:border-[#E26D54] focus:ring-1 focus:ring-[#171717] dark:focus:ring-[#E26D54] transition-all disabled:bg-[#F7F5F0] dark:disabled:bg-[#15171A] disabled:text-[#68655F] dark:disabled:text-[#9C978D] ${className}`}
          {...props}
        />
      </div>
      {error ? (
        <p className="text-xs text-[#C84B31] dark:text-[#E26D54]">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-[#68655F] dark:text-[#9C978D]">{helperText}</p>
      ) : null}
    </div>
  );
};

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  helperText,
  error,
  className = '',
  id,
  rows = 3,
  ...props
}) => {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5 text-left">
      {label && (
        <label
          htmlFor={textareaId}
          className="text-xs font-medium text-[#171717] dark:text-[#F0EDE6]"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        className={`w-full bg-white dark:bg-[#1E2228] text-[#171717] dark:text-[#F0EDE6] placeholder:text-[#68655F]/60 dark:placeholder:text-[#9C978D]/60 text-sm rounded-[6px] border ${
          error ? 'border-[#C84B31] dark:border-[#E26D54]' : 'border-[#D9D6CF] dark:border-[#2D333D]'
        } px-3 py-2 focus:outline-none focus:border-[#171717] dark:focus:border-[#E26D54] focus:ring-1 focus:ring-[#171717] dark:focus:ring-[#E26D54] transition-all disabled:bg-[#F7F5F0] dark:disabled:bg-[#15171A] ${className}`}
        {...props}
      />
      {error ? (
        <p className="text-xs text-[#C84B31] dark:text-[#E26D54]">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-[#68655F] dark:text-[#9C978D]">{helperText}</p>
      ) : null}
    </div>
  );
};
