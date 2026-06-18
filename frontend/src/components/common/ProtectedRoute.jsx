import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth()

  if (loading) return null

  if (!user) return <Navigate to="/login" replace />

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to own dashboard if accessing wrong role's route
    const dash = user.role === 'admin' ? '/admin/dashboard'
                : user.role === 'teacher' ? '/teacher/dashboard'
                : user.role === 'guide' ? '/guide/dashboard'
                : '/student/dashboard'
    return <Navigate to={dash} replace />
  }

  return <Outlet />
}
