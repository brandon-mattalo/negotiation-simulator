import React from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';

export interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  title,
  subtitle,
  actions,
}) => {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="md:ml-20 pt-16 md:pt-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="container mx-auto px-4 sm:px-6 py-6 md:py-8 max-w-7xl"
        >
          {(title || subtitle || actions) && (
            <div className="mb-6 md:mb-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  {title && (
                    <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-2">
                      {title}
                    </h1>
                  )}
                  {subtitle && (
                    <p className="text-base md:text-lg text-neutral-600">{subtitle}</p>
                  )}
                </div>
                {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
              </div>
            </div>
          )}
          {children}
        </motion.div>
      </div>
    </div>
  );
};
