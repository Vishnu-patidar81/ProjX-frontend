import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { uploadToImageKit } from '../../utils/uploadHelper'
import toast from 'react-hot-toast'
import { FiPhone, FiMail, FiUser, FiCamera, FiCheckCircle } from 'react-icons/fi'

export default function CompleteProfile() {
  const { user, updateUser, logout } = useAuth()
  const [form, setForm] = useState({
    phoneNumber: '',
    personalEmail: '',
    profilePhoto: ''
  })
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        return toast.error('Photo size must be less than 2MB')
      }
      setPhotoFile(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.phoneNumber || !form.personalEmail) {
      return toast.error('Phone number and personal email are required')
    }

    if (form.phoneNumber.length !== 10 || !/^\d{10}$/.test(form.phoneNumber)) {
      return toast.error('Please enter a valid 10-digit mobile number')
    }

    if (!/^\S+@\S+\.\S+$/.test(form.personalEmail)) {
      return toast.error('Please enter a valid personal email address')
    }

    setLoading(true)
    try {
      let uploadedPhotoUrl = form.profilePhoto

      if (photoFile) {
        toast.loading('Uploading profile photo...', { id: 'photo-upload' })
        const uploadResult = await uploadToImageKit(photoFile, 'profile-images', user)
        uploadedPhotoUrl = uploadResult.url
        toast.success('Photo uploaded successfully', { id: 'photo-upload' })
      }

      const { data } = await api.post('/auth/complete-profile', {
        phoneNumber: form.phoneNumber,
        personalEmail: form.personalEmail.trim().toLowerCase(),
        profilePhoto: uploadedPhotoUrl
      })

      toast.success('Profile onboarding completed successfully!')

      // Sync the user state locally
      updateUser(data.user)

      // Navigate to student dashboard
      navigate('/student/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete profile onboarding')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-700 to-accent flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Onboarding Banner */}
        <div className="bg-gradient-to-r from-primary-700 to-primary-600 px-8 py-6 text-white text-center relative">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-white/10 rounded-xl mb-3 text-white border border-white/20">
            <FiCheckCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold">Complete Your Profile</h2>
          <p className="text-xs text-primary-100 mt-1">
            Let's get your details updated before you enter the ProjX portal.
          </p>
        </div>

        <div className="p-8 space-y-6">
          {/* Read-Only Student Info */}
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex justify-between items-center text-sm">
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Student Name</p>
              <p className="text-gray-800 font-bold mt-0.5">{user?.name}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Enrollment No.</p>
              <p className="text-gray-800 font-mono font-semibold mt-0.5">{user?.enrollmentNumber}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Profile Photo Uploader */}
            <div className="flex flex-col items-center">
              <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo (Optional)</label>
              <div className="relative w-24 h-24 rounded-full border-2 border-gray-200 overflow-hidden flex items-center justify-center group bg-gray-50 shadow-inner">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <FiUser className="w-10 h-10 text-gray-400" />
                )}
                <label className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <FiCamera className="w-6 h-6 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5">JPG, PNG, GIF up to 2MB. Hover to edit.</p>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="tel"
                  name="phoneNumber"
                  value={form.phoneNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                    setForm(prev => ({ ...prev, phoneNumber: val }))
                  }}
                  placeholder="Enter 10-digit phone number"
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            {/* Personal Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Personal Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  name="personalEmail"
                  value={form.personalEmail}
                  onChange={handleChange}
                  placeholder="name@personal.com"
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2">
              {loading ? 'Completing profile...' : 'Complete Profile & Open Dashboard'}
            </button>
          </form>

          <div className="text-center pt-2">
            <button
              onClick={logout}
              className="text-sm text-red-500 hover:text-red-700 font-medium hover:underline"
            >
              Cancel & Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
