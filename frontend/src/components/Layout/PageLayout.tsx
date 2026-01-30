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
      <div className="ml-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="container mx-auto px-6 py-8 max-w-7xl"
        >
          {(title || subtitle || actions) && (
            <div className="mb-8">
              <div className="flex items-start justify-between">
                <div>
                  {title && (
                    <h1 className="text-4xl font-bold text-neutral-900 mb-2">
                      {title}
                    </h1>
                  )}
                  {subtitle && (
                    <p className="text-lg text-neutral-600">{subtitle}</p>
                  )}
                </div>
                {actions && <div className="flex gap-3">{actions}</div>}
              </div>
            </div>
          )}
          {children}
        </motion.div>
      </div>
    </div>
  );
};
