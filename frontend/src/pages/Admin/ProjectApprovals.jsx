import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import PageLayout from '../../components/common/PageLayout'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { FiCheck, FiX, FiFilter } from 'react-icons/fi'
import Modal from '../../components/shared/Modal'

export default function ProjectApprovals() {
  const [groups, setGroups]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('pending')
  const [rejectModal, setRejectModal] = useState(null)
  const [remarks, setRemarks] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const location = useLocation()
  const navigate = useNavigate()
  const { highlightId } = location.state || {}

  const fetchGroups = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/projects/all?status=${filter}`)
      setGroups(data.groups || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchGroups() }, [filter])

  useEffect(() => {
    if (highlightId && groups.length > 0) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`card-${highlightId}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          element.classList.add('highlight-active')
          navigate(location.pathname, { replace: true, state: {} })
        }
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [highlightId, groups])

  const handleApprove = async (groupId, title) => {
    if (!window.confirm(`Approve project "${title}"?`)) return
    setSubmitting(true)
    try {
      await api.put(`/projects/${groupId}/approve`, { remarks: 'Project approved by admin' })
      toast.success('Project approved!')
      fetchGroups()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') } finally { setSubmitting(false) }
  }

  const handleReject = async () => {
    if (!rejectModal || !remarks) return toast.error('Remarks required')
    setSubmitting(true)
    try {
      await api.put(`/projects/${rejectModal._id}/reject`, { remarks })
      toast.success('Project rejected')
      setRejectModal(null); setRemarks('')
      fetchGroups()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') } finally { setSubmitting(false) }
  }

  const statusBadge = (s) => ({
    not_submitted: 'badge-info', pending: 'badge-pending',
    approved: 'badge-approved', rejected: 'badge-rejected',
  })[s] || 'badge-info'

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1>Project Approvals</h1>
          {/* Filter tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 max-w-full scrollbar-none whitespace-nowrap">
            {['pending','approved','rejected'].map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors inline-block
                  ${filter === s ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="card animate-pulse h-36" />)}</div>
        ) : groups.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-400">No {filter} projects found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map(g => (
              <div key={g._id} id={`card-${g._id}`} className="card">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3>{g.projectDetails?.title || 'Untitled'}</h3>
                      <span className={statusBadge(g.projectStatus)}>{g.projectStatus.replace('_',' ')}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Group: {g.groupName} · Leader: {g.leader?.name} ({g.leader?.enrollmentNumber})
                    </p>
                  </div>
                  {g.projectStatus === 'pending' && (
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button onClick={() => handleApprove(g._id, g.projectDetails?.title)}
                        disabled={submitting}
                        className="btn-success flex-1 sm:flex-none flex items-center justify-center gap-1 text-xs py-1.5 px-3">
                        <FiCheck className="w-3 h-3" /> Approve
                      </button>
                      <button onClick={() => setRejectModal(g)}
                        className="btn-danger flex-1 sm:flex-none flex items-center justify-center gap-1 text-xs py-1.5 px-3">
                        <FiX className="w-3 h-3" /> Reject
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm">
                  <div><p className="text-xs text-gray-400">Domain</p><p>{g.projectDetails?.domain}</p></div>
                  <div><p className="text-xs text-gray-400">Category</p><p>{g.projectDetails?.category}</p></div>
                  <div><p className="text-xs text-gray-400">Members</p><p>{g.members?.length}</p></div>
                </div>

                {g.projectDetails?.description && (
                  <p className="text-sm text-gray-600 mt-3 bg-gray-50 rounded p-2">
                    {g.projectDetails.description}
                  </p>
                )}

                {g.projectDetails?.techStack?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {g.projectDetails.techStack.map(t => (
                      <span key={t} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{t}</span>
                    ))}
                  </div>
                )}

                {g.adminRemarks && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                    <strong>Admin Remarks:</strong> {g.adminRemarks}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={!!rejectModal} onClose={() => { setRejectModal(null); setRemarks('') }}
        title={`Reject: ${rejectModal?.projectDetails?.title}`}>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Provide rejection remarks (visible to the student group).</p>
          <textarea value={remarks} onChange={e => setRemarks(e.target.value)}
            rows={4} placeholder="Reason for rejection…" className="input-field resize-none" />
          <div className="flex gap-3">
            <button onClick={handleReject} disabled={submitting || !remarks} className="btn-danger flex-1">
              {submitting ? 'Rejecting…' : 'Reject Project'}
            </button>
            <button onClick={() => { setRejectModal(null); setRemarks('') }} className="btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </Modal>
    </PageLayout>
  )
}
