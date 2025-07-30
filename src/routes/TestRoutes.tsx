import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import TestsAdmin from '../pages/admin/TestsAdmin';
import TestForm from '../components/admin/TestForm';
import ProtectedRoute from '../components/ProtectedRoute';

const TestRoutes: React.FC = () => {
  return (
    <Routes>
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <TestsAdmin />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/new" 
        element={
          <ProtectedRoute>
            <TestForm />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/edit/:testId" 
        element={
          <ProtectedRoute>
            <TestForm />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<Navigate to="/admin/tests" replace />} />
    </Routes>
  );
};

export default TestRoutes;
