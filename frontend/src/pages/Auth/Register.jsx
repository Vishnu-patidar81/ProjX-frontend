import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { FiUser, FiMail, FiLock, FiBriefcase } from 'react-icons/fi'

const DOMAINS = [
  'Web Development','Mobile Development','Machine Learning',
  'Data Science','IoT','Cybersecurity','Cloud Computing',
  'Blockchain','AR/VR','Other',
]

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    role: 'student', enrollmentNumber: '', facultyId: '', department: '',
    expertiseDomains: [], className: '', section: '', year: '', adminSetupKey: ''
  })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const toggleDomain = (d) => {
    setForm(prev => ({
      ...prev,
      expertiseDomains: prev.expertiseDomains.includes(d)
        ? prev.expertiseDomains.filter(x => x !== d)
        : [...prev.expertiseDomains, d],
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match')
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')

    setLoading(true)
    try {
      const submitData = { ...form }
      if (form.role === 'teacher') {
        submitData.department = form.className
      }
      const { data } = await api.post('/auth/register', submitData)
      login(data.user, data.token)
      toast.success('Registration successful!')
      const dash = data.user.role === 'admin' ? '/admin/dashboard'
                 : data.user.role === 'teacher' ? '/teacher/dashboard'
                 : data.user.role === 'guide'  ? '/guide/dashboard'
                 : '/student/dashboard'
      navigate(dash)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-700 to-accent flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-xl shadow mb-3">
            <span className="text-primary-700 font-bold">PX</span>
          </div>
          <h1 className="text-white text-xl font-bold">Create Account</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input name="name" value={form.name} onChange={handleChange}
                  placeholder="John Doe" className="input-field pl-10" required />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input type="email" name="email" value={form.email} onChange={handleChange}
                  placeholder="you@institution.edu" className="input-field pl-10" required />
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select name="role" value={form.role} onChange={handleChange} className="input-field">
                <option value="student">Student</option>
                <option value="guide">Guide / Faculty</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Role-specific ID */}
            {form.role === 'student' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Number</label>
                  <input name="enrollmentNumber" value={form.enrollmentNumber} onChange={handleChange}
                    placeholder="e.g. 0101CS21001" className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input name="className" value={form.className} onChange={handleChange}
                    placeholder="CSE" className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                  <input type="number" min="1" name="section" value={form.section} onChange={handleChange}
                    placeholder="2" className="input-field" required />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <input type="number" min="1" max="4" name="year" value={form.year} onChange={handleChange}
                    placeholder="3" className="input-field" required />
                </div>
              </div>
            ) : form.role === 'teacher' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Faculty ID</label>
                  <input name="facultyId" value={form.facultyId} onChange={handleChange}
                    placeholder="FAC001" className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input name="className" value={form.className} onChange={handleChange}
                    placeholder="CSE" className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                  <input type="number" min="1" name="section" value={form.section} onChange={handleChange}
                    placeholder="2" className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <input type="number" min="1" max="4" name="year" value={form.year} onChange={handleChange}
                    placeholder="3" className="input-field" required />
                </div>
              </div>
            ) : form.role === 'admin' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Faculty ID</label>
                  <input name="facultyId" value={form.facultyId} onChange={handleChange}
                    placeholder="FAC001" className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admin Setup Key</label>
                  <input type="password" name="adminSetupKey" value={form.adminSetupKey} onChange={handleChange}
                    placeholder="Secret Key" className="input-field" required />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Faculty ID</label>
                  <input name="facultyId" value={form.facultyId} onChange={handleChange}
                    placeholder="FAC001" className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input name="department" value={form.department} onChange={handleChange}
                    placeholder="CSE" className="input-field" />
                </div>
              </div>
            )}

            {/* Expertise domains for guides and teachers */}
            {(form.role === 'guide' || form.role === 'teacher') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expertise Domains</label>
                <div className="flex flex-wrap gap-2">
                  {DOMAINS.map(d => (
                    <button key={d} type="button" onClick={() => toggleDomain(d)}
                      className={`text-xs px-3 py-1 rounded-full border transition-colors
                        ${form.expertiseDomains.includes(d)
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input type="password" name="password" value={form.password} onChange={handleChange}
                    placeholder="Min 6 chars" className="input-field pl-10" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm</label>
                <input type="password" name="confirmPassword" value={form.confirmPassword}
                  onChange={handleChange} placeholder="Repeat" className="input-field" required />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2">
              {loading ? 'Creating account…' : 'Register'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
