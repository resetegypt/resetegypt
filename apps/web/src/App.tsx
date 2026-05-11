import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore, defaultRouteForRole } from './lib/auth';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/admin/UsersPage';
import { AuditPage } from './pages/admin/AuditPage';
import { PatientsListPage } from './pages/patients/PatientsListPage';
import { PatientIntakePage } from './pages/patients/PatientIntakePage';
import { PatientDetailPage } from './pages/patients/PatientDetailPage';
import { ClinicalFormPage } from './pages/patients/ClinicalFormPage';
import { AgendaPage } from './pages/agenda/AgendaPage';
import { NewAppointmentPage } from './pages/agenda/NewAppointmentPage';
import { PaymentPage } from './pages/payment/PaymentPage';
import { StatsPage } from './pages/stats/StatsPage';
import { InboxPage } from './pages/inbox/InboxPage';
import { AppShell } from './components/AppShell';
import { ProtectedRoute } from './components/ProtectedRoute';

export function App() {
  const init = useAuthStore((s) => s.init);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route index element={user?.role === 'ADMIN' ? <Navigate to="/admin/dashboard" replace /> : <DashboardPage />} />
            <Route path="agenda" element={<AgendaPage />} />
            <Route path="appointments/new" element={<NewAppointmentPage />} />
            <Route path="patients" element={<PatientsListPage />} />
            <Route path="patients/intake" element={<PatientIntakePage />} />
            <Route path="patients/:id" element={<PatientDetailPage />} />
            <Route path="patients/:id/clinical" element={<ClinicalFormPage />} />
            <Route path="payment/:appointmentId" element={<PaymentPage />} />
            <Route path="inbox" element={<InboxPage />} />
            <Route path="stats" element={<StatsPage />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute roles={['ADMIN']} />}>
          <Route element={<AppShell />}>
            <Route path="admin/dashboard" element={<StatsPage />} />
            <Route path="admin/users" element={<UsersPage />} />
            <Route path="admin/audit" element={<AuditPage />} />
          </Route>
        </Route>
        <Route
          path="*"
          element={user ? <Navigate to={defaultRouteForRole(user.role)} replace /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
