import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '@/components/error/error-boundary';
import { ProtectedRoute } from './protected-route';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';

const SignIn = React.lazy(() => import('@/pages/auth/SignIn'));
const ForgotPassword = React.lazy(() => import('@/pages/auth/ForgotPassword'));
const ResetPassword = React.lazy(() => import('@/pages/auth/ResetPassword'));

const DashboardLayout = React.lazy(() => import('@/layouts/dashboard-layout'));
const Dashboard = React.lazy(() => import('@/components/Dashboard'));
const Profile = React.lazy(() => import('@/components/Profile'));
const Treatments = React.lazy(() => import('@/components/Treatments'));
const Prescriptions = React.lazy(() => import('@/components/Prescriptions'));
const Messages = React.lazy(() => import('@/components/Messages'));
const MedicalRecords = React.lazy(() => import('@/components/MedicalRecords'));
const Appointments = React.lazy(() => import('@/components/Appointments'));
const Blog = React.lazy(() => import('@/components/Blog'));
const BlogPost = React.lazy(() => import('@/components/BlogPost'));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="space-y-4 text-center">
      <LoadingSkeleton className="w-16 h-16 rounded-full mx-auto" />
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

export const AppRouter: React.FC = () => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes - Authentication */}
          <Route path="/auth/signin" element={<SignIn />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />

          {/* Protected routes - Dashboard with proper nesting */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard child routes */}
            <Route index element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="medical-records" element={<MedicalRecords />} />
            <Route path="prescriptions" element={<Prescriptions />} />
            <Route path="treatments" element={<Treatments />} />
            <Route path="messages" element={<Messages />} />
            <Route path="blog" element={<Blog />} />
            <Route path="blog/:id" element={<BlogPost />} />
            
            {/* Settings and Help pages */}
            <Route path="settings" element={
              <div className="p-6">
                <h1 className="text-2xl font-semibold">Settings</h1>
                <p className="text-muted-foreground">Manage your account settings and preferences.</p>
              </div>
            } />
            
            <Route path="help" element={
              <div className="p-6">
                <h1 className="text-2xl font-semibold">Help & Support</h1>
                <p className="text-muted-foreground">Get help and find answers to common questions.</p>
              </div>
            } />
          </Route>

          {/* Default redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Navigate to="/auth/signin" replace />} />

          {/* 404 - Not Found */}
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center bg-background">
              <div className="space-y-4 text-center">
                <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
                <h2 className="text-2xl font-semibold">Page Not Found</h2>
                <p className="text-muted-foreground">
                  The page you're looking for doesn't exist.
                </p>
                <button 
                  onClick={() => window.history.back()}
                  className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Go Back
                </button>
              </div>
            </div>
          } />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};
