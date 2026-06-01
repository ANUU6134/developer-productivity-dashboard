// Dashboard.tsx - Updated to use real API data
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  CheckCircle, Clock, FolderOpen, TrendingUp, Calendar,
  Activity, Code, Target, Zap, Award
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../lib/api';
import { formatLocalTime, getRelativeTime } from '../lib/dateUtils';

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();

  // Fetch real user stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['user-stats'],
    queryFn: async () => {
      const response = await api.get('/api/analytics/user-stats');
      return response.data;
    },
  });

  // Fetch real task data by day
  const { data: taskData, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks-by-day'],
    queryFn: async () => {
      const response = await api.get('/api/analytics/tasks-by-day?days=7');
      return response.data;
    },
  });

  // Fetch real coding hours
  const { data: codingData, isLoading: codingLoading } = useQuery({
    queryKey: ['coding-hours'],
    queryFn: async () => {
      const response = await api.get('/api/analytics/coding-hours?days=7');
      return response.data;
    },
  });

  // Fetch recent activities
  const { data: recentActivities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: async () => {
      const response = await api.get('/api/analytics/recent-activities?limit=5');
      return response.data;
    },
  });

  // Prepare chart data
  const activityChartData = taskData?.labels?.map((label: string, idx: number) => ({
    date: label,
    completed: taskData.completed?.[idx] || 0,
    created: taskData.created?.[idx] || 0,
  })) || [];

  const codingChartData = codingData?.labels?.map((label: string, idx: number) => ({
    date: label,
    hours: codingData.hours?.[idx] || 0,
  })) || [];

  const statsCards = [
    {
      title: 'Total Tasks',
      value: stats?.total_tasks || 0,
      icon: CheckCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      title: 'Completed Tasks',
      value: stats?.completed_tasks || 0,
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      title: 'Active Projects',
      value: stats?.active_projects || 0,
      icon: FolderOpen,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
    {
      title: 'Productivity',
      value: `${stats?.productivity_score || 0}%`,
      icon: Zap,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    },
    {
      title: 'Completed Projects',
      value: stats?.completed_projects || 0,
      icon: Award,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    },
  ];

  if (statsLoading || tasksLoading || codingLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 md:p-8 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Welcome back, {user?.full_name?.split(' ')[0] || user?.username || 'Developer'}! 👋
            </h1>
            <p className="text-blue-100">
              You've completed {stats?.completed_tasks || 0} out of {stats?.total_tasks || 0} tasks
            </p>
            <div className="mt-3 flex items-center space-x-2">
              <Award className="h-5 w-5 text-yellow-300" />
              <span className="text-sm font-medium">
                {stats?.productivity_score > 70 ? 'Great progress!' : 'Keep pushing! 🔥'}
              </span>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statsCards.map((card, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{card.title}</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {card.value}
                </p>
              </div>
              <div className={`${card.bgColor} p-3 rounded-full`}>
                <card.icon className={`h-5 w-5 md:h-6 md:w-6 ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Weekly Activity
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={activityChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="completed" 
                stackId="1"
                stroke="#10b981" 
                fill="#10b981" 
                fillOpacity={0.3}
                name="Completed"
              />
              <Area 
                type="monotone" 
                dataKey="created" 
                stackId="2"
                stroke="#3b82f6" 
                fill="#3b82f6" 
                fillOpacity={0.3}
                name="Created"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Coding Hours Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Coding Hours
        </h3>
        {codingChartData && codingChartData.length > 0 && codingChartData.some(item => item.hours > 0) ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={codingChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                formatter={(value: any) => [`${value} hours`, 'Coding Time']}
                labelFormatter={(label) => `${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="hours" 
                stroke="#8b5cf6" 
                strokeWidth={2} 
                name="Hours"
                dot={{ fill: '#8b5cf6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-gray-500">
            <div className="text-center">
              <Code className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>No coding hours recorded yet</p>
              <p className="text-sm">Complete tasks to track your coding time</p>
            </div>
          </div>
        )}
      </div>
    </div>

      {/* Recent Activity & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Activity
            </h3>
          </div>
          <div className="p-4 md:p-6 space-y-4 max-h-96 overflow-y-auto">
            {recentActivities?.length > 0 ? (
              recentActivities.map((activity: any) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 p-2 ${activity.bgColor} rounded-lg`}>
                    <Activity className={`h-4 w-4 ${activity.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {getRelativeTime(activity.created_at)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                No recent activities
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Quick Stats
            </h3>
          </div>
          <div className="p-4 md:p-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.completion_rate || 0}%
              </div>
              <div className="text-xs text-gray-500 mt-1">Completion Rate</div>
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${stats?.completion_rate || 0}%` }}
                />
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.productivity_score || 0}%
              </div>
              <div className="text-xs text-gray-500 mt-1">Productivity</div>
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${stats?.productivity_score || 0}%` }}
                />
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.total_projects || 0}
              </div>
              <div className="text-xs text-gray-500 mt-1">Total Projects</div>
            </div>
            <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats?.total_coding_hours ? `${stats.total_coding_hours}h` : '0h'}
            </div>
            <div className="text-xs text-gray-500 mt-1">Coding Hours</div>
            {stats?.total_coding_hours > 0 && (
              <div className="text-xs text-green-600 mt-1">
                Total time spent coding
              </div>
            )}
          </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;