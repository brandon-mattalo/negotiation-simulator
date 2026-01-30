import React from 'react';
import clsx from 'clsx';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className,
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-full';

  const variantStyles = {
    primary: 'bg-primary-100 text-primary-700 border border-primary-200',
    success: 'bg-success-100 text-success-700 border border-success-200',
    warning: 'bg-warning-100 text-warning-700 border border-warning-200',
    danger: 'bg-danger-100 text-danger-700 border border-danger-200',
    neutral: 'bg-neutral-100 text-neutral-700 border border-neutral-200',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span className={clsx(baseStyles, variantStyles[variant], sizeStyles[size], className)}>
      {children}
    </span>
  );
};
