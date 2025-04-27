import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Location from './pages/Location';
import Contact from './pages/Contact';
import Login from './pages/auth/login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import GoldPurchase from './pages/goldpurchase';
import BankBuyBack from './pages/bankbuyback';
import InterestRates from './pages/interestrates';
import Payments from './pages/payments';
import Footer from './components/footer';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminDashboard from './pages/admin/dashboard';
import CustomerDashboard from './pages/customer/dashboard';
import EmployeeDashboard from './pages/employee/dashboard';
import CustomersPage from './pages/admin/customers';
import EmployeesPage from './pages/admin/employees';
import ReportsPage from './pages/admin/reports';
import LoansPage from './pages/admin/loans';
import { useAuth as utilsAuth } from './utils/auth';
import ResetPassword from './pages/auth/ResetPassword';

// Protected Route component
const ProtectedRoute = ({ children, allowedRoles = [] }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  // Debug output
  console.log('[ProtectedRoute]', {
    user,
    isAuthenticated,
    loading,
    allowedRoles
  });

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles.length > 0 && (!user?.role || !allowedRoles.includes(user.role))) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

// Layouts for each role
const AdminLayout = () => (
  <>
    {/* Optionally add AdminSidebar here */}
    <Outlet />
  </>
);

const EmployeeLayout = () => (
  <>
    {/* Optionally add EmployeeSidebar here */}
    <Outlet />
  </>
);

const CustomerLayout = () => (
  <>
    <Outlet />
  </>
);

const AppRoutes: React.FC = () => {
  // Use the auth hook to handle token refresh
  useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-20">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/gold-purchase" element={<GoldPurchase />} />
          <Route path="/bank-buy-back" element={<BankBuyBack />} />
          <Route path="/interest-rates" element={<InterestRates />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/location" element={<Location />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Admin routes */}
          <Route element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/customers" element={<CustomersPage />} />
            <Route path="/admin/loans" element={<LoansPage />} />
            <Route path="/admin/employees" element={<EmployeesPage />} />
            <Route path="/admin/reports" element={<ReportsPage />} />
          </Route>

          {/* Employee routes */}
          <Route element={
            <ProtectedRoute allowedRoles={['employee']}>
              <EmployeeLayout />
            </ProtectedRoute>
          }>
            <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
            <Route path="/employee/customers" element={<CustomersPage />} />
            <Route path="/employee/loans" element={<LoansPage />} />
            <Route path="/employee/reports" element={<ReportsPage />} />
          </Route>

          {/* Customer routes */}
          <Route element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerLayout />
            </ProtectedRoute>
          }>
            <Route path="/customer/dashboard" element={<CustomerDashboard />} />
            {/* Add more customer routes here if needed */}
          </Route>
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
};

export default App;