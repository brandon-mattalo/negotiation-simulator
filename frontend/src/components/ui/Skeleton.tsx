import React from 'react';
import clsx from 'clsx';

export interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className,
}) => {
  const baseStyles = 'animate-pulse bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%]';

  const variantStyles = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={clsx(baseStyles, variantStyles[variant], className)}
      style={style}
    />
  );
};

export const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-3xl shadow-soft border border-neutral-200 p-6 space-y-4">
    <Skeleton variant="rectangular" height={24} width="60%" />
    <div className="space-y-2">
      <Skeleton variant="text" width="100%" />
      <Skeleton variant="text" width="90%" />
      <Skeleton variant="text" width="70%" />
    </div>
  </div>
);

export const SkeletonStatCard: React.FC = () => (
  <div className="bg-primary-50 rounded-3xl shadow-soft border border-primary-200 p-6">
    <div className="flex items-start justify-between">
      <div className="flex-1 space-y-3">
        <Skeleton variant="text" width="40%" height={16} />
        <Skeleton variant="rectangular" width="60%" height={36} />
      </div>
      <Skeleton variant="circular" width={48} height={48} />
    </div>
  </div>
);
