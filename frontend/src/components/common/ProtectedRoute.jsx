import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ allowedRoles, isSystemPortal }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return null

  const accessingSystem = isSystemPortal || location.pathname.startsWith('/system')

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Force password change check
  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />
  }

  const userRole = user.role
  const isUserGuide = user.isGuide === true

  if (accessingSystem) {
    if (userRole !== 'super_admin') {
      return <Navigate to="/login" replace />
    }
    return <Outlet />
  }

  if (userRole === 'super_admin' && !accessingSystem) {
    return <Navigate to="/system/dashboard" replace />
  }

  if (allowedRoles) {
    let hasAccess = allowedRoles.includes(userRole)
    if (!hasAccess) {
      if (allowedRoles.includes('admin') && (userRole === 'college_admin' || userRole === 'super_admin')) {
        hasAccess = true
      }
      if (allowedRoles.includes('guide') && userRole === 'teacher' && isUserGuide) {
        hasAccess = true
      }
      if (allowedRoles.includes('teacher') && userRole === 'guide') {
        hasAccess = true
      }
    }

    if (!hasAccess) {
      // Redirect to own dashboard if accessing wrong role's route
      const dash = userRole === 'super_admin' ? '/system/dashboard'
                  : (userRole === 'admin' || userRole === 'college_admin') ? '/admin/dashboard'
                  : userRole === 'teacher' ? '/teacher/dashboard'
                  : userRole === 'guide' ? '/guide/dashboard'
                  : '/student/dashboard'
      return <Navigate to={dash} replace />
    }
  }

  return <Outlet />
}
