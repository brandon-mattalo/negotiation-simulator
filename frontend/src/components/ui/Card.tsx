import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export interface CardProps {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  padding = 'md',
  hover = false,
  className,
  onClick,
}) => {
  const baseStyles = 'bg-white rounded-3xl shadow-soft border border-neutral-200';

  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const hoverStyles = hover
    ? 'cursor-pointer transition-all duration-200 hover:shadow-soft-md hover:-translate-y-0.5'
    : '';

  const Component = hover ? motion.div : 'div';

  return (
    <Component
      className={clsx(baseStyles, paddingStyles[padding], hoverStyles, className)}
      onClick={onClick}
      {...(hover && {
        whileHover: { scale: 1.01 },
        whileTap: { scale: 0.99 },
      })}
    >
      {children}
    </Component>
  );
};
