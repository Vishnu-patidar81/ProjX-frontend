import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import toast from 'react-hot-toast'
import {
  FiUsers, FiBook, FiCalendar, FiLayers, FiSettings,
  FiPlus, FiEdit, FiInfo, FiCopy, FiCheck, FiX,
  FiSend, FiGrid, FiUserCheck, FiLogOut, FiAward, FiList, FiLink, FiActivity
} from 'react-icons/fi'

export default function CollegeAdminDashboard() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [teachers, setTeachers] = useState([])
  const [guides, setGuides] = useState([])
  const [departments, setDepartments] = useState([])
  const [sessions, setSessions] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [sections, setSections] = useState([])
  const [assignments, setAssignments] = useState([])
  const [invites, setInvites] = useState([])
  const [loading, setLoading] = useState(false)

  // Search/Filters states
  const [teacherSearch, setTeacherSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [guideSearch, setGuideSearch] = useState('')

  // Modals / Drawers states
  const [teacherModal, setTeacherModal] = useState({ open: false, mode: 'invite', data: null })
  const [guideModal, setGuideModal] = useState({ open: false, mode: 'invite', data: null })
  const [deptModal, setDeptModal] = useState({ open: false, mode: 'create', data: null })
  const [sessionModal, setSessionModal] = useState({ open: false, mode: 'create', data: null })
  const [yearModal, setYearModal] = useState({ open: false, mode: 'create', data: null })
  const [sectionModal, setSectionModal] = useState({ open: false, mode: 'create', data: null })
  const [assignmentModal, setAssignmentModal] = useState({ open: false, mode: 'create', data: null })

  // Form states
  const [teacherForm, setTeacherForm] = useState({
    name: '', email: '', phoneNumber: '', facultyId: '', department: '', designation: '', guideEligible: false, isActive: true
  })
  const [guideForm, setGuideForm] = useState({
    name: '', email: '', phoneNumber: '', facultyId: '', department: '', designation: '', guideEligible: true, isActive: true
  })
  const [deptForm, setDeptForm] = useState({ name: '', code: '', isActive: true })
  const [sessionForm, setSessionForm] = useState({ name: '', startDate: '', endDate: '', status: 'Upcoming' })
  const [yearForm, setYearForm] = useState({ academicSessionId: '', yearValue: '', status: 'Active' })
  const [sectionForm, setSectionForm] = useState({ name: '', academicSessionId: '', academicYearId: '', departmentId: '', status: 'Active' })
  const [assignmentForm, setAssignmentForm] = useState({ teacherId: '', sectionId: '', isClassTeacher: false, status: 'Active' })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = () => {
    fetchTeachers()
    fetchGuides()
    fetchDepartments()
    fetchSessions()
    fetchAcademicYears()
    fetchSections()
    fetchAssignments()
    fetchInvites()
  }

  const fetchTeachers = async () => {
    try {
      const { data } = await api.get('/teachers?role=teacher')
      setTeachers(data.teachers || [])
    } catch (err) {
      toast.error('Failed to load teachers')
    }
  }

  const fetchGuides = async () => {
    try {
      const { data } = await api.get('/teachers?role=guide')
      setGuides(data.teachers || [])
    } catch (err) {
      toast.error('Failed to load guides')
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
      toast.error('Failed to load sessions')
    }
  }

  const fetchAcademicYears = async () => {
    try {
      const { data } = await api.get('/academic/academic-years')
      setAcademicYears(data.years || [])
    } catch (err) {
      toast.error('Failed to load academic years')
    }
  }

  const fetchSections = async () => {
    try {
      const { data } = await api.get('/academic/sections')
      setSections(data.sections || [])
    } catch (err) {
      toast.error('Failed to load sections')
    }
  }

  const fetchAssignments = async () => {
    try {
      const { data } = await api.get('/academic/teacher-assignments')
      setAssignments(data.assignments || [])
    } catch (err) {
      toast.error('Failed to load teacher assignments')
    }
  }

  const fetchInvites = async () => {
    try {
      const { data } = await api.get('/invites')
      setInvites(data.invites || [])
    } catch (err) {
      toast.error('Failed to load invitation history')
    }
  }

  // Teacher handlers
  const handleOpenTeacherModal = (mode, data = null) => {
    if (mode === 'invite') {
      setTeacherForm({ name: '', email: '', phoneNumber: '', facultyId: '', department: departments[0]?.name || '', designation: 'Assistant Professor', guideEligible: false, isActive: true })
    } else {
      setTeacherForm({
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber || '',
        facultyId: data.facultyId || '',
        department: data.department || '',
        designation: data.designation || '',
        guideEligible: data.isGuide || false,
        isActive: data.isActive !== false
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
        fetchInvites()
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

  // Guide handlers
  const handleOpenGuideModal = (mode, data = null) => {
    if (mode === 'invite') {
      setGuideForm({ name: '', email: '', phoneNumber: '', facultyId: '', department: departments[0]?.name || '', designation: 'Professor', guideEligible: true, isActive: true })
    } else {
      setGuideForm({
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber || '',
        facultyId: data.facultyId || '',
        department: data.department || '',
        designation: data.designation || '',
        guideEligible: true,
        isActive: data.isActive !== false
      })
    }
    setGuideModal({ open: true, mode, data })
  }

  const handleSaveGuide = async (e) => {
    e.preventDefault()
    if (!guideForm.name || !guideForm.email) {
      return toast.error('Name and Email are mandatory')
    }

    setLoading(true)
    try {
      if (guideModal.mode === 'invite') {
        const { data } = await api.post('/invites/send', {
          ...guideForm,
          role: 'guide'
        })
        toast.success('Guide faculty invited successfully')
        if (data.activationLink) {
          navigator.clipboard.writeText(data.activationLink)
          toast('Activation link copied to clipboard!', { icon: '📋' })
        }
        fetchInvites()
      } else {
        await api.put(`/teachers/${guideModal.data._id}`, guideForm)
        toast.success('Guide details updated successfully')
        fetchGuides()
      }
      setGuideModal({ open: false, mode: 'invite', data: null })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save guide')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleDeactivateUser = async (user, isGuideRole = false) => {
    if (user.isActive && (user.isGuide || isGuideRole)) {
      const proceed = confirm(`⚠️ Warning: This faculty "${user.name}" is designated as a Guide. Deactivating them will prevent them from managing student project groups. Do you want to proceed?`)
      if (!proceed) return
    } else if (user.isActive) {
      const proceed = confirm(`Are you sure you want to deactivate teacher ${user.name}?`)
      if (!proceed) return
    }

    try {
      await api.post(`/teachers/${user._id}/deactivate`)
      toast.success('User status updated successfully')
      if (isGuideRole) fetchGuides()
      else fetchTeachers()
    } catch (err) {
      toast.error('Failed to change status')
    }
  }

  const handleResendInvite = async (id) => {
    try {
      const { data } = await api.post(`/invites/${id}/resend`)
      toast.success('Activation link regenerated')
      if (data.activationLink) {
        navigator.clipboard.writeText(data.activationLink)
        toast('New link copied to clipboard!', { icon: '📋' })
      }
      fetchInvites()
    } catch (err) {
      toast.error('Failed to resend invite')
    }
  }

  const handleCancelInvite = async (id) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) return
    try {
      await api.post(`/invites/${id}/cancel`)
      toast.success('Invitation cancelled')
      fetchInvites()
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

  // Sessions CRUD
  const handleOpenSessionModal = (mode, data = null) => {
    if (mode === 'create') {
      setSessionForm({ name: '', startDate: '', endDate: '', status: 'Upcoming' })
    } else {
      setSessionForm({
        name: data.name,
        startDate: data.startDate ? data.startDate.split('T')[0] : '',
        endDate: data.endDate ? data.endDate.split('T')[0] : '',
        status: data.status
      })
    }
    setSessionModal({ open: true, mode, data })
  }

  const handleSaveSession = async (e) => {
    e.preventDefault()
    if (!sessionForm.name || !sessionForm.startDate || !sessionForm.endDate) {
      return toast.error('Name, Start Date, and End Date are required')
    }

    setLoading(true)
    try {
      if (sessionModal.mode === 'create') {
        await api.post('/academic/academic-sessions', sessionForm)
        toast.success('Academic session created')
      } else {
        await api.put(`/academic/academic-sessions/${sessionModal.data._id}`, sessionForm)
        toast.success('Academic session updated')
      }
      setSessionModal({ open: false, mode: 'create', data: null })
      fetchSessions()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save session')
    } finally {
      setLoading(false)
    }
  }

  // Academic Years CRUD
  const handleOpenYearModal = (mode, data = null) => {
    if (mode === 'create') {
      setYearForm({ academicSessionId: sessions[0]?._id || '', yearValue: '1', status: 'Active' })
    } else {
      setYearForm({
        academicSessionId: data.academicSessionId?._id || data.academicSessionId,
        yearValue: String(data.yearValue),
        status: data.status
      })
    }
    setYearModal({ open: true, mode, data })
  }

  const handleSaveYear = async (e) => {
    e.preventDefault()
    if (!yearForm.academicSessionId || !yearForm.yearValue) {
      return toast.error('Academic Session and Year Value are required')
    }

    setLoading(true)
    try {
      if (yearModal.mode === 'create') {
        await api.post('/academic/academic-years', yearForm)
        toast.success('Academic year created')
      } else {
        await api.put(`/academic/academic-years/${yearModal.data._id}`, yearForm)
        toast.success('Academic year updated')
      }
      setYearModal({ open: false, mode: 'create', data: null })
      fetchAcademicYears()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save academic year')
    } finally {
      setLoading(false)
    }
  }

  // Sections CRUD
  const handleOpenSectionModal = (mode, data = null) => {
    if (mode === 'create') {
      setSectionForm({ name: '', academicSessionId: sessions[0]?._id || '', academicYearId: academicYears[0]?._id || '', departmentId: departments[0]?._id || '', status: 'Active' })
    } else {
      setSectionForm({
        name: data.name,
        academicSessionId: data.academicSessionId?._id || data.academicSessionId,
        academicYearId: data.academicYearId?._id || data.academicYearId,
        departmentId: data.departmentId?._id || data.departmentId,
        status: data.status
      })
    }
    setSectionModal({ open: true, mode, data })
  }

  const handleSaveSection = async (e) => {
    e.preventDefault()
    if (!sectionForm.name || !sectionForm.academicSessionId || !sectionForm.academicYearId || !sectionForm.departmentId) {
      return toast.error('All fields are required')
    }

    setLoading(true)
    try {
      if (sectionModal.mode === 'create') {
        await api.post('/academic/sections', sectionForm)
        toast.success('Section created')
      } else {
        await api.put(`/academic/sections/${sectionModal.data._id}`, sectionForm)
        toast.success('Section updated')
      }
      setSectionModal({ open: false, mode: 'create', data: null })
      fetchSections()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save section')
    } finally {
      setLoading(false)
    }
  }

  // Teacher Assignments CRUD
  const handleOpenAssignmentModal = (mode, data = null) => {
    if (mode === 'create') {
      setAssignmentForm({ teacherId: teachers[0]?._id || '', sectionId: sections[0]?._id || '', isClassTeacher: false, status: 'Active' })
    } else {
      setAssignmentForm({
        teacherId: data.teacherId?._id || data.teacherId,
        sectionId: data.sectionId?._id || data.sectionId,
        isClassTeacher: data.isClassTeacher,
        status: data.status
      })
    }
    setAssignmentModal({ open: true, mode, data })
  }

  const handleSaveAssignment = async (e) => {
    e.preventDefault()
    if (!assignmentForm.teacherId || !assignmentForm.sectionId) {
      return toast.error('Teacher and Section are required')
    }

    setLoading(true)
    try {
      if (assignmentModal.mode === 'create') {
        await api.post('/academic/teacher-assignments', assignmentForm)
        toast.success('Teacher assigned successfully')
      } else {
        await api.put(`/academic/teacher-assignments/${assignmentModal.data._id}`, assignmentForm)
        toast.success('Assignment details updated')
      }
      setAssignmentModal({ open: false, mode: 'create', data: null })
      fetchAssignments()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save teacher assignment')
    } finally {
      setLoading(false)
    }
  }

  const copyLink = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Activation link copied!')
  }

  const filteredTeachers = teachers.filter((t) => {
    const searchMatch =
      t.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      t.email.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      (t.facultyId && t.facultyId.toLowerCase().includes(teacherSearch.toLowerCase()))
    const deptMatch = !deptFilter || t.department === deptFilter
    return searchMatch && deptMatch
  })

  const filteredGuides = guides.filter((g) => {
    return g.name.toLowerCase().includes(guideSearch.toLowerCase()) ||
      g.email.toLowerCase().includes(guideSearch.toLowerCase()) ||
      (g.facultyId && g.facultyId.toLowerCase().includes(guideSearch.toLowerCase()))
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
        <aside className="w-full lg:w-64 bg-white border-r border-gray-200 p-4 space-y-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all
              ${activeTab === 'overview' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <FiGrid className="w-5 h-5" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all
              ${activeTab === 'sessions' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <FiCalendar className="w-5 h-5" />
            Academic Sessions
          </button>
          <button
            onClick={() => setActiveTab('years')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all
              ${activeTab === 'years' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <FiLayers className="w-5 h-5" />
            Academic Years
          </button>
          <button
            onClick={() => setActiveTab('sections')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all
              ${activeTab === 'sections' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <FiList className="w-5 h-5" />
            Sections
          </button>
          <button
            onClick={() => setActiveTab('teachers')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all
              ${activeTab === 'teachers' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <FiUsers className="w-5 h-5" />
            Teachers
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all
              ${activeTab === 'assignments' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <FiUserCheck className="w-5 h-5" />
            Teacher Assignment
          </button>
          <button
            onClick={() => setActiveTab('guides')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all
              ${activeTab === 'guides' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <FiAward className="w-5 h-5" />
            Guide Faculty
          </button>
          <button
            onClick={() => setActiveTab('departments')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all
              ${activeTab === 'departments' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <FiBook className="w-5 h-5" />
            Departments
          </button>
          <button
            onClick={() => setActiveTab('invites')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all
              ${activeTab === 'invites' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <FiLink className="w-5 h-5" />
            Invite History
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
                  <p className="text-xs text-primary-700 mt-0.5">Use the institutional workspace modules to manage academic sessions, sections, faculty registers, and dual-role class assignments.</p>
                </div>
              </div>

              {/* Scoped Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Teachers</span>
                  <p className="text-3xl font-extrabold text-gray-800 mt-2">{teachers.length}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Guides</span>
                  <p className="text-3xl font-extrabold text-gray-800 mt-2">{guides.length}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Sections Registered</span>
                  <p className="text-3xl font-extrabold text-gray-800 mt-2">{sections.length}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Active Sessions</span>
                  <p className="text-3xl font-extrabold text-gray-800 mt-2">{sessions.filter(s => s.status === 'Active').length}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SESSIONS */}
          {activeTab === 'sessions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Academic Sessions</h2>
                  <p className="text-xs text-gray-500">Manage academic batch sessions. Only one session can remain Active.</p>
                </div>
                <button
                  onClick={() => handleOpenSessionModal('create')}
                  className="btn-primary flex items-center gap-2 py-2 px-4 text-sm"
                >
                  <FiPlus className="w-4 h-4" />
                  Add Session
                </button>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                      <th className="p-4">Session Name</th>
                      <th className="p-4">Start Date</th>
                      <th className="p-4">End Date</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {sessions.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-gray-400">No academic sessions added yet.</td>
                      </tr>
                    ) : (
                      sessions.map((s) => (
                        <tr key={s._id} className="hover:bg-gray-50/50">
                          <td className="p-4 font-semibold text-gray-800">{s.name}</td>
                          <td className="p-4 text-gray-600">{s.startDate ? new Date(s.startDate).toLocaleDateString() : 'N/A'}</td>
                          <td className="p-4 text-gray-600">{s.endDate ? new Date(s.endDate).toLocaleDateString() : 'N/A'}</td>
                          <td className="p-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold
                              ${s.status === 'Active' ? 'bg-emerald-50 text-emerald-600'
                                : s.status === 'Upcoming' ? 'bg-amber-50 text-amber-600'
                                : 'bg-gray-100 text-gray-500'}`}>
                              {s.status}
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

          {/* TAB: YEARS */}
          {activeTab === 'years' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Academic Years</h2>
                  <p className="text-xs text-gray-500">Configure numeric academic years (1-4) within academic sessions.</p>
                </div>
                <button
                  onClick={() => handleOpenYearModal('create')}
                  className="btn-primary flex items-center gap-2 py-2 px-4 text-sm"
                  disabled={sessions.length === 0}
                >
                  <FiPlus className="w-4 h-4" />
                  Add Academic Year
                </button>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                      <th className="p-4">Academic Session</th>
                      <th className="p-4">Academic Year</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {academicYears.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-8 text-center text-gray-400">No academic years configured yet.</td>
                      </tr>
                    ) : (
                      academicYears.map((y) => (
                        <tr key={y._id} className="hover:bg-gray-50/50">
                          <td className="p-4 text-gray-800 font-medium">{y.academicSessionId?.name || 'N/A'}</td>
                          <td className="p-4 font-bold text-primary-700">
                            {y.yearValue === 1 ? '1st Year' : y.yearValue === 2 ? '2nd Year' : y.yearValue === 3 ? '3rd Year' : '4th Year'}
                          </td>
                          <td className="p-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold
                              ${y.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                              {y.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleOpenYearModal('edit', y)}
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

          {/* TAB: SECTIONS */}
          {activeTab === 'sections' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Sections Registry</h2>
                  <p className="text-xs text-gray-500">Configure class sections and connect them to Session, Year, and Department structures.</p>
                </div>
                <button
                  onClick={() => handleOpenSectionModal('create')}
                  className="btn-primary flex items-center gap-2 py-2 px-4 text-sm"
                  disabled={academicYears.length === 0 || departments.length === 0}
                >
                  <FiPlus className="w-4 h-4" />
                  Add Section
                </button>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                      <th className="p-4">Section Name</th>
                      <th className="p-4">Session</th>
                      <th className="p-4">Academic Year</th>
                      <th className="p-4">Department</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {sections.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-gray-400">No sections registered yet.</td>
                      </tr>
                    ) : (
                      sections.map((sec) => (
                        <tr key={sec._id} className="hover:bg-gray-50/50">
                          <td className="p-4 font-bold text-gray-800">{sec.name}</td>
                          <td className="p-4 text-gray-600">{sec.academicSessionId?.name || 'N/A'}</td>
                          <td className="p-4 text-gray-600">
                            {sec.academicYearId?.yearValue ? `${sec.academicYearId.yearValue}st Year` : 'N/A'}
                          </td>
                          <td className="p-4 text-gray-600">{sec.departmentId?.name || 'N/A'}</td>
                          <td className="p-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold
                              ${sec.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                              {sec.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleOpenSectionModal('edit', sec)}
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

          {/* TAB: TEACHERS */}
          {activeTab === 'teachers' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Faculty Teachers</h2>
                  <p className="text-xs text-gray-500">Invite and manage core teachers. Access link is sent automatically.</p>
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
                  placeholder="Search by name, email, or Employee ID..."
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

              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                      <th className="p-4">Employee ID</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Department / Designation</th>
                      <th className="p-4">Class Mapping</th>
                      <th className="p-4">Guide Eligible</th>
                      <th className="p-4">Last Login</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {filteredTeachers.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="p-8 text-center text-gray-400">No active teachers matching filters.</td>
                      </tr>
                    ) : (
                      filteredTeachers.map((t) => (
                        <tr key={t._id} className="hover:bg-gray-50/50">
                          <td className="p-4 font-mono font-semibold text-primary-700">{t.facultyId || 'N/A'}</td>
                          <td className="p-4 font-semibold text-gray-800">{t.name}</td>
                          <td className="p-4 text-gray-600">{t.email}</td>
                          <td className="p-4 text-xs">
                            <div>{t.department || 'N/A'}</div>
                            <div className="text-gray-400 font-medium">{t.designation || 'N/A'}</div>
                          </td>
                          <td className="p-4 text-xs font-bold text-indigo-600">
                            {t.className ? `${t.className} | Sec ${t.section} | Yr ${t.year}` : 'No Class Assigned'}
                          </td>
                          <td className="p-4">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold
                              ${t.isGuide ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-gray-50 text-gray-400'}`}>
                              {t.isGuide ? 'Yes' : 'No'}
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
                            >
                              <FiEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleDeactivateUser(t, false)}
                              className={`text-xs font-semibold px-2.5 py-1 rounded-lg border
                                ${t.isActive ? 'text-red-500 border-red-100 bg-red-50/30 hover:bg-red-50' : 'text-emerald-600 border-emerald-100 bg-emerald-50/30'}`}
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
            </div>
          )}

          {/* TAB: ASSIGNMENTS */}
          {activeTab === 'assignments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Teacher Class Assignments</h2>
                  <p className="text-xs text-gray-500">Map teachers to sections. A section can only have one active Class Teacher.</p>
                </div>
                <button
                  onClick={() => handleOpenAssignmentModal('create')}
                  className="btn-primary flex items-center gap-2 py-2 px-4 text-sm"
                  disabled={teachers.length === 0 || sections.length === 0}
                >
                  <FiPlus className="w-4 h-4" />
                  Assign Teacher
                </button>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                      <th className="p-4">Teacher Name</th>
                      <th className="p-4">Employee ID</th>
                      <th className="p-4">Section / Class</th>
                      <th className="p-4">Class Teacher</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {assignments.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-gray-400">No assignments mapped yet.</td>
                      </tr>
                    ) : (
                      assignments.map((asg) => (
                        <tr key={asg._id} className="hover:bg-gray-50/50">
                          <td className="p-4 font-semibold text-gray-800">{asg.teacherId?.name || 'N/A'}</td>
                          <td className="p-4 text-gray-600 font-mono text-xs">{asg.teacherId?.facultyId || 'N/A'}</td>
                          <td className="p-4 font-bold text-primary-600">{asg.sectionId?.name || 'N/A'}</td>
                          <td className="p-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold
                              ${asg.isClassTeacher ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-gray-100 text-gray-500'}`}>
                              {asg.isClassTeacher ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold
                              ${asg.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                              {asg.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleOpenAssignmentModal('edit', asg)}
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

          {/* TAB: GUIDES */}
          {activeTab === 'guides' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Guide-Only Faculty</h2>
                  <p className="text-xs text-gray-500">Manage Guide-only faculty members. They do not have access to Teacher roles.</p>
                </div>
                <button
                  onClick={() => handleOpenGuideModal('invite')}
                  className="btn-primary flex items-center gap-2 py-2.5 px-4 text-sm self-start sm:self-auto"
                >
                  <FiPlus className="w-4 h-4" />
                  Invite Guide
                </button>
              </div>

              {/* Search */}
              <div className="max-w-md">
                <input
                  type="text"
                  placeholder="Search guides by name, email..."
                  value={guideSearch}
                  onChange={(e) => setGuideSearch(e.target.value)}
                  className="input-field py-2 text-sm"
                />
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                      <th className="p-4">Employee ID</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Department / Designation</th>
                      <th className="p-4">Last Login</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {filteredGuides.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="p-8 text-center text-gray-400">No guide-only faculty registers found.</td>
                      </tr>
                    ) : (
                      filteredGuides.map((g) => (
                        <tr key={g._id} className="hover:bg-gray-50/50">
                          <td className="p-4 font-mono font-semibold text-primary-700">{g.facultyId || 'N/A'}</td>
                          <td className="p-4 font-semibold text-gray-800">{g.name}</td>
                          <td className="p-4 text-gray-600">{g.email}</td>
                          <td className="p-4 text-xs">
                            <div>{g.department || 'N/A'}</div>
                            <div className="text-gray-400 font-medium">{g.designation || 'N/A'}</div>
                          </td>
                          <td className="p-4 text-xs text-gray-400">
                            {g.lastLogin ? new Date(g.lastLogin).toLocaleString() : 'Never'}
                          </td>
                          <td className="p-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold
                              ${g.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                              {g.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => handleOpenGuideModal('edit', g)}
                              className="text-gray-500 hover:text-primary-600 inline-flex items-center justify-center p-1.5 hover:bg-gray-100 rounded-lg"
                            >
                              <FiEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleDeactivateUser(g, true)}
                              className={`text-xs font-semibold px-2.5 py-1 rounded-lg border
                                ${g.isActive ? 'text-red-500 border-red-100 bg-red-50/30 hover:bg-red-50' : 'text-emerald-600 border-emerald-100 bg-emerald-50/30'}`}
                            >
                              {g.isActive ? 'Deactivate' : 'Activate'}
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

          {/* TAB: INVITE HISTORY */}
          {activeTab === 'invites' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Invitation History</h2>
                <p className="text-xs text-gray-500">Track and copy onboarding activation links.</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                      <th className="p-4">Email</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Department / Designation</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {invites.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-gray-400">No invitations issued yet.</td>
                      </tr>
                    ) : (
                      invites.map((inv) => (
                        <tr key={inv._id} className="hover:bg-gray-50/50">
                          <td className="p-4 font-semibold text-gray-800">{inv.email}</td>
                          <td className="p-4 text-gray-700 font-medium">{inv.name || 'N/A'}</td>
                          <td className="p-4 capitalize text-xs font-semibold text-primary-700">{inv.role}</td>
                          <td className="p-4 text-xs">
                            <div>{inv.department || 'N/A'}</div>
                            <div className="text-gray-400">{inv.designation || 'N/A'}</div>
                          </td>
                          <td className="p-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold
                              ${inv.status === 'Accepted' ? 'bg-emerald-50 text-emerald-600'
                                : inv.status === 'Pending' ? 'bg-amber-50 text-amber-600'
                                : inv.status === 'Resent' ? 'bg-blue-50 text-blue-600'
                                : 'bg-red-50 text-red-600'}`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2 text-xs font-semibold">
                            {inv.status !== 'Accepted' && inv.status !== 'Cancelled' && (
                              <>
                                <button
                                  onClick={() => handleResendInvite(inv._id)}
                                  className="text-primary-600 hover:text-primary-800"
                                >
                                  Resend
                                </button>
                                <button
                                  onClick={() => handleCancelInvite(inv._id)}
                                  className="text-red-500 hover:text-red-700"
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
                    onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
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
                    onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                    placeholder="teacher@institution.edu"
                    className="input-field"
                    disabled={teacherModal.mode === 'edit'}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Phone Number</label>
                  <input
                    value={teacherForm.phoneNumber}
                    onChange={(e) => setTeacherForm({ ...teacherForm, phoneNumber: e.target.value })}
                    placeholder="10-digit mobile"
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Employee ID</label>
                  <input
                    value={teacherForm.facultyId}
                    onChange={(e) => setTeacherForm({ ...teacherForm, facultyId: e.target.value })}
                    placeholder="e.g. EMP001"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Department</label>
                  <select
                    value={teacherForm.department}
                    onChange={(e) => setTeacherForm({ ...teacherForm, department: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Designation</label>
                  <input
                    value={teacherForm.designation}
                    onChange={(e) => setTeacherForm({ ...teacherForm, designation: e.target.value })}
                    placeholder="e.g. Assistant Professor"
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <input
                  type="checkbox"
                  checked={teacherForm.guideEligible}
                  onChange={(e) => setTeacherForm({ ...teacherForm, guideEligible: e.target.checked })}
                  className="w-5 h-5 text-primary-600 rounded"
                />
                <div>
                  <label className="text-sm font-semibold text-gray-700 block">Guide Eligible</label>
                  <span className="text-xs text-gray-400">Can this teacher act as a project guide?</span>
                </div>
              </div>

              {teacherModal.mode === 'edit' && (
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={teacherForm.isActive}
                    onChange={(e) => setTeacherForm({ ...teacherForm, isActive: e.target.checked })}
                    className="w-5 h-5 text-primary-600 rounded"
                  />
                  <label className="text-sm font-semibold text-gray-700">Account is Active</label>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
              >
                {loading ? 'Processing…' : teacherModal.mode === 'invite' ? 'Send Invitation' : 'Save Details'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Guide Invite / Edit Modal */}
      {guideModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl relative border border-gray-100">
            <button
              onClick={() => setGuideModal({ open: false, mode: 'invite', data: null })}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-gray-800 mb-4 capitalize">
              {guideModal.mode === 'invite' ? 'Invite Guide Faculty' : 'Edit Guide Details'}
            </h2>

            <form onSubmit={handleSaveGuide} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Full Name</label>
                  <input
                    value={guideForm.name}
                    onChange={(e) => setGuideForm({ ...guideForm, name: e.target.value })}
                    placeholder="Enter full name"
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={guideForm.email}
                    onChange={(e) => setGuideForm({ ...guideForm, email: e.target.value })}
                    placeholder="guide@institution.edu"
                    className="input-field"
                    disabled={guideModal.mode === 'edit'}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Phone Number</label>
                  <input
                    value={guideForm.phoneNumber}
                    onChange={(e) => setGuideForm({ ...guideForm, phoneNumber: e.target.value })}
                    placeholder="10-digit mobile"
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Employee ID</label>
                  <input
                    value={guideForm.facultyId}
                    onChange={(e) => setGuideForm({ ...guideForm, facultyId: e.target.value })}
                    placeholder="e.g. EMP100"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Department</label>
                  <select
                    value={guideForm.department}
                    onChange={(e) => setGuideForm({ ...guideForm, department: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Designation</label>
                  <input
                    value={guideForm.designation}
                    onChange={(e) => setGuideForm({ ...guideForm, designation: e.target.value })}
                    placeholder="e.g. Professor"
                    className="input-field"
                    required
                  />
                </div>
              </div>

              {guideModal.mode === 'edit' && (
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={guideForm.isActive}
                    onChange={(e) => setGuideForm({ ...guideForm, isActive: e.target.checked })}
                    className="w-5 h-5 text-primary-600 rounded"
                  />
                  <label className="text-sm font-semibold text-gray-700">Account is Active</label>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
              >
                {loading ? 'Processing…' : guideModal.mode === 'invite' ? 'Send Invitation' : 'Save Details'}
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
              {sessionModal.mode === 'create' ? 'Create Session' : 'Edit Session Details'}
            </h2>

            <form onSubmit={handleSaveSession} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Session Name</label>
                <input
                  value={sessionForm.name}
                  onChange={(e) => setSessionForm({ ...sessionForm, name: e.target.value })}
                  placeholder="e.g. 2026-27"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Start Date</label>
                <input
                  type="date"
                  value={sessionForm.startDate}
                  onChange={(e) => setSessionForm({ ...sessionForm, startDate: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">End Date</label>
                <input
                  type="date"
                  value={sessionForm.endDate}
                  onChange={(e) => setSessionForm({ ...sessionForm, endDate: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Status</label>
                <select
                  value={sessionForm.status}
                  onChange={(e) => setSessionForm({ ...sessionForm, status: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="Active">Active</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2 flex items-center justify-center gap-2"
              >
                {loading ? 'Saving…' : 'Save Session'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Academic Year Modal */}
      {yearModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl relative border border-gray-100">
            <button
              onClick={() => setYearModal({ open: false, mode: 'create', data: null })}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-gray-800 mb-4 capitalize">
              {yearModal.mode === 'create' ? 'Create Academic Year' : 'Edit Academic Year'}
            </h2>

            <form onSubmit={handleSaveYear} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Academic Session</label>
                <select
                  value={yearForm.academicSessionId}
                  onChange={(e) => setYearForm({ ...yearForm, academicSessionId: e.target.value })}
                  className="input-field"
                  required
                >
                  {sessions.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Year Value</label>
                <select
                  value={yearForm.yearValue}
                  onChange={(e) => setYearForm({ ...yearForm, yearValue: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Status</label>
                <select
                  value={yearForm.status}
                  onChange={(e) => setYearForm({ ...yearForm, status: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2 flex items-center justify-center gap-2"
              >
                {loading ? 'Saving…' : 'Save Academic Year'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Section Modal */}
      {sectionModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl relative border border-gray-100">
            <button
              onClick={() => setSectionModal({ open: false, mode: 'create', data: null })}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-gray-800 mb-4 capitalize">
              {sectionModal.mode === 'create' ? 'Create Section' : 'Edit Section Details'}
            </h2>

            <form onSubmit={handleSaveSection} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Section Name</label>
                <input
                  value={sectionForm.name}
                  onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                  placeholder="e.g. CSE-1"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Academic Session</label>
                <select
                  value={sectionForm.academicSessionId}
                  onChange={(e) => setSectionForm({ ...sectionForm, academicSessionId: e.target.value })}
                  className="input-field"
                  required
                >
                  {sessions.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Academic Year</label>
                <select
                  value={sectionForm.academicYearId}
                  onChange={(e) => setSectionForm({ ...sectionForm, academicYearId: e.target.value })}
                  className="input-field"
                  required
                >
                  {academicYears.map((y) => (
                    <option key={y._id} value={y._id}>{y.academicSessionId?.name} - {y.yearValue}st Year</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Department</label>
                <select
                  value={sectionForm.departmentId}
                  onChange={(e) => setSectionForm({ ...sectionForm, departmentId: e.target.value })}
                  className="input-field"
                  required
                >
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Status</label>
                <select
                  value={sectionForm.status}
                  onChange={(e) => setSectionForm({ ...sectionForm, status: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2 flex items-center justify-center gap-2"
              >
                {loading ? 'Saving…' : 'Save Section'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Teacher Assignment Modal */}
      {assignmentModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl relative border border-gray-100">
            <button
              onClick={() => setAssignmentModal({ open: false, mode: 'create', data: null })}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-gray-800 mb-4 capitalize">
              {assignmentModal.mode === 'create' ? 'Assign Teacher' : 'Edit Assignment Details'}
            </h2>

            <form onSubmit={handleSaveAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Teacher</label>
                <select
                  value={assignmentForm.teacherId}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, teacherId: e.target.value })}
                  className="input-field"
                  disabled={assignmentModal.mode === 'edit'}
                  required
                >
                  {teachers.map((t) => (
                    <option key={t._id} value={t._id}>{t.name} ({t.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Section</label>
                <select
                  value={assignmentForm.sectionId}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, sectionId: e.target.value })}
                  className="input-field"
                  disabled={assignmentModal.mode === 'edit'}
                  required
                >
                  {sections.map((sec) => (
                    <option key={sec._id} value={sec._id}>{sec.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <input
                  type="checkbox"
                  checked={assignmentForm.isClassTeacher}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, isClassTeacher: e.target.checked })}
                  className="w-5 h-5 text-primary-600 rounded"
                />
                <div>
                  <label className="text-sm font-semibold text-gray-700 block">Class Teacher</label>
                  <span className="text-xs text-gray-400">Designate as active Class Teacher for this section</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Status</label>
                <select
                  value={assignmentForm.status}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, status: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2 flex items-center justify-center gap-2"
              >
                {loading ? 'Saving…' : 'Save Assignment'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
