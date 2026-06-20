import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { FiUser, FiLock, FiMail, FiPhone, FiCheck, FiX, FiAward } from 'react-icons/fi'

export default function ActivateAccount() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { login } = useAuth()

  const [invite, setInvite] = useState(null)
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  const [form, setForm] = useState({
    name: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    facultyId: '',
  })

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const { data } = await api.get(`/invites/verify/${token}`)
        setInvite(data.invite)
        setForm((prev) => ({
          ...prev,
          name: data.invite.role === 'teacher' ? prev.name : '',
        }))
        setVerifying(false)
      } catch (err) {
        setErrorMsg(err.response?.data?.message || 'Verification failed. This invitation link is invalid or expired.')
        setVerifying(false)
      } finally {
        setLoading(false)
      }
    }
    verifyToken()
  }, [token])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.name || !form.phoneNumber || !form.password || !form.confirmPassword) {
      return toast.error('All fields are required')
    }

    if (form.phoneNumber.length !== 10 || isNaN(Number(form.phoneNumber))) {
      return toast.error('Phone number must be a 10-digit number')
    }

    if (form.password !== form.confirmPassword) {
      return toast.error('Passwords do not match')
    }

    if (form.password.length < 6) {
      return toast.error('Password must be at least 6 characters long')
    }

    setLoading(true)
    try {
      const payload = {
        token,
        name: form.name,
        phoneNumber: form.phoneNumber,
        password: form.password,
        facultyId: invite.role === 'teacher' ? form.facultyId || invite.facultyId : undefined,
        className: invite.className,
        section: invite.section,
        year: invite.year,
      }

      const { data } = await api.post('/invites/activate', payload)
      login(data.user, data.token)
      toast.success('Account activated successfully! Welcome to ProjX.')
      
      const dash = data.user.role === 'super_admin' ? '/super-admin/dashboard'
                 : (data.user.role === 'admin' || data.user.role === 'college_admin') ? '/admin/dashboard'
                 : data.user.role === 'teacher' ? '/teacher/dashboard'
                 : '/student/dashboard'
      navigate(dash)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Activation failed')
    } finally {
      setLoading(false)
    }
  }

  if (verifying) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-700">Verifying invitation token…</h2>
        </div>
      </div>
    )
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center border border-red-100">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiX className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Invitation Error</h2>
          <p className="text-gray-500 text-sm mb-6">{errorMsg}</p>
          <button
            onClick={() => navigate('/login')}
            className="btn-primary w-full py-2.5"
          >
            Go to Login Page
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-700 to-accent flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-xl shadow mb-3">
            <span className="text-primary-700 font-bold">PX</span>
          </div>
          <h1 className="text-white text-2xl font-bold">Onboard on ProjX</h1>
          <p className="text-primary-100 text-sm">Activate your administrative portal account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
          {/* Metadata summary */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 mb-6">
            <h3 className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-2">Invitation Details</h3>
            <div className="space-y-1 text-sm text-gray-700">
              <p><strong>Email:</strong> {invite?.email}</p>
              <p><strong>Organization:</strong> {invite?.collegeName}</p>
              <p><strong>Role:</strong> <span className="capitalize">{invite?.role.replace('_', ' ')}</span></p>
              {invite?.role === 'teacher' && (
                <p><strong>Class Details:</strong> {invite.className} | Section {invite.section} | Year {invite.year}</p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number (10 digits)</label>
              <div className="relative">
                <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  name="phoneNumber"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  placeholder="Enter 10-digit mobile number"
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            {/* Faculty ID if teacher */}
            {invite?.role === 'teacher' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Faculty ID (Optional)</label>
                <div className="relative">
                  <FiAward className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    name="facultyId"
                    value={form.facultyId}
                    onChange={handleChange}
                    placeholder="e.g. FAC101"
                    className="input-field pl-10"
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Min 6 chars"
                    className="input-field pl-10"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat password"
                  className="input-field"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 mt-2 flex items-center justify-center gap-2"
            >
              {loading ? 'Activating Profile…' : 'Activate Account & Access Portal'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
