import { Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import AppShell from './components/AppShell';
import Toast from './components/Toast';
import LoginPage from './pages/LoginPage';
import TaskDashboardPage from './pages/TaskDashboardPage';
import WorkspaceListPage from './pages/WorkspaceListPage';
import WorkspacePage from './pages/WorkspacePage';
import EvaluationReportPage from './pages/EvaluationReportPage';
import AdminReviewPage from './pages/AdminReviewPage';
import TeamDashboardPage from './pages/TeamDashboardPage';
import AdminSettingsPage from './pages/AdminSettingsPage';

function ProtectedLayout() {
  const { isLoggedIn } = useApp();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return <AppShell />;
}

function RootRedirect() {
  const { isLoggedIn, role } = useApp();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return <Navigate to={role === 'sales' ? '/tasks' : '/review'} replace />;
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
        <Route path="/review" element={<AdminReviewPage />} />
        <Route path="/dashboard" element={<TeamDashboardPage />} />
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
