import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  FiHome, FiUsers, FiCalendar, FiBarChart2,
  FiCheckSquare, FiUserCheck, FiAward, FiList, FiFileText, FiTrendingUp,
  FiUploadCloud, FiFolder
} from 'react-icons/fi'

const studentLinks = [
  { to: '/student/dashboard', icon: FiHome,      label: 'Dashboard' },
  { to: '/student/group',     icon: FiUsers,     label: 'My Group & Project' },
  { to: '/student/meetings',  icon: FiCalendar,  label: 'Meetings' },
  { to: '/student/submissions', icon: FiUploadCloud, label: 'File Submission' },
  { to: '/student/marks',     icon: FiBarChart2, label: 'My Marks' },
  { to: '/student/announcements', icon: FiFileText, label: 'Announcements' },
]

const guideLinks = [
  { to: '/guide/dashboard', icon: FiHome,      label: 'Dashboard' },
  { to: '/guide/consents',  icon: FiUserCheck, label: 'Group Consents' },
  { to: '/guide/meetings',  icon: FiCalendar,  label: 'Meeting Reports' },
  { to: '/guide/submissions', icon: FiFolder,    label: 'Student Submissions' },
  { to: '/guide/announcements', icon: FiFileText, label: 'Announcements' },
]

const teacherLinks = [
  { to: '/teacher/dashboard',   icon: FiHome,        label: 'Dashboard' },
  { to: '/teacher/approvals',   icon: FiCheckSquare, label: 'Project Approvals' },
  { to: '/teacher/guide-assign',icon: FiUserCheck,   label: 'Guide Assignment' },
  { to: '/teacher/progress',    icon: FiTrendingUp,  label: 'Project Progress' },
  { to: '/teacher/submissions', icon: FiFolder,      label: 'Student Submissions' },
  { to: '/teacher/marks',       icon: FiAward,       label: 'Marks Management' },
  { to: '/teacher/announcements', icon: FiFileText,  label: 'Announcements' },
]

const adminLinks = [
  { to: '/admin/dashboard',   icon: FiHome,        label: 'Dashboard' },
  { to: '/admin/approvals',   icon: FiCheckSquare, label: 'Project Approvals' },
  { to: '/admin/guide-assign',icon: FiUserCheck,   label: 'Guide Assignment' },
  { to: '/admin/marks',       icon: FiAward,       label: 'Marks Management' },
  { to: '/admin/groups',      icon: FiList,        label: 'All Groups' },
]

const superAdminLinks = [
  { to: '/super-admin/dashboard', icon: FiHome, label: 'Dashboard' },
]

const collegeAdminLinks = [
  { to: '/admin/dashboard', icon: FiHome, label: 'Dashboard' },
]

export default function Sidebar({ isOpen, onClose }) {
  const { user, activeMode, toggleMode } = useAuth()
  const navigate = useNavigate()

  const displayRole = user?.role === 'teacher' && user?.isAlsoGuide ? activeMode : user?.role

  const links =
    displayRole === 'super_admin' ? superAdminLinks :
    displayRole === 'college_admin' ? collegeAdminLinks :
    displayRole === 'admin' ? adminLinks :
    displayRole === 'teacher' ? teacherLinks :
    displayRole === 'guide' ? guideLinks : studentLinks

  const handleToggle = () => {
    toggleMode()
    navigate(activeMode === 'teacher' ? '/guide/dashboard' : '/teacher/dashboard')
  }

  return (
    <>
      {/* Mobile/Tablet Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-xs lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col py-6 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:w-56 lg:z-0 lg:min-h-[calc(100vh-4rem)] ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {user?.role === 'teacher' && user?.isAlsoGuide && (
          <div className="px-4 mb-6">
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              <button
                onClick={() => { if(activeMode !== 'teacher') handleToggle() }}
                className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-colors ${activeMode === 'teacher' ? 'bg-white shadow-sm text-primary-600 dark:bg-gray-700 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
              >
                Teacher View
              </button>
              <button
                onClick={() => { if(activeMode !== 'guide') handleToggle() }}
                className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-colors ${activeMode === 'guide' ? 'bg-white shadow-sm text-primary-600 dark:bg-gray-700 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
              >
                Guide View
              </button>
            </div>
          </div>
        )}

        <nav className="flex-1 space-y-1 px-3">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose} // Auto-close drawer after navigation selection
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                 ${isActive
                   ? 'bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-400 font-semibold'
                   : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-400 dark:text-gray-500">ProjX v1.0.0</p>
        </div>
      </aside>
    </>
  )
}
