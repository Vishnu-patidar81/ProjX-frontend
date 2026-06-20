/**
 * NotificationPanel.jsx - Real-time notification sidebar/dropdown
 * Polls every 30 seconds for new notifications
 */
import { useEffect, useState, useRef } from 'react'
import api from '../../services/api'
import { FiBell, FiX, FiCheck } from 'react-icons/fi'
import { formatDistanceToNow } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import { getNotificationRoute } from '../../utils/notificationRouter'
import toast from 'react-hot-toast'

const typeIcons = {
  project_submission:      '📥',
  project_approved:        '✅',
  project_rejected:        '❌',
  guide_assignment:        '👨‍🏫',
  guide_assigned:          '👨‍🏫',
  guide_accepted:          '🤝',
  guide_rejected:          '🚫',
  meeting_scheduled:       '📅',
  meeting_accepted:        '🤝',
  meeting_rejected:        '🚫',
  meeting_report:          '📋',
  student_file_submission: '📁',
  file_review:             '📝',
  progress_update:         '📈',
  progress_updated:        '📈',
  evaluation:              '📊',
  marks_updated:           '📊',
  chat_message:            '💬',
  announcement:            '📢',
  general:                 '🔔',
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
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [activeMode])

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  // Listen to Socket.IO events for dynamic synchronization
  useEffect(() => {
    if (!socket) return

    const handleSocketRead = ({ id }) => {
      setNotifications(prev => prev.filter(n => n._id !== id))
    }
    const handleSocketReadAll = () => {
      setNotifications([])
    }
    const handleSocketNew = (newNotif) => {
      setNotifications(prev => {
        if (prev.some(n => n._id === newNotif._id)) return prev;
        return [newNotif, ...prev].slice(0, 50);
      });
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
      setNotifications(prev => prev.filter(item => item._id !== n._id))
      setUnreadCount(prev => Math.max(0, prev - 1))
      try {
        await api.patch(`/notifications/${n._id}/read`)
      } catch (err) {
        console.error('Failed to mark notification as read:', err)
      }
    }

    onClose()

    const displayRole = user?.role === 'teacher' && user?.isAlsoGuide ? activeMode : user?.role
    const route = getNotificationRoute(n, displayRole)

    toast.success('Opened from Notification', { icon: '🔔', id: 'notif-toast' })
    navigate(route.path, { state: route.state })
  }

  const markAllRead = async () => {
    const modeQuery = activeMode ? `?mode=${activeMode}` : ''
    try {
      await api.patch(`/notifications/read-all${modeQuery}`)
      setNotifications([])
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  return (
    <div
      ref={panelRef}
      className="fixed left-4 right-4 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <FiBell className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">Notifications</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={markAllRead} className="text-xs text-primary-600 dark:text-primary-400 hover:underline">
            Mark all read
          </button>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <FiX className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-96 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700">
        {notifications.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-8">No notifications yet</p>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              className={`px-4 py-3 flex gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors
                ${!n.isRead ? 'bg-blue-50/50 dark:bg-blue-950/20 border-l-4 border-l-primary-500' : ''}`}
              onClick={() => handleNotificationClick(n)}
            >
              <span className="text-lg flex-shrink-0 mt-0.5">{typeIcons[n.type] || '🔔'}</span>
              <div className="flex-1 min-w-0">
                {n.title && <p className="text-sm font-semibold text-gray-900 dark:text-white">{n.title}</p>}
                <p className={`text-xs text-gray-700 dark:text-gray-300 leading-relaxed ${!n.isRead ? 'font-medium' : ''}`}>
                  {n.message}
                </p>
                {n.reason && (
                  <div className="mt-1 p-2 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 rounded text-xs text-red-700 dark:text-red-300 italic">
                    <span className="font-semibold not-italic">Reason: </span>{n.reason}
                  </div>
                )}
                <div className="flex justify-between items-center mt-1.5">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </span>
                  <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-850 flex items-center gap-0.5">
                    View &rarr;
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
