import React from 'react';
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
  LogOut,
} from 'lucide-react';
import clsx from 'clsx';
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
  ];

  const navItems = user?.role === 'instructor' ? instructorNavItems : studentNavItems;

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="fixed left-0 top-0 h-screen w-20 bg-white border-r border-neutral-200 shadow-soft flex flex-col items-center py-6 z-40">
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
          className="w-full h-12 rounded-2xl flex items-center justify-center text-neutral-600 hover:bg-danger-50 hover:text-danger-600 transition-all duration-200 group"
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
  );
};
