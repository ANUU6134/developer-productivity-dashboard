// client/src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/useAuthStore';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Projects from './pages/Projects';
import Analytics from './pages/Analytics';
import Notes from './pages/Notes';
import Settings from './pages/Settings';

const queryClient = new QueryClient();

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="projects" element={<Projects />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="notes" element={<Notes />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;