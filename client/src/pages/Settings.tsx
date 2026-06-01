// client/src/pages/Settings.tsx
import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { User, Bell, Shield, Palette, Key, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

const Settings: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

    // For profile update - change from /api/users/profile to /api/auth/profile
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.put('/api/auth/profile', {
        full_name: profileForm.full_name,
        email: profileForm.email,
        avatar_url: profileForm.avatar_url
      });
      // Update user in store
      useAuthStore.getState().setUser(response.data);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    }
  };

  // For password change - update endpoint
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordForm.new_password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      await api.put('/api/auth/change-password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      });
      toast.success('Password updated successfully');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update password');
    }
};

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your account preferences
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
              
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <input
                  type="text"
                  value={user?.username}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
              </div>

              <button
                type="submit"
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Save size={18} />
                <span>Save Changes</span>
              </button>
            </form>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handlePasswordUpdate} className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Change Password</h2>

              <div>
                <label className="block text-sm font-medium mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                />
              </div>

              <button
                type="submit"
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Key size={18} />
                <span>Update Password</span>
              </button>
            </form>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Appearance Settings</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Theme preferences can be changed using the sun/moon icon in the top navigation bar.
              </p>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
              <div className="space-y-4">
                <label className="flex items-center justify-between">
                  <span>Email Notifications</span>
                  <input type="checkbox" className="toggle" />
                </label>
                <label className="flex items-center justify-between">
                  <span>Task Reminders</span>
                  <input type="checkbox" className="toggle" defaultChecked />
                </label>
                <label className="flex items-center justify-between">
                  <span>Project Updates</span>
                  <input type="checkbox" className="toggle" defaultChecked />
                </label>
                <label className="flex items-center justify-between">
                  <span>Deadline Alerts</span>
                  <input type="checkbox" className="toggle" defaultChecked />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;