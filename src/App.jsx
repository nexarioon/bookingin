import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { ToastProvider } from '@/components/ui/toast'

import HomePage from '@/pages/public/HomePage'
import UnitDetailPage from '@/pages/public/UnitDetailPage'
import BookingSuccessPage from '@/pages/public/BookingSuccessPage'

import LoginPage from '@/pages/admin/LoginPage'
import DashboardPage from '@/pages/admin/DashboardPage'
import BookingsPage from '@/pages/admin/BookingsPage'
import UnitsPage from '@/pages/admin/UnitsPage'
import CalendarPage from '@/pages/admin/CalendarPage'
import PromoPage from '@/pages/admin/PromoPage'
import CustomersPage from '@/pages/admin/CustomersPage'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
  if (!user) return <Navigate to="/admin/login" replace />
  return children
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/unit/:id" element={<UnitDetailPage />} />
            <Route path="/booking/success" element={<BookingSuccessPage />} />
            <Route path="/admin/login" element={<LoginPage />} />
            <Route path="/admin" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/admin/bookings" element={<ProtectedRoute><BookingsPage /></ProtectedRoute>} />
            <Route path="/admin/units" element={<ProtectedRoute><UnitsPage /></ProtectedRoute>} />
            <Route path="/admin/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
            <Route path="/admin/promos" element={<ProtectedRoute><PromoPage /></ProtectedRoute>} />
            <Route path="/admin/customers" element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ToastProvider>
  )
}

export default App
