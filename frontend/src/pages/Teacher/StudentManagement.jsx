import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { resolveFileUrl } from '../../utils/uploadHelper'
import PageLayout from '../../components/common/PageLayout'
import toast from 'react-hot-toast'
import {
  FiUsers, FiUser, FiPlus, FiDownload, FiUpload, FiLock,
  FiSearch, FiCheck, FiX, FiInfo, FiEdit, FiChevronLeft,
  FiChevronRight, FiCalendar, FiBook, FiList, FiAlertTriangle
} from 'react-icons/fi'

export default function StudentManagement() {
  const { user } = useAuth()
  const [students, setStudents] = useState([])
  const [stats, setStats] = useState({ totalStudents: 0, activeStudents: 0, inactiveStudents: 0, lastImportDate: null })
  const [sections, setSections] = useState([])
  const [importHistory, setImportHistory] = useState([])
  const [loading, setLoading] = useState(true)

  // Search, Filter & Pagination states
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortField, setSortField] = useState('Name')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [totalPages, setTotalPages] = useState(1)
  const [totalStudentsCount, setTotalStudentsCount] = useState(0)

  // Selection state for bulk operations
  const [selectedIds, setSelectedIds] = useState([])

  // Modals state
  const [studentModal, setStudentModal] = useState({ open: false, mode: 'create', data: null })
  const [detailsModal, setDetailsModal] = useState({ open: false, data: null })
  const [importModal, setImportModal] = useState({ open: false, file: null, fileName: '', targetSectionId: '', errorFilePath: '', summary: null })

  // Form state
  const [studentForm, setStudentForm] = useState({
    enrollmentNumber: '',
    name: '',
    email: '',
    personalEmail: '',
    gender: '',
    sectionId: ''
  })

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    fetchStudentsList()
  }, [search, statusFilter, sortField, page, limit])

  const fetchInitialData = async () => {
    try {
      const [statsRes, sectionsRes, historyRes] = await Promise.allSettled([
        api.get('/students/stats'),
        api.get('/students/sections'),
        api.get('/students/import-history')
      ])

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data)
      if (sectionsRes.status === 'fulfilled') {
        const sectionsData = sectionsRes.value.data.sections || []
        setSections(sectionsData)
        if (sectionsData.length > 0) {
          setStudentForm(prev => ({ ...prev, sectionId: sectionsData[0]._id }))
          setImportModal(prev => ({ ...prev, targetSectionId: sectionsData[0]._id }))
        }
      }
      if (historyRes.status === 'fulfilled') setImportHistory(historyRes.value.data.history || [])
    } catch (error) {
      console.error('Error fetching initial data:', error)
    }
  }

  const fetchStudentsList = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/students', {
        params: {
          search,
          status: statusFilter,
          sort: sortField,
          page,
          limit
        }
      })
      setStudents(data.students || [])
      setTotalPages(data.pages || 1)
      setTotalStudentsCount(data.total || 0)
      setSelectedIds([]) // Reset selections on page or query change
    } catch (err) {
      toast.error('Failed to load students list')
    } finally {
      setLoading(false)
    }
  }

  const fetchStatsAndHistory = async () => {
    try {
      const [statsRes, historyRes] = await Promise.allSettled([
        api.get('/students/stats'),
        api.get('/students/import-history')
      ])
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data)
      if (historyRes.status === 'fulfilled') setImportHistory(historyRes.value.data.history || [])
    } catch (error) {
      console.error(error)
    }
  }

  // Checkbox Selection
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(students.map(s => s._id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectRow = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  // Student CRUD triggers
  const handleOpenCreateModal = () => {
    setStudentForm({
      enrollmentNumber: '',
      name: '',
      email: '',
      personalEmail: '',
      gender: '',
    })
    setStudentModal({ open: true, mode: 'create', data: null })
  }

  const handleOpenEditModal = (student) => {
    setStudentForm({
      enrollmentNumber: student.enrollmentNumber || '',
      name: student.name || '',
      email: student.email || '',
      personalEmail: student.personalEmail || '',
      gender: student.gender || '',
    })
    setStudentModal({ open: true, mode: 'edit', data: student })
  }

  const handleSaveStudent = async (e) => {
    e.preventDefault()

    if (!studentForm.enrollmentNumber || !studentForm.name) {
      return toast.error('Enrollment Number and Student Name are required')
    }

    if (studentForm.personalEmail) {
      if (!/^\S+@\S+\.\S+$/.test(studentForm.personalEmail.trim())) {
        return toast.error('Please enter a valid personal email address.')
      }
    }

    const payload = { ...studentForm }
    // Clean up empty optional fields
    if (!payload.email) delete payload.email
    if (!payload.personalEmail) {
      delete payload.personalEmail
    } else {
      payload.personalEmail = payload.personalEmail.trim()
    }

    const promise = studentModal.mode === 'create'
      ? api.post('/students', payload)
      : api.put(`/students/${studentModal.data._id}`, payload)

    toast.promise(promise, {
      loading: studentModal.mode === 'create' ? 'Creating student...' : 'Updating student...',
      success: () => {
        setStudentModal({ open: false, mode: 'create', data: null })
        fetchStudentsList()
        fetchStatsAndHistory()
        return studentModal.mode === 'create' ? 'Student created successfully!' : 'Student updated successfully!'
      },
      error: (err) => err.response?.data?.message || 'Failed to save student details'
    })
  }

  const handleToggleStatus = async (student) => {
    const nextStatus = !student.isActive
    const promise = api.patch(`/students/${student._id}/status`, { isActive: nextStatus })

    toast.promise(promise, {
      loading: 'Updating status...',
      success: () => {
        fetchStudentsList()
        fetchStatsAndHistory()
        return `Student ${nextStatus ? 'Activated' : 'Deactivated'} successfully!`
      },
      error: 'Failed to update student status'
    })
  }

  const handleResetPassword = async (student) => {
    if (!confirm(`Are you sure you want to reset password for ${student.name}? The password will be reset to their Enrollment Number.`)) return

    const promise = api.post(`/students/${student._id}/reset-password`)
    toast.promise(promise, {
      loading: 'Resetting password...',
      success: 'Password reset to enrollment number successfully!',
      error: 'Failed to reset password'
    })
  }

  const handleBulkResetPassword = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Are you sure you want to reset passwords for ${selectedIds.length} selected student(s)? Passwords will be reset to their respective Enrollment Numbers.`)) return

    const promise = api.post('/students/reset-password/bulk', { studentIds: selectedIds })
    toast.promise(promise, {
      loading: 'Performing bulk reset...',
      success: () => {
        setSelectedIds([])
        return 'Bulk password reset completed successfully!'
      },
      error: 'Failed to reset passwords'
    })
  }

  // Export
  const handleExport = () => {
    const exportUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/students/export?search=${search}&status=${statusFilter}`
    
    // Fetch file with credentials using browser anchor download
    toast.loading('Generating export spreadsheet...', { id: 'export-toast' })
    api.get('/students/export', {
      params: { search, status: statusFilter },
      responseType: 'blob'
    }).then(({ data }) => {
      const url = window.URL.createObjectURL(new Blob([data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'students_export.xlsx')
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      toast.success('Spreadsheet exported successfully!', { id: 'export-toast' })
    }).catch(() => {
      toast.error('Failed to export students', { id: 'export-toast' })
    })
  }

  const handleDownloadSample = () => {
    api.get('/students/sample', { responseType: 'blob' }).then(({ data }) => {
      const url = window.URL.createObjectURL(new Blob([data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'sample_students.xlsx')
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
    }).catch(() => {
      toast.error('Failed to download template')
    })
  }

  // Import
  const handleImportFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target.result.split(',')[1]
        setImportModal(prev => ({
          ...prev,
          file: base64,
          fileName: file.name,
          errorFilePath: '',
          summary: null
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUploadImport = async (e) => {
    e.preventDefault()
    if (!importModal.file) {
      return toast.error('Please select a spreadsheet file.')
    }

    setLoading(true)
    try {
      const { data } = await api.post('/students/import', {
        file: importModal.file,
        fileName: importModal.fileName,
      })

      toast.success(data.message || 'Bulk import completed successfully!')
      setImportModal({ open: false, file: null, fileName: '', targetSectionId: sections[0]?._id || '', errorFilePath: '', summary: null })
      fetchStudentsList()
      fetchStatsAndHistory()
    } catch (err) {
      const res = err.response?.data
      if (res && res.errorFilePath) {
        toast.error('Import failed due to row validation errors.')
        setImportModal(prev => ({
          ...prev,
          errorFilePath: res.errorFilePath,
          summary: {
            totalRows: res.totalRows,
            totalImported: res.totalImported,
            failed: res.failed
          }
        }))
      } else {
        toast.error(res?.message || 'Server error during spreadsheet upload.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!loading && sections.length === 0) {
    return (
      <PageLayout>
        <div className="min-h-[50vh] flex flex-col items-center justify-center text-center px-4 py-12">
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900/50 rounded-2xl p-8 max-w-md shadow-sm">
            <FiAlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4 animate-bounce" />
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Access Restricted</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You are not assigned as a Class Teacher for any section.
            </p>
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-primary-700 via-primary-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FiUsers className="w-7 h-7" /> Student Workspace
            </h1>
            <p className="text-xs text-primary-100 mt-1">
              Manage enrollments, credentials, and imports/exports for your classroom students.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2.5 bg-white text-primary-700 hover:bg-primary-50 rounded-xl font-semibold text-sm shadow-md transition-all flex items-center gap-1.5"
            >
              <FiPlus className="w-4 h-4" /> Add Student
            </button>
            <button
              onClick={() => setImportModal(prev => ({ ...prev, open: true }))}
              className="px-4 py-2.5 bg-primary-800/40 border border-white/20 hover:bg-primary-800/60 rounded-xl font-semibold text-sm transition-all flex items-center gap-1.5"
            >
              <FiUpload className="w-4 h-4" /> Bulk Import
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2.5 bg-primary-800/40 border border-white/20 hover:bg-primary-800/60 rounded-xl font-semibold text-sm transition-all flex items-center gap-1.5"
            >
              <FiDownload className="w-4 h-4" /> Export Excel
            </button>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Students</span>
            <p className="text-3xl font-extrabold text-gray-800 mt-2">{stats.totalStudents}</p>
          </div>
          <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-emerald-500">Active Students</span>
            <p className="text-3xl font-extrabold text-emerald-600 mt-2">{stats.activeStudents}</p>
          </div>
          <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-red-400">Inactive Students</span>
            <p className="text-3xl font-extrabold text-red-500 mt-2">{stats.inactiveStudents}</p>
          </div>
          <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-indigo-400">Last Import Date</span>
            <p className="text-lg font-bold text-gray-800 mt-3.5">
              {stats.lastImportDate ? new Date(stats.lastImportDate).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              }) : 'Never'}
            </p>
          </div>
        </div>

        {/* Search, Filter & Bulk Actions Bar */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-4 md:space-y-0 md:flex md:items-center md:justify-between md:gap-4">
          {/* Search Inputs */}
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by enrollment, name, email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input-field pl-10 pr-4 py-2 text-sm"
            />
          </div>

          {/* Filters & Sort */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 outline-hidden focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            <select
              value={sortField}
              onChange={(e) => { setSortField(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 outline-hidden focus:ring-2 focus:ring-primary-500"
            >
              <option value="Name">Sort by Name</option>
              <option value="Latest">Sort by Latest</option>
              <option value="Oldest">Sort by Oldest</option>
            </select>

            <select
              value={limit}
              onChange={(e) => { setLimit(parseInt(e.target.value)); setPage(1); }}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 outline-hidden focus:ring-2 focus:ring-primary-500"
            >
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>

            {selectedIds.length > 0 && (
              <button
                onClick={handleBulkResetPassword}
                className="px-4 py-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-200 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all"
              >
                <FiLock className="w-4 h-4" /> Bulk Reset Password ({selectedIds.length})
              </button>
            )}
          </div>
        </div>

        {/* Student Table */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="p-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={students.length > 0 && selectedIds.length === students.length}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
                    />
                  </th>
                  <th className="p-4">Enrollment</th>
                  <th className="p-4">Student Name</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Section</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Last Login</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="p-8 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600" />
                        <span className="text-gray-500 font-medium">Loading student list...</span>
                      </div>
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="p-12 text-center text-gray-400 font-medium">
                      No students found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student._id} className="hover:bg-gray-50/50">
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(student._id)}
                          onChange={() => handleSelectRow(student._id)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
                        />
                      </td>
                      <td className="p-4 font-mono font-semibold text-gray-700">{student.enrollmentNumber}</td>
                      <td className="p-4 font-semibold text-gray-800">{student.name}</td>
                      <td className="p-4 text-gray-500">{student.departmentId?.code || student.departmentId?.name || 'N/A'}</td>
                      <td className="p-4 text-gray-500">{student.sectionId?.name || 'N/A'}</td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleStatus(student)}
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold transition-all border ${
                            student.isActive
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100'
                          }`}
                        >
                          {student.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="p-4 text-gray-500">
                        {student.lastLogin ? new Date(student.lastLogin).toLocaleString() : 'Never'}
                      </td>
                      <td className="p-4 text-gray-500">
                        {new Date(student.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right space-x-1.5">
                        <button
                          onClick={() => setDetailsModal({ open: true, data: student })}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors inline-flex"
                          title="View Details"
                        >
                          <FiInfo className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(student)}
                          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors inline-flex"
                          title="Edit Student"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleResetPassword(student)}
                          className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors inline-flex"
                          title="Reset Password"
                        >
                          <FiLock className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-150">
              <span className="text-xs font-semibold text-gray-500">
                Showing page <strong className="text-gray-700">{page}</strong> of <strong className="text-gray-700">{totalPages}</strong> ({totalStudentsCount} total students)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  className="p-2 border border-gray-250 bg-white rounded-lg hover:bg-gray-50 text-gray-600 disabled:opacity-50 transition-all inline-flex items-center"
                >
                  <FiChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                  className="p-2 border border-gray-250 bg-white rounded-lg hover:bg-gray-50 text-gray-600 disabled:opacity-50 transition-all inline-flex items-center"
                >
                  <FiChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* MODAL: Student Create / Edit */}
        {studentModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 overflow-y-auto backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-150">
              <div className="bg-gradient-to-r from-primary-700 to-primary-600 px-6 py-4 text-white flex justify-between items-center">
                <h3 className="font-bold text-lg">{studentModal.mode === 'create' ? 'Add Student' : 'Edit Student'}</h3>
                <button onClick={() => setStudentModal({ open: false, mode: 'create', data: null })} className="text-white hover:opacity-80">
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSaveStudent} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Enrollment Number */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Enrollment Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={studentForm.enrollmentNumber}
                      onChange={(e) => setStudentForm({ ...studentForm, enrollmentNumber: e.target.value })}
                      placeholder="e.g. EN2026101"
                      className="input-field"
                      disabled={studentModal.mode === 'edit'}
                      required
                    />
                  </div>

                  {/* Student Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Student Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={studentForm.name}
                      onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                      placeholder="e.g. Amit Kumar"
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* College Email */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      College Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={studentForm.email}
                      onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                      placeholder="e.g. amit@college.edu"
                      className="input-field"
                    />
                  </div>

                  {/* Personal Email */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Personal Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={studentForm.personalEmail}
                      onChange={(e) => setStudentForm({ ...studentForm, personalEmail: e.target.value })}
                      placeholder="e.g. amit.kumar99@gmail.com"
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Gender */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Gender</label>
                    <select
                      value={studentForm.gender}
                      onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value })}
                      className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 outline-hidden w-full"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                  <button
                    type="button"
                    onClick={() => setStudentModal({ open: false, mode: 'create', data: null })}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold shadow-md">
                    {studentModal.mode === 'create' ? 'Create Student' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: View Details */}
        {detailsModal.open && detailsModal.data && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 overflow-y-auto backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-150">
              <div className="bg-gradient-to-r from-primary-700 to-primary-600 px-6 py-4 text-white flex justify-between items-center">
                <h3 className="font-bold text-lg">Student Profile Card</h3>
                <button onClick={() => setDetailsModal({ open: false, data: null })} className="text-white hover:opacity-80">
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-5">
                {/* Photo & Main Details */}
                <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                  <div className="w-16 h-16 rounded-full border border-gray-200 overflow-hidden flex items-center justify-center bg-gray-50">
                    {detailsModal.data.profilePhoto ? (
                      <img src={resolveFileUrl(detailsModal.data.profilePhoto)} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <FiUser className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-800">{detailsModal.data.name}</h4>
                    <p className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wide mt-0.5">{detailsModal.data.enrollmentNumber}</p>
                  </div>
                </div>

                {/* Academic Data Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 border border-gray-100 rounded-xl p-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Department</label>
                    <p className="text-gray-700 font-semibold mt-0.5">{detailsModal.data.departmentId?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Class Section</label>
                    <p className="text-gray-700 font-semibold mt-0.5">{detailsModal.data.sectionId?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Academic Session</label>
                    <p className="text-gray-700 font-semibold mt-0.5">{detailsModal.data.academicSessionId?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Academic Year</label>
                    <p className="text-gray-700 font-semibold mt-0.5">{detailsModal.data.academicYearId?.name || 'N/A'}</p>
                  </div>
                </div>

                {/* Contact Data */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-gray-400 font-medium">College Email</span>
                    <span className="text-gray-800 font-semibold">{detailsModal.data.email}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-gray-400 font-medium">Personal Email</span>
                    <span className="text-gray-800 font-semibold">{detailsModal.data.personalEmail || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-gray-400 font-medium">Phone Number</span>
                    <span className="text-gray-800 font-semibold">{detailsModal.data.phoneNumber || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-gray-400 font-medium">Gender</span>
                    <span className="text-gray-800 font-semibold">{detailsModal.data.gender || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-gray-400 font-medium">Onboarding Status</span>
                    <span className={`inline-block px-2 py-0.5 rounded-sm text-[10px] font-bold ${detailsModal.data.isProfileComplete ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {detailsModal.data.isProfileComplete ? 'Complete' : 'Pending Onboarding'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-gray-400 font-medium">Last Login</span>
                    <span className="text-gray-800 font-semibold">{detailsModal.data.lastLogin ? new Date(detailsModal.data.lastLogin).toLocaleString() : 'Never'}</span>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setDetailsModal({ open: false, data: null })}
                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DRAWER/MODAL: Bulk Import */}
        {importModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 overflow-y-auto backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-150">
              <div className="bg-gradient-to-r from-primary-700 to-primary-600 px-6 py-4 text-white flex justify-between items-center">
                <h3 className="font-bold text-lg">Bulk Student Import</h3>
                <button
                  onClick={() => setImportModal({ open: false, file: null, fileName: '', targetSectionId: sections[0]?._id || '', errorFilePath: '', summary: null })}
                  className="text-white hover:opacity-80"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Download Sample Box */}
                <div className="bg-indigo-50 border border-indigo-150 rounded-xl p-4 flex justify-between items-center text-sm">
                  <div>
                    <h4 className="font-bold text-indigo-900">Download Template</h4>
                    <p className="text-xs text-indigo-700 mt-0.5">Use our predefined spreadsheet template with valid column headers.</p>
                  </div>
                  <button
                    onClick={handleDownloadSample}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md transition-all flex items-center gap-1"
                  >
                    <FiDownload className="w-3.5 h-3.5" /> Template
                  </button>
                </div>

                <form onSubmit={handleUploadImport} className="space-y-4">
                  {/* File Upload */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Select Spreadsheet (.xlsx, max 500 rows) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      accept=".xlsx"
                      onChange={handleImportFileChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 file:cursor-pointer hover:file:bg-primary-100"
                      required
                    />
                    {importModal.fileName && (
                      <p className="text-xs text-gray-400 mt-1">Selected file: <strong className="text-gray-600">{importModal.fileName}</strong></p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                    <button
                      type="button"
                      onClick={() => setImportModal({ open: false, file: null, fileName: '', targetSectionId: sections[0]?._id || '', errorFilePath: '', summary: null })}
                      className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!importModal.file || loading}
                      className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold shadow-md disabled:opacity-50"
                    >
                      Upload & Parse
                    </button>
                  </div>
                </form>

                {/* Import Failures and Error Download */}
                {importModal.errorFilePath && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <FiAlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-red-900">Validation Failures Found</h4>
                        <p className="text-xs text-red-700 mt-0.5">
                          Excel file was rejected due to data validation errors. Download the error report spreadsheet to see details for each row.
                        </p>
                      </div>
                    </div>
                    {importModal.summary && (
                      <div className="text-xs text-red-800 grid grid-cols-3 gap-2 py-1 bg-red-100/40 rounded-lg text-center font-medium">
                        <div>Total: {importModal.summary.totalRows}</div>
                        <div>Valid: {importModal.summary.totalImported}</div>
                        <div>Failed: {importModal.summary.failed}</div>
                      </div>
                    )}
                    <a
                      href={resolveFileUrl(importModal.errorFilePath)}
                      download
                      className="w-full text-center block px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-md transition-all"
                    >
                      Download Error Report Excel
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Section: Import History Logs */}
        {importHistory.length > 0 && (
          <div className="card bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-1.5">
                <FiCalendar className="w-5 h-5 text-indigo-500" /> Spreadsheet Import History Logs
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">Track metadata, volume stats, and verification error sheets for past bulk uploads.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 font-bold text-gray-500 uppercase tracking-wider">
                    <th className="p-3">Uploaded Date</th>
                    <th className="p-3">File Name</th>
                    <th className="p-3">Imported By</th>
                    <th className="p-3">Target Section</th>
                    <th className="p-3 text-center">Success</th>
                    <th className="p-3 text-center">Failed</th>
                    <th className="p-3 text-right">Error File</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 text-gray-600">
                  {importHistory.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50/30">
                      <td className="p-3 font-medium">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="p-3 font-semibold text-gray-800">{log.fileName}</td>
                      <td className="p-3">{log.importedBy?.name || 'System'}</td>
                      <td className="p-3">{log.sectionId?.name || 'Multiple'}</td>
                      <td className="p-3 text-center font-bold text-emerald-600">{log.totalImported}</td>
                      <td className="p-3 text-center font-bold text-red-500">{log.failed}</td>
                      <td className="p-3 text-right">
                        {log.errorFilePath ? (
                          <a
                            href={resolveFileUrl(log.errorFilePath)}
                            download
                            className="text-red-600 hover:text-red-800 font-bold hover:underline"
                          >
                            Download Error Excel
                          </a>
                        ) : (
                          <span className="text-gray-400">None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
