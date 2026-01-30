import React from 'react';
import clsx from 'clsx';

export interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name,
  size = 'md',
  className,
}) => {
  const sizeStyles = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getGradient = (name: string) => {
    const gradients = [
      'from-primary-400 to-primary-600',
      'from-lavender-400 to-lavender-600',
      'from-sky-400 to-sky-600',
      'from-rose-400 to-rose-600',
      'from-mint-400 to-mint-600',
    ];

    const charCode = name.charCodeAt(0);
    return gradients[charCode % gradients.length];
  };

  return (
    <div
      className={clsx(
        'relative inline-flex items-center justify-center rounded-full overflow-hidden flex-shrink-0',
        sizeStyles[size],
        className
      )}
    >
      {src ? (
        <img src={src} alt={alt || name || 'Avatar'} className="w-full h-full object-cover" />
      ) : (
        <div
          className={clsx(
            'w-full h-full flex items-center justify-center font-semibold text-white bg-gradient-to-br',
            name && getGradient(name)
          )}
        >
          {name ? getInitials(name) : '?'}
        </div>
      )}
    </div>
  );
};
