// client/src/pages/Tasks.tsx (COMPLETE WORKING VERSION)
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Circle,
  Clock,
  AlertCircle,
  Filter,
  Search,
  ChevronDown,
  Calendar,
  Flag,
  Tag
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface Task {
  id: number;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  labels: string[];
  due_date: string;
  estimated_hours: number;
  actual_hours: number;
  created_at: string;
}

const Tasks: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    labels: '',
    due_date: '',
    estimated_hours: '',
  });
  const queryClient = useQueryClient();

  // Fetch tasks
  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['tasks', selectedStatus],
    queryFn: async () => {
      const params = selectedStatus !== 'all' ? { status: selectedStatus } : {};
      const response = await api.get('/api/tasks', { params });
      return response.data;
    },
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const response = await api.post('/api/tasks', taskData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task created successfully');
      setIsModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error('Create error:', error);
      toast.error(error.response?.data?.detail || 'Failed to create task');
    },
  });

  // When updating task status to completed, also set actual_hours
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      // If status is being changed to completed, set actual_hours to estimated_hours
      if (data.status === 'completed') {
        data.actual_hours = data.estimated_hours || 0;
      }
      const response = await api.put(`/api/tasks/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task updated successfully');
      setEditingTask(null);
      setIsModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error('Update error:', error);
      toast.error(error.response?.data?.detail || 'Failed to update task');
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/tasks/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task deleted successfully');
    },
    onError: (error: any) => {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete task');
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      labels: '',
      due_date: '',
      estimated_hours: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const taskData = {
      title: formData.title,
      description: formData.description,
      status: formData.status,
      priority: formData.priority,
      labels: formData.labels ? formData.labels.split(',').map(l => l.trim()) : [],
      due_date: formData.due_date || null,
      estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
    };
    
    if (editingTask) {
      updateTaskMutation.mutate({ id: editingTask.id, data: taskData });
    } else {
      createTaskMutation.mutate(taskData);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      urgent: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'review':
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      todo: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      review: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    };
    return badges[status as keyof typeof badges] || badges.todo;
  };

  const filteredTasks = tasks.filter((task: Task) =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (error) {
    console.error('Tasks loading error:', error);
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">Error loading tasks. Please make sure the backend server is running.</p>
          <button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['tasks'] })}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tasks</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and track your daily tasks
          </p>
        </div>
        <button
          onClick={() => {
            setEditingTask(null);
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={20} />
          <span>New Task</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          {['all', 'todo', 'in_progress', 'review', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-4 py-2 rounded-lg capitalize whitespace-nowrap transition-colors ${
                selectedStatus === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
          <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No tasks yet</h3>
          <p className="text-gray-600 dark:text-gray-400">Create your first task to get started!</p>
          <button
            onClick={() => {
              setEditingTask(null);
              resetForm();
              setIsModalOpen(true);
            }}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Create Task
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredTasks.map((task: Task) => (
            <div
              key={task.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all group"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(task.status)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                          {task.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          <Flag className="inline h-3 w-3 mr-1" />
                          {task.priority}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(task.status)}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                        {task.labels && task.labels.map((label, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                          >
                            <Tag className="inline h-3 w-3 mr-1" />
                            {label}
                          </span>
                        ))}
                        {task.due_date && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400">
                            <Calendar className="inline h-3 w-3 mr-1" />
                            Due: {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        )}
                        {task.estimated_hours > 0 && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400">
                            <Clock className="inline h-3 w-3 mr-1" />
                            {task.estimated_hours}h est.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2 ml-8 md:ml-0">
                  <button
                    onClick={() => {
                      setEditingTask(task);
                      setFormData({
                        title: task.title,
                        description: task.description || '',
                        status: task.status,
                        priority: task.priority,
                        labels: task.labels?.join(', ') || '',
                        due_date: task.due_date?.split('T')[0] || '',
                        estimated_hours: task.estimated_hours?.toString() || '',
                      });
                      setIsModalOpen(true);
                    }}
                    className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this task?')) {
                        deleteTaskMutation.mutate(task.id);
                      }
                    }}
                    className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter task title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter task description"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Due Date</label>
                    <input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Estimated Hours</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.estimated_hours}
                      onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      placeholder="e.g., 2.5"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Labels (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.labels}
                    onChange={(e) => setFormData({ ...formData, labels: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="bug, feature, urgent"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
                    className="flex-1 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {createTaskMutation.isPending || updateTaskMutation.isPending
                      ? 'Saving...'
                      : editingTask ? 'Update Task' : 'Create Task'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingTask(null);
                      resetForm();
                    }}
                    className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;