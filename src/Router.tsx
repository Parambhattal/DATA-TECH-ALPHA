import { createBrowserRouter, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import React from 'react';
import { GeminiProvider } from './contexts/GeminiContext';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import PrivacyPolicy from './pages/policies/PrivacyPolicy';
import TermsAndConditions from './pages/policies/TermsAndConditions';
import { CourseProvider } from './contexts/CourseContext';
import { ChatProvider } from './contexts/ChatContext';
import CourseDetailPage from './pages/CourseDetailPage';
import { LayoutProvider } from './contexts/LayoutContext';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import PublicCoursesPage from './pages/CoursesPage';
import LoginPage from './pages/Login';
import SignupPage from './pages/Signup';
import NotFoundPage from './pages/NotFoundPage';
import AdminLayout from './components/admin/AdminLayout';
import SubAdminLayout from './components/admin/SubAdminLayout';
import SubAdmins from './pages/admin/SubAdmins';
import AdminDashboard from './pages/admin/Dashboard';
import TestzPage from './pages/Testz';
import TestConductor from './components/test/TestConductor/TestConductor';
import InternshipsDashboard from './pages/admin/InternshipsDashboard';
import CreateInternshipPage from './pages/admin/CreateInternshipPage';
import EditInternshipPage from './pages/admin/EditInternshipPage';
import InternshipsPage from './pages/InternshipsPage';
import InternshipDetail from './pages/InternshipDetail';
import TeachersPage from './pages/admin/Teachers';
import StudentsPage from './pages/admin/Students';
import ReelsPage from './pages/admin/Reels';
import ProfilePage from './pages/ProfilePage';
import AdminCoursesPage from './pages/admin/Courses';
import NotificationsPage from './pages/admin/Notifications';
import VideoReviewPage from './pages/admin/VideoReview';
import NotesReviewPage from './pages/admin/NotesReview';
import ContactPage from './pages/ContactPage';
import VerifyNotice from './pages/VerifyNotice';
import VerifyEmailPage from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import InstructorsPage from './pages/instructors';

// Create a wrapper component that includes all providers
const AppWithProviders = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <NotificationProvider>
      <CourseProvider>
        <ChatProvider>
          <LayoutProvider>
            <GeminiProvider>
              {children}
            </GeminiProvider>
          </LayoutProvider>
        </ChatProvider>
      </CourseProvider>
    </NotificationProvider>
  </AuthProvider>
);
// Simple wrapper components for protected routes
const AdminRoute = ({ children }: { children?: React.ReactNode }) => (
  <AdminLayout>
    {children || <Outlet />}
  </AdminLayout>
);

const SubAdminRoute = ({ children }: { children?: React.ReactNode }) => (
  <SubAdminLayout>
    {children || <Outlet />}
  </SubAdminLayout>
);

// We'll add authentication checks in the layout components instead
// This is a simpler approach that avoids the hooks-in-router issue
export const router = createBrowserRouter([
  // Redirects
  {
    path: '/blog',
    element: <Navigate to="/about" replace />
  },
  {
    path: '/careers',
    element: <Navigate to="/about" replace />
  },
  {
    path: '/instructors',
    element: <Navigate to="/instructor" replace />
  },
  {
    path: '/terms',
    element: <Navigate to="/terms-and-conditions" replace />
  },
  {
    path: '/privacy',
    element: <Navigate to="/privacy-policy" replace />
  },
  {
    path: '/cookies',
    element: <Navigate to="/privacy-policy#cookies" replace />
  },
  // Reset password route - must be outside the main layout
  {
    path: '/reset-password',
    element: (
      <AppWithProviders>
        <ResetPassword />
      </AppWithProviders>
    )
  },
  // Main app routes
  {
    path: '/',
    element: (
      <AppWithProviders>
        <Layout />
      </AppWithProviders>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'courses', element: <PublicCoursesPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
      { path: 'verify-notice', element: <VerifyNotice /> },
      { path: 'verify-email', element: <VerifyEmailPage /> },
      { path: 'forgot-password', element: <ForgotPassword /> },
      { path: 'testz', element: <TestzPage /> },
      { path: 'test/:testId', element: <TestConductor /> },
      { path: 'privacy-policy', element: <PrivacyPolicy /> },
      { path: 'terms-and-conditions', element: <TermsAndConditions /> },
      { 
        path: 'internships', 
        children: [
          { index: true, element: <InternshipsPage /> },
          { path: ':id', element: <InternshipDetail /> },
        ]
      },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'contact', element: <ContactPage /> },
      { 
        path: 'instructor', 
        element: <InstructorsPage /> 
      },
      { 
        path: 'courses/:id', 
        element: <CourseDetailPage /> 
      },
      
      // Admin routes
      {
        path: 'admin',
        element: <AdminRoute />,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: 'dashboard', element: <AdminDashboard /> },
          { 
            path: 'subadmins', 
            element: <SubAdmins /> 
          },
          {
            path: 'internships',
            element: <Outlet />,
            children: [
              { index: true, element: <InternshipsDashboard /> },
              { path: 'new', element: <CreateInternshipPage /> },
              { path: 'edit/:id', element: <EditInternshipPage /> },
            ]
          },
          // Users management
          {
            path: 'students',
            element: <StudentsPage />
          },
          {
            path: 'teachers',
            element: <TeachersPage />
          },
          {
            path: 'reels',
            element: <ReelsPage />
          },
          {
            path: 'courses',
            element: <AdminCoursesPage />
          },
          {
            path: 'notifications',
            element: <NotificationsPage />
          },
          {
            path: 'video-review',
            element: <VideoReviewPage />
          },
          {
            path: 'notes-review',
            element: <NotesReviewPage />
          },
          // Add other admin routes here
        ],
      },
      
      // Sub-admin routes
      {
        path: 'subadmin',
        element: <SubAdminRoute />,
        children: [
          { index: true, element: <Navigate to="/subadmin" replace /> },
          // Add sub-admin routes here
        ],
      },

      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);