import { Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import AppShell from './components/AppShell';
import Toast from './components/Toast';
import LoginPage from './pages/LoginPage';
import TaskDashboardPage from './pages/TaskDashboardPage';
import WorkspaceListPage from './pages/WorkspaceListPage';
import WorkspacePage from './pages/WorkspacePage';
import EvaluationReportPage from './pages/EvaluationReportPage';
import ReviewListPage from './pages/ReviewListPage';
import ReviewDetailPage from './pages/ReviewDetailPage';
import TeamWorksPage from './pages/TeamWorksPage';
import TeamDashboardPage from './pages/TeamDashboardPage';
import TeamCoachingReportPage from './pages/TeamCoachingReportPage';
import AdminSettingsPage from './pages/AdminSettingsPage';

function ProtectedLayout() {
  const { isLoggedIn, authLoading } = useApp();
  if (authLoading) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return <AppShell />;
}

function RootRedirect() {
  const { isLoggedIn, authLoading, role } = useApp();
  if (authLoading) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return <Navigate to={role === 'member' ? '/tasks' : '/review'} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/tasks" element={<TaskDashboardPage />} />
        <Route path="/workspace" element={<WorkspaceListPage />} />
        <Route path="/workspace/:taskId" element={<WorkspacePage />} />
        <Route path="/report" element={<EvaluationReportPage />} />
        <Route path="/review" element={<ReviewListPage />} />
        <Route path="/review/:reviewRequestId" element={<ReviewDetailPage />} />
        <Route path="/team-works" element={<TeamWorksPage />} />
        <Route path="/dashboard" element={<TeamDashboardPage />} />
        <Route path="/dashboard/coaching" element={<TeamCoachingReportPage />} />
        <Route path="/settings" element={<AdminSettingsPage />} />
      </Route>
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
      <Toast />
    </AppProvider>
  );
}
