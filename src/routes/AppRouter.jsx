import { Routes, Route } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import RoomsPage from '../pages/RoomsPage';
import CategoriesPage from '../pages/CategoriesPage';
import CustomersPage from '../pages/CustomersPage';
import ReservationsPage from '../pages/ReservationsPage';
import PaymentsPage from '../pages/PaymentsPage';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/rooms" element={<RoomsPage />} />
      <Route path="/categories" element={<CategoriesPage />} />
      <Route path="/customers" element={<CustomersPage />} />
      <Route path="/reservations" element={<ReservationsPage />} />
      <Route path="/payments" element={<PaymentsPage />} />
    </Routes>
  );
}
