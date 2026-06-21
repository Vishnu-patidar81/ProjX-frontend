import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// Auth pages
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import ForgotPassword from './pages/Auth/ForgotPassword'
import ChangePassword from './pages/Auth/ChangePassword'
import SuperAdminDashboard from './pages/Admin/SuperAdminDashboard'
import CollegeAdminDashboard from './pages/Admin/CollegeAdminDashboard'
import ActivateAccount from './pages/Auth/ActivateAccount'
import CompleteProfile from './pages/Auth/CompleteProfile'
import SystemLogin from './pages/Auth/SystemLogin'

// Student pages
import StudentDashboard from './pages/Student/StudentDashboard'
import GroupFormation from './pages/Student/GroupFormation'
import BookMeeting from './pages/Student/BookMeeting'
import MyMarks from './pages/Student/MyMarks'
import FileSubmission from './pages/Student/FileSubmission'

// Guide pages
import GuideDashboard from './pages/Guide/GuideDashboard'
import GuideMeetings from './pages/Guide/GuideMeetings'
import ConsentForms from './pages/Guide/ConsentForms'

// Admin pages
import AdminDashboard from './pages/Admin/AdminDashboard'
import ProjectApprovals from './pages/Admin/ProjectApprovals'
import GuideAssign from './pages/Admin/GuideAssign'
import MarksManagement from './pages/Admin/MarksManagement'
import AllGroups from './pages/Admin/AllGroups'
import TeacherDashboard from './pages/Teacher/TeacherDashboard'
import TeacherReports from './pages/Teacher/TeacherReports'
import Profile from './pages/Profile/Profile'
import StudentManagement from './pages/Teacher/StudentManagement'

// Announcement pages
import StudentAnnouncements from './pages/Student/StudentAnnouncements'
import GuideAnnouncements from './pages/Guide/GuideAnnouncements'
import TeacherAnnouncements from './pages/Teacher/TeacherAnnouncements'
import ProjectProgress from './pages/Teacher/ProjectProgress'
import StudentSubmissions from './pages/Teacher/StudentSubmissions'
import GuideSubmissions from './pages/Guide/GuideSubmissions'

// Layout
import ProtectedRoute from './components/common/ProtectedRoute'

export default function App() {
  const { user, loading, activeMode } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login"           element={!user ? <Login />          : <Navigate to={getDashboard(activeMode || user.role)} replace />} />
      <Route path="/register"        element={<Navigate to="/login" replace />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/activate-account/:token" element={<ActivateAccount />} />
      <Route path="/system/login"    element={!user ? <SystemLogin />    : <Navigate to="/system/dashboard" replace />} />

      {/* Student routes */}
      <Route element={<ProtectedRoute allowedRoles={['student']} />}>
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/group"     element={<GroupFormation />} />
        <Route path="/student/meetings"  element={<BookMeeting />} />
        <Route path="/student/marks"     element={<MyMarks />} />
        <Route path="/student/announcements" element={<StudentAnnouncements />} />
        <Route path="/student/submissions" element={<FileSubmission />} />
      </Route>

      {/* Teacher routes */}
      <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        <Route path="/teacher/approvals" element={<ProjectApprovals />} />
        <Route path="/teacher/guide-assign" element={<GuideAssign />} />
        <Route path="/teacher/marks"     element={<MarksManagement />} />
        <Route path="/teacher/reports"   element={<TeacherReports />} />
        <Route path="/teacher/announcements" element={<TeacherAnnouncements />} />
        <Route path="/teacher/progress" element={<ProjectProgress />} />
        <Route path="/teacher/submissions" element={<StudentSubmissions />} />
        <Route path="/teacher/students" element={<StudentManagement />} />
      </Route>

      {/* Guide routes */}
      <Route element={<ProtectedRoute allowedRoles={['guide', 'teacher']} />}>
        <Route path="/guide/dashboard" element={<GuideDashboard />} />
        <Route path="/guide/meetings"  element={<GuideMeetings />} />
        <Route path="/guide/consents"  element={<ConsentForms />} />
        <Route path="/guide/announcements" element={<GuideAnnouncements />} />
        <Route path="/guide/submissions" element={<GuideSubmissions />} />
      </Route>

      {/* Admin routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin/dashboard" element={user?.role === 'college_admin' ? <CollegeAdminDashboard /> : <AdminDashboard />} />
        <Route path="/admin/approvals" element={<ProjectApprovals />} />
        <Route path="/admin/guide-assign" element={<GuideAssign />} />
        <Route path="/admin/marks"     element={<MarksManagement />} />
        <Route path="/admin/groups"    element={<AllGroups />} />
      </Route>

      {/* Super Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={['super_admin']} isSystemPortal={true} />}>
        <Route path="/system/dashboard" element={<SuperAdminDashboard />} />
      </Route>

      {/* Universal Profile & Change Password Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<Profile />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />
      </Route>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to={user ? getDashboard(activeMode || user.role) : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function getDashboard(role) {
  if (role === 'super_admin') return '/system/dashboard'
  if (role === 'admin' || role === 'college_admin') return '/admin/dashboard'
  if (role === 'teacher') return '/teacher/dashboard'
  if (role === 'guide')  return '/guide/dashboard'
  return '/student/dashboard'
}
