'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';

// Utility function for className merging
function clsx(...classes: (string | undefined | null | false | Record<string, boolean>)[]) {
  const classList: string[] = [];
  
  for (const item of classes) {
    if (!item) continue;
    
    if (typeof item === 'string') {
      classList.push(item);
    } else if (typeof item === 'object') {
      for (const [key, value] of Object.entries(item)) {
        if (value) classList.push(key);
      }
    }
  }
  
  return classList.join(' ');
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
  pill?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  pill = false,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const baseStyles = clsx(
    'inline-flex items-center justify-center font-semibold transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
    'transform active:scale-95',
    {
      'w-full': fullWidth,
      'rounded-full': pill,
      'rounded-lg': !pill,
    }
  );

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2.5',
    xl: 'px-8 py-4 text-xl gap-3',
  };

  const variantStyles = {
    primary: clsx(
      'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-lg',
      'hover:from-teal-700 hover:to-teal-800',
      'focus:ring-teal-500'
    ),
    secondary: clsx(
      'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg',
      'hover:from-blue-700 hover:to-blue-800',
      'focus:ring-blue-500'
    ),
    success: clsx(
      'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg',
      'hover:from-green-700 hover:to-green-800',
      'focus:ring-green-500'
    ),
    danger: clsx(
      'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg',
      'hover:from-red-700 hover:to-red-800',
      'focus:ring-red-500'
    ),
    warning: clsx(
      'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg',
      'hover:from-amber-600 hover:to-amber-700',
      'focus:ring-amber-500'
    ),
    ghost: clsx(
      'bg-transparent text-gray-700 hover:bg-gray-100',
      'focus:ring-gray-500'
    ),
    outline: clsx(
      'bg-transparent border-2 border-teal-600 text-teal-600',
      'hover:bg-teal-50 hover:border-teal-700 hover:text-teal-700',
      'focus:ring-teal-500'
    ),
  };

  return (
    <button
      className={clsx(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
