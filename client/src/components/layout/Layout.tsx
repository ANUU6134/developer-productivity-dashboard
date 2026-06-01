import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import { Menu } from 'lucide-react';
import { cn } from '../../lib/utils';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const location = useLocation();

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [location]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md"
      >
        <Menu size={20} />
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixed position, doesn't affect content flow */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full z-50 transition-transform duration-300 transform",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:block"
        )}
      >
        <Sidebar isOpen={true} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content - Pushed right on desktop, full width on mobile */}
      <div className="lg:ml-64 min-h-screen">
        <TopNav
          onMenuClick={() => setSidebarOpen(true)}
          isDarkMode={isDarkMode}
          toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        />
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;