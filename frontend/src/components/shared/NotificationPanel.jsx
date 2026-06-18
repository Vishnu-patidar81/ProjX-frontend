/**
 * NotificationPanel.jsx - Real-time notification sidebar/dropdown
 * Polls every 30 seconds for new notifications
 */
import { useEffect, useState, useRef } from 'react'
import api from '../../services/api'
import { FiBell, FiX, FiCheck } from 'react-icons/fi'
import { formatDistanceToNow } from 'date-fns'

const typeIcons = {
  project_approved: '✅',
  project_rejected: '❌',
  guide_assigned:   '👨‍🏫',
  guide_accepted:   '🤝',
  guide_rejected:   '🚫',
  meeting_scheduled:'📅',
  meeting_report:   '📋',
  marks_updated:    '📊',
  group_invite:     '👥',
  announcement:     '📢',
  general:          '🔔',
}

export default function NotificationPanel({ onClose, setUnreadCount, activeMode }) {
  const [notifications, setNotifications] = useState([])
  const panelRef = useRef(null)

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

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`)
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllRead = async () => {
    const modeQuery = activeMode ? `?mode=${activeMode}` : ''
    await api.put(`/notifications/mark-all-read${modeQuery}`)
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }

  return (
    <div
      ref={panelRef}
      className="fixed left-4 right-4 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <FiBell className="w-4 h-4 text-gray-600" />
          <span className="font-semibold text-sm text-gray-800">Notifications</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={markAllRead} className="text-xs text-primary-600 hover:underline">
            Mark all read
          </button>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
        {notifications.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-8">No notifications yet</p>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              className={`px-4 py-3 flex gap-3 cursor-pointer hover:bg-gray-50 transition-colors
                ${!n.isRead ? 'bg-blue-50' : ''}`}
              onClick={() => !n.isRead && markRead(n._id)}
            >
              <span className="text-lg flex-shrink-0">{typeIcons[n.type] || '🔔'}</span>
              <div className="flex-1 min-w-0">
                {n.title && <p className="text-sm font-semibold text-gray-900">{n.title}</p>}
                <p className={`text-xs text-gray-700 leading-relaxed ${!n.isRead ? 'font-medium' : ''}`}>
                  {n.message}
                </p>
                {n.reason && (
                  <div className="mt-1 p-2 bg-red-50 border border-red-100 rounded text-xs text-red-700 italic">
                    <span className="font-semibold not-italic">Reason: </span>{n.reason}
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </p>
              </div>
              {!n.isRead && (
                <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
