import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

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

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) return toast.error('All fields are required')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', form)
      login(data.user, data.token)
      toast.success(`Welcome back, ${data.user.name}!`)
      
      if (data.user.mustChangePassword) {
        navigate('/change-password')
      } else {
        const dash = data.user.role === 'super_admin' ? '/system/dashboard'
          : (data.user.role === 'admin' || data.user.role === 'college_admin') ? '/admin/dashboard'
          : data.user.role === 'teacher' ? '/teacher/dashboard'
          : data.user.role === 'guide' ? '/guide/dashboard'
          : '/student/dashboard'
        navigate(dash)
      }
    } catch (err) {
      if (err.response?.data?.isSuperAdmin) {
        toast.error(err.response.data.message)
        setTimeout(() => navigate('/system/login'), 1500)
      } else {
        toast.error(err.response?.data?.message || 'Login failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-700 to-accent flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 cursor-pointer select-none" onClick={handleLogoClick}>
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white rounded-2xl shadow-lg mb-4">
            <span className="text-primary-700 font-bold text-xl">PX</span>
          </div>
          <h1 className="text-white text-2xl font-bold">ProjX</h1>
          <p className="text-primary-200 text-sm mt-1">Minor Project Management System</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Sign In</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email or Enrollment Number
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@institution.edu or Enrollment No."
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input-field pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPass ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span />
              <Link to="/forgot-password" className="text-xs text-primary-600 hover:underline">
                Forgot password?
              </Link>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Register link disabled for ERP migration */}
        </div>

      </div>
    </div>
  )
}
