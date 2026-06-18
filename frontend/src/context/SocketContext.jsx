/**
 * SocketContext.jsx - Global Socket.io state management
 * Handles connection lifecycle based on authentication, registers user rooms,
 * tracks online presence lists, and shows live notification toasts.
 */

import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const { user, token } = useAuth()
  const [socket, setSocket] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState([])

  useEffect(() => {
    if (!user || !token) {
      if (socket) {
        socket.disconnect()
        setSocket(null)
      }
      setOnlineUsers([])
      return
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000'
    const newSocket = io(socketUrl, {
      autoConnect: true,
      transports: ['websocket'],
      auth: {
        token: token
      }
    })

    newSocket.on('connect', () => {
      console.log('🔌 Socket connected:', newSocket.id)
      // Room joins are now handled dynamically via server based on user ID
      // newSocket.emit('join_user_room', user._id)
    })

    newSocket.on('presence:online_list', (users) => {
      setOnlineUsers(users)
    })

    newSocket.on('notification:new', (notif) => {
      toast(notif.message, {
        icon: '🔔',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      })
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [user])

  const isUserOnline = (userId) => {
    return onlineUsers.includes(userId)
  }

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, isUserOnline }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => {
  const ctx = useContext(SocketContext)
  if (!ctx) throw new Error('useSocket must be used inside SocketProvider')
  return ctx
}
