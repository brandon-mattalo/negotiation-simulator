import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  History,
  Settings,
  ClipboardList,
  Eye,
  BookOpen,
  Users,
  ShieldCheck,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { Avatar } from '../ui';
import { useAuth } from '../../contexts/AuthContext';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
}

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const studentNavItems: NavItem[] = [
    { icon: <LayoutDashboard size={24} />, label: 'Dashboard', path: '/student' },
    { icon: <FileText size={24} />, label: 'Assignments', path: '/student/assignments' },
    { icon: <History size={24} />, label: 'History', path: '/student/history' },
  ];

  const instructorNavItems: NavItem[] = [
    { icon: <LayoutDashboard size={24} />, label: 'Dashboard', path: '/instructor' },
    { icon: <BookOpen size={24} />, label: 'Templates', path: '/instructor/templates' },
    { icon: <Settings size={24} />, label: 'Configurations', path: '/instructor/configurations' },
    { icon: <ClipboardList size={24} />, label: 'Assignments', path: '/instructor/assignments' },
    { icon: <Users size={24} />, label: 'Students', path: '/instructor/students' },
    { icon: <Eye size={24} />, label: 'Review', path: '/instructor/review' },
    ...(user?.isAdmin ? [{ icon: <ShieldCheck size={24} />, label: 'Instructors', path: '/instructor/team' }] : []),
  ];

  const navItems = user?.role === 'instructor' ? instructorNavItems : studentNavItems;

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Close the mobile drawer whenever the route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Prevent the page behind the drawer from scrolling while it is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [mobileOpen]);

  const handleLogout = () => {
    const origin = localStorage.getItem('loginOrigin') || '/login';
    logout();
    navigate(origin);
  };

  return (
    <>
      {/* Desktop / tablet icon rail */}
      <div className="hidden md:flex fixed left-0 top-0 h-screen w-20 bg-white border-r border-neutral-200 shadow-soft flex-col items-center py-6 z-40">
        {/* Logo/Brand */}
        <div className="mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-xl shadow-soft">
            N
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 flex flex-col gap-2 w-full px-3">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={clsx(
                'group relative w-full h-14 rounded-2xl flex items-center justify-center transition-all duration-200',
                isActive(item.path)
                  ? 'bg-primary-500 text-white shadow-soft'
                  : 'text-neutral-600 hover:bg-neutral-100'
              )}
              aria-label={item.label}
            >
              {item.icon}
              {/* Tooltip */}
              <div className="absolute left-full ml-2 px-3 py-2 bg-neutral-900 text-white text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-soft-lg">
                {item.label}
              </div>
            </button>
          ))}
        </nav>

        {/* User Avatar + Logout */}
        <div className="flex flex-col items-center gap-3 w-full px-3">
          <div className="w-full h-px bg-neutral-200" />
          <Avatar
            name={user?.username || 'User'}
            size="md"
            className="cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all"
          />
          <button
            onClick={handleLogout}
            className="group relative w-full h-12 rounded-2xl flex items-center justify-center text-neutral-600 hover:bg-danger-50 hover:text-danger-600 transition-all duration-200"
            aria-label="Logout"
          >
            <LogOut size={20} />
            {/* Tooltip */}
            <div className="absolute left-full ml-2 px-3 py-2 bg-neutral-900 text-white text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-soft-lg">
              Logout
            </div>
          </button>
        </div>
      </div>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-neutral-200 shadow-soft flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-lg shadow-soft">
            N
          </div>
          <span className="font-bold text-neutral-900">Negotiation Simulator</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="w-11 h-11 rounded-xl flex items-center justify-center text-neutral-700 hover:bg-neutral-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-50">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            {/* Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="absolute left-0 top-0 h-full w-72 max-w-[80%] bg-white shadow-soft-xl flex flex-col py-5 px-4"
            >
              <div className="flex items-center justify-between mb-6 px-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-lg shadow-soft">
                    N
                  </div>
                  <div className="flex items-center gap-2">
                    <Avatar name={user?.username || 'User'} size="sm" />
                    <span className="font-semibold text-neutral-900 truncate max-w-[110px]">
                      {user?.username || 'User'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-neutral-500 hover:bg-neutral-100 transition-colors"
                  aria-label="Close menu"
                >
                  <X size={22} />
                </button>
              </div>

              <nav className="flex-1 flex flex-col gap-1 overflow-y-auto">
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={clsx(
                      'w-full h-12 rounded-2xl flex items-center gap-3 px-4 transition-all duration-200 text-left',
                      isActive(item.path)
                        ? 'bg-primary-500 text-white shadow-soft'
                        : 'text-neutral-700 hover:bg-neutral-100'
                    )}
                  >
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </nav>

              <div className="pt-3 mt-3 border-t border-neutral-200">
                <button
                  onClick={handleLogout}
                  className="w-full h-12 rounded-2xl flex items-center gap-3 px-4 text-neutral-700 hover:bg-danger-50 hover:text-danger-600 transition-all duration-200"
                >
                  <LogOut size={20} />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
