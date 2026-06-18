import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { FiMail, FiKey, FiLock } from 'react-icons/fi'

export default function ForgotPassword() {
  const [step, setStep]   = useState(1) // 1=email, 2=otp+new password
  const [email, setEmail] = useState('')
  const [otp, setOtp]     = useState('')
  const [newPass, setNewPass] = useState('')
  const [loading, setLoading] = useState(false)

  const sendOtp = async (e) => {
    e.preventDefault()
    if (!email) return toast.error('Enter your email')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/forgot-password', { email })
      toast.success(data.message)
      if (data.otp) toast(`Dev OTP: ${data.otp}`, { icon: '🔑', duration: 10000 })
      setStep(2)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (e) => {
    e.preventDefault()
    if (!otp || !newPass) return toast.error('OTP and new password are required')
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { email, otp, newPassword: newPass })
      toast.success('Password reset! You can now login.')
      setStep(3)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 to-accent flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <FiKey className="w-6 h-6 text-primary-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Reset Password</h2>
        </div>

        {step === 1 && (
          <form onSubmit={sendOtp} className="space-y-4">
            <p className="text-sm text-gray-500">Enter your registered email to receive an OTP.</p>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@institution.edu" className="input-field pl-10" required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Sending…' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={resetPassword} className="space-y-4">
            <p className="text-sm text-gray-500">Enter the OTP sent to <strong>{email}</strong></p>
            <div className="relative">
              <FiKey className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input value={otp} onChange={e => setOtp(e.target.value)}
                placeholder="6-digit OTP" className="input-field pl-10" required />
            </div>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)}
                placeholder="New password (min 6 chars)" className="input-field pl-10" required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
          </form>
        )}

        {step === 3 && (
          <div className="text-center space-y-4">
            <div className="text-4xl">✅</div>
            <p className="text-gray-700 font-medium">Password reset successfully!</p>
            <Link to="/login" className="btn-primary inline-block px-8">Back to Login</Link>
          </div>
        )}

        <p className="text-center text-sm text-gray-400 mt-6">
          <Link to="/login" className="text-primary-600 hover:underline">← Back to Login</Link>
        </p>
      </div>
    </div>
  )
}
