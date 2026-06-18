import { useState, useEffect } from 'react'
import PageLayout from '../../components/common/PageLayout'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { FiUserCheck, FiZap } from 'react-icons/fi'
import Modal from '../../components/shared/Modal'

export default function GuideAssign() {
  const [groups, setGroups]   = useState([])
  const [guides, setGuides]   = useState([])
  const [loading, setLoading] = useState(true)
  const [assignModal, setAssignModal] = useState(null)
  const [summaryModal, setSummaryModal] = useState(null)
  const [selectedGuide, setSelectedGuide] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    try {
      const [gRes, guRes] = await Promise.allSettled([
        api.get('/projects/all?status=approved'),
        api.get('/guides/available'),
      ])
      if (gRes.status === 'fulfilled') setGroups(gRes.value.data.groups || [])
      if (guRes.status === 'fulfilled') setGuides(guRes.value.data.guides || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleManualAssign = async () => {
    if (!selectedGuide || !assignModal) return toast.error('Select a guide')
    setSubmitting(true)
    try {
      await api.put('/guides/assign', { groupId: assignModal._id, guideId: selectedGuide })
      toast.success('Guide assigned!')
      setAssignModal(null); setSelectedGuide('')
      fetchData()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') } finally { setSubmitting(false) }
  }

  const handleAutoAssignAll = async () => {
    if (!window.confirm(`Auto-assign guides for all unassigned groups?`)) return
    setSubmitting(true)
    try {
      const { data } = await api.post(`/guides/auto-assign-all`)
      setSummaryModal(data.summary)
      fetchData()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') } finally { setSubmitting(false) }
  }

  const guideStatusBadge = (s) => ({
    not_assigned: 'badge-info', pending_consent: 'badge-pending',
    accepted: 'badge-approved', rejected: 'badge-rejected',
  })[s] || 'badge-info'

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1>Guide Assignment</h1>
            <p className="text-sm text-gray-500">
              Showing all approved projects ready for guide assignment.
            </p>
          </div>
          <button 
            onClick={handleAutoAssignAll} 
            disabled={submitting || groups.length === 0}
            className="btn-primary flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 font-semibold"
          >
            🚀 Auto Assign All Guides
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">{[1,2].map(i => <div key={i} className="card animate-pulse h-28" />)}</div>
        ) : groups.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-400">No approved projects awaiting guide assignment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map(g => (
              <div key={g._id} className="card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3>{g.groupName}</h3>
                    <p className="text-sm text-gray-500">{g.projectDetails?.title}</p>
                    <p className="text-xs text-gray-400">Domain: {g.projectDetails?.domain}</p>
                  </div>
                  <span className={guideStatusBadge(g.guideStatus)}>
                    {g.guideStatus?.replace('_', ' ')}
                  </span>
                </div>

                {g.guide && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-3 text-sm">
                    <p className="text-xs text-gray-400">Assigned Guide</p>
                    <p className="font-medium">{g.guide.name}</p>
                    <p className="text-xs text-gray-500">{g.guide.email}</p>
                  </div>
                )}

                {/* Only show assignment buttons if guide not yet accepted */}
                {g.guideStatus !== 'accepted' && (
                  <div className="flex gap-2">
                    <button onClick={() => { setAssignModal(g); setSelectedGuide('') }}
                      className="btn-primary flex items-center gap-2 text-sm">
                      <FiUserCheck className="w-4 h-4" /> Assign Guide
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Available Guides Reference */}
        <div className="card">
          <h2 className="mb-4">Available Guides</h2>
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs text-gray-400 pb-2">Name</th>
                  <th className="text-left text-xs text-gray-400 pb-2">Faculty ID</th>
                  <th className="text-left text-xs text-gray-400 pb-2">Department</th>
                  <th className="text-left text-xs text-gray-400 pb-2">Expertise</th>
                  <th className="text-left text-xs text-gray-400 pb-2">Workload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {guides.map(g => (
                  <tr key={g._id}>
                    <td className="py-2 font-medium">{g.name}</td>
                    <td className="py-2 text-gray-500">{g.facultyId}</td>
                    <td className="py-2 text-gray-500">{g.department || '—'}</td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-1">
                        {g.expertiseDomains?.slice(0,2).map(d => (
                          <span key={d} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{d}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2">
                      <span className={`font-medium ${g.currentWorkload >= 4 ? 'text-red-500' : 'text-green-600'}`}>
                        {g.currentWorkload} group{g.currentWorkload !== 1 ? 's' : ''}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="block md:hidden space-y-3">
            {guides.map(g => (
              <div key={g._id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 text-sm space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">{g.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">ID: {g.facultyId} · {g.department || '—'}</p>
                  </div>
                  <span className={`text-xs font-semibold ${g.currentWorkload >= 4 ? 'text-red-500' : 'text-green-600'}`}>
                    {g.currentWorkload} group{g.currentWorkload !== 1 ? 's' : ''}
                  </span>
                </div>
                {g.expertiseDomains && g.expertiseDomains.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {g.expertiseDomains.slice(0, 3).map(d => (
                      <span key={d} className="text-[10px] bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
                        {d}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Manual Assign Modal */}
      <Modal isOpen={!!assignModal} onClose={() => { setAssignModal(null); setSelectedGuide('') }}
        title={`Assign Guide — ${assignModal?.groupName}`}>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Project Domain: <strong>{assignModal?.projectDetails?.domain}</strong>
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Guide</label>
            <select value={selectedGuide} onChange={e => setSelectedGuide(e.target.value)} className="input-field">
              <option value="">-- Select a guide --</option>
              {guides.map(g => (
                <option key={g._id} value={g._id}>
                  {g.name} ({g.department || 'No dept'}) — {g.currentWorkload} groups
                </option>
              ))}
            </select>
          </div>
          {selectedGuide && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              {guides.filter(g => g._id === selectedGuide).map(g => (
                <div key={g._id}>
                  <p className="font-medium">{g.name}</p>
                  <p className="text-xs text-gray-500">Expertise: {g.expertiseDomains?.join(', ') || 'N/A'}</p>
                  <p className="text-xs text-gray-500">Current load: {g.currentWorkload} groups</p>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={handleManualAssign} disabled={!selectedGuide || submitting} className="btn-primary flex-1">
              {submitting ? 'Assigning…' : 'Assign Guide'}
            </button>
            <button onClick={() => { setAssignModal(null); setSelectedGuide('') }} className="btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </Modal>

      {/* Auto Assign Summary Modal */}
      <Modal isOpen={!!summaryModal} onClose={() => setSummaryModal(null)} title="Auto Assignment Summary">
        {summaryModal && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Groups Processed</span>
                <span className="font-semibold">{summaryModal.processed}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Assigned Successfully</span>
                <span className="font-semibold text-green-600">{summaryModal.assigned}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-gray-600">Failed Assignments</span>
                <span className={`font-semibold ${summaryModal.failed > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {summaryModal.failed}
                </span>
              </div>
            </div>
            <button onClick={() => setSummaryModal(null)} className="btn-primary w-full">Close</button>
          </div>
        )}
      </Modal>
    </PageLayout>
  )
}
