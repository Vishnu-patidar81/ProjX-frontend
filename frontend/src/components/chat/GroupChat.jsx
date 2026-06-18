/**
 * GroupChat.jsx - Lightweight, Real-time Text-based Group Chat Drawer
 * Supports scroll-to-bottom, typing indicators, online presence indicators,
 * message timestamps, and read receipt marking.
 */

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import api from '../../services/api'
import { FiSend, FiX, FiMessageSquare, FiCircle } from 'react-icons/fi'
import { formatDistanceToNow, format } from 'date-fns'
import toast from 'react-hot-toast'

export default function GroupChat({ groupId, groupName, members = [], guide = null, onClose }) {
  const { user } = useAuth()
  const { socket, isUserOnline } = useSocket()
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [typingUser, setTypingUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  // Fetch chat history and join room
  useEffect(() => {
    if (!groupId || !socket) return

    const fetchHistory = async () => {
      try {
        setLoading(true)
        const { data } = await api.get(`/chat/${groupId}`)
        setMessages(data.messages || [])
        // Mark as read
        await api.put(`/chat/${groupId}/read`)
      } catch (err) {
        console.error('Failed to load chat history:', err)
        toast.error('Could not load chat history')
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()

    // Join room
    socket.emit('chat:join', { groupId })

    // Listeners
    socket.on('chat:message', (newMsg) => {
      setMessages((prev) => [...prev, newMsg])
      // If active, mark as read
      api.put(`/chat/${groupId}/read`).catch(console.error)
    })

    socket.on('chat:typing', ({ userName }) => {
      setTypingUser(userName)
    })

    socket.on('chat:stopTyping', () => {
      setTypingUser(null)
    })

    return () => {
      socket.emit('chat:leave', { groupId })
      socket.off('chat:message')
      socket.off('chat:typing')
      socket.off('chat:stopTyping')
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }
  }, [groupId, socket])

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingUser])

  // Handle send message
  const handleSend = (e) => {
    e.preventDefault()
    if (!inputText.trim()) return

    // Stop typing immediately
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    socket.emit('chat:stopTyping', { groupId })

    socket.emit('chat:message', {
      groupId,
      senderId: user._id,
      senderRole: user.role,
      message: inputText.trim(),
    })

    setInputText('')
  }

  // Handle typing events
  const handleInputChange = (e) => {
    setInputText(e.target.value)

    if (!socket) return

    // Emit typing event
    socket.emit('chat:typing', { groupId, userName: user.name })

    // Reset timeout to stop typing after inactivity
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('chat:stopTyping', { groupId })
    }, 2000)
  }

  // Check if someone in active list is online
  const renderPresenceList = () => {
    const allUsers = [...members]
    if (guide) allUsers.push(guide)

    return (
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-1 mt-1 border-t border-gray-100 scrollbar-none">
        <span className="text-[10px] text-gray-400 font-semibold uppercase mr-1">Active:</span>
        {allUsers.map((u) => {
          const online = isUserOnline(u._id)
          return (
            <div
              key={u._id}
              className="flex items-center gap-1 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full text-xs font-medium"
            >
              <FiCircle className={`w-2 h-2 ${online ? 'text-green-500 fill-green-500' : 'text-gray-300 fill-gray-300'}`} />
              <span className="text-gray-600 truncate max-w-[80px]" title={u.name}>
                {u.name.split(' ')[0]}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-md bg-white dark:bg-gray-900 shadow-2xl flex flex-col border-l border-gray-200 dark:border-gray-800 animate-slide-in">
      {/* Header */}
      <div className="p-4 border-b border-gray-150 bg-gradient-to-r from-primary-600 to-indigo-600 text-white flex flex-col">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiMessageSquare className="w-5 h-5" />
            <div>
              <h3 className="text-sm font-semibold truncate max-w-[240px] text-white leading-tight">{groupName}</h3>
              <p className="text-[11px] text-primary-100 font-medium">Group Discussion Room</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white">
            <FiX className="w-5 h-5" />
          </button>
        </div>
        {renderPresenceList()}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-gray-950 scrollbar-thin">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'} animate-pulse`}
              >
                <div className="w-2/3 h-10 bg-gray-200 rounded-xl" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center px-4">
            <FiMessageSquare className="w-12 h-12 text-gray-300 mb-3" />
            <p className="font-semibold text-sm">No messages yet</p>
            <p className="text-xs text-gray-400 mt-1 max-w-[200px]">
              Send a text message to start collaborating in real-time.
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.sender._id === user._id
            const displayTime = m.createdAt
              ? format(new Date(m.createdAt), 'hh:mm a')
              : 'Sending...'

            return (
              <div key={m._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[75%]">
                  {!isMe && (
                    <div className="flex items-center gap-1 px-1 mb-0.5">
                      <span className="text-[10px] font-bold text-gray-500">{m.sender.name}</span>
                      <span className="text-[8px] bg-indigo-100 text-indigo-800 px-1 rounded uppercase font-semibold">
                        {m.senderRole}
                      </span>
                    </div>
                  )}
                  <div
                    className={`p-3 rounded-2xl shadow-sm text-sm ${
                      isMe
                        ? 'bg-primary-600 text-white rounded-tr-none'
                        : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                    }`}
                  >
                    <p className="leading-relaxed break-words whitespace-pre-wrap">{m.message}</p>
                    <div className={`text-[9px] mt-1 flex justify-end ${isMe ? 'text-primary-100' : 'text-gray-400'}`}>
                      {displayTime}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}

        {/* Typing indicator */}
        {typingUser && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 text-gray-500 rounded-xl px-3 py-1.5 text-xs flex items-center gap-1.5 shadow-sm">
              <span className="font-semibold text-gray-600">{typingUser}</span> is typing
              <span className="flex gap-0.5 items-center">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Footer */}
      <form onSubmit={handleSend} className="p-3 border-t border-gray-200 bg-white flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm resize-none"
          required
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2.5 rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FiSend className="w-4 h-4" />
        </button>
      </form>
    </div>
  )
}
