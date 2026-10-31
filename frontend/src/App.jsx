import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TripProvider } from './context/TripContext';
import { ThemeProvider } from './context/ThemeContext';

import Login        from './pages/Login';
import Dashboard    from './pages/Dashboard';
import TripRequest  from './pages/TripRequest';
import TripDetail   from './pages/TripDetail';
import ManagerPanel from './pages/ManagerPanel';
import FinancePanel from './pages/FinancePanel';
import AdminPanel   from './pages/AdminPanel';
import EmployeeReimbursements from './pages/EmployeeReimbursements';
import FinanceReimbursements from './pages/FinanceReimbursements';
import AdminTelemetry from './pages/AdminTelemetry';
import LoadingSpinner     from './components/common/ShimmerLoader';
import AnimatedBackground from './components/common/AnimatedBackground';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (!user)   return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRoutes = () => {
  const location = useLocation();
  return (
    <>
      <AnimatedBackground />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/login" element={<Login />} />

          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/trip/new" element={
            <ProtectedRoute><TripRequest /></ProtectedRoute>
          } />
          <Route path="/trip/:tripId" element={
            <ProtectedRoute><TripDetail /></ProtectedRoute>
          } />
          <Route path="/manager" element={
            <ProtectedRoute roles={['manager', 'admin']}><ManagerPanel /></ProtectedRoute>
          } />
          <Route path="/finance" element={
            <ProtectedRoute roles={['finance', 'admin']}><FinancePanel /></ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute roles={['admin']}><AdminPanel /></ProtectedRoute>
          } />
          <Route path="/reimbursements" element={
            <ProtectedRoute><EmployeeReimbursements /></ProtectedRoute>
          } />
          <Route path="/finance-reimbursements" element={
            <ProtectedRoute roles={['finance', 'admin']}><FinanceReimbursements /></ProtectedRoute>
          } />
          <Route path="/admin/telemetry" element={
            <ProtectedRoute roles={['admin']}><AdminTelemetry /></ProtectedRoute>
          } />

          <Route path="/"  element={<Navigate to="/dashboard" replace />} />
          <Route path="*"  element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AnimatePresence>
    </>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TripProvider>
          <AppRoutes />
        </TripProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
