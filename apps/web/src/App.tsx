import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ToastProvider } from './lib/toast';
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
import { InvoicePage } from './pages/payment/InvoicePage';
import { AccountingPage } from './pages/accounting/AccountingPage';
import { StatsPage } from './pages/stats/StatsPage';
import { InboxPage } from './pages/inbox/InboxPage';
import { WaitingListPage } from './pages/waiting-list/WaitingListPage';
import { AppShell } from './components/AppShell';
import { ProtectedRoute } from './components/ProtectedRoute';

export function App() {
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <ToastProvider>
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </ToastProvider>
  );
}

// AnimatePresence a besoin d'une `key` qui change à chaque navigation pour
// déclencher les transitions enter/exit. On utilise location.pathname.
function AnimatedRoutes() {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<PageMotion><LoginPage /></PageMotion>} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route index element={user?.role === 'ADMIN' ? <Navigate to="/admin/dashboard" replace /> : <PageMotion><DashboardPage /></PageMotion>} />
            <Route path="agenda" element={<PageMotion><AgendaPage /></PageMotion>} />
            <Route path="appointments/new" element={<PageMotion><NewAppointmentPage /></PageMotion>} />
            <Route path="patients" element={<PageMotion><PatientsListPage /></PageMotion>} />
            <Route path="patients/intake" element={<PageMotion><PatientIntakePage /></PageMotion>} />
            <Route path="patients/:id" element={<PageMotion><PatientDetailPage /></PageMotion>} />
            <Route path="patients/:id/clinical" element={<PageMotion><ClinicalFormPage /></PageMotion>} />
            <Route path="payment/:appointmentId" element={<PageMotion><PaymentPage /></PageMotion>} />
            <Route path="payments/:id" element={<PageMotion><InvoicePage /></PageMotion>} />
            <Route path="accounting" element={<PageMotion><AccountingPage /></PageMotion>} />
            <Route path="inbox" element={<PageMotion><InboxPage /></PageMotion>} />
            <Route path="waiting-list" element={<PageMotion><WaitingListPage /></PageMotion>} />
            <Route path="stats" element={<PageMotion><StatsPage /></PageMotion>} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute roles={['ADMIN']} />}>
          <Route element={<AppShell />}>
            <Route path="admin/dashboard" element={<PageMotion><StatsPage /></PageMotion>} />
            <Route path="admin/users" element={<PageMotion><UsersPage /></PageMotion>} />
            <Route path="admin/audit" element={<PageMotion><AuditPage /></PageMotion>} />
          </Route>
        </Route>
        <Route
          path="*"
          element={user ? <Navigate to={defaultRouteForRole(user.role)} replace /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </AnimatePresence>
  );
}

// Wrapper d'animation : fade + glissement vertical court. Effet "Linear-like".
function PageMotion({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.22, ease: [0.4, 0.0, 0.2, 1] }}
      className="h-full"
    >
      {children}
    </motion.div>
  );
}
