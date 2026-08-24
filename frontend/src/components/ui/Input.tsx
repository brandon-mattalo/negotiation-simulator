import React from 'react';
import clsx from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
  rightIconLabel?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, onRightIconClick, rightIconLabel, className, ...props }, ref) => {
    const inputBaseStyles =
      'w-full rounded-xl border px-4 py-2.5 text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1';

    const inputStateStyles = error
      ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500'
      : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500';

    const hasIcon = leftIcon || rightIcon;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={clsx(
              inputBaseStyles,
              inputStateStyles,
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            {...props}
          />
          {rightIcon && onRightIconClick && (
            <button
              type="button"
              onClick={onRightIconClick}
              aria-label={rightIconLabel}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 focus:outline-none"
              tabIndex={-1}
            >
              {rightIcon}
            </button>
          )}
          {rightIcon && !onRightIconClick && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-danger-600 animate-fade-in">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-neutral-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
