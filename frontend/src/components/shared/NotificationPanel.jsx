/**
 * NotificationPanel.jsx - Real-time notification sidebar/dropdown
 */
import { useEffect, useState, useRef } from 'react'
import api from '../../services/api'
import { 
  FiBell, FiX, FiCheck, FiUser, FiFileText, FiCalendar, 
  FiTrendingUp, FiMessageSquare, FiBookOpen, FiAlertCircle, FiSettings, FiCheckSquare, FiAward, FiShield
} from 'react-icons/fi'
import { formatDistanceToNow } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import { getNotificationRoute } from '../../utils/notificationRouter'
import toast from 'react-hot-toast'

const getIcon = (type) => {
  switch (type) {
    case 'project_submission':
    case 'student_file_submission':
    case 'submission_uploaded':
      return <FiFileText className="w-4 h-4 text-blue-500" />
    case 'project_approved':
    case 'guide_accepted':
    case 'group_accepted':
    case 'meeting_accepted':
    case 'meeting_approved':
    case 'invitation_accepted':
      return <FiCheck className="w-4 h-4 text-green-500" />
    case 'project_rejected':
    case 'guide_rejected':
    case 'group_rejected':
    case 'meeting_rejected':
      return <FiAlertCircle className="w-4 h-4 text-red-500" />
    case 'meeting_scheduled':
      return <FiCalendar className="w-4 h-4 text-yellow-500" />
    case 'guide_assigned':
    case 'guide_assignment':
    case 'teacher_assigned':
      return <FiUser className="w-4 h-4 text-purple-500" />
    case 'chat_message':
      return <FiMessageSquare className="w-4 h-4 text-indigo-500" />
    case 'announcement':
      return <FiBookOpen className="w-4 h-4 text-cyan-500" />
    case 'progress_update':
    case 'progress_updated':
      return <FiTrendingUp className="w-4 h-4 text-teal-500" />
    case 'password_reset':
    case 'profile_updated':
      return <FiSettings className="w-4 h-4 text-gray-500" />
    case 'marks_published':
    case 'submission_reviewed':
      return <FiAward className="w-4 h-4 text-orange-500" />
    case 'audit_event':
      return <FiShield className="w-4 h-4 text-amber-500" />
    default:
      return <FiBell className="w-4 h-4 text-primary-500" />
  }
}

export default function NotificationPanel({ onClose, setUnreadCount, activeMode }) {
  const [notifications, setNotifications] = useState([])
  const panelRef = useRef(null)
  const navigate = useNavigate()
  const { user } = useAuth()
  const { socket } = useSocket()

  const fetchNotifications = async () => {
    try {
      const modeQuery = activeMode ? `?mode=${activeMode}` : ''
      const { data } = await api.get(`/notifications${modeQuery}`)
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch {/* silently fail */}
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [activeMode])

  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  useEffect(() => {
    if (!socket) return

    const handleSocketRead = ({ id }) => {
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
    const handleSocketReadAll = () => {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    }
    const handleSocketNew = (newNotif) => {
      setNotifications(prev => {
        if (prev.some(n => n._id === newNotif._id)) return prev;
        return [newNotif, ...prev].slice(0, 100);
      });
      setUnreadCount(prev => prev + 1)
    }

    socket.on('notification:read', handleSocketRead)
    socket.on('notification:read-all', handleSocketReadAll)
    socket.on('notification:new', handleSocketNew)

    return () => {
      socket.off('notification:read', handleSocketRead)
      socket.off('notification:read-all', handleSocketReadAll)
      socket.off('notification:new', handleSocketNew)
    }
  }, [socket])

  const handleNotificationClick = async (n) => {
    if (!n.isRead) {
      handleMarkRead(n._id)
    }
    onClose()

    const displayRole = user?.role === 'teacher' && user?.isAlsoGuide ? activeMode : user?.role
    const fallbackRoute = getNotificationRoute(n, displayRole)
    const targetPath = n.destinationRoute || n.route || n.link || fallbackRoute.path || '/'
    const targetState = fallbackRoute.state || {}

    toast.success('Opening related page...', { icon: '🔔', id: 'notif-toast' })
    navigate(targetPath, { state: targetState })
  }

  const handleMarkRead = async (id) => {
    setNotifications(prev => prev.map(item => item._id === id ? { ...item, isRead: true } : item))
    setUnreadCount(prev => Math.max(0, prev - 1))
    try {
      await api.patch(`/notifications/${id}/read`)
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  const markAllRead = async () => {
    const modeQuery = activeMode ? `?mode=${activeMode}` : ''
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnreadCount(0)
    try {
      await api.patch(`/notifications/read-all${modeQuery}`)
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  return (
    <div
      ref={panelRef}
      className="fixed left-4 right-4 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-fadeIn"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <FiBell className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          <span className="font-semibold text-sm text-gray-850 dark:text-gray-200">Notifications</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={markAllRead} 
            className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-750 dark:hover:text-primary-350 transition-colors"
          >
            Mark all read
          </button>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-655 dark:hover:text-gray-300 ml-1">
            <FiX className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-96 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700/50">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <span className="text-2xl mb-2">🔔</span>
            <p className="text-xs text-gray-400 font-medium">All caught up! No notifications.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              className={`px-4 py-3 flex gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors relative ${
                !n.isRead ? 'bg-blue-50/20 dark:bg-blue-950/10' : ''
              }`}
              onClick={() => handleNotificationClick(n)}
            >
              {/* Icon Container */}
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                {getIcon(n.type)}
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1">
                  <p className={`text-xs font-bold truncate text-gray-900 dark:text-white ${!n.isRead ? 'pr-2' : ''}`}>
                    {n.title || 'Notification'}
                  </p>
                  
                  {/* Unread dot */}
                  {!n.isRead && (
                    <span className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0 mt-1" title="Unread" />
                  )}
                </div>

                <p className={`text-xs text-gray-655 dark:text-gray-350 leading-relaxed mt-0.5 ${!n.isRead ? 'font-semibold' : ''}`}>
                  {n.message}
                </p>

                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 font-medium">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
