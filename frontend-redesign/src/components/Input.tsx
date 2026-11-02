import type { InputHTMLAttributes } from 'react';

export function Input({
  label,
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="label mb-1 block">{label}</span>}
      <input
        {...props}
        className={`w-full rounded-lg border-2 border-ink bg-cream px-3 py-2 text-[15px] placeholder:text-ink/50 focus:shadow-stamp ${className}`}
      />
    </label>
  );
}
