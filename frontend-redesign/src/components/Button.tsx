import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'dark';

const variants: Record<Variant, string> = {
  primary: 'border-ink bg-orange text-white',
  secondary: 'border-ink bg-cream text-ink',
  ghost: 'border-ink bg-transparent text-ink hover:bg-cream',
  dark: 'border-ink bg-ink text-white',
};

export function Button({
  variant = 'secondary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const shadow =
    variant === 'ghost'
      ? ''
      : 'shadow-stamp hover:-translate-y-px hover:shadow-stamp-hover active:translate-y-0.5 active:shadow-stamp-press';
  return (
    <button
      {...props}
      className={`rounded-lg border-2 px-5 py-2 font-display text-base font-bold transition-transform ${variants[variant]} ${shadow} ${className}`}
    />
  );
}
