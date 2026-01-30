import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: 'lavender' | 'sky' | 'rose' | 'mint' | 'primary';
  trend?: {
    value: string;
    direction: 'up' | 'down';
  };
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color = 'primary',
  trend,
  className,
}) => {
  const colorStyles = {
    lavender: {
      bg: 'bg-lavender-50',
      iconBg: 'bg-lavender-100',
      iconText: 'text-lavender-600',
      border: 'border-lavender-200',
    },
    sky: {
      bg: 'bg-sky-50',
      iconBg: 'bg-sky-100',
      iconText: 'text-sky-600',
      border: 'border-sky-200',
    },
    rose: {
      bg: 'bg-rose-50',
      iconBg: 'bg-rose-100',
      iconText: 'text-rose-600',
      border: 'border-rose-200',
    },
    mint: {
      bg: 'bg-mint-50',
      iconBg: 'bg-mint-100',
      iconText: 'text-mint-600',
      border: 'border-mint-200',
    },
    primary: {
      bg: 'bg-primary-50',
      iconBg: 'bg-primary-100',
      iconText: 'text-primary-600',
      border: 'border-primary-200',
    },
  };

  const styles = colorStyles[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={clsx(
        'rounded-3xl p-6 shadow-soft border transition-all duration-200 hover:shadow-soft-md',
        styles.bg,
        styles.border,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-600 mb-2">{title}</p>
          <p className="text-4xl font-bold text-neutral-900 mb-1">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 text-sm">
              <span
                className={clsx(
                  'font-medium',
                  trend.direction === 'up' ? 'text-success-600' : 'text-danger-600'
                )}
              >
                {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div
            className={clsx(
              'rounded-2xl p-3 shadow-soft',
              styles.iconBg,
              styles.iconText
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
};
