import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import toast from 'react-hot-toast'
import {
  FiUsers, FiBook, FiCalendar, FiLayers, FiSettings,
  FiPlus, FiEdit, FiInfo, FiCopy, FiCheck, FiX,
  FiSend, FiGrid, FiUserCheck, FiLogOut
} from 'react-icons/fi'

export default function CollegeAdminDashboard() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [teachers, setTeachers] = useState([])
  const [departments, setDepartments] = useState([])
  const [sessions, setSessions] = useState([])
  const [semesters, setSemesters] = useState([])
  const [teacherInvites, setTeacherInvites] = useState([])
  const [loading, setLoading] = useState(false)

  // Search/Filters states
  const [teacherSearch, setTeacherSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')

  // Modals / Drawers states
  const [teacherModal, setTeacherModal] = useState({ open: false, mode: 'invite', data: null })
  const [deptModal, setDeptModal] = useState({ open: false, mode: 'create', data: null })
  const [sessionModal, setSessionModal] = useState({ open: false, mode: 'create', data: null })
  const [semesterModal, setSemesterModal] = useState({ open: false, mode: 'create', data: null })

  // Form states
  const [teacherForm, setTeacherForm] = useState({
    name: '', email: '', phoneNumber: '', facultyId: '', className: '', section: '', year: '', isGuide: false
  })
  const [deptForm, setDeptForm] = useState({ name: '', code: '', isActive: true })
  const [sessionForm, setSessionForm] = useState({ sessionYear: '', isActive: true })
  const [semesterForm, setSemesterForm] = useState({ number: '', isActive: true })

  useEffect(() => {
    fetchTeachers()
    fetchTeacherInvites()
    fetchDepartments()
    fetchSessions()
    fetchSemesters()
  }, [])

  const fetchTeachers = async () => {
    try {
      const { data } = await api.get('/teachers')
      setTeachers(data.teachers || [])
    } catch (err) {
      toast.error('Failed to load teachers')
    }
  }

  const fetchTeacherInvites = async () => {
    try {
      const { data } = await api.get('/invites')
      setTeacherInvites(data.invites || [])
    } catch (err) {
      toast.error('Failed to load invitations')
    }
  }

  const fetchDepartments = async () => {
    try {
      const { data } = await api.get('/academic/departments')
      setDepartments(data.departments || [])
    } catch (err) {
      toast.error('Failed to load departments')
    }
  }

  const fetchSessions = async () => {
    try {
      const { data } = await api.get('/academic/academic-sessions')
      setSessions(data.sessions || [])
    } catch (err) {
      toast.error('Failed to load batches')
    }
  }

  const fetchSemesters = async () => {
    try {
      const { data } = await api.get('/academic/semesters')
      setSemesters(data.semesters || [])
    } catch (err) {
      toast.error('Failed to load semesters')
    }
  }

  // Teacher handlers
  const handleOpenTeacherModal = (mode, data = null) => {
    if (mode === 'invite') {
      setTeacherForm({ name: '', email: '', phoneNumber: '', facultyId: '', className: '', section: '', year: '', isGuide: false })
    } else {
      setTeacherForm({
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber || '',
        facultyId: data.facultyId || '',
        className: data.className || '',
        section: data.section || '',
        year: data.year || '',
        isGuide: data.isGuide || false
      })
    }
    setTeacherModal({ open: true, mode, data })
  }

  const handleSaveTeacher = async (e) => {
    e.preventDefault()
    if (!teacherForm.name || !teacherForm.email) {
      return toast.error('Name and Email are mandatory')
    }

    setLoading(true)
    try {
      if (teacherModal.mode === 'invite') {
        const { data } = await api.post('/invites/send', {
          ...teacherForm,
          role: 'teacher'
        })
        toast.success('Teacher invited successfully')
        if (data.activationLink) {
          navigator.clipboard.writeText(data.activationLink)
          toast('Activation link copied to clipboard!', { icon: '📋' })
        }
        fetchTeacherInvites()
      } else {
        await api.put(`/teachers/${teacherModal.data._id}`, teacherForm)
        toast.success('Teacher details updated successfully')
        fetchTeachers()
      }
      setTeacherModal({ open: false, mode: 'invite', data: null })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save teacher')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleDeactivateTeacher = async (teacher) => {
    if (teacher.isActive && teacher.isGuide) {
      const proceed = confirm(`⚠️ Warning: This teacher "${teacher.name}" is designated as a Guide. Deactivating them will prevent them from managing student project groups and viewing active consent forms. Do you want to proceed?`)
      if (!proceed) return
    } else if (teacher.isActive) {
      const proceed = confirm(`Are you sure you want to deactivate teacher ${teacher.name}?`)
      if (!proceed) return
    }

    try {
      await api.post(`/teachers/${teacher._id}/deactivate`)
      toast.success('Teacher status updated successfully')
      fetchTeachers()
    } catch (err) {
      toast.error('Failed to change status')
    }
  }

  const handleResendTeacherInvite = async (id) => {
    try {
      const { data } = await api.post(`/invites/${id}/resend`)
      toast.success('Activation link regenerated')
      if (data.activationLink) {
        navigator.clipboard.writeText(data.activationLink)
        toast('New link copied to clipboard!', { icon: '📋' })
      }
      fetchTeacherInvites()
    } catch (err) {
      toast.error('Failed to resend invite')
    }
  }

  const handleCancelTeacherInvite = async (id) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) return
    try {
      await api.post(`/invites/${id}/cancel`)
      toast.success('Invitation cancelled')
      fetchTeacherInvites()
    } catch (err) {
      toast.error('Failed to cancel invite')
    }
  }

  // Departments CRUD
  const handleOpenDeptModal = (mode, data = null) => {
    if (mode === 'create') {
      setDeptForm({ name: '', code: '', isActive: true })
    } else {
      setDeptForm({ name: data.name, code: data.code || '', isActive: data.isActive })
    }
    setDeptModal({ open: true, mode, data })
  }

  const handleSaveDept = async (e) => {
    e.preventDefault()
    if (!deptForm.name) return toast.error('Department name is required')

    setLoading(true)
    try {
      if (deptModal.mode === 'create') {
        await api.post('/academic/departments', deptForm)
        toast.success('Department created')
      } else {
        await api.put(`/academic/departments/${deptModal.data._id}`, deptForm)
        toast.success('Department updated')
      }
      setDeptModal({ open: false, mode: 'create', data: null })
      fetchDepartments()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save department')
    } finally {
      setLoading(false)
    }
  }

  // Academic Sessions CRUD
  const handleOpenSessionModal = (mode, data = null) => {
    if (mode === 'create') {
      setSessionForm({ sessionYear: '', isActive: true })
    } else {
      setSessionForm({ sessionYear: data.sessionYear, isActive: data.isActive })
    }
    setSessionModal({ open: true, mode, data })
  }

  const handleSaveSession = async (e) => {
    e.preventDefault()
    if (!sessionForm.sessionYear) return toast.error('Session Year is required')

    setLoading(true)
    try {
      if (sessionModal.mode === 'create') {
        await api.post('/academic/academic-sessions', sessionForm)
        toast.success('Academic session batch created')
      } else {
        await api.put(`/academic/academic-sessions/${sessionModal.data._id}`, sessionForm)
        toast.success('Academic session batch updated')
      }
      setSessionModal({ open: false, mode: 'create', data: null })
      fetchSessions()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save batch')
    } finally {
      setLoading(false)
    }
  }

  // Semesters CRUD
  const handleOpenSemesterModal = (mode, data = null) => {
    if (mode === 'create') {
      setSemesterForm({ number: '', isActive: true })
    } else {
      setSemesterForm({ number: data.number, isActive: data.isActive })
    }
    setSemesterModal({ open: true, mode, data })
  }

  const handleSaveSemester = async (e) => {
    e.preventDefault()
    if (!semesterForm.number || isNaN(Number(semesterForm.number))) {
      return toast.error('Valid semester number is required')
    }

    setLoading(true)
    try {
      if (semesterModal.mode === 'create') {
        await api.post('/academic/semesters', semesterForm)
        toast.success('Semester term created')
      } else {
        await api.put(`/academic/semesters/${semesterModal.data._id}`, semesterForm)
        toast.success('Semester term updated')
      }
      setSemesterModal({ open: false, mode: 'create', data: null })
      fetchSemesters()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save term')
    } finally {
      setLoading(false)
    }
  }

  // Copy helper
  const copyLink = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Invite link copied!')
  }

  // Filtering teachers
  const filteredTeachers = teachers.filter((t) => {
    const searchMatch =
      t.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      t.email.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      (t.facultyId && t.facultyId.toLowerCase().includes(teacherSearch.toLowerCase()))

    const deptMatch = !deptFilter || t.className === deptFilter
    return searchMatch && deptMatch
  })

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-primary-600 text-white p-2.5 rounded-xl shadow-md">
            <FiUsers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">College Administration Portal</h1>
            <p className="text-xs text-gray-400 font-medium">ProjX Institutional Workspace</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-700">{user?.name || 'College Admin'}</p>
            <p className="text-xs text-amber-600 font-bold bg-amber-50 px-2.5 py-0.5 rounded-full inline-block">College Admin</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:bg-red-50 px-4 py-2.5 rounded-xl transition-all border border-red-100 hover:border-red-200"
          >
            <FiLogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="w-full lg:w-64 bg-white border-r border-gray-200 p-4 space-y-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all
              ${activeTab === 'overview' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <FiGrid className="w-5 h-5" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('teachers')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all
              ${activeTab === 'teachers' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <FiUserCheck className="w-5 h-5" />
            Teachers & Guides
          </button>
          <button
            onClick={() => setActiveTab('departments')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all
              ${activeTab === 'departments' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <FiBook className="w-5 h-5" />
            Departments
          </button>
          <button
            onClick={() => setActiveTab('batches')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all
              ${activeTab === 'batches' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <FiCalendar className="w-5 h-5" />
            Academic Batches
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all
              ${activeTab === 'terms' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <FiLayers className="w-5 h-5" />
            Semester Terms
          </button>
        </aside>

        {/* Content Body */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-6xl w-full mx-auto">
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-primary-50 border border-primary-200 text-primary-800 rounded-2xl p-5 flex gap-3">
                <FiInfo className="w-5 h-5 mt-0.5 shrink-0 text-primary-600" />
                <div>
                  <p className="font-bold text-sm">College Workspace Status: ACTIVE</p>
                  <p className="text-xs text-primary-700 mt-0.5">Use the side navigation options to manage teachers and guides directory, define structural departments, batches, and semesters terms.</p>
                </div>
              </div>

              {/* Scoped Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Teachers</span>
                  <p className="text-3xl font-extrabold text-gray-800 mt-2">{teachers.length}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Departments</span>
                  <p className="text-3xl font-extrabold text-gray-800 mt-2">{departments.length}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Academic Batches</span>
                  <p className="text-3xl font-extrabold text-gray-800 mt-2">{sessions.length}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Semester Terms</span>
                  <p className="text-3xl font-extrabold text-gray-800 mt-2">{semesters.length}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: TEACHERS */}
          {activeTab === 'teachers' && (
            <div className="space-y-6">
              {/* Header Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Teachers & Guides Directory</h2>
                  <p className="text-xs text-gray-500">Configure academic class assignments and guide status</p>
                </div>
                <button
                  onClick={() => handleOpenTeacherModal('invite')}
                  className="btn-primary flex items-center gap-2 py-2.5 px-4 text-sm self-start sm:self-auto"
                >
                  <FiPlus className="w-4 h-4" />
                  Invite Teacher
                </button>
              </div>

              {/* Filters / Search */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Search by name, email, or Faculty ID..."
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                  className="input-field py-2 text-sm"
                />
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="input-field py-2 text-sm"
                >
                  <option value="">All Departments</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Active Teachers Directory */}
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 bg-gray-50/50 border-b border-gray-200">
                  <h3 className="text-sm font-bold text-gray-700">Active Teachers</h3>
                </div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                      <th className="p-4">Faculty ID</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Class Mapping</th>
                      <th className="p-4">Guide Capability</th>
                      <th className="p-4">Last Login</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {filteredTeachers.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="p-8 text-center text-gray-400">No active teachers matching filters.</td>
                      </tr>
                    ) : (
                      filteredTeachers.map((t) => (
                        <tr key={t._id} className="hover:bg-gray-50/50">
                          <td className="p-4 font-mono font-semibold text-primary-700">{t.facultyId || 'N/A'}</td>
                          <td className="p-4 font-semibold text-gray-800">{t.name}</td>
                          <td className="p-4 text-gray-600">{t.email}</td>
                          <td className="p-4 text-xs">
                            {t.className ? `${t.className} | Sec ${t.section} | Yr ${t.year}` : 'N/A'}
                          </td>
                          <td className="p-4">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold
                              ${t.isGuide ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-gray-50 text-gray-400'}`}>
                              {t.isGuide ? 'Guide' : 'Teacher Only'}
                            </span>
                          </td>
                          <td className="p-4 text-xs text-gray-400">
                            {t.lastLogin ? new Date(t.lastLogin).toLocaleString() : 'Never'}
                          </td>
                          <td className="p-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold
                              ${t.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                              {t.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => handleOpenTeacherModal('edit', t)}
                              className="text-gray-500 hover:text-primary-600 inline-flex items-center justify-center p-1.5 hover:bg-gray-100 rounded-lg"
                              title="Edit details"
                            >
                              <FiEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleDeactivateTeacher(t)}
                              className={`text-xs font-semibold px-2 py-1 rounded-lg border
                                ${t.isActive ? 'text-red-500 border-red-100 bg-red-50/30 hover:bg-red-50' : 'text-emerald-600 border-emerald-100 bg-emerald-50/30'}`}
                              title={t.isActive ? 'Deactivate Account' : 'Activate Account'}
                            >
                              {t.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pending Invites Section */}
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 bg-gray-50/50 border-b border-gray-200">
                  <h3 className="text-sm font-bold text-gray-700">Pending Onboarding Invitations</h3>
                </div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                      <th className="p-4">Email</th>
                      <th className="p-4">Assigned Department</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {teacherInvites.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-6 text-center text-gray-400">No pending teacher invitations.</td>
                      </tr>
                    ) : (
                      teacherInvites.map((inv) => (
                        <tr key={inv._id} className="hover:bg-gray-50/50">
                          <td className="p-4 font-semibold text-gray-800">{inv.email}</td>
                          <td className="p-4 text-xs">{inv.className || 'N/A'}</td>
                          <td className="p-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold
                              ${inv.status === 'Accepted' ? 'bg-emerald-50 text-emerald-600'
                                : inv.status === 'Pending' ? 'bg-amber-50 text-amber-600'
                                : inv.status === 'Resent' ? 'bg-blue-50 text-blue-600'
                                : 'bg-red-50 text-red-600'}`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            {inv.status !== 'Accepted' && (
                              <>
                                <button
                                  onClick={() => handleResendTeacherInvite(inv._id)}
                                  className="text-primary-600 hover:text-primary-800 text-xs font-semibold hover:underline"
                                >
                                  Resend
                                </button>
                                <button
                                  onClick={() => handleCancelTeacherInvite(inv._id)}
                                  className="text-red-500 hover:text-red-700 text-xs font-semibold hover:underline"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: DEPARTMENTS */}
          {activeTab === 'departments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Departments</h2>
                  <p className="text-xs text-gray-500">Configure college branches</p>
                </div>
                <button
                  onClick={() => handleOpenDeptModal('create')}
                  className="btn-primary flex items-center gap-2 py-2 px-4 text-sm"
                >
                  <FiPlus className="w-4 h-4" />
                  Add Department
                </button>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                      <th className="p-4">Code</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {departments.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-8 text-center text-gray-400">No departments added yet.</td>
                      </tr>
                    ) : (
                      departments.map((d) => (
                        <tr key={d._id} className="hover:bg-gray-50/50">
                          <td className="p-4 font-mono font-bold text-primary-700">{d.code || 'N/A'}</td>
                          <td className="p-4 font-semibold text-gray-800">{d.name}</td>
                          <td className="p-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold
                              ${d.isActive !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                              {d.isActive !== false ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleOpenDeptModal('edit', d)}
                              className="text-gray-500 hover:text-primary-600 inline-flex items-center justify-center p-1.5 hover:bg-gray-100 rounded-lg"
                              title="Edit details"
                            >
                              <FiEdit className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: BATCHES */}
          {activeTab === 'batches' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Academic Batches / Sessions</h2>
                  <p className="text-xs text-gray-500">Track and configure batch years</p>
                </div>
                <button
                  onClick={() => handleOpenSessionModal('create')}
                  className="btn-primary flex items-center gap-2 py-2 px-4 text-sm"
                >
                  <FiPlus className="w-4 h-4" />
                  Add Session Year
                </button>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                      <th className="p-4">Session Year</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {sessions.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="p-8 text-center text-gray-400">No session batches configured.</td>
                      </tr>
                    ) : (
                      sessions.map((s) => (
                        <tr key={s._id} className="hover:bg-gray-50/50">
                          <td className="p-4 font-semibold text-gray-800">{s.sessionYear}</td>
                          <td className="p-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold
                              ${s.isActive !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                              {s.isActive !== false ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleOpenSessionModal('edit', s)}
                              className="text-gray-500 hover:text-primary-600 inline-flex items-center justify-center p-1.5 hover:bg-gray-100 rounded-lg"
                            >
                              <FiEdit className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: TERMS */}
          {activeTab === 'terms' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Semester Terms</h2>
                  <p className="text-xs text-gray-500">Configure academic semesters</p>
                </div>
                <button
                  onClick={() => handleOpenSemesterModal('create')}
                  className="btn-primary flex items-center gap-2 py-2 px-4 text-sm"
                >
                  <FiPlus className="w-4 h-4" />
                  Add Semester Term
                </button>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                      <th className="p-4">Semester Number</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {semesters.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="p-8 text-center text-gray-400">No semesters term configured.</td>
                      </tr>
                    ) : (
                      semesters.map((sem) => (
                        <tr key={sem._id} className="hover:bg-gray-50/50">
                          <td className="p-4 font-semibold text-gray-800">Semester {sem.number}</td>
                          <td className="p-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold
                              ${sem.isActive !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                              {sem.isActive !== false ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleOpenSemesterModal('edit', sem)}
                              className="text-gray-500 hover:text-primary-600 inline-flex items-center justify-center p-1.5 hover:bg-gray-100 rounded-lg"
                            >
                              <FiEdit className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Teacher Invite / Edit Modal */}
      {teacherModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl relative border border-gray-100">
            <button
              onClick={() => setTeacherModal({ open: false, mode: 'invite', data: null })}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-gray-800 mb-4 capitalize">
              {teacherModal.mode === 'invite' ? 'Invite New Faculty Teacher' : 'Edit Teacher Details'}
            </h2>

            <form onSubmit={handleSaveTeacher} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Full Name</label>
                  <input
                    value={teacherForm.name}
                    onChange={handleChange}
                    name="name"
                    placeholder="Enter full name"
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={teacherForm.email}
                    onChange={handleChange}
                    name="email"
                    placeholder="teacher@institution.edu"
                    className="input-field"
                    disabled={teacherModal.mode === 'edit'}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Phone Number (10 digits)</label>
                  <input
                    value={teacherForm.phoneNumber}
                    onChange={handleChange}
                    name="phoneNumber"
                    placeholder="Phone number"
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Faculty ID</label>
                  <input
                    value={teacherForm.facultyId}
                    onChange={handleChange}
                    name="facultyId"
                    placeholder="e.g. TCH001"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Department</label>
                  <input
                    value={teacherForm.className}
                    onChange={handleChange}
                    name="className"
                    placeholder="e.g. CSE"
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Section</label>
                  <input
                    type="number"
                    value={teacherForm.section}
                    onChange={handleChange}
                    name="section"
                    placeholder="e.g. 2"
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Year</label>
                  <input
                    type="number"
                    value={teacherForm.year}
                    onChange={handleChange}
                    name="year"
                    placeholder="e.g. 3"
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <input
                  type="checkbox"
                  name="isGuide"
                  checked={teacherForm.isGuide}
                  onChange={(e) => setTeacherForm({ ...teacherForm, isGuide: e.target.checked })}
                  className="w-5 h-5 text-primary-600 rounded"
                />
                <div>
                  <label className="text-sm font-semibold text-gray-700 block">Designate as Project Guide</label>
                  <span className="text-xs text-gray-400">Grants capability to be auto-allocated/assigned to student groups</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
              >
                {loading ? 'Processing…' : teacherModal.mode === 'invite' ? 'Send Invitation & Copy Link' : 'Save Details'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Department Modal */}
      {deptModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl relative border border-gray-100">
            <button
              onClick={() => setDeptModal({ open: false, mode: 'create', data: null })}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-gray-800 mb-4 capitalize">
              {deptModal.mode === 'create' ? 'Create Department' : 'Edit Department Details'}
            </h2>

            <form onSubmit={handleSaveDept} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Department Name</label>
                <input
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  placeholder="e.g. Computer Science Engineering"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Department Code</label>
                <input
                  value={deptForm.code}
                  onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                  placeholder="e.g. CSE"
                  className="input-field"
                />
              </div>

              {deptModal.mode === 'edit' && (
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={deptForm.isActive}
                    onChange={(e) => setDeptForm({ ...deptForm, isActive: e.target.checked })}
                    className="w-5 h-5 text-primary-600 rounded"
                  />
                  <label className="text-sm font-semibold text-gray-700">Department is Active</label>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2 flex items-center justify-center gap-2"
              >
                {loading ? 'Saving…' : 'Save Department'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Academic Session Modal */}
      {sessionModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl relative border border-gray-100">
            <button
              onClick={() => setSessionModal({ open: false, mode: 'create', data: null })}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-gray-800 mb-4 capitalize">
              {sessionModal.mode === 'create' ? 'Create Session Year' : 'Edit Session Details'}
            </h2>

            <form onSubmit={handleSaveSession} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Session Year Identifier</label>
                <input
                  value={sessionForm.sessionYear}
                  onChange={(e) => setSessionForm({ ...sessionForm, sessionYear: e.target.value })}
                  placeholder="e.g. 2026-2027"
                  className="input-field"
                  required
                />
              </div>

              {sessionModal.mode === 'edit' && (
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={sessionForm.isActive}
                    onChange={(e) => setSessionForm({ ...sessionForm, isActive: e.target.checked })}
                    className="w-5 h-5 text-primary-600 rounded"
                  />
                  <label className="text-sm font-semibold text-gray-700">Session Year is Active</label>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2 flex items-center justify-center gap-2"
              >
                {loading ? 'Saving…' : 'Save Session Batch'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Semester Modal */}
      {semesterModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl relative border border-gray-100">
            <button
              onClick={() => setSemesterModal({ open: false, mode: 'create', data: null })}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-gray-800 mb-4 capitalize">
              {semesterModal.mode === 'create' ? 'Create Semester Term' : 'Edit Semester Term'}
            </h2>

            <form onSubmit={handleSaveSemester} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Semester Number</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={semesterForm.number}
                  onChange={(e) => setSemesterForm({ ...semesterForm, number: e.target.value })}
                  placeholder="e.g. 5"
                  className="input-field"
                  required
                />
              </div>

              {semesterModal.mode === 'edit' && (
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={semesterForm.isActive}
                    onChange={(e) => setSemesterForm({ ...semesterForm, isActive: e.target.checked })}
                    className="w-5 h-5 text-primary-600 rounded"
                  />
                  <label className="text-sm font-semibold text-gray-700">Semester is Active</label>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2 flex items-center justify-center gap-2"
              >
                {loading ? 'Saving…' : 'Save Term'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
