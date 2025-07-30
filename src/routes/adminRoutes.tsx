import { RouteObject } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import DashboardPage from '@/pages/admin/Dashboardd';
import TeachersPage from '@/pages/admin/Teachers';
import StudentsPage from '@/pages/admin/Students';
import CoursesPage from '@/pages/admin/Courses';
import NotificationsPage from '@/pages/admin/Notifications';
import VideoReviewPage from '@/pages/admin/VideoReview';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

const adminRoutes: RouteObject[] = [
  {
    path: '/admin',
    element: (
      <ProtectedRoute requiredRole="admin">
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'teachers',
        element: <TeachersPage />,
      },
      {
        path: 'students',
        element: <StudentsPage />,
      },
      {
        path: 'courses',
        element: <CoursesPage />,
      },
      {
        path: 'notifications',
        element: <NotificationsPage />,
      },
      {
        path: 'video-review',
        element: <VideoReviewPage />,
      },
    ],
  },
];

export default adminRoutes;
