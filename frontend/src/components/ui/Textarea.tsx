import React from 'react';
import clsx from 'clsx';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className, ...props }, ref) => {
    const textareaBaseStyles =
      'w-full rounded-xl border px-4 py-2.5 text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 resize-vertical min-h-[100px]';

    const textareaStateStyles = error
      ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500'
      : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500';

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={clsx(textareaBaseStyles, textareaStateStyles, className)}
          {...props}
        />
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

Textarea.displayName = 'Textarea';
