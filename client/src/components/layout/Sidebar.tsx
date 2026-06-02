import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  BarChart3,
  StickyNote,
  Settings,
  Code2,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  onClose: () => void;
}

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/tasks', label: 'Tasks', icon: CheckSquare },
  { path: '/projects', label: 'Projects', icon: FolderKanban },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/notes', label: 'Notes', icon: StickyNote },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  return (
    <aside
      className={cn(
        "h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col",
        "shadow-lg lg:shadow-none",
        "overflow-y-auto"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Code2 className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          <span className="font-bold text-xl bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
            DevDash
          </span>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => {
              if (window.innerWidth < 1024) {
                onClose();
              }
            }}
            className={({ isActive }) =>
              cn(
                "flex items-center space-x-3 px-4 py-3 mx-2 my-1 rounded-lg transition-colors",
                isActive
                  ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              )
            }
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-3">
          <p className="text-white text-sm font-medium">Need Help?</p>
          <p className="text-primary-100 text-xs mt-1">Check documentation</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;