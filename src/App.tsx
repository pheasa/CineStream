import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Category from './pages/Category';
import Search from './pages/Search';
import Watch from './pages/Watch';
import NotFound from './pages/NotFound';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminMovies from './pages/admin/Movies';
import AdminCategories from './pages/admin/Categories';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = localStorage.getItem('admin_auth') === 'true';
  if (!isAuthenticated) return <Navigate to="/admin/login" />;
  return <Layout isAdmin>{children}</Layout>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* User Routes */}
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/categories" element={<Layout><Category /></Layout>} />
        <Route path="/category/:name" element={<Layout><Category /></Layout>} />
        <Route path="/search" element={<Layout><Search /></Layout>} />
        <Route path="/watch/:id" element={<Layout><Watch /></Layout>} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<Layout><AdminLogin /></Layout>} />
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/movies" element={<ProtectedRoute><AdminMovies /></ProtectedRoute>} />
        <Route path="/admin/categories" element={<ProtectedRoute><AdminCategories /></ProtectedRoute>} />

        {/* 404 Route */}
        <Route path="*" element={<Layout><NotFound /></Layout>} />
      </Routes>
    </Router>
  );
}
