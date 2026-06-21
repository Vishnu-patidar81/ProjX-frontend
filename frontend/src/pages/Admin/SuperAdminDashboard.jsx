import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import toast from 'react-hot-toast'
import {
  FiShield, FiLogOut, FiPlus, FiEdit, FiTrash2,
  FiSend, FiRefreshCw, FiGrid, FiUsers, FiSettings,
  FiActivity, FiCopy, FiCheck, FiX, FiInfo, FiEye,
  FiAlertTriangle, FiCheckCircle, FiDollarSign, FiClock
} from 'react-icons/fi'

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [colleges, setColleges] = useState([])
  const [admins, setAdmins] = useState([])
  const [adminInvites, setAdminInvites] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [plans, setPlans] = useState([])
  const [settings, setSettings] = useState({})
  const [stats, setStats] = useState({
    totalColleges: 0,
    activeColleges: 0,
    inactiveColleges: 0,
    trialColleges: 0,
    expiredSubscriptions: 0,
    pendingRenewals: 0,
    totalCollegeAdmins: 0
  })
  
  const [loading, setLoading] = useState(false)

  // Filters
  const [collegeSearch, setCollegeSearch] = useState('')
  const [collegeStatusFilter, setCollegeStatusFilter] = useState('All')
  const [adminSearch, setAdminSearch] = useState('')
  const [adminStatusFilter, setAdminStatusFilter] = useState('All')
  const [logCollegeFilter, setLogCollegeFilter] = useState('')
  const [logActionFilter, setLogActionFilter] = useState('')
  const [logDateFilter, setLogDateFilter] = useState('')

  // Modals & Active Selections
  const [selectedCollege, setSelectedCollege] = useState(null)
  const [collegeModal, setCollegeModal] = useState({ open: false, mode: 'create', data: null })
  const [adminModal, setAdminModal] = useState({ open: false, mode: 'create', data: null })
  const [transferModal, setTransferModal] = useState({ open: false, collegeId: null })
  const [subscriptionModal, setSubscriptionModal] = useState({ open: false, college: null })
  const [planModal, setPlanModal] = useState({ open: false, mode: 'create', data: null })
  const [tempPasswordAlert, setTempPasswordAlert] = useState(null)

  // Form states
  const [collegeForm, setCollegeForm] = useState({
    name: '', code: '', slug: '', email: '', phone: '', address: '', website: '', status: 'Active'
  })
  const [adminForm, setAdminForm] = useState({
    email: '', name: '', phoneNumber: '', collegeId: ''
  })
  const [transferForm, setTransferForm] = useState({ email: '' })
  const [subscriptionForm, setSubscriptionForm] = useState({
    action: 'upgrade', planId: '', expiresAt: '', paymentStatus: 'Paid'
  })
  const [planForm, setPlanForm] = useState({
    name: '', price: 0, billingCycle: 'monthly', maxStudents: 1000, maxGroups: 100, features: '', isActive: true
  })
  const [settingsForm, setSettingsForm] = useState({
    smtpHost: '', smtpPort: '', smtpUser: '', smtpPass: '', maintenanceMode: false, supportEmail: '', defaultSubscriptionPlanId: '', jwtExpiresIn: '7d'
  })

  // Load all dashboard components on mount
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = () => {
    fetchColleges()
    fetchCollegeAdmins()
    fetchStats()
    fetchAuditLogs()
    fetchPlans()
    fetchSettings()
  }

  const fetchColleges = async () => {
    try {
      const { data } = await api.get('/colleges')
      setColleges(data.colleges || [])
    } catch (err) {
      toast.error('Failed to load colleges')
    }
  }

  const fetchCollegeAdmins = async () => {
    try {
      const { data } = await api.get('/admin/college-admins')
      setAdmins(data.admins || [])
      setAdminInvites(data.invites || [])
    } catch (err) {
      toast.error('Failed to load college admins')
    }
  }

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/admin/stats/super')
      setStats(data || {})
    } catch (err) {
      console.error(err)
    }
  }

  const fetchAuditLogs = async (customFilters = null) => {
    try {
      const activeFilters = customFilters || {
        collegeId: logCollegeFilter,
        action: logActionFilter,
        date: logDateFilter
      }
      const params = {}
      if (activeFilters.collegeId) params.collegeId = activeFilters.collegeId
      if (activeFilters.action) params.action = activeFilters.action
      if (activeFilters.date) params.date = activeFilters.date

      const { data } = await api.get('/admin/audit-logs', { params })
      setAuditLogs(data.logs || [])
    } catch (err) {
      toast.error('Failed to load audit logs')
    }
  }

  const fetchPlans = async () => {
    try {
      const { data } = await api.get('/admin/subscriptions/plans')
      setPlans(data.plans || [])
    } catch (err) {
      toast.error('Failed to load subscription plans')
    }
  }

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/admin/settings/system')
      if (data.settings) {
        setSettings(data.settings)
        setSettingsForm({
          smtpHost: data.settings.smtpHost || '',
          smtpPort: data.settings.smtpPort || '',
          smtpUser: data.settings.smtpUser || '',
          smtpPass: data.settings.smtpPass || '',
          maintenanceMode: !!data.settings.maintenanceMode,
          supportEmail: data.settings.supportEmail || '',
          defaultSubscriptionPlanId: data.settings.defaultSubscriptionPlanId || '',
          jwtExpiresIn: data.settings.jwtExpiresIn || '7d'
        })
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Colleges Operations
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
        if (selectedCollege && selectedCollege._id === collegeModal.data._id) {
          // Refresh details view if open
          const { data } = await api.get('/colleges')
          const updatedCollege = data.colleges.find(c => c._id === collegeModal.data._id)
          if (updatedCollege) setSelectedCollege(updatedCollege)
        }
      }
      setCollegeModal({ open: false, mode: 'create', data: null })
      fetchColleges()
      fetchStats()
      fetchAuditLogs()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save college')
    } finally {
      setLoading(false)
    }
  }

  const handleArchiveCollege = async (id) => {
    if (!confirm('Are you sure you want to Archive this college? This will deactivate all associated users and restrict their login access.')) return
    try {
      await api.delete(`/colleges/${id}`)
      toast.success('College archived and deactivated')
      if (selectedCollege && selectedCollege._id === id) {
        setSelectedCollege(null)
      }
      fetchColleges()
      fetchCollegeAdmins()
      fetchStats()
      fetchAuditLogs()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to archive college')
    }
  }

  const handleSuspendSubscription = async (id) => {
    try {
      await api.put(`/colleges/${id}/subscription`, { action: 'suspend' })
      toast.success('Subscription suspended successfully')
      fetchColleges()
      fetchStats()
      fetchAuditLogs()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to suspend subscription')
    }
  }

  const handleActivateSubscription = async (id) => {
    try {
      await api.put(`/colleges/${id}/subscription`, { action: 'activate' })
      toast.success('Subscription activated successfully')
      fetchColleges()
      fetchStats()
      fetchAuditLogs()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to activate subscription')
    }
  }

  // College Admin Operations
  const handleOpenAdminModal = (mode, data = null) => {
    if (mode === 'create') {
      setAdminForm({ email: '', name: '', phoneNumber: '', collegeId: '' })
    } else {
      setAdminForm({
        email: data.email,
        name: data.name || '',
        phoneNumber: data.phone || '',
        collegeId: data.college?._id || ''
      })
    }
    setAdminModal({ open: true, mode, data })
  }

  const handleSaveAdmin = async (e) => {
    e.preventDefault()
    if (!adminForm.email || (adminModal.mode === 'create' && !adminForm.collegeId)) {
      return toast.error('Email and College are required')
    }
    setLoading(true)
    try {
      if (adminModal.mode === 'create') {
        const { data } = await api.post('/admin/college-admins/create', adminForm)
        toast.success('College Admin invite sent')
        if (data.activationLink) {
          navigator.clipboard.writeText(data.activationLink)
          toast('Invite activation link copied!', { icon: '📋' })
        }
      } else {
        await api.put(`/admin/college-admins/${adminModal.data.id}`, adminForm)
        toast.success('College Admin details updated')
      }
      setAdminModal({ open: false, mode: 'create', data: null })
      fetchCollegeAdmins()
      fetchColleges()
      fetchStats()
      fetchAuditLogs()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save admin')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAdminStatus = async (id) => {
    try {
      await api.post(`/admin/college-admins/${id}/toggle-status`)
      toast.success('Admin status updated')
      fetchCollegeAdmins()
      fetchColleges()
      fetchAuditLogs()
    } catch (err) {
      toast.error('Failed to change status')
    }
  }

  const handleGenerateTempPassword = async (id) => {
    try {
      const { data } = await api.post(`/admin/college-admins/${id}/generate-temp-password`)
      setTempPasswordAlert(data.tempPassword)
      fetchAuditLogs()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate temporary password')
    }
  }

  const handleResendAdminInvite = async (id) => {
    try {
      const { data } = await api.post(`/invites/${id}/resend`)
      toast.success('Invitation link re-issued')
      if (data.activationLink) {
        navigator.clipboard.writeText(data.activationLink)
        toast('Invite link copied!', { icon: '📋' })
      }
      fetchCollegeAdmins()
      fetchAuditLogs()
    } catch (err) {
      toast.error('Failed to resend invite')
    }
  }

  const handleSoftDeleteAdmin = async (id) => {
    if (!confirm('Are you sure you want to deactivate this admin or cancel their invitation?')) return
    try {
      await api.delete(`/admin/college-admins/${id}`)
      toast.success('Action completed')
      fetchCollegeAdmins()
      fetchColleges()
      fetchStats()
      fetchAuditLogs()
    } catch (err) {
      toast.error('Failed to complete action')
    }
  }

  // Transfer Admin handler
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
        toast('Invite link copied!', { icon: '📋' })
      }
      setTransferModal({ open: false, collegeId: null })
      fetchColleges()
      fetchCollegeAdmins()
      fetchStats()
      fetchAuditLogs()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to transfer admin')
    } finally {
      setLoading(false)
    }
  }

  // Subscription Management Operations
  const handleOpenSubscriptionModal = (college) => {
    setSubscriptionForm({
      action: 'upgrade',
      planId: college.subscription?.planId?._id || '',
      expiresAt: college.subscription?.expiresAt ? new Date(college.subscription.expiresAt).toISOString().split('T')[0] : '',
      paymentStatus: college.subscription?.paymentStatus || 'Paid'
    })
    setSubscriptionModal({ open: true, college })
  }

  const handleUpdateSubscription = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.put(`/colleges/${subscriptionModal.college._id}/subscription`, subscriptionForm)
      toast.success('Subscription plan updated')
      setSubscriptionModal({ open: false, college: null })
      fetchColleges()
      fetchStats()
      fetchAuditLogs()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update subscription')
    } finally {
      setLoading(false)
    }
  }

  // Plan CRUD operations
  const handleOpenPlanModal = (mode, data = null) => {
    if (mode === 'create') {
      setPlanForm({ name: '', price: 0, billingCycle: 'monthly', maxStudents: 1000, maxGroups: 100, features: '', isActive: true })
    } else {
      setPlanForm({
        name: data.name,
        price: data.price,
        billingCycle: data.billingCycle,
        maxStudents: data.maxStudents,
        maxGroups: data.maxGroups,
        features: data.features ? data.features.join(', ') : '',
        isActive: data.isActive
      })
    }
    setPlanModal({ open: true, mode, data })
  }

  const handleSavePlan = async (e) => {
    e.preventDefault()
    if (!planForm.name || planForm.price === undefined || planForm.maxStudents === undefined || planForm.maxGroups === undefined) {
      return toast.error('Required fields missing')
    }
    setLoading(true)
    try {
      const payload = {
        ...planForm,
        features: planForm.features ? planForm.features.split(',').map(f => f.trim()) : []
      }
      if (planModal.mode === 'create') {
        await api.post('/admin/subscriptions/plans', payload)
        toast.success('Plan created')
      } else {
        await api.put(`/admin/subscriptions/plans/${planModal.data._id}`, payload)
        toast.success('Plan updated')
      }
      setPlanModal({ open: false, mode: 'create', data: null })
      fetchPlans()
      fetchAuditLogs()
    } catch (err) {
      toast.error('Failed to save plan')
    } finally {
      setLoading(false)
    }
  }

  // Settings Save
  const handleSaveSettings = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.put('/admin/settings/system', settingsForm)
      toast.success('System settings saved')
      fetchSettings()
      fetchAuditLogs()
    } catch (err) {
      toast.error('Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  // Remaining days calculation helper
  const getRemainingDays = (expiresAt) => {
    if (!expiresAt) return 'N/A'
    const exp = new Date(expiresAt)
    const diffTime = exp - new Date()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays <= 0) return 'Expired'
    return `${diffDays} days`
  }

  // Audit Logs quick filter triggers
  const handleApplyLogFilters = () => {
    fetchAuditLogs()
  }

  const handleClearLogFilters = () => {
    setLogCollegeFilter('')
    setLogActionFilter('')
    setLogDateFilter('')
    fetchAuditLogs({ collegeId: '', action: '', date: '' })
  }

  // Multi-table filters
  const filteredColleges = colleges.filter(c => {
    const search = collegeSearch.toLowerCase()
    const matchesSearch = c.name.toLowerCase().includes(search) || c.code.toLowerCase().includes(search)
    const matchesStatus = collegeStatusFilter === 'All' ? true : c.status === collegeStatusFilter
    return matchesSearch && matchesStatus
  })

  const combinedAdmins = [
    ...admins.map(a => ({
      id: a._id,
      email: a.email,
      name: a.name,
      phone: a.phoneNumber || 'N/A',
      college: a.collegeId,
      status: a.isActive ? 'Active' : 'Inactive',
      isInvite: false
    })),
    ...adminInvites.map(i => ({
      id: i._id,
      email: i.email,
      name: i.name || 'Invited Admin (Pending Onboard)',
      phone: i.phoneNumber || 'N/A',
      college: i.collegeId,
      status: i.status,
      isInvite: true,
      expiresAt: i.expiresAt
    }))
  ]

  const filteredAdmins = combinedAdmins.filter(a => {
    const search = adminSearch.toLowerCase()
    const matchesSearch = a.email.toLowerCase().includes(search) || a.name.toLowerCase().includes(search)
    let matchesStatus = true
    if (adminStatusFilter !== 'All') {
      if (adminStatusFilter === 'Active') matchesStatus = a.status === 'Active'
      else if (adminStatusFilter === 'Inactive') matchesStatus = a.status === 'Inactive'
      else if (adminStatusFilter === 'Invited') matchesStatus = a.isInvite
    }
    return matchesSearch && matchesStatus
  })

  // Expiry stats below Dashboard
  const expiringSoonColleges = colleges.filter(c => {
    const days = getRemainingDays(c.subscription?.expiresAt)
    if (days === 'Expired') return true
    const numericDays = parseInt(days)
    return !isNaN(numericDays) && numericDays <= 30
  })

  const recentColleges = [...colleges].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
  const recentLogs = [...auditLogs].slice(0, 8)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans antialiased text-gray-800">
      {/* SaaS Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-md">
            <FiShield className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-950">ProjX SaaS Platform Manager</h1>
            <p className="text-xs text-gray-400 font-medium">SaaS Level Super Administration</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-700">{user?.name || 'SaaS Admin'}</p>
            <p className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-block font-bold mt-0.5">PLATFORM ADMIN</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-100 hover:border-red-200 px-3.5 py-2 rounded-xl transition-all"
          >
            <FiLogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </header>

      {/* Main SaaS Administration Area */}
      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Minimal SaaS Navigation Sidebar */}
        <aside className="w-full lg:w-64 bg-white border-r border-gray-200 p-4 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible shrink-0">
          <button
            onClick={() => { setActiveTab('overview'); setSelectedCollege(null); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap lg:w-full
              ${activeTab === 'overview' ? 'bg-slate-900 text-white shadow-md' : 'text-gray-600 hover:bg-slate-50'}`}
          >
            <FiGrid className="w-4 h-4 shrink-0" />
            Dashboard
          </button>
          <button
            onClick={() => { setActiveTab('colleges'); setSelectedCollege(null); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap lg:w-full
              ${activeTab === 'colleges' ? 'bg-slate-900 text-white shadow-md' : 'text-gray-600 hover:bg-slate-50'}`}
          >
            <FiPlus className="w-4 h-4 shrink-0" />
            Colleges
          </button>
          <button
            onClick={() => { setActiveTab('admins'); setSelectedCollege(null); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap lg:w-full
              ${activeTab === 'admins' ? 'bg-slate-900 text-white shadow-md' : 'text-gray-600 hover:bg-slate-50'}`}
          >
            <FiUsers className="w-4 h-4 shrink-0" />
            College Admins
          </button>
          <button
            onClick={() => { setActiveTab('subscriptions'); setSelectedCollege(null); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap lg:w-full
              ${activeTab === 'subscriptions' ? 'bg-slate-900 text-white shadow-md' : 'text-gray-600 hover:bg-slate-50'}`}
          >
            <FiDollarSign className="w-4 h-4 shrink-0" />
            Subscription Management
          </button>
          <button
            onClick={() => { setActiveTab('logs'); setSelectedCollege(null); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap lg:w-full
              ${activeTab === 'logs' ? 'bg-slate-900 text-white shadow-md' : 'text-gray-600 hover:bg-slate-50'}`}
          >
            <FiActivity className="w-4 h-4 shrink-0" />
            Audit Logs
          </button>
          <button
            onClick={() => { setActiveTab('settings'); setSelectedCollege(null); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap lg:w-full
              ${activeTab === 'settings' ? 'bg-slate-900 text-white shadow-md' : 'text-gray-600 hover:bg-slate-50'}`}
          >
            <FiSettings className="w-4 h-4 shrink-0" />
            System Settings
          </button>
        </aside>

        {/* Action Panel Container */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* SaaS Dashboard Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow transition-all">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Total Colleges</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <p className="text-3xl font-bold text-slate-900">{stats.totalColleges}</p>
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow transition-all">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 block">Active Colleges</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <p className="text-3xl font-bold text-emerald-600">{stats.activeColleges}</p>
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow transition-all">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 block">Inactive Colleges</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <p className="text-3xl font-bold text-red-600">{stats.inactiveColleges}</p>
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow transition-all">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 block">Trial Colleges</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <p className="text-3xl font-bold text-indigo-600">{stats.trialColleges}</p>
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow transition-all">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 block">Expired Subscriptions</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <p className="text-3xl font-bold text-rose-600">{stats.expiredSubscriptions}</p>
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow transition-all">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 block">Pending Renewals</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <p className="text-3xl font-bold text-amber-600">{stats.pendingRenewals}</p>
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow transition-all">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total College Admins</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <p className="text-3xl font-bold text-slate-800">{stats.totalCollegeAdmins}</p>
                  </div>
                </div>
              </div>

              {/* Sub-tables: Expiring Subscriptions, Recent Colleges, Recent Logs */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Subscription Expiring Soon Table */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <FiAlertTriangle className="text-amber-500 w-4 h-4" />
                    <h3 className="text-sm font-bold text-slate-800">Subscriptions Expiring Soon (or Expired)</h3>
                  </div>
                  <div className="overflow-x-auto flex-1">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-400 font-bold uppercase">
                          <th className="py-2.5 px-3">College</th>
                          <th className="py-2.5 px-3">Plan</th>
                          <th className="py-2.5 px-3">Expiry Date</th>
                          <th className="py-2.5 px-3 text-right">Remaining</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-700">
                        {expiringSoonColleges.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="py-4 text-center text-gray-400">All subscriptions are up-to-date.</td>
                          </tr>
                        ) : (
                          expiringSoonColleges.map(c => (
                            <tr key={c._id} className="hover:bg-gray-50/55">
                              <td className="py-2 px-3 font-semibold text-slate-900">{c.name}</td>
                              <td className="py-2 px-3">{c.subscription?.planId?.name || 'N/A'}</td>
                              <td className="py-2 px-3 text-gray-500">{new Date(c.subscription?.expiresAt).toLocaleDateString()}</td>
                              <td className="py-2 px-3 text-right font-bold">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] ${getRemainingDays(c.subscription?.expiresAt) === 'Expired' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                                  {getRemainingDays(c.subscription?.expiresAt)}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recent Colleges Table */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <FiPlus className="text-slate-800 w-4 h-4" />
                    <h3 className="text-sm font-bold text-slate-800">Recently Registered Colleges</h3>
                  </div>
                  <div className="overflow-x-auto flex-1">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-400 font-bold uppercase">
                          <th className="py-2.5 px-3">College Name</th>
                          <th className="py-2.5 px-3">Code</th>
                          <th className="py-2.5 px-3">Created</th>
                          <th className="py-2.5 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-700">
                        {recentColleges.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="py-4 text-center text-gray-400">No colleges registered.</td>
                          </tr>
                        ) : (
                          recentColleges.map(c => (
                            <tr key={c._id} className="hover:bg-gray-50/55">
                              <td className="py-2 px-3 font-semibold text-slate-900">{c.name}</td>
                              <td className="py-2 px-3">{c.code}</td>
                              <td className="py-2 px-3 text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                              <td className="py-2 px-3 text-right">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                  {c.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recent System Audit Logs */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm lg:col-span-2">
                  <div className="flex items-center gap-2 mb-3">
                    <FiActivity className="text-slate-800 w-4 h-4" />
                    <h3 className="text-sm font-bold text-slate-800">Recent Administrative Logs</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-400 font-bold uppercase">
                          <th className="py-2.5 px-3">Action</th>
                          <th className="py-2.5 px-3">Details</th>
                          <th className="py-2.5 px-3">Actor</th>
                          <th className="py-2.5 px-3 text-right">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-600">
                        {recentLogs.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="py-4 text-center text-gray-400">No recent logs recorded.</td>
                          </tr>
                        ) : (
                          recentLogs.map(log => (
                            <tr key={log._id || Math.random()} className="hover:bg-gray-50/50">
                              <td className="py-2 px-3 font-semibold text-slate-900">{log.action}</td>
                              <td className="py-2 px-3 text-gray-500">{log.details}</td>
                              <td className="py-2 px-3">{log.actor?.email || 'System'}</td>
                              <td className="py-2 px-3 text-right text-[10px] text-gray-400">{new Date(log.timestamp).toLocaleString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: COLLEGES */}
          {activeTab === 'colleges' && !selectedCollege && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Colleges Management</h2>
                  <p className="text-xs text-gray-500">Add, edit, view detail profile and archive institution accounts</p>
                </div>
                <button
                  onClick={() => handleOpenCollegeModal('create')}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-sm transition-all"
                >
                  <FiPlus className="w-4 h-4" />
                  Add College
                </button>
              </div>

              {/* Filters */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center">
                <div className="w-full sm:flex-1 relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <FiShield className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search by college name or code..."
                    value={collegeSearch}
                    onChange={(e) => setCollegeSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-slate-400"
                  />
                </div>
                <div className="w-full sm:w-48">
                  <select
                    value={collegeStatusFilter}
                    onChange={(e) => setCollegeStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-slate-400 bg-white"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Deactivated">Archived</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase">
                        <th className="p-4">Code</th>
                        <th className="p-4">Name</th>
                        <th className="p-4">Official Email</th>
                        <th className="p-4">Phone</th>
                        <th className="p-4">Subscription</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredColleges.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="p-8 text-center text-gray-400">No colleges match criteria.</td>
                        </tr>
                      ) : (
                        filteredColleges.map((c) => (
                          <tr key={c._id} className="hover:bg-gray-50/50">
                            <td className="p-4 font-bold text-slate-900">{c.code}</td>
                            <td className="p-4 font-semibold text-slate-800">{c.name}</td>
                            <td className="p-4 text-gray-600">{c.email}</td>
                            <td className="p-4 text-gray-600">{c.phone}</td>
                            <td className="p-4 font-medium text-slate-700">
                              {c.subscription?.planId?.name || 'No Plan'} ({getRemainingDays(c.subscription?.expiresAt)})
                            </td>
                            <td className="p-4">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold
                                ${c.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                  : c.status === 'Deactivated' ? 'bg-red-50 text-red-600 border border-red-100'
                                  : 'bg-gray-50 text-gray-600 border border-gray-100'}`}>
                                {c.status === 'Deactivated' ? 'Archived' : c.status}
                              </span>
                            </td>
                            <td className="p-4 text-right space-x-2 whitespace-nowrap">
                              <button
                                onClick={() => setSelectedCollege(c)}
                                className="text-slate-500 hover:text-slate-900 border border-gray-100 hover:border-gray-300 bg-gray-50 px-2 py-1 rounded-lg font-semibold inline-flex items-center gap-1.5"
                                title="View Details"
                              >
                                <FiEye className="w-3 h-3" />
                                View
                              </button>
                              <button
                                onClick={() => handleOpenCollegeModal('edit', c)}
                                className="text-slate-600 hover:text-slate-800 border border-gray-100 hover:border-gray-300 bg-gray-50 p-1.5 rounded-lg inline-flex"
                                title="Edit College"
                              >
                                <FiEdit className="w-3.5 h-3.5" />
                              </button>
                              {c.status === 'Active' ? (
                                <button
                                  onClick={() => handleSuspendSubscription(c._id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-100 px-2 py-1 rounded-lg font-semibold"
                                >
                                  Suspend
                                </button>
                              ) : (
                                c.status !== 'Deactivated' && (
                                  <button
                                    onClick={() => handleActivateSubscription(c._id)}
                                    className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg font-semibold"
                                  >
                                    Activate
                                  </button>
                                )
                              )}
                              {c.status !== 'Deactivated' && (
                                <button
                                  onClick={() => handleArchiveCollege(c._id)}
                                  className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-100 px-2 py-1 rounded-lg font-semibold"
                                  title="Archive College"
                                >
                                  Archive
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* College Details View Sub-Page */}
          {activeTab === 'colleges' && selectedCollege && (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedCollege(null)}
                  className="text-slate-500 hover:text-slate-900 border border-gray-200 bg-white hover:bg-gray-50 px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1.5"
                >
                  <FiX className="w-4 h-4" />
                  Back to Directory
                </button>
                <span className="text-gray-300">/</span>
                <span className="text-xs font-bold text-gray-500 uppercase">{selectedCollege.name} Profile</span>
              </div>

              {/* Info panel */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedCollege.name} Details</h3>
                  <p className="text-xs text-gray-400">Institutional record index</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs border-t border-b border-gray-100 py-6">
                  <div>
                    <span className="font-bold text-gray-400 uppercase tracking-wider block mb-1">College Code</span>
                    <span className="text-sm font-bold text-slate-800">{selectedCollege.code}</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-400 uppercase tracking-wider block mb-1">Slug</span>
                    <span className="text-sm text-slate-700 font-mono">{selectedCollege.slug}</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-400 uppercase tracking-wider block mb-1">Official Email</span>
                    <span className="text-sm text-slate-700">{selectedCollege.email}</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-400 uppercase tracking-wider block mb-1">Phone Number</span>
                    <span className="text-sm text-slate-700">{selectedCollege.phone}</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-400 uppercase tracking-wider block mb-1">Website</span>
                    <a href={`http://${selectedCollege.website}`} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline">{selectedCollege.website || 'N/A'}</a>
                  </div>
                  <div>
                    <span className="font-bold text-gray-400 uppercase tracking-wider block mb-1">College Status</span>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold mt-1 text-[10px]
                      ${selectedCollege.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        : selectedCollege.status === 'Deactivated' ? 'bg-red-50 text-red-600 border border-red-100'
                        : 'bg-gray-50 text-gray-600 border border-gray-100'}`}>
                      {selectedCollege.status === 'Deactivated' ? 'Archived' : selectedCollege.status}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-400 uppercase tracking-wider block mb-1">Subscription Plan</span>
                    <span className="text-sm font-semibold text-slate-800">{selectedCollege.subscription?.planId?.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-400 uppercase tracking-wider block mb-1">Expiry Date</span>
                    <span className="text-sm text-slate-700">{new Date(selectedCollege.subscription?.expiresAt).toLocaleString()} ({getRemainingDays(selectedCollege.subscription?.expiresAt)})</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-400 uppercase tracking-wider block mb-1">Assigned Admin</span>
                    <span className="text-sm font-semibold text-slate-800">{selectedCollege.adminUser ? `${selectedCollege.adminUser.name} (${selectedCollege.adminUser.email})` : 'No Admin Assigned'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-400 uppercase tracking-wider block mb-1">Created Date</span>
                    <span className="text-sm text-gray-500">{new Date(selectedCollege.createdAt).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-400 uppercase tracking-wider block mb-1">Updated Date</span>
                    <span className="text-sm text-gray-500">{new Date(selectedCollege.updatedAt).toLocaleString()}</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-bold text-gray-400 uppercase tracking-wider block mb-1">Physical Address</span>
                    <span className="text-sm text-slate-700">{selectedCollege.address}</span>
                  </div>
                </div>

                {/* History Timeline */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <FiClock className="w-4 h-4 text-gray-400" />
                    Subscription History Timeline
                  </h4>
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-400 font-bold uppercase">
                          <th className="p-3">Plan</th>
                          <th className="p-3">ActionPerformed</th>
                          <th className="p-3">Expiry Date</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Payment</th>
                          <th className="p-3 text-right">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-700">
                        {!selectedCollege.subscriptionHistory || selectedCollege.subscriptionHistory.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="p-4 text-center text-gray-400">No logs on subscription adjustments.</td>
                          </tr>
                        ) : (
                          selectedCollege.subscriptionHistory.map((h, i) => (
                            <tr key={i} className="hover:bg-gray-50/50">
                              <td className="p-3 font-semibold text-slate-800">{h.planId?.name || 'Same Plan'}</td>
                              <td className="p-3 capitalize">{h.action}</td>
                              <td className="p-3 text-gray-500">{new Date(h.expiresAt).toLocaleDateString()}</td>
                              <td className="p-3">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${h.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                  {h.status}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${h.paymentStatus === 'Paid' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                                  {h.paymentStatus || 'Paid'}
                                </span>
                              </td>
                              <td className="p-3 text-right text-gray-400 text-[10px]">{new Date(h.timestamp).toLocaleString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COLLEGE ADMINS */}
          {activeTab === 'admins' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">College Admins Directory</h2>
                  <p className="text-xs text-gray-500">Invite, configure settings, reset passwords, transfer, and suspend admins</p>
                </div>
                <button
                  onClick={() => handleOpenAdminModal('create')}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-sm transition-all"
                >
                  <FiSend className="w-4 h-4" />
                  Invite Admin
                </button>
              </div>

              {/* Temporary password alert banner */}
              {tempPasswordAlert && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 px-5 py-4 rounded-2xl flex items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <FiAlertTriangle className="text-amber-600 w-5 h-5 shrink-0" />
                    <div>
                      <p className="font-bold text-sm">Temporary Password Generated</p>
                      <p className="text-xs text-amber-700 mt-0.5">Please copy this password now. It will not be shown again: <strong className="bg-white border border-amber-300 px-2 py-1 rounded select-all font-mono tracking-wider ml-1">{tempPasswordAlert}</strong></p>
                    </div>
                  </div>
                  <button onClick={() => setTempPasswordAlert(null)} className="text-amber-500 hover:text-amber-800 font-bold text-sm px-2 py-1 border border-amber-200 hover:border-amber-300 rounded-lg">Dismiss</button>
                </div>
              )}

              {/* Filters */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center">
                <div className="w-full sm:flex-1 relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <FiUsers className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search admin users by name or email address..."
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-slate-400"
                  />
                </div>
                <div className="w-full sm:w-48">
                  <select
                    value={adminStatusFilter}
                    onChange={(e) => setAdminStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-slate-400 bg-white"
                  >
                    <option value="All">All Admins</option>
                    <option value="Active">Active Users</option>
                    <option value="Inactive">Inactive Users</option>
                    <option value="Invited">Invited / Pending</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase">
                        <th className="p-4">Name</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">College</th>
                        <th className="p-4">Phone</th>
                        <th className="p-4">Admin Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredAdmins.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="p-8 text-center text-gray-400">No admins match filters.</td>
                        </tr>
                      ) : (
                        filteredAdmins.map((a) => (
                          <tr key={a.id} className="hover:bg-gray-50/50">
                            <td className="p-4 font-semibold text-slate-800">{a.name}</td>
                            <td className="p-4 text-gray-600 font-mono">{a.email}</td>
                            <td className="p-4 font-bold text-slate-700">{a.college?.name || 'N/A'}</td>
                            <td className="p-4 text-gray-600">{a.phone}</td>
                            <td className="p-4">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold border
                                ${a.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                  : a.status === 'Inactive' ? 'bg-red-50 text-red-700 border-red-100'
                                  : a.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-100'
                                  : a.status === 'Resent' ? 'bg-blue-50 text-blue-700 border-blue-100'
                                  : a.status === 'Cancelled' ? 'bg-rose-50 text-rose-700 border-rose-100'
                                  : 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                                {a.status}
                              </span>
                            </td>
                            <td className="p-4 text-right space-x-2 whitespace-nowrap">
                              <button
                                onClick={() => handleOpenAdminModal('edit', a)}
                                className="text-slate-600 hover:text-slate-900 border border-gray-100 hover:border-gray-200 bg-gray-50 p-1.5 rounded-lg inline-flex"
                                title="Edit Admin Details"
                              >
                                <FiEdit className="w-3.5 h-3.5" />
                              </button>
                              
                              {a.isInvite ? (
                                <>
                                  {a.status !== 'Cancelled' && (
                                    <>
                                      <button
                                        onClick={() => handleResendAdminInvite(a.id)}
                                        className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold"
                                      >
                                        Resend
                                      </button>
                                      <button
                                        onClick={() => handleSoftDeleteAdmin(a.id)}
                                        className="text-red-500 hover:text-red-700 text-xs font-semibold"
                                      >
                                        Cancel
                                      </button>
                                    </>
                                  )}
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleToggleAdminStatus(a.id)}
                                    className={`text-xs font-semibold ${a.status === 'Active' ? 'text-amber-600 hover:text-amber-800' : 'text-emerald-600 hover:text-emerald-800'}`}
                                  >
                                    {a.status === 'Active' ? 'Deactivate' : 'Activate'}
                                  </button>
                                  <button
                                    onClick={() => handleGenerateTempPassword(a.id)}
                                    className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold"
                                  >
                                    Generate Temp Pass
                                  </button>
                                  <button
                                    onClick={() => handleOpenTransferModal(a.college?._id)}
                                    className="text-orange-600 hover:text-orange-800 text-xs font-semibold"
                                  >
                                    Transfer
                                  </button>
                                  <button
                                    onClick={() => handleSoftDeleteAdmin(a.id)}
                                    className="text-red-500 hover:text-red-700 text-xs font-semibold"
                                    title="Deactivate Admin"
                                  >
                                    Archive
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
            </div>
          )}

          {/* TAB 4: SUBSCRIPTIONS */}
          {activeTab === 'subscriptions' && (
            <div className="space-y-8">
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Subscription Management</h2>
                  <p className="text-xs text-gray-500">Monitor tenant billing plans, remaining days, upgrade, suspend, and renew agreements</p>
                </div>

                {/* College Billing Table */}
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase">
                          <th className="p-4">College</th>
                          <th className="p-4">Billing Plan</th>
                          <th className="p-4">Expiry Date</th>
                          <th className="p-4">Remaining Days</th>
                          <th className="p-4">Payment</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {colleges.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="p-8 text-center text-gray-400">No colleges registered.</td>
                          </tr>
                        ) : (
                          colleges.map((c) => (
                            <tr key={c._id} className="hover:bg-gray-50/50">
                              <td className="p-4 font-bold text-slate-800">{c.name}</td>
                              <td className="p-4 font-semibold text-indigo-700">{c.subscription?.planId?.name || 'N/A'}</td>
                              <td className="p-4 text-gray-600">{c.subscription?.expiresAt ? new Date(c.subscription.expiresAt).toLocaleDateString() : 'N/A'}</td>
                              <td className="p-4 font-semibold">{getRemainingDays(c.subscription?.expiresAt)}</td>
                              <td className="p-4">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] border
                                  ${c.subscription?.paymentStatus === 'Paid' ? 'bg-blue-50 text-blue-700 border-blue-100'
                                    : c.subscription?.paymentStatus === 'Failed' ? 'bg-red-50 text-red-700 border-red-100'
                                    : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                  {c.subscription?.paymentStatus || 'Paid'}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] border
                                  ${c.subscription?.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                    : c.subscription?.status === 'trialing' ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                    : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                                  {c.subscription?.status}
                                </span>
                              </td>
                              <td className="p-4 text-right space-x-2 whitespace-nowrap">
                                <button
                                  onClick={() => handleOpenSubscriptionModal(c)}
                                  className="text-slate-800 hover:text-black border border-gray-200 hover:border-gray-300 bg-white px-2.5 py-1 rounded-lg font-semibold text-[11px]"
                                >
                                  Modify Agreement
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Sub-Section: Plans Directory */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">SaaS Subscription Plans</h3>
                    <p className="text-xs text-gray-500">Configure global subscription catalog rates, features, and database constraints</p>
                  </div>
                  <button
                    onClick={() => handleOpenPlanModal('create')}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2 px-3.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <FiPlus className="w-3.5 h-3.5" />
                    New Billing Plan
                  </button>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase">
                          <th className="p-4">Plan Name</th>
                          <th className="p-4">Price</th>
                          <th className="p-4">Billing Cycle</th>
                          <th className="p-4">Max Students</th>
                          <th className="p-4">Max Groups</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {plans.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="p-8 text-center text-gray-400">No subscription plans created.</td>
                          </tr>
                        ) : (
                          plans.map((p) => (
                            <tr key={p._id} className="hover:bg-gray-50/50">
                              <td className="p-4 font-bold text-slate-800">{p.name}</td>
                              <td className="p-4 font-semibold text-gray-800">${p.price}</td>
                              <td className="p-4 capitalize text-gray-600">{p.billingCycle}</td>
                              <td className="p-4 text-gray-600">{p.maxStudents.toLocaleString()}</td>
                              <td className="p-4 text-gray-600">{p.maxGroups.toLocaleString()}</td>
                              <td className="p-4">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold border
                                  ${p.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                  {p.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <button
                                  onClick={() => handleOpenPlanModal('edit', p)}
                                  className="text-slate-600 hover:text-slate-900 border border-gray-100 hover:border-gray-200 bg-gray-50 p-1.5 rounded-lg inline-flex"
                                  title="Edit Plan Constraints"
                                >
                                  <FiEdit className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: SYSTEM AUDIT LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Platform System Audit Logs</h2>
                <p className="text-xs text-gray-500">View detailed administrative actions history, system logins, and operational telemetry</p>
              </div>

              {/* Advanced Filter Toolbar */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Filter by College</label>
                  <select
                    value={logCollegeFilter}
                    onChange={(e) => setLogCollegeFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-slate-400 bg-white"
                  >
                    <option value="">All Institutions</option>
                    {colleges.map(c => (
                      <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Filter by Action</label>
                  <select
                    value={logActionFilter}
                    onChange={(e) => setLogActionFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-slate-400 bg-white"
                  >
                    <option value="">All Actions</option>
                    <option value="COLLEGE_CREATED">College Created</option>
                    <option value="COLLEGE_UPDATED">College Updated</option>
                    <option value="COLLEGE_ARCHIVED">College Archived</option>
                    <option value="ADMIN_CREATED">Admin Invitation</option>
                    <option value="ADMIN_PASSWORD_RESET">Password Reset</option>
                    <option value="SUBSCRIPTION_CHANGED">Subscription Changed</option>
                    <option value="SYSTEM_SETTINGS_UPDATED">Settings Updated</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Filter by Date</label>
                  <input
                    type="date"
                    value={logDateFilter}
                    onChange={(e) => setLogDateFilter(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-slate-400 bg-white font-sans"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleApplyLogFilters}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2 rounded-xl text-center"
                  >
                    Apply Filters
                  </button>
                  <button
                    onClick={handleClearLogFilters}
                    className="px-3 border border-gray-200 hover:bg-gray-50 font-semibold text-xs py-2 rounded-xl text-center text-gray-500"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Table list */}
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase sticky top-0">
                        <th className="p-4">Action</th>
                        <th className="p-4">Scope College</th>
                        <th className="p-4">Details Log</th>
                        <th className="p-4">Performed By</th>
                        <th className="p-4 text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-slate-700">
                      {auditLogs.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="p-8 text-center text-gray-400">No action logs found.</td>
                        </tr>
                      ) : (
                        auditLogs.map((log) => (
                          <tr key={log._id || Math.random()} className="hover:bg-gray-50/50">
                            <td className="p-4 font-bold text-slate-900">{log.action}</td>
                            <td className="p-4 font-semibold text-slate-800">{log.collegeId?.name || 'Platform Level'}</td>
                            <td className="p-4 text-gray-500">{log.details}</td>
                            <td className="p-4 font-semibold">
                              {log.actor?.name || 'System'} <span className="text-[10px] text-gray-400 font-normal">({log.actor?.email || 'automated'})</span>
                            </td>
                            <td className="p-4 text-right text-[10px] text-gray-400 font-mono whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SYSTEM SETTINGS */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Global SaaS Settings</h2>
                <p className="text-xs text-gray-400">Manage backend authentication limits, support contact emails, default trial billing rates, and SMTP dispatchers</p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
                
                {/* Section 1: SMTP Config */}
                <div className="space-y-3">
                  <h3 className="font-bold text-slate-800 border-b border-gray-100 pb-2 uppercase tracking-wider text-[10px]">SMTP Dispatcher Credentials</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">SMTP Host</label>
                      <input
                        type="text"
                        value={settingsForm.smtpHost}
                        onChange={(e) => setSettingsForm({ ...settingsForm, smtpHost: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-slate-400"
                        placeholder="smtp.mailtrap.io"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">SMTP Port</label>
                      <input
                        type="text"
                        value={settingsForm.smtpPort}
                        onChange={(e) => setSettingsForm({ ...settingsForm, smtpPort: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-slate-400"
                        placeholder="2525"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">SMTP Username</label>
                      <input
                        type="text"
                        value={settingsForm.smtpUser}
                        onChange={(e) => setSettingsForm({ ...settingsForm, smtpUser: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">SMTP Password</label>
                      <input
                        type="password"
                        value={settingsForm.smtpPass}
                        onChange={(e) => setSettingsForm({ ...settingsForm, smtpPass: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-slate-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Platform Configurations */}
                <div className="space-y-3">
                  <h3 className="font-bold text-slate-800 border-b border-gray-100 pb-2 uppercase tracking-wider text-[10px]">Administrative Configurations</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Support Contact Email</label>
                      <input
                        type="email"
                        value={settingsForm.supportEmail}
                        onChange={(e) => setSettingsForm({ ...settingsForm, supportEmail: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-slate-400"
                        placeholder="support@projx.com"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">JWT Key Expiry</label>
                      <input
                        type="text"
                        value={settingsForm.jwtExpiresIn}
                        onChange={(e) => setSettingsForm({ ...settingsForm, jwtExpiresIn: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-slate-400"
                        placeholder="7d"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Default Onboarding Plan</label>
                      <select
                        value={settingsForm.defaultSubscriptionPlanId}
                        onChange={(e) => setSettingsForm({ ...settingsForm, defaultSubscriptionPlanId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-slate-400 bg-white"
                      >
                        <option value="">No Default Plan</option>
                        {plans.map(p => (
                          <option key={p._id} value={p._id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Maintenance Toggle */}
                <div className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
                  <div>
                    <label className="font-bold text-slate-800 block">Maintenance Flag (SaaS Lock)</label>
                    <span className="text-[10px] text-gray-400">Put platform completely offline for system adjustments</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settingsForm.maintenanceMode}
                    onChange={(e) => setSettingsForm({ ...settingsForm, maintenanceMode: e.target.checked })}
                    className="w-5 h-5 accent-slate-900 rounded"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl shadow transition-all text-xs"
                >
                  {loading ? 'Saving Platform Config…' : 'Save SaaS Configurations'}
                </button>

              </form>
            </div>
          )}

        </main>
      </div>

      {/* College Modal (Create/Edit) */}
      {collegeModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl relative border border-gray-100">
            <button
              onClick={() => setCollegeModal({ open: false, mode: 'create', data: null })}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-5 h-5" />
            </button>
            
            <h2 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">
              {collegeModal.mode === 'create' ? 'Register Institution Tenant' : 'Edit College Parameters'}
            </h2>

            <form onSubmit={handleSaveCollege} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">College Name</label>
                <input
                  value={collegeForm.name}
                  onChange={(e) => setCollegeForm({ ...collegeForm, name: e.target.value })}
                  placeholder="e.g. BITS Pilani"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-slate-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">College Code</label>
                  <input
                    value={collegeForm.code}
                    onChange={(e) => setCollegeForm({ ...collegeForm, code: e.target.value })}
                    placeholder="e.g. BITS"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-slate-400 uppercase"
                    disabled={collegeModal.mode === 'edit'}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">URL Tenant Slug</label>
                  <input
                    value={collegeForm.slug}
                    onChange={(e) => setCollegeForm({ ...collegeForm, slug: e.target.value })}
                    placeholder="e.g. bits-pilani"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-slate-400"
                    disabled={collegeModal.mode === 'edit'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Official Email</label>
                  <input
                    type="email"
                    value={collegeForm.email}
                    onChange={(e) => setCollegeForm({ ...collegeForm, email: e.target.value })}
                    placeholder="admin@bits.edu"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-slate-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Contact Phone</label>
                  <input
                    value={collegeForm.phone}
                    onChange={(e) => setCollegeForm({ ...collegeForm, phone: e.target.value })}
                    placeholder="+91-..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-slate-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Campuses Location Address</label>
                <textarea
                  value={collegeForm.address}
                  onChange={(e) => setCollegeForm({ ...collegeForm, address: e.target.value })}
                  placeholder="Street details..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-slate-400 h-16"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Website URL</label>
                  <input
                    value={collegeForm.website}
                    onChange={(e) => setCollegeForm({ ...collegeForm, website: e.target.value })}
                    placeholder="www.bits.edu"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Record Status</label>
                  <select
                    value={collegeForm.status}
                    onChange={(e) => setCollegeForm({ ...collegeForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-slate-400 bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Deactivated">Archived</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl transition-all shadow text-center"
              >
                {loading ? 'Saving tenant...' : 'Commit Tenant configurations'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Admin Invite Modal */}
      {adminModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative border border-gray-100">
            <button
              onClick={() => setAdminModal({ open: false, mode: 'create', data: null })}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-5 h-5" />
            </button>

            <h2 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">
              {adminModal.mode === 'create' ? 'Invite College Admin' : 'Edit Admin Details'}
            </h2>

            <form onSubmit={handleSaveAdmin} className="space-y-4 text-xs">
              {adminModal.mode === 'create' && (
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Associate College</label>
                  <select
                    value={adminForm.collegeId}
                    onChange={(e) => setAdminForm({ ...adminForm, collegeId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-slate-400 bg-white"
                    required
                  >
                    <option value="">Select Organization</option>
                    {colleges.filter(c => c.status === 'Active').map(c => (
                      <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Official Email Address</label>
                <input
                  type="email"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  placeholder="admin@college.edu"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-slate-400"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Administrator Full Name</label>
                <input
                  type="text"
                  value={adminForm.name}
                  onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Contact Phone (Optional)</label>
                <input
                  type="text"
                  value={adminForm.phoneNumber}
                  onChange={(e) => setAdminForm({ ...adminForm, phoneNumber: e.target.value })}
                  placeholder="10-digit number"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-slate-400"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl transition-all shadow text-center"
              >
                {loading ? 'Processing...' : 'Generate Onboarding Invitation'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Admin Modal */}
      {transferModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative border border-gray-100">
            <button
              onClick={() => setTransferModal({ open: false, collegeId: null })}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-5 h-5" />
            </button>

            <h2 className="text-sm font-bold text-slate-900 mb-2 uppercase tracking-wider">Transfer College Admin</h2>
            <p className="text-[10px] text-red-500 font-semibold mb-4 leading-relaxed bg-red-50 border border-red-100 p-2.5 rounded-xl">
              ⚠️ Warning: Confirming this action immediately suspends (deactivates) the current active college administrator and registers a new email invitation token.
            </p>

            <form onSubmit={handleTransferAdmin} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">New Administrator Email</label>
                <input
                  type="email"
                  value={transferForm.email}
                  onChange={(e) => setTransferForm({ ...transferForm, email: e.target.value })}
                  placeholder="newadmin@bits.edu"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-slate-400"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow text-center"
              >
                {loading ? 'Transferring administrative rights...' : 'Transfer Admin & Generate Invitation'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modify Subscription Modal */}
      {subscriptionModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative border border-gray-100">
            <button
              onClick={() => setSubscriptionModal({ open: false, college: null })}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-5 h-5" />
            </button>

            <h2 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">
              Modify Subscription Plan for {subscriptionModal.college?.name}
            </h2>

            <form onSubmit={handleUpdateSubscription} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Modification Action</label>
                <select
                  value={subscriptionForm.action}
                  onChange={(e) => setSubscriptionForm({ ...subscriptionForm, action: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-slate-400 bg-white"
                >
                  <option value="upgrade">Upgrade Subscription Plan</option>
                  <option value="downgrade">Downgrade Subscription Plan</option>
                  <option value="renew">Renew Subscription Term</option>
                  <option value="activate">Activate Subscription (Un-suspend)</option>
                </select>
              </div>

              {(subscriptionForm.action === 'upgrade' || subscriptionForm.action === 'downgrade') && (
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Select Billing Plan</label>
                  <select
                    value={subscriptionForm.planId}
                    onChange={(e) => setSubscriptionForm({ ...subscriptionForm, planId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-slate-400 bg-white"
                    required
                  >
                    <option value="">Select Plan</option>
                    {plans.map(p => (
                      <option key={p._id} value={p._id}>{p.name} - ${p.price} ({p.billingCycle})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">New Expiry Date</label>
                <input
                  type="date"
                  value={subscriptionForm.expiresAt}
                  onChange={(e) => setSubscriptionForm({ ...subscriptionForm, expiresAt: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-slate-400 bg-white"
                  required={subscriptionForm.action === 'renew'}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Payment Settlement Status</label>
                <select
                  value={subscriptionForm.paymentStatus}
                  onChange={(e) => setSubscriptionForm({ ...subscriptionForm, paymentStatus: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-slate-400 bg-white"
                >
                  <option value="Paid">Settled (Paid)</option>
                  <option value="Unpaid">Outstanding (Unpaid)</option>
                  <option value="Pending">Processing (Pending)</option>
                  <option value="Failed">Declined (Failed)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl transition-all shadow text-center"
              >
                {loading ? 'Processing subscription change...' : 'Save Subscription Details'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Plan Modal (Create/Edit Plans) */}
      {planModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative border border-gray-100">
            <button
              onClick={() => setPlanModal({ open: false, mode: 'create', data: null })}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-5 h-5" />
            </button>

            <h2 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">
              {planModal.mode === 'create' ? 'Create SaaS Billing Plan' : 'Edit Plan Configuration'}
            </h2>

            <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Plan Name</label>
                <input
                  type="text"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  placeholder="e.g. Gold Tier"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-slate-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Rate Price (USD)</label>
                  <input
                    type="number"
                    value={planForm.price}
                    onChange={(e) => setPlanForm({ ...planForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-slate-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Billing Cycle</label>
                  <select
                    value={planForm.billingCycle}
                    onChange={(e) => setPlanForm({ ...planForm, billingCycle: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-slate-400 bg-white"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Max Student limit</label>
                  <input
                    type="number"
                    value={planForm.maxStudents}
                    onChange={(e) => setPlanForm({ ...planForm, maxStudents: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-slate-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Max Group limit</label>
                  <input
                    type="number"
                    value={planForm.maxGroups}
                    onChange={(e) => setPlanForm({ ...planForm, maxGroups: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-slate-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Features (comma-separated list)</label>
                <input
                  type="text"
                  value={planForm.features}
                  onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })}
                  placeholder="Feature A, Feature B..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={planForm.isActive}
                  onChange={(e) => setPlanForm({ ...planForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-slate-900"
                />
                <label className="font-semibold text-slate-800">Plan is Active & Selectable</label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl transition-all shadow text-center"
              >
                {loading ? 'Saving Billing Plan...' : 'Save Plan Details'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
