import { useState, useEffect } from 'react'
import PageLayout from '../../components/common/PageLayout'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { FiCheck, FiX, FiUsers } from 'react-icons/fi'
import Modal from '../../components/shared/Modal'

export default function ConsentForms() {
  const [pending, setPending]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [rejectModal, setRejectModal] = useState(null)
  const [reason, setReason]     = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchPending = async () => {
    try {
      const { data } = await api.get('/guides/pending-consents')
      setPending(data.groups || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchPending() }, [])

  const handleAccept = async (groupId, groupName) => {
    if (!window.confirm(`Accept assignment for "${groupName}"?`)) return
    setSubmitting(true)
    try {
      await api.put(`/guides/accept/${groupId}`)
      toast.success('Assignment accepted!')
      fetchPending()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') } finally { setSubmitting(false) }
  }

  const handleReject = async () => {
    if (!rejectModal || !reason) return toast.error('Please provide a reason')
    setSubmitting(true)
    try {
      await api.put(`/guides/reject/${rejectModal._id}`, { reason })
      toast.success('Assignment rejected')
      setRejectModal(null)
      setReason('')
      fetchPending()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') } finally { setSubmitting(false) }
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        <h1>Pending Group Consents</h1>

        {loading ? (
          <div className="space-y-4">
            {[1,2].map(i => <div key={i} className="card animate-pulse h-36" />)}
          </div>
        ) : pending.length === 0 ? (
          <div className="card text-center py-12">
            <FiUsers className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">No pending assignments. You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map(g => (
              <div key={g._id} className="card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3>{g.groupName}</h3>
                    <p className="text-xs text-gray-400">Academic Year: {g.academicYear}</p>
                  </div>
                  <span className="badge-pending">Awaiting Your Consent</span>
                </div>

                {/* Project details */}
                {g.projectDetails?.title && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
                    <p className="text-sm font-semibold text-gray-700">Project Details</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div><p className="text-xs text-gray-400">Title</p><p>{g.projectDetails.title}</p></div>
                      <div><p className="text-xs text-gray-400">Domain</p><p>{g.projectDetails.domain}</p></div>
                      <div><p className="text-xs text-gray-400">Category</p><p>{g.projectDetails.category}</p></div>
                      <div><p className="text-xs text-gray-400">Tech Stack</p><p>{g.projectDetails.techStack?.join(', ') || '—'}</p></div>
                    </div>
                    <div><p className="text-xs text-gray-400">Description</p>
                      <p className="text-sm text-gray-700">{g.projectDetails.description}</p></div>
                  </div>
                )}

                {/* Members */}
                <div className="mb-4">
                  <p className="text-xs text-gray-400 font-medium uppercase mb-2">Group Members</p>
                  <div className="flex flex-wrap gap-2">
                    {g.members?.map(m => (
                      <span key={m._id} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                        {m.name} {g.leader?._id === m._id && '(Leader)'}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button onClick={() => handleAccept(g._id, g.groupName)}
                    disabled={submitting}
                    className="btn-success flex items-center gap-2">
                    <FiCheck className="w-4 h-4" /> Accept
                  </button>
                  <button onClick={() => setRejectModal(g)}
                    className="btn-danger flex items-center gap-2">
                    <FiX className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      <Modal isOpen={!!rejectModal} onClose={() => { setRejectModal(null); setReason('') }}
        title={`Reject: ${rejectModal?.groupName}`}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Please provide a reason for rejection.</p>
          <textarea value={reason} onChange={e => setReason(e.target.value)}
            rows={3} placeholder="Reason for rejection…" className="input-field resize-none" />
          <div className="flex gap-3">
            <button onClick={handleReject} disabled={submitting || !reason} className="btn-danger flex-1">
              {submitting ? 'Rejecting…' : 'Confirm Reject'}
            </button>
            <button onClick={() => { setRejectModal(null); setReason('') }} className="btn-secondary flex-1">
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </PageLayout>
  )
}
