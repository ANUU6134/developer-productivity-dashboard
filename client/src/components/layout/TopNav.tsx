import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Menu, Sun, Moon, Bell, LogOut, Settings, User, Code2 } from 'lucide-react';
import { useState } from 'react';

interface TopNavProps {
  onMenuClick: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const TopNav: React.FC<TopNavProps> = ({ onMenuClick, isDarkMode, toggleDarkMode }) => {
  const { user, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left side */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Menu size={20} />
            </button>
            {/* Mobile logo */}
            <Link to="/dashboard" className="lg:hidden">
              <Code2 className="h-6 w-6 text-primary-600" />
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 relative"
              >
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              {/* Notifications dropdown */}
              {showNotifications && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotifications(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="font-semibold">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      <div className="p-4 text-center text-gray-500">
                        No new notifications
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:inline text-sm font-medium">
                  {user?.full_name?.split(' ')[0] || user?.username}
                </span>
              </button>

              {/* User dropdown */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <div className="py-2">
                      <Link
                        to="/settings"
                        className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User size={16} />
                        <span>Profile</span>
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings size={16} />
                        <span>Settings</span>
                      </Link>
                      <hr className="my-1 border-gray-200 dark:border-gray-700" />
                      <button
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                        }}
                        className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left text-red-600"
                      >
                        <LogOut size={16} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TopNav;