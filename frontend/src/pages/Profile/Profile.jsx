import { useEffect, useState } from 'react'
import PageLayout from '../../components/common/PageLayout'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { toast } from 'react-hot-toast'
import { FiUser, FiMail, FiPhone, FiLock, FiCalendar, FiShield, FiBriefcase, FiTag, FiBook } from 'react-icons/fi'

export default function Profile() {
  const { updateUser } = useAuth()
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    expertiseDomains: '',
    className: '',
    section: '',
    year: ''
  })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/auth/me')
        setProfileData(data.user)
        setFormData({
          name: data.user.name || '',
          email: data.user.email || '',
          phoneNumber: data.user.phoneNumber ? data.user.phoneNumber.replace('+91', '') : '',
          password: '',
          confirmPassword: '',
          expertiseDomains: data.user.expertiseDomains ? data.user.expertiseDomains.join(', ') : '',
          className: data.user.className || '',
          section: data.user.section || '',
          year: data.user.year || ''
        })
      } catch (err) {
        toast.error('Failed to load profile data')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

    const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Name is required')
      return
    }
    if (!formData.email.trim()) {
      toast.error('Email is required')
      return
    }
    
    // Phone Number Frontend Validation
    if (!formData.phoneNumber) {
      toast.error('Phone number is required')
      return
    }
    if (formData.phoneNumber.length !== 10) {
      toast.error('Phone number must contain exactly 10 digits')
      return
    }
    if (!/^\d{10}$/.test(formData.phoneNumber)) {
      toast.error('Please enter a valid 10-digit mobile number.')
      return
    }

    if (formData.password) {
      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters')
        return
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match')
        return
      }
    }

    setSaving(true)
    try {
      const updatePayload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber,
      }
      if (formData.password) {
        updatePayload.password = formData.password
      }
      if (profileData?.role === 'student' || profileData?.role === 'teacher') {
        updatePayload.className = formData.className.trim();
        updatePayload.section = formData.section;
        updatePayload.year = formData.year;
      }
      if (profileData?.role === 'guide' || profileData?.role === 'teacher') {
        updatePayload.expertiseDomains = formData.expertiseDomains
          .split(',')
          .map(d => d.trim())
          .filter(d => d.length > 0)
      }

      const { data } = await api.put('/auth/profile', updatePayload)
      setProfileData(data.user)
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }))
      updateUser(data.user)
      toast.success('Profile updated successfully')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400" />
        </div>
      </PageLayout>
    )
  }

  const roleLabels = {
    student: 'Student',
    teacher: 'Teacher',
    guide: 'Guide',
    admin: 'Administrator'
  }

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Block */}
        <div className="bg-gradient-to-r from-primary-600 to-indigo-600 dark:from-primary-700 dark:to-indigo-800 rounded-xl p-6 text-white shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/10 dark:bg-white/5 rounded-full flex items-center justify-center border border-white/20">
              <FiUser className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{profileData?.name}</h1>
              <p className="text-primary-100 text-sm mt-1 capitalize font-medium">
                {roleLabels[profileData?.role] || profileData?.role}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Read-Only Role Fields Card */}
          <div className="md:col-span-1 space-y-6">
            <div className="card bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
                System Info
              </h2>
              <div className="space-y-4">
                {/* Common non-editable fields */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FiShield className="w-3.5 h-3.5" /> Role
                  </label>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-1 capitalize">
                    {profileData?.role}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FiCalendar className="w-3.5 h-3.5" /> Registered Date
                  </label>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-1">
                    {profileData?.createdAt ? new Date(profileData.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : '—'}
                  </p>
                </div>

                {/* Student role-specific read-only fields */}
                {profileData?.role === 'student' && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Enrollment Number</label>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-1">{profileData?.enrollmentNumber || '—'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Department / Section</label>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-1">
                        {profileData?.className} - {profileData?.section}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Year</label>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-1">{profileData?.year || '—'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <FiBriefcase className="w-3.5 h-3.5" /> Group Name
                      </label>
                      <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 mt-1">{profileData?.groupName}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <FiBook className="w-3.5 h-3.5" /> Project Title
                      </label>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-1">{profileData?.projectTitle}</p>
                    </div>
                  </>
                )}

                {/* Teacher role-specific read-only fields */}
                {profileData?.role === 'teacher' && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Faculty ID</label>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-1">{profileData?.facultyId || '—'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Assigned Department / Section</label>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-1">
                        {profileData?.className} - {profileData?.section}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Assigned Year</label>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-1">{profileData?.year || '—'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">General Department</label>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-1">{profileData?.department || '—'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <FiTag className="w-3.5 h-3.5" /> Expertise Domains
                      </label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {profileData?.expertiseDomains && profileData.expertiseDomains.length > 0 ? (
                          profileData.expertiseDomains.map(d => (
                            <span key={d} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                              {d}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500">—</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <FiBriefcase className="w-3.5 h-3.5" /> Managed Groups
                      </label>
                      <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 mt-1">{profileData?.assignedGroupsCount || 0}</p>
                    </div>
                  </>
                )}

                {/* Guide role-specific read-only fields */}
                {profileData?.role === 'guide' && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Faculty ID</label>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-1">{profileData?.facultyId || '—'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <FiTag className="w-3.5 h-3.5" /> Department
                      </label>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-1">{profileData?.department || '—'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <FiBriefcase className="w-3.5 h-3.5" /> Assigned Groups Count
                      </label>
                      <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 mt-1">{profileData?.assignedGroupsCount || 0}</p>
                    </div>
                  </>
                )}

                {/* Admin role-specific read-only fields */}
                {profileData?.role === 'admin' && (
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FiBriefcase className="w-3.5 h-3.5" /> System Summary
                    </label>
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-2 bg-gray-50 dark:bg-gray-800 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 leading-relaxed whitespace-pre-line">
                      {profileData?.systemSummary}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Editable Form Card */}
          <div className="md:col-span-2">
            <div className="card bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-6 pb-2 border-b border-gray-100 dark:border-gray-800">
                Edit Information
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <FiUser className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="input-field pl-10"
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <FiMail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="input-field pl-10"
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <FiPhone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        handleChange({ target: { name: 'phoneNumber', value: val } });
                      }}
                      className="input-field pl-10"
                      placeholder="Enter 10-digit mobile number"
                      required
                    />
                  </div>
                </div>

                {/* Department, Section, Year for Student/Teacher */}
                {(profileData?.role === 'student' || profileData?.role === 'teacher') && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Department
                      </label>
                      <input
                        type="text"
                        name="className"
                        value={formData.className}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="e.g. CSE"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Section
                      </label>
                      <input
                        type="number"
                        min="1"
                        name="section"
                        value={formData.section}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="e.g. 2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Year
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="4"
                        name="year"
                        value={formData.year}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="e.g. 3"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Guide / Teacher Expertise Domains */}
                {(profileData?.role === 'guide' || profileData?.role === 'teacher') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Expertise Domains <span className="text-xs text-gray-400">(Comma separated)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <FiTag className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        name="expertiseDomains"
                        value={formData.expertiseDomains}
                        onChange={handleChange}
                        className="input-field pl-10"
                        placeholder="e.g. Machine Learning, Cloud Computing, Web Development"
                      />
                    </div>
                  </div>
                )}

                {/* Security Section (Change Password) */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <FiLock className="w-4 h-4" /> Change Password
                  </h3>
                  <p className="text-xs text-gray-400">Leave these fields blank if you do not wish to change your password.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="Min 6 characters"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="Re-enter password"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary flex items-center gap-2"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
