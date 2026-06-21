import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import toast from 'react-hot-toast'
import {
  FiShield, FiLogOut, FiPlus, FiEdit, FiTrash2,
  FiSend, FiRefreshCw, FiGrid, FiUsers, FiSettings,
  FiActivity, FiCopy, FiCheck, FiX, FiInfo
} from 'react-icons/fi'

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [colleges, setColleges] = useState([])
  const [invites, setInvites] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(false)

  // Modals / Drawers states
  const [collegeModal, setCollegeModal] = useState({ open: false, mode: 'create', data: null })
  const [inviteModal, setInviteModal] = useState(false)
  const [transferModal, setTransferModal] = useState({ open: false, collegeId: null })

  // Form states
  const [collegeForm, setCollegeForm] = useState({
    name: '', code: '', slug: '', email: '', phone: '', address: '', website: '', status: 'Active'
  })
  const [inviteForm, setInviteForm] = useState({ email: '', collegeId: '' })
  const [transferForm, setTransferForm] = useState({ email: '' })
  const [settingsForm, setSettingsForm] = useState({ maintenanceMode: false })

  // Load dashboard data
  useEffect(() => {
    fetchColleges()
    fetchInvites()
    fetchAuditLogs()
  }, [])

  const fetchColleges = async () => {
    try {
      const { data } = await api.get('/colleges')
      setColleges(data.colleges || [])
    } catch (err) {
      toast.error('Failed to load colleges')
    }
  }

  const fetchInvites = async () => {
    try {
      const { data } = await api.get('/invites')
      setInvites(data.invites || [])
    } catch (err) {
      toast.error('Failed to load invitations')
    }
  }

  const fetchAuditLogs = async () => {
    try {
      const { data } = await api.get('/admin/audit-logs')
      setAuditLogs(data.logs || [])
    } catch (err) {
      toast.error('Failed to load audit logs')
    }
  }

  // Colleges CRUD handlers
  const handleOpenCollegeModal = (mode, data = null) => {
    if (mode === 'create') {
      setCollegeForm({ name: '', code: '', slug: '', email: '', phone: '', address: '', website: '', status: 'Active' })
    } else {
      setCollegeForm({
        name: data.name,
        code: data.code,
        slug: data.slug,
        email: data.email,
        phone: data.phone,
        address: data.address,
        website: data.website || '',
        status: data.status
      })
    }
    setCollegeModal({ open: true, mode, data })
  }

  const handleSaveCollege = async (e) => {
    e.preventDefault()
    if (!collegeForm.name || !collegeForm.code || !collegeForm.email || !collegeForm.phone || !collegeForm.address) {
      return toast.error('Please fill in all mandatory fields')
    }

    setLoading(true)
    try {
      if (collegeModal.mode === 'create') {
        await api.post('/colleges', collegeForm)
        toast.success('College created successfully')
      } else {
        await api.put(`/colleges/${collegeModal.data._id}`, collegeForm)
        toast.success('College updated successfully')
      }
      setCollegeModal({ open: false, mode: 'create', data: null })
      fetchColleges()
      fetchAuditLogs()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save college')
    } finally {
      setLoading(false)
    }
  }

  // Invite handlers
  const handleSendInvite = async (e) => {
    e.preventDefault()
    if (!inviteForm.email || !inviteForm.collegeId) {
      return toast.error('Email and College selection are required')
    }

    setLoading(true)
    try {
      const { data } = await api.post('/invites/send', {
        email: inviteForm.email,
        collegeId: inviteForm.collegeId,
        role: 'college_admin'
      })
      toast.success('Invitation sent successfully')
      
      // Auto-display and trigger copy option for link in developer mode
      if (data.activationLink) {
        navigator.clipboard.writeText(data.activationLink)
        toast('Invite link copied to clipboard!', { icon: '📋' })
      }
      
      setInviteModal(false)
      setInviteForm({ email: '', collegeId: '' })
      fetchInvites()
      fetchAuditLogs()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send invite')
    } finally {
      setLoading(false)
    }
  }

  const handleResendInvite = async (id) => {
    try {
      const { data } = await api.post(`/invites/${id}/resend`)
      toast.success('Invitation link re-issued')
      if (data.activationLink) {
        navigator.clipboard.writeText(data.activationLink)
        toast('New invite link copied to clipboard!', { icon: '📋' })
      }
      fetchInvites()
      fetchAuditLogs()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend invite')
    }
  }

  const handleCancelInvite = async (id) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) return
    try {
      await api.post(`/invites/${id}/cancel`)
      toast.success('Invitation cancelled')
      fetchInvites()
      fetchAuditLogs()
    } catch (err) {
      toast.error('Failed to cancel invite')
    }
  }

  const handleOpenTransferModal = (collegeId) => {
    setTransferForm({ email: '' })
    setTransferModal({ open: true, collegeId })
  }

  const handleTransferAdmin = async (e) => {
    e.preventDefault()
    if (!transferForm.email) return toast.error('Email is required')

    setLoading(true)
    try {
      const { data } = await api.post(`/colleges/${transferModal.collegeId}/transfer-admin`, {
        email: transferForm.email
      })
      toast.success('Admin transfer initiated!')
      if (data.activationLink) {
        navigator.clipboard.writeText(data.activationLink)
        toast('Activation link copied to clipboard!', { icon: '📋' })
      }
      setTransferModal({ open: false, collegeId: null })
      fetchColleges()
      fetchInvites()
      fetchAuditLogs()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to transfer admin')
    } finally {
      setLoading(false)
    }
  }

  // Copy helper
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied link to clipboard!')
  }

  // Stats computation
  const totalColleges = colleges.length
  const activeColleges = colleges.filter(c => c.status === 'Active').length
  const inactiveColleges = colleges.filter(c => c.status === 'Inactive' || c.status === 'Deactivated').length
  const pendingInvitesCount = invites.filter(i => i.status === 'Pending' || i.status === 'Resent').length
  
  // Scoped placeholders / summaries
  const totalTeachers = 12 // Simplified summary or mock counts
  const totalDepartments = 8
  const totalAcademicSessions = 4

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-primary-600 text-white p-2.5 rounded-xl shadow-md shadow-primary-200">
            <FiShield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">ProjX Super Admin</h1>
            <p className="text-xs text-gray-400 font-medium">ERP Multi-College Hub</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-700">{user?.name || 'Super Admin'}</p>
            <p className="text-xs text-primary-600 font-bold bg-primary-50 px-2.5 py-0.5 rounded-full inline-block mt-0.5">Super Admin Mode</p>
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
              ${activeTab === 'overview' ? 'bg-primary-600 text-white shadow-lg shadow-primary-100' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <FiGrid className="w-5 h-5" />
            Overview Dashboard
          </button>
          <button
            onClick={() => setActiveTab('colleges')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all
              ${activeTab === 'colleges' ? 'bg-primary-600 text-white shadow-lg shadow-primary-100' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <FiPlus className="w-5 h-5" />
            College Tenants
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all
              ${activeTab === 'admins' ? 'bg-primary-600 text-white shadow-lg shadow-primary-100' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <FiUsers className="w-5 h-5" />
            College Admins
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all
              ${activeTab === 'logs' ? 'bg-primary-600 text-white shadow-lg shadow-primary-100' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <FiActivity className="w-5 h-5" />
            System Audit Logs
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all
              ${activeTab === 'settings' ? 'bg-primary-600 text-white shadow-lg shadow-primary-100' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <FiSettings className="w-5 h-5" />
            System Settings
          </button>
        </aside>

        {/* Content Body */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-6xl w-full mx-auto">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Info alert */}
              <div className="bg-primary-50 border border-primary-200 text-primary-800 rounded-2xl p-4 flex gap-3">
                <FiInfo className="w-5 h-5 mt-0.5 shrink-0 text-primary-600" />
                <div>
                  <p className="font-bold text-sm">ERP Multi-College Hub Online</p>
                  <p className="text-xs text-primary-700 mt-0.5">Welcome to the ProjX ERP administration panel. From here, you can onboard colleges, manage scope access credentials, and monitor system log trails.</p>
                </div>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Colleges</span>
                  <p className="text-3xl font-extrabold text-gray-800 mt-2">{totalColleges}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">Active Colleges</span>
                  <p className="text-3xl font-extrabold text-emerald-600 mt-2">{activeColleges}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-wider text-red-500">Inactive Colleges</span>
                  <p className="text-3xl font-extrabold text-red-600 mt-2">{inactiveColleges}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-500">Pending Invites</span>
                  <p className="text-3xl font-extrabold text-amber-600 mt-2">{pendingInvitesCount}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Teachers</span>
                  <p className="text-2xl font-extrabold text-gray-800 mt-2">{totalTeachers}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Departments</span>
                  <p className="text-2xl font-extrabold text-gray-800 mt-2">{totalDepartments}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Academic Sessions</span>
                  <p className="text-2xl font-extrabold text-gray-800 mt-2">{totalAcademicSessions}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COLLEGES */}
          {activeTab === 'colleges' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">College Tenants</h2>
                  <p className="text-xs text-gray-500">Register and configure institution accounts</p>
                </div>
                <button
                  onClick={() => handleOpenCollegeModal('create')}
                  className="btn-primary flex items-center gap-2 py-2 px-4 text-sm"
                >
                  <FiPlus className="w-4 h-4" />
                  Add College
                </button>
              </div>

              {/* Table */}
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                      <th className="p-4">Code</th>
                      <th className="p-4">College Name</th>
                      <th className="p-4">Slug</th>
                      <th className="p-4">Contact Email</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {colleges.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-gray-400">No colleges registered yet.</td>
                      </tr>
                    ) : (
                      colleges.map((c) => (
                        <tr key={c._id} className="hover:bg-gray-50/50">
                          <td className="p-4 font-bold text-primary-700">{c.code}</td>
                          <td className="p-4 font-semibold text-gray-800">{c.name}</td>
                          <td className="p-4 text-xs font-mono text-gray-500">{c.slug}</td>
                          <td className="p-4 text-gray-600">{c.email}</td>
                          <td className="p-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold
                              ${c.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => handleOpenCollegeModal('edit', c)}
                              className="text-gray-500 hover:text-primary-600 inline-flex items-center justify-center p-1.5 hover:bg-gray-100 rounded-lg"
                              title="Edit Details"
                            >
                              <FiEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenTransferModal(c._id)}
                              className="text-amber-500 hover:text-amber-700 font-semibold text-xs border border-amber-100 hover:border-amber-300 bg-amber-50/30 hover:bg-amber-50 px-2 py-1 rounded-lg"
                              title="Transfer Admin"
                            >
                              Transfer Admin
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

          {/* TAB 3: ADMINS */}
          {activeTab === 'admins' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">College Admins</h2>
                  <p className="text-xs text-gray-500">Invite and manage tenant administrators</p>
                </div>
                <button
                  onClick={() => setInviteModal(true)}
                  className="btn-primary flex items-center gap-2 py-2 px-4 text-sm"
                >
                  <FiSend className="w-4 h-4" />
                  Invite Admin
                </button>
              </div>

              {/* Table */}
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                      <th className="p-4">Email</th>
                      <th className="p-4">College</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Expires At</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {invites.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-gray-400">No invitations issued yet.</td>
                      </tr>
                    ) : (
                      invites.map((inv) => (
                        <tr key={inv._id} className="hover:bg-gray-50/50">
                          <td className="p-4 font-semibold text-gray-800">{inv.email}</td>
                          <td className="p-4 text-gray-600">{inv.collegeId?.name || 'N/A'}</td>
                          <td className="p-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border
                              ${inv.status === 'Accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : inv.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : inv.status === 'Resent' ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : inv.status === 'Cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : inv.status === 'Expired' ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-gray-100 text-gray-700 border-gray-300'}`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="p-4 text-xs text-gray-400">
                            {new Date(inv.expiresAt).toLocaleString()}
                          </td>
                          <td className="p-4 text-right space-x-2">
                            {inv.status !== 'Accepted' && (
                              <>
                                <button
                                  onClick={() => handleResendInvite(inv._id)}
                                  className="text-primary-600 hover:text-primary-800 text-xs font-semibold hover:underline"
                                  title="Resend Activation Link"
                                >
                                  Resend
                                </button>
                                <button
                                  onClick={() => handleCancelInvite(inv._id)}
                                  className="text-red-500 hover:text-red-700 text-xs font-semibold hover:underline"
                                  title="Cancel Invitation"
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

          {/* TAB 4: AUDIT LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">System Audit Logs</h2>
                <p className="text-xs text-gray-500">Trace history of all operations</p>
              </div>

              {/* Log List */}
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                {auditLogs.length === 0 ? (
                  <p className="p-8 text-center text-gray-400 text-sm">No action logs captured yet.</p>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log._id || Math.random()} className="p-4 hover:bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
                      <div className="space-y-1">
                        <p className="font-semibold text-gray-800">
                          {log.action} <span className="text-xs font-normal text-gray-400">by {log.role || 'Super Admin'}</span>
                        </p>
                        <p className="text-xs text-gray-500">{log.details}</p>
                        <p className="text-[10px] text-gray-400 font-mono">IP: {log.ipAddress || 'Unknown'} | {log.userAgent?.substring(0, 80)}...</p>
                      </div>
                      <span className="text-[11px] text-gray-400 font-medium shrink-0 self-end sm:self-center">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 5: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-md shadow-sm">
              <h2 className="text-lg font-bold text-gray-800 mb-2">System Settings</h2>
              <p className="text-xs text-gray-400 mb-6">Manage global application flags</p>

              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); toast.success('Settings saved successfully!') }}>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block">Maintenance Mode</label>
                    <span className="text-xs text-gray-400">Put system offline for updates</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settingsForm.maintenanceMode}
                    onChange={(e) => setSettingsForm({ ...settingsForm, maintenanceMode: e.target.checked })}
                    className="w-5 h-5 text-primary-600"
                  />
                </div>

                <button type="submit" className="btn-primary w-full py-2">
                  Save Configuration
                </button>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* College Modal */}
      {collegeModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl relative border border-gray-100">
            <button
              onClick={() => setCollegeModal({ open: false, mode: 'create', data: null })}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-5 h-5" />
            </button>
            
            <h2 className="text-lg font-bold text-gray-800 mb-4 capitalize">
              {collegeModal.mode === 'create' ? 'Create New College Tenant' : 'Edit College Details'}
            </h2>

            <form onSubmit={handleSaveCollege} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">College Name</label>
                <input
                  value={collegeForm.name}
                  onChange={(e) => setCollegeForm({ ...collegeForm, name: e.target.value })}
                  placeholder="e.g. Indian Institute of Technology"
                  className="input-field"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">College Code</label>
                  <input
                    value={collegeForm.code}
                    onChange={(e) => setCollegeForm({ ...collegeForm, code: e.target.value })}
                    placeholder="e.g. IITD"
                    className="input-field"
                    disabled={collegeModal.mode === 'edit'}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">URL Slug</label>
                  <input
                    value={collegeForm.slug}
                    onChange={(e) => setCollegeForm({ ...collegeForm, slug: e.target.value })}
                    placeholder="e.g. iit-delhi (autogen if empty)"
                    className="input-field"
                    disabled={collegeModal.mode === 'edit'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Official Email</label>
                  <input
                    type="email"
                    value={collegeForm.email}
                    onChange={(e) => setCollegeForm({ ...collegeForm, email: e.target.value })}
                    placeholder="admin@college.edu"
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Phone Number</label>
                  <input
                    value={collegeForm.phone}
                    onChange={(e) => setCollegeForm({ ...collegeForm, phone: e.target.value })}
                    placeholder="Contact number"
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Physical Campus Address</label>
                <textarea
                  value={collegeForm.address}
                  onChange={(e) => setCollegeForm({ ...collegeForm, address: e.target.value })}
                  placeholder="Street details..."
                  className="input-field h-20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Website (Optional)</label>
                  <input
                    value={collegeForm.website}
                    onChange={(e) => setCollegeForm({ ...collegeForm, website: e.target.value })}
                    placeholder="www.college.edu"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">College Status</label>
                  <select
                    value={collegeForm.status}
                    onChange={(e) => setCollegeForm({ ...collegeForm, status: e.target.value })}
                    className="input-field text-sm"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Deactivated">Deactivated</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
              >
                {loading ? 'Saving College…' : 'Save College Tenant'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {inviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative border border-gray-100">
            <button
              onClick={() => setInviteModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-gray-800 mb-4">Invite College Admin</h2>

            <form onSubmit={handleSendInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Select College</label>
                <select
                  value={inviteForm.collegeId}
                  onChange={(e) => setInviteForm({ ...inviteForm, collegeId: e.target.value })}
                  className="input-field text-sm"
                  required
                >
                  <option value="">Select an Organization</option>
                  {colleges.map(c => (
                    <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Admin Email Address</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  placeholder="admin@college.edu"
                  className="input-field"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
              >
                {loading ? 'Creating Invitation Link…' : 'Generate Activation Link'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Admin Modal */}
      {transferModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative border border-gray-100">
            <button
              onClick={() => setTransferModal({ open: false, collegeId: null })}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-gray-800 mb-2">Transfer College Admin</h2>
            <p className="text-xs text-red-500 font-semibold mb-4 leading-relaxed">
              ⚠️ Warning: Proceeding will deactivate the current active administrator for this college and issue a new invite token.
            </p>

            <form onSubmit={handleTransferAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">New Admin Email Address</label>
                <input
                  type="email"
                  value={transferForm.email}
                  onChange={(e) => setTransferForm({ ...transferForm, email: e.target.value })}
                  placeholder="newadmin@college.edu"
                  className="input-field"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5 bg-amber-600 hover:bg-amber-700 flex items-center justify-center gap-2 border-amber-600"
              >
                {loading ? 'Initiating Transfer…' : 'Confirm Transfer & Generate Link'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
