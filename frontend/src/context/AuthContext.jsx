/**
 * AuthContext.jsx - Global authentication state
 * Stores user info and JWT token, persists to localStorage
 */

import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null)
  const [token, setToken]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeMode, setActiveMode] = useState(null)

  // Rehydrate from localStorage on app mount
  useEffect(() => {
    const storedToken = localStorage.getItem('projx_token')
    const storedUser  = localStorage.getItem('projx_user')
    const storedMode  = localStorage.getItem('projx_mode')
    
    const initializeAuth = async () => {
      if (storedToken && storedUser) {
        setToken(storedToken)
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
        setActiveMode(storedMode || parsedUser.role)
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
        
        // Fetch fresh user data to update properties like isAlsoGuide
        try {
          const { data } = await api.get('/auth/me');
          if (data && data.user) {
            setUser(data.user);
            localStorage.setItem('projx_user', JSON.stringify(data.user));
            if (data.user.role === 'teacher' && !data.user.isAlsoGuide && storedMode === 'guide') {
              setActiveMode('teacher');
              localStorage.setItem('projx_mode', 'teacher');
            }
          }
        } catch (error) {
          console.error("Failed to refresh user session");
        }
      }
      setLoading(false)
    }

    initializeAuth()
  }, [])

  const login = (userData, jwtToken) => {
    setUser(userData)
    setToken(jwtToken)
    setActiveMode(userData.role)
    localStorage.setItem('projx_token', jwtToken)
    localStorage.setItem('projx_user', JSON.stringify(userData))
    localStorage.setItem('projx_mode', userData.role)
    api.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    setActiveMode(null)
    localStorage.removeItem('projx_token')
    localStorage.removeItem('projx_user')
    localStorage.removeItem('projx_mode')
    delete api.defaults.headers.common['Authorization']
  }

  const toggleMode = () => {
    if (user?.role === 'teacher' && user?.isAlsoGuide) {
      const newMode = activeMode === 'teacher' ? 'guide' : 'teacher'
      setActiveMode(newMode)
      localStorage.setItem('projx_mode', newMode)
      // Redirect handled by component calling toggleMode
    }
  }

  const switchMode = (newMode) => {
    if (user?.role === 'teacher' && user?.isAlsoGuide) {
      setActiveMode(newMode)
      localStorage.setItem('projx_mode', newMode)
    }
  }

  const updateUser = (updatedUser) => {
    setUser(updatedUser)
    localStorage.setItem('projx_user', JSON.stringify(updatedUser))
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, activeMode, login, logout, updateUser, toggleMode, switchMode }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
