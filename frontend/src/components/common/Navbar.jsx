import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useState } from 'react'
import NotificationPanel from '../shared/NotificationPanel'
import { FiBell, FiLogOut, FiUser, FiSun, FiMoon, FiMenu } from 'react-icons/fi'
import { useSocket } from '../../context/SocketContext'
import { useTheme } from '../../context/ThemeContext'
import api from '../../services/api'
import { useEffect } from 'react'

export default function Navbar({ onToggleSidebar }) {
  const { user, logout, activeMode, switchMode } = useAuth()
  const navigate = useNavigate()
  const [showNotif, setShowNotif] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const { socket } = useSocket()
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    if (!user) return
    const modeQuery = activeMode ? `?mode=${activeMode}` : ''
    api.get(`/notifications${modeQuery}`).then(({ data }) => setUnreadCount(data.unreadCount || 0)).catch(() => {})
  }, [user, activeMode])

  useEffect(() => {
    if (!socket || !user) return
    const handleNewNotif = () => setUnreadCount(prev => prev + 1)
    const handleReadNotif = () => setUnreadCount(prev => Math.max(0, prev - 1))
    const handleReadAllNotif = () => setUnreadCount(0)

    socket.on('notification:new', handleNewNotif)
    socket.on('notification:read', handleReadNotif)
    socket.on('notification:read-all', handleReadAllNotif)

    return () => {
      socket.off('notification:new', handleNewNotif)
      socket.off('notification:read', handleReadNotif)
      socket.off('notification:read-all', handleReadAllNotif)
    }
  }, [socket, user])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const [logoClicks, setLogoClicks] = useState([])

  const handleLogoClick = (e) => {
    const now = Date.now()
    const activeClicks = [...logoClicks.filter(t => now - t < 3000), now]
    setLogoClicks(activeClicks)
    if (activeClicks.length >= 5) {
      e.preventDefault()
      navigate('/system/login')
    }
  }

  const displayRole = user?.role === 'teacher' && user?.isAlsoGuide ? activeMode : user?.role

  const roleLabel = displayRole === 'super_admin' ? 'Super Admin'
                  : displayRole === 'college_admin' ? 'College Admin'
                  : displayRole === 'admin' ? 'Admin'
                  : displayRole === 'guide' ? (user?.role === 'teacher' ? 'Current Mode: Guide' : 'Guide')
                  : displayRole === 'teacher' ? (user?.isAlsoGuide ? 'Current Mode: Teacher' : 'Teacher')
                  : 'Student'
  const roleColor = displayRole === 'super_admin' || displayRole === 'college_admin' || displayRole === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                  : displayRole === 'guide' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                  : displayRole === 'teacher' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            {/* Hamburger menu button for small screens */}
            {user && (
              <button
                onClick={onToggleSidebar}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 lg:hidden focus:outline-none"
                aria-label="Toggle Menu"
              >
                <FiMenu className="w-5 h-5" />
              </button>
            )}
            {/* Logo */}
            <Link to="/" onClick={handleLogoClick} className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PX</span>
              </div>
              <span className="font-bold text-gray-900 dark:text-white text-lg">ProjX</span>
            </Link>
          </div>

          {/* Right section */}
          {user && (
            <div className="flex items-center gap-3">
              {/* Role badge or Switcher */}
              {user?.role === 'teacher' && user?.isAlsoGuide ? (
                <div className="relative">
                  <select
                    value={activeMode || 'teacher'}
                    onChange={(e) => {
                      const newMode = e.target.value;
                      switchMode(newMode);
                      navigate(newMode === 'teacher' ? '/teacher/dashboard' : '/guide/dashboard');
                    }}
                    className="text-xs font-semibold px-3 py-1 rounded-full border bg-white dark:bg-gray-800 text-indigo-700 border-indigo-200 cursor-pointer focus:outline-none"
                  >
                    <option value="teacher">Teacher Mode ▼</option>
                    <option value="guide">Guide Mode ▼</option>
                  </select>
                </div>
              ) : (
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full hidden sm:inline-block ${roleColor}`}>
                  {roleLabel}
                </span>
              )}

              {/* Theme toggle button */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? (
                  <FiSun className="w-5 h-5 text-yellow-500 animate-spin-slow" />
                ) : (
                  <FiMoon className="w-5 h-5 text-gray-600" />
                )}
              </button>

              {/* Notification bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotif(!showNotif)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 relative"
                  aria-label="Notifications"
                >
                  <FiBell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {showNotif && <NotificationPanel onClose={() => setShowNotif(false)} setUnreadCount={setUnreadCount} activeMode={activeMode} />}
              </div>

              {/* User avatar/name linking to Profile */}
              <Link to="/profile" className="flex items-center gap-2 hover:opacity-85 transition-opacity">
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-950/40 rounded-full flex items-center justify-center border border-primary-200 dark:border-primary-800">
                  <FiUser className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
                  {user.name}
                </span>
              </Link>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                title="Logout"
              >
                <FiLogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
