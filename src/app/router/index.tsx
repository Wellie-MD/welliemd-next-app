import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '@/components/error/error-boundary';
import { ProtectedRoute } from './protected-route';
import { RoleGuard } from './role-guard';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';
import { UserRole, PERMISSIONS } from '@/features/auth/types/auth.types';

// Lazy load components for better performance
const SignIn = React.lazy(() => import('@/pages/auth/SignIn'));
const ForgotPassword = React.lazy(() => import('@/pages/auth/ForgotPassword'));
const ResetPassword = React.lazy(() => import('@/pages/auth/ResetPassword'));

// Dashboard layout and pages
const DashboardLayout = React.lazy(() => import('@/layouts/dashboard-layout'));
const Dashboard = React.lazy(() => import('@/components/Dashboard'));
const Profile = React.lazy(() => import('@/components/Profile'));
const Treatments = React.lazy(() => import('@/components/Treatments'));
const Prescriptions = React.lazy(() => import('@/components/Prescriptions'));
const Messages = React.lazy(() => import('@/components/Messages'));
const MedicalRecords = React.lazy(() => import('@/components/MedicalRecords'));
const Appointments = React.lazy(() => import('@/components/Appointments'));

// Loading component for Suspense
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="space-y-4 text-center">
      <LoadingSkeleton className="w-16 h-16 rounded-full mx-auto" />
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

/**
 * Main application router with authentication and role-based access control
 */
export const AppRouter: React.FC = () => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes - Authentication */}
          <Route path="/auth/signin" element={<SignIn />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />

          {/* Protected routes - Dashboard */}
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Default dashboard route */}
            <Route index element={<Dashboard />} />
            
            {/* Profile routes - accessible to all authenticated users */}
            <Route path="profile" element={<Profile />} />
            
            {/* Patient-specific routes */}
            <Route
              path="appointments"
              element={
                <RoleGuard 
                  allowedRoles={[UserRole.PATIENT, UserRole.PROVIDER, UserRole.ADMIN]}
                  requiredPermissions={[PERMISSIONS.PATIENT_VIEW_APPOINTMENTS]}
                >
                  <Appointments />
                </RoleGuard>
              }
            />
            
            <Route
              path="medical-records"
              element={
                <RoleGuard 
                  allowedRoles={[UserRole.PATIENT, UserRole.PROVIDER, UserRole.ADMIN]}
                  requiredPermissions={[PERMISSIONS.PATIENT_VIEW_MEDICAL_RECORDS]}
                >
                  <MedicalRecords />
                </RoleGuard>
              }
            />
            
            <Route
              path="prescriptions"
              element={
                <RoleGuard 
                  allowedRoles={[UserRole.PATIENT, UserRole.PROVIDER, UserRole.ADMIN]}
                  requiredPermissions={[PERMISSIONS.PATIENT_VIEW_PRESCRIPTIONS]}
                >
                  <Prescriptions />
                </RoleGuard>
              }
            />
            
            <Route
              path="treatments"
              element={
                <RoleGuard 
                  allowedRoles={[UserRole.PATIENT, UserRole.PROVIDER, UserRole.ADMIN]}
                  requiredPermissions={[PERMISSIONS.PATIENT_VIEW_MEDICAL_RECORDS]}
                >
                  <Treatments />
                </RoleGuard>
              }
            />
            
            <Route
              path="messages"
              element={
                <RoleGuard 
                  allowedRoles={[UserRole.PATIENT, UserRole.PROVIDER, UserRole.ADMIN]}
                  requiredPermissions={[PERMISSIONS.PATIENT_SEND_MESSAGES]}
                >
                  <Messages />
                </RoleGuard>
              }
            />

            {/* Provider-specific routes */}
            <Route
              path="patients"
              element={
                <RoleGuard 
                  allowedRoles={[UserRole.PROVIDER, UserRole.ADMIN]}
                  requiredPermissions={[PERMISSIONS.PROVIDER_VIEW_PATIENTS]}
                >
                  <div className="p-6">
                    <h1 className="text-2xl font-semibold">Patient Management</h1>
                    <p className="text-muted-foreground">Manage your patients and their care.</p>
                  </div>
                </RoleGuard>
              }
            />

            <Route
              path="analytics"
              element={
                <RoleGuard 
                  allowedRoles={[UserRole.PROVIDER, UserRole.ADMIN]}
                  requiredPermissions={[PERMISSIONS.PROVIDER_VIEW_ANALYTICS]}
                >
                  <div className="p-6">
                    <h1 className="text-2xl font-semibold">Analytics</h1>
                    <p className="text-muted-foreground">View practice analytics and insights.</p>
                  </div>
                </RoleGuard>
              }
            />

            {/* Admin-specific routes */}
            <Route
              path="admin/*"
              element={
                <RoleGuard 
                  allowedRoles={[UserRole.ADMIN]}
                  requiredPermissions={[PERMISSIONS.ADMIN_MANAGE_USERS]}
                >
                  <Routes>
                    <Route index element={
                      <div className="p-6">
                        <h1 className="text-2xl font-semibold">Admin Panel</h1>
                        <p className="text-muted-foreground">System administration and management.</p>
                      </div>
                    } />
                    <Route path="users" element={
                      <div className="p-6">
                        <h1 className="text-2xl font-semibold">User Management</h1>
                        <p className="text-muted-foreground">Manage system users and permissions.</p>
                      </div>
                    } />
                    <Route path="settings" element={
                      <div className="p-6">
                        <h1 className="text-2xl font-semibold">System Settings</h1>
                        <p className="text-muted-foreground">Configure system-wide settings.</p>
                      </div>
                    } />
                  </Routes>
                </RoleGuard>
              }
            />

            {/* Settings routes */}
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
          <Route path="/auth/login" element={<Navigate to="/auth/signin" replace />} />
          <Route path="/register" element={<Navigate to="/auth/signup" replace />} />
          <Route path="/auth/register" element={<Navigate to="/auth/signup" replace />} />

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