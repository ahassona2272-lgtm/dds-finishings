import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientForm from './pages/admin/ClientForm';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Users from './pages/admin/Users';
import DesignTasks from './pages/design/DesignTasks';
import SiteReports from './pages/execution/SiteReports';
import SiteImages from './pages/execution/SiteImages';
import Payments from './pages/accounting/Payments';
import Contracts from './pages/accounting/Contracts';
import Purchases from './pages/purchasing/Purchases';
import Messages from './pages/Messages';
import ClientPortal from './pages/client/ClientPortal';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="clients" element={<Clients />} />
        <Route path="clients/new" element={<ClientForm />} />
        <Route path="clients/:id" element={<ClientForm />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="messages" element={<Messages />} />
        
        {/* Admin Routes */}
        <Route path="users" element={
          <ProtectedRoute roles={['admin']}>
            <Users />
          </ProtectedRoute>
        } />
        
        {/* Design Routes */}
        <Route path="design/tasks" element={
          <ProtectedRoute roles={['admin', 'design']}>
            <DesignTasks />
          </ProtectedRoute>
        } />
        
        {/* Execution Routes */}
        <Route path="execution/reports" element={
          <ProtectedRoute roles={['admin', 'execution']}>
            <SiteReports />
          </ProtectedRoute>
        } />
        <Route path="execution/images" element={
          <ProtectedRoute roles={['admin', 'execution']}>
            <SiteImages />
          </ProtectedRoute>
        } />
        
        {/* Accounting Routes */}
        <Route path="accounting/payments" element={
          <ProtectedRoute roles={['admin', 'accounting']}>
            <Payments />
          </ProtectedRoute>
        } />
        <Route path="accounting/contracts" element={
          <ProtectedRoute roles={['admin', 'accounting', 'pricing']}>
            <Contracts />
          </ProtectedRoute>
        } />
        
        {/* Purchasing Routes */}
        <Route path="purchasing" element={
          <ProtectedRoute roles={['admin', 'purchasing']}>
            <Purchases />
          </ProtectedRoute>
        } />

        {/* Client Portal */}
        <Route path="my-portal" element={
          <ProtectedRoute roles={['client']}>
            <ClientPortal />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}