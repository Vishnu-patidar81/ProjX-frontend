import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import PageLayout from '../../components/common/PageLayout'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { FiPlus, FiCalendar, FiDownload, FiClock, FiCheck, FiX } from 'react-icons/fi'
import Modal from '../../components/shared/Modal'

export default function BookMeeting() {
  const { user }  = useAuth()
  const [meetings, setMeetings]     = useState([])
  const [group, setGroup]           = useState(null)
  const [loading, setLoading]       = useState(true)
  const [showSchedule, setShowSchedule] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  // Reject Modal State
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')

  const [form, setForm] = useState({
    scheduledDate: '', scheduledTime: '', mode: 'Offline', meetingLink: '', 
    building: '', roomNumber: '', venue: '', agenda: '',
  })

  const location = useLocation()
  const navigate = useNavigate()
  const { highlightId } = location.state || {}

  const fetchData = async () => {
    try {
      const [gRes, mRes] = await Promise.allSettled([
        api.get('/groups/my-group'),
        api.get('/meetings/my-meetings'),
      ])
      if (gRes.status === 'fulfilled') setGroup(gRes.value.data.group)
      if (mRes.status === 'fulfilled') setMeetings(mRes.value.data.meetings || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    if (highlightId && meetings.length > 0) {
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
  }, [highlightId, meetings])

  const isLeader = group?.leader?._id === user?._id

  const handleSchedule = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/meetings/schedule', form)
      toast.success('Meeting requested!')
      setShowSchedule(false)
      setForm({ scheduledDate: '', scheduledTime: '', mode: 'Offline', meetingLink: '', building: '', roomNumber: '', venue: '', agenda: '' })
      fetchData()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') } finally { setSubmitting(false) }
  }

  const handleAccept = async (meetingId) => {
    try {
      await api.put(`/meetings/${meetingId}/accept`)
      toast.success('Meeting accepted')
      fetchData()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to accept') }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) return toast.error('Rejection reason is required')
    try {
      await api.put(`/meetings/${rejectModal}/reject`, { reason: rejectionReason })
      toast.success('Meeting rejected')
      setRejectModal(null)
      setRejectionReason('')
      fetchData()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to reject') }
  }

  const downloadPDF = async (meetingId, meetingNum) => {
    try {
      const { data } = await api.get(`/meetings/${meetingId}/pdf`)
      const byteChars = atob(data.pdfBase64)
      const bytes = new Uint8Array(byteChars.length).map((_, i) => byteChars.charCodeAt(i))
      const blob  = new Blob([bytes], { type: 'application/pdf' })
      const url   = URL.createObjectURL(blob)
      const a     = document.createElement('a')
      a.href = url; a.download = data.filename; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('PDF not available yet') }
  }

  const statusBadge = (s) => ({
    pending: 'badge-pending bg-yellow-50 text-yellow-800 border border-yellow-200',
    accepted: 'badge-approved bg-green-50 text-green-700',
    scheduled: 'badge-info bg-blue-50 text-blue-700',
    completed: 'badge-approved bg-green-100 text-green-800 font-bold border border-green-200',
    cancelled: 'badge-rejected',
    rejected: 'badge-rejected bg-red-50 text-red-700',
  })[s] || 'badge-info'

  if (loading) return <PageLayout><div className="card animate-pulse h-48" /></PageLayout>

  const canSchedule = isLeader && group?.guideStatus === 'accepted'

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1>Meetings</h1>
          {canSchedule && (
            <button onClick={() => setShowSchedule(true)} className="btn-primary flex items-center gap-2">
              <FiPlus className="w-4 h-4" /> Schedule Meeting
            </button>
          )}
        </div>

        {!group ? (
          <div className="card text-center py-10 text-gray-400">No group found.</div>
        ) : !canSchedule && isLeader ? (
          <div className="card bg-yellow-50 border-yellow-200">
            <p className="text-yellow-800 text-sm">
              ⚠️ Meetings can be scheduled only after a guide has accepted your group.
            </p>
          </div>
        ) : null}

        {meetings.length === 0 ? (
          <div className="card text-center py-10">
            <FiCalendar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">No meetings scheduled yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {meetings.map((m) => (
              <div key={m._id} id={`card-${m._id}`} className="card">
                <div className="flex flex-col sm:flex-row items-stretch justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3>Meeting #{m.meetingNumber}</h3>
                      <span className={`${statusBadge(m.status)} capitalize px-2 py-0.5 rounded text-xs font-semibold`}>{m.status}</span>
                      {m.createdByRole && (
                         <span className="text-[10px] text-gray-400 uppercase">Created by {m.createdByRole}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(m.scheduledDate).toDateString()} at {m.scheduledTime} · {m.mode}
                    </p>
                    
                    {m.mode === 'Offline' && (
                      <p className="text-xs text-gray-500 mt-1">
                        <strong>Location:</strong> {m.venue}, Building {m.building}, Room {m.roomNumber}
                      </p>
                    )}
                    {m.mode === 'Online' && m.meetingLink && (
                      <p className="text-xs mt-1">
                        <a href={m.meetingLink} target="_blank" rel="noreferrer"
                          className="text-primary-600 hover:underline">🔗 Join Link</a>
                      </p>
                    )}

                    <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded border border-gray-100">
                      <strong>Agenda:</strong> {m.agenda}
                    </p>

                    {m.status === 'rejected' && m.rejectionReason && (
                      <p className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded">
                        <strong>Rejection Reason:</strong> {m.rejectionReason}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 mt-2 sm:mt-0 w-full sm:w-auto justify-start sm:justify-end shrink-0">
                    {/* If Guide created it and it's pending, leader can Accept/Reject */}
                    {m.status === 'pending' && m.createdByRole === 'guide' && isLeader && (
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button onClick={() => handleAccept(m._id)} className="btn-success flex-1 sm:flex-none flex items-center justify-center gap-1 py-1.5 px-3 text-xs">
                          <FiCheck className="w-3 h-3" /> Accept
                        </button>
                        <button onClick={() => setRejectModal(m._id)} className="btn-danger flex-1 sm:flex-none flex items-center justify-center gap-1 py-1.5 px-3 text-xs">
                          <FiX className="w-3 h-3" /> Reject
                        </button>
                      </div>
                    )}
                    
                    {/* If PDF is generated (which implies status=completed) */}
                    {m.pdfGenerated && (
                      <button onClick={() => downloadPDF(m._id, m.meetingNumber)}
                        className="btn-secondary flex-1 sm:flex-none flex items-center justify-center gap-1 text-xs py-1.5 px-3">
                        <FiDownload className="w-3 h-3" /> Download Report
                      </button>
                    )}
                  </div>
                </div>

                {/* Status Messages */}
                {m.status === 'accepted' && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                    <FiClock className="w-3 h-3" /> Waiting for meeting completion
                  </div>
                )}
                
                {m.status === 'completed' && !m.pdfGenerated && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                    <FiClock className="w-3 h-3" /> Awaiting meeting report submission from guide
                  </div>
                )}

                {/* Report summary */}
                {m.meetingReport?.isReportFilled && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Meeting Report Snippet</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div><p className="text-xs text-gray-400">Discussion</p><p>{m.meetingReport.discussion}</p></div>
                      <div><p className="text-xs text-gray-400">Outcomes</p><p>{m.meetingReport.outcomes}</p></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      <Modal isOpen={showSchedule} onClose={() => setShowSchedule(false)} title="Schedule Meeting">
        <form onSubmit={handleSchedule} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input type="date" value={form.scheduledDate}
                onChange={e => setForm({...form, scheduledDate: e.target.value})}
                className="input-field" required min={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
              <input type="time" value={form.scheduledTime}
                onChange={e => setForm({...form, scheduledTime: e.target.value})}
                className="input-field" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mode *</label>
            <select value={form.mode} onChange={e => setForm({...form, mode: e.target.value})}
              className="input-field">
              <option>Offline</option>
              <option>Online</option>
            </select>
          </div>
          
          {form.mode === 'Offline' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-1">Venue *</label>
                <input value={form.venue} onChange={e => setForm({...form, venue: e.target.value})}
                  className="input-field text-sm" placeholder="Campus A" required />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-1">Building *</label>
                <input value={form.building} onChange={e => setForm({...form, building: e.target.value})}
                  className="input-field text-sm" placeholder="CS Block" required />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-1">Room *</label>
                <input value={form.roomNumber} onChange={e => setForm({...form, roomNumber: e.target.value})}
                  className="input-field text-sm" placeholder="401" required />
              </div>
            </div>
          )}

          {form.mode === 'Online' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link *</label>
              <input value={form.meetingLink} onChange={e => setForm({...form, meetingLink: e.target.value})}
                placeholder="https://meet.google.com/..." className="input-field" required />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agenda *</label>
            <textarea value={form.agenda} onChange={e => setForm({...form, agenda: e.target.value})}
              rows={3} placeholder="Topics to discuss…" className="input-field resize-none" required />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Requesting…' : 'Request Meeting'}
          </button>
        </form>
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={!!rejectModal} onClose={() => { setRejectModal(null); setRejectionReason('') }} title="Reject Meeting">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Please provide a reason for rejecting this meeting request.</p>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="input-field resize-none"
            rows={3}
            placeholder="E.g., Time conflict, need to reschedule..."
          />
          <div className="flex gap-2">
            <button onClick={handleReject} className="btn-danger flex-1">Confirm Reject</button>
            <button onClick={() => { setRejectModal(null); setRejectionReason('') }} className="btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </Modal>
    </PageLayout>
  )
}
