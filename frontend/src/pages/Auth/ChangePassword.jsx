import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { FiLock, FiEye, FiEyeOff } from 'react-icons/fi'

export default function ChangePassword() {
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(false)
  const { user, updateUser, logout } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.oldPassword || !form.newPassword || !form.confirmPassword) {
      return toast.error('All fields are required')
    }

    if (form.newPassword !== form.confirmPassword) {
      return toast.error('New passwords do not match')
    }

    if (form.newPassword.length < 6) {
      return toast.error('New password must be at least 6 characters long')
    }

    setLoading(true)
    try {
      await api.post('/auth/change-password', {
        oldPassword: form.oldPassword,
        newPassword: form.newPassword,
      })

      toast.success('Password changed successfully!')

      // Update the user session locally to clear mustChangePassword
      const updatedUser = { ...user, mustChangePassword: false }
      updateUser(updatedUser)

      // Navigate to corresponding dashboard
      const dash = updatedUser.role === 'super_admin' ? '/system/dashboard'
                 : (updatedUser.role === 'admin' || updatedUser.role === 'college_admin') ? '/admin/dashboard'
                 : updatedUser.role === 'teacher' ? '/teacher/dashboard'
                 : updatedUser.role === 'guide' ? '/guide/dashboard'
                 : '/student/dashboard'
      navigate(dash)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-700 to-accent flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-xl mb-3 text-yellow-600">
            <FiLock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Change Password</h2>
          <p className="text-sm text-gray-500 mt-1">
            You are logging in with a temporary password and must set a new password before proceeding.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Old Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current/Temporary Password</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type={showOld ? 'text' : 'password'}
                name="oldPassword"
                value={form.oldPassword}
                onChange={handleChange}
                placeholder="Enter current password"
                className="input-field pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showOld ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type={showNew ? 'text' : 'password'}
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                placeholder="At least 6 characters"
                className="input-field pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showNew ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat new password"
                className="input-field pl-10"
                required
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2">
            {loading ? 'Updating password…' : 'Update Password & Access Portal'}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={logout}
            className="text-sm text-red-500 hover:text-red-700 font-medium hover:underline"
          >
            Cancel & Logout
          </button>
        </div>
      </div>
    </div>
  )
}
