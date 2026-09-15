import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { AppLayout } from './components/layout/AppLayout';

// Empty page placeholders to allow routing before we create them
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import ReviewQueuePage from './pages/ReviewQueuePage';
import ReviewDetailPage from './pages/ReviewDetailPage';
import RecordsPage from './pages/RecordsPage';
import RecordDetailPage from './pages/RecordDetailPage';
import MapPage from './pages/MapPage';
import CertificatesPage from './pages/CertificatesPage';
import CertificateVerifyPage from './pages/CertificateVerifyPage';
import FraudDashboardPage from './pages/FraudDashboardPage';
import { AnimatePresence } from 'framer-motion';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  
  return <>{children}</>;
}

export default function App() {
  return (
    <AnimatePresence mode="wait">
      <Routes />
    </AnimatePresence>
  );
}

// Inline routes for now
import { Routes as RouterRoutes, Route } from 'react-router-dom';

function Routes() {
  return (
    <RouterRoutes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verify/:hash" element={<CertificateVerifyPage />} />
      
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        
        <Route path="/upload" element={
          <ProtectedRoute allowedRoles={['revenue_officer', 'verifier_admin']}>
            <UploadPage />
          </ProtectedRoute>
        } />
        
        <Route path="/review-queue" element={
          <ProtectedRoute allowedRoles={['revenue_officer', 'verifier_admin']}>
            <ReviewQueuePage />
          </ProtectedRoute>
        } />
        
        <Route path="/review/:id" element={
          <ProtectedRoute allowedRoles={['revenue_officer', 'verifier_admin']}>
            <ReviewDetailPage />
          </ProtectedRoute>
        } />
        
        <Route path="/records" element={<RecordsPage />} />
        <Route path="/records/:id" element={<RecordDetailPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/certificates" element={<CertificatesPage />} />
        
        <Route path="/fraud" element={
          <ProtectedRoute allowedRoles={['verifier_admin']}>
            <FraudDashboardPage />
          </ProtectedRoute>
        } />
      </Route>
    </RouterRoutes>
  );
}
