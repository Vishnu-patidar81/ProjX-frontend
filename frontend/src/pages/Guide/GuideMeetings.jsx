import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import PageLayout from '../../components/common/PageLayout'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { FiFileText, FiDownload, FiCalendar, FiPlus, FiClock, FiCheck, FiX, FiCheckCircle } from 'react-icons/fi'
import Modal from '../../components/shared/Modal'

export default function GuideMeetings() {
  const [meetings, setMeetings]   = useState([])
  const [groups, setGroups]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [reportModal, setReportModal] = useState(null)
  const [submitting, setSubmitting]   = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)
  
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')

  const [reportForm, setReportForm] = useState({
    discussion: '', outcomes: '', actionItems: '', nextMeetingDate: '',
    membersPresent: [],
  })

  const [scheduleForm, setScheduleForm] = useState({
    groupId: '', scheduledDate: '', scheduledTime: '', mode: 'Offline', meetingLink: '', 
    building: '', roomNumber: '', venue: '', agenda: ''
  })

  const location = useLocation()
  const navigate = useNavigate()
  const { highlightId } = location.state || {}

  const fetchMeetingsAndGroups = async () => {
    try {
      const [mRes, gRes] = await Promise.allSettled([
        api.get('/meetings/guide-meetings'),
        api.get('/groups/guide-groups')
      ])
      if (mRes.status === 'fulfilled') setMeetings(mRes.value.data.meetings || [])
      if (gRes.status === 'fulfilled') setGroups(gRes.value.data.groups || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchMeetingsAndGroups() }, [])

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

  const openReportModal = (meeting) => {
    setReportModal(meeting)
    const groupMembers = meeting.group?.members || []
    setReportForm({
      discussion: '', outcomes: '', actionItems: '', nextMeetingDate: '',
      membersPresent: groupMembers.map(m => m.enrollmentNumber) 
    })
  }

  const handleReportSubmit = async (e) => {
    e.preventDefault()
    if (!reportModal) return
    if (reportForm.membersPresent.length === 0) {
      return toast.error('Please select at least one present member.')
    }
    setSubmitting(true)
    try {
      await api.put(`/meetings/${reportModal._id}/report`, {
        discussion: reportForm.discussion,
        outcomes: reportForm.outcomes,
        actionItems: reportForm.actionItems,
        nextMeetingDate: reportForm.nextMeetingDate,
        membersPresent: reportForm.membersPresent
      })
      toast.success('Report submitted and PDF generated!')
      setReportModal(null)
      fetchMeetingsAndGroups()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') } finally { setSubmitting(false) }
  }

  const handleAccept = async (meetingId) => {
    try {
      await api.put(`/meetings/${meetingId}/accept`)
      toast.success('Meeting accepted!')
      fetchMeetingsAndGroups()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to accept') }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) return toast.error('Reason is required')
    try {
      await api.put(`/meetings/${rejectModal}/reject`, { reason: rejectionReason })
      toast.success('Meeting rejected!')
      setRejectModal(null)
      setRejectionReason('')
      fetchMeetingsAndGroups()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to reject') }
  }

  const handleComplete = async (meetingId) => {
    try {
      await api.put(`/meetings/${meetingId}/complete`)
      toast.success('Meeting marked as completed!')
      fetchMeetingsAndGroups()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to mark completed. Is it past the scheduled date?') }
  }

  const handleScheduleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/meetings/schedule', scheduleForm)
      toast.success('Meeting scheduled successfully!')
      setShowSchedule(false)
      setScheduleForm({ groupId: '', scheduledDate: '', scheduledTime: '', mode: 'Offline', meetingLink: '', building: '', roomNumber: '', venue: '', agenda: '' })
      fetchMeetingsAndGroups()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to schedule') } finally { setSubmitting(false) }
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
    } catch { toast.error('PDF not available') }
  }

  const toggleMember = (memberId) => {
    setReportForm(prev => ({
      ...prev,
      membersPresent: prev.membersPresent.includes(memberId)
        ? prev.membersPresent.filter(id => id !== memberId)
        : [...prev.membersPresent, memberId],
    }))
  }

  const statusBadge = (s) => ({
    pending: 'badge-pending bg-yellow-50 text-yellow-800 border border-yellow-200',
    accepted: 'badge-approved bg-green-50 text-green-700',
    scheduled: 'badge-info bg-blue-50 text-blue-700',
    completed: 'badge-approved bg-green-100 text-green-800 font-bold border border-green-200',
    cancelled: 'badge-rejected',
    rejected: 'badge-rejected bg-red-50 text-red-700',
  })[s] || 'badge-info'

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1>Meetings & Reports</h1>
          {groups.length > 0 && (
            <button onClick={() => setShowSchedule(true)} className="btn-primary flex items-center gap-2">
              <FiPlus className="w-4 h-4" /> Schedule Meeting
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="card animate-pulse h-28" />)}</div>
        ) : meetings.length === 0 ? (
          <div className="card text-center py-12">
            <FiCalendar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">No meetings scheduled yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {meetings.map((m) => (
              <div key={m._id} id={`card-${m._id}`} className="card">
                <div className="flex flex-col sm:flex-row items-stretch justify-between gap-4 mb-2">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3>Meeting #{m.meetingNumber}</h3>
                      <span className={`${statusBadge(m.status)} capitalize px-2 py-0.5 rounded text-xs font-semibold`}>{m.status}</span>
                      {m.createdByRole && (
                         <span className="text-[10px] text-gray-400 uppercase">Created by {m.createdByRole}</span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-1">{m.group?.groupName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {new Date(m.scheduledDate).toDateString()} at {m.scheduledTime} · {m.mode}
                    </p>
                    
                    {m.mode === 'Offline' && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <strong>Location:</strong> {m.venue}, Building {m.building}, Room {m.roomNumber}
                      </p>
                    )}
                    {m.mode === 'Online' && m.meetingLink && (
                      <p className="text-xs mt-1">
                        <a href={m.meetingLink} target="_blank" rel="noreferrer"
                          className="text-primary-600 dark:text-primary-400 hover:underline">🔗 Join Link</a>
                      </p>
                    )}

                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-100 dark:border-gray-800">
                      <strong>Agenda:</strong> {m.agenda}
                    </p>

                    {m.status === 'rejected' && m.rejectionReason && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-2 bg-red-50 dark:bg-red-950/30 p-2 rounded">
                        <strong>Rejection Reason:</strong> {m.rejectionReason}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 mt-2 sm:mt-0 w-full sm:w-auto justify-start sm:justify-end shrink-0">
                    {/* PDF Download if generated */}
                    {m.pdfGenerated && (
                      <button onClick={() => downloadPDF(m._id, m.meetingNumber)}
                        className="btn-secondary flex-1 sm:flex-none flex items-center justify-center gap-1 text-xs py-1.5 px-3">
                        <FiDownload className="w-3 h-3" /> PDF
                      </button>
                    )}
                    
                    {/* Approval logic for student-created meetings */}
                    {m.status === 'pending' && m.createdByRole === 'student' && (
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button onClick={() => handleAccept(m._id)} className="btn-success flex-1 sm:flex-none flex items-center justify-center gap-1 text-xs py-1.5 px-3 rounded-lg font-medium">
                          <FiCheck className="w-3 h-3" /> Accept
                        </button>
                        <button onClick={() => setRejectModal(m._id)} className="btn-danger flex-1 sm:flex-none flex items-center justify-center gap-1 text-xs py-1.5 px-3 rounded-lg font-medium">
                          <FiX className="w-3 h-3" /> Reject
                        </button>
                      </div>
                    )}

                    {/* Mark Completed */}
                    {m.status === 'accepted' && (
                      <button onClick={() => handleComplete(m._id)}
                        className="btn-outline border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 flex-1 sm:flex-none flex items-center justify-center gap-1 text-xs py-1.5 px-3">
                        <FiCheckCircle className="w-3 h-3" /> Mark Completed
                      </button>
                    )}

                    {/* Submit Report Form */}
                    {m.status === 'completed' && !m.meetingReport?.isReportFilled && (
                      <button onClick={() => openReportModal(m)}
                        className="btn-primary flex-1 sm:flex-none flex items-center justify-center gap-1 text-xs py-1.5 px-3">
                        <FiFileText className="w-3 h-3" /> Submit Report
                      </button>
                    )}
                  </div>
                </div>

                {m.status === 'accepted' && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-blue-600">
                    <FiClock className="w-3 h-3" /> Scheduled. Mark as completed after the meeting ends to submit report.
                  </div>
                )}

                {m.meetingReport?.isReportFilled && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400 font-semibold uppercase mb-2">Report Summary</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><p className="text-xs text-gray-400">Discussion</p><p>{m.meetingReport.discussion}</p></div>
                      <div><p className="text-xs text-gray-400">Outcomes</p><p>{m.meetingReport.outcomes}</p></div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-3">
                      <div>
                        <p className="text-xs text-gray-400 font-semibold uppercase mb-1">Attendance Summary</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                          <div>Total Members: <span className="font-semibold text-gray-800 dark:text-gray-200">{m.group?.members?.length || 0}</span></div>
                          <div>Present: <span className="font-semibold text-green-600 dark:text-green-400">{m.meetingReport.membersPresent?.length || 0}</span></div>
                          <div>Absent: <span className="font-semibold text-red-600 dark:text-red-400">{Math.max(0, (m.group?.members?.length || 0) - (m.meetingReport.membersPresent?.length || 0))}</span></div>
                          <div>Attendance: <span className="font-semibold text-primary-600 dark:text-primary-400">{m.group?.members?.length > 0 ? Math.round(((m.meetingReport.membersPresent?.length || 0) / m.group.members.length) * 100) : 0}%</span></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-400 font-semibold uppercase mb-1.5">Present Students</p>
                          <div className="flex flex-wrap gap-1.5">
                            {m.group?.members?.filter(mem => m.meetingReport.membersPresent?.includes(mem.enrollmentNumber)).map(p => (
                              <span key={p.enrollmentNumber} className="text-xs bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 px-2.5 py-0.5 rounded-full border border-green-100 dark:border-green-800">
                                {p.name} ({p.enrollmentNumber})
                              </span>
                            )) || m.meetingReport.membersPresent?.map(enrollment => (
                              <span key={enrollment} className="text-xs bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 px-2.5 py-0.5 rounded-full border border-green-100 dark:border-green-800">
                                {enrollment}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-gray-400 font-semibold uppercase mb-1.5">Absent Students</p>
                          <div className="flex flex-wrap gap-1.5">
                            {m.group?.members?.filter(mem => !m.meetingReport.membersPresent?.includes(mem.enrollmentNumber)).map(p => (
                              <span key={p.enrollmentNumber} className="text-xs bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 px-2.5 py-0.5 rounded-full border border-red-100 dark:border-red-800">
                                {p.name} ({p.enrollmentNumber})
                              </span>
                            ))}
                            {(!m.group?.members || m.group.members.filter(mem => !m.meetingReport.membersPresent?.includes(mem.enrollmentNumber)).length === 0) && (
                              <span className="text-xs text-gray-400 italic">None</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-col gap-1">
                      <p className="text-xs text-gray-400">
                        Verification Code: <span className="font-mono text-gray-700 dark:text-gray-200">{m.meetingReport.verificationCode || m.meetingReport.guideSignatureOtp || 'N/A'}</span>
                      </p>
                      <p className="text-xs text-gray-400">
                        Status: <span className={`font-semibold ${m.verificationStatus === 'Verified' ? 'text-green-600' : m.verificationStatus === 'Verification Failed' ? 'text-red-600' : 'text-gray-500'}`}>{m.verificationStatus || 'Unknown'}</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report Modal */}
      <Modal isOpen={!!reportModal} onClose={() => setReportModal(null)}
        title={`Meeting Report — #${reportModal?.meetingNumber}`} size="lg">
        {reportModal && (
          <form onSubmit={handleReportSubmit} className="space-y-4">
            <p className="text-sm text-gray-500">
              Fill the post-meeting report. A digital signature OTP will be auto-generated on submission.
            </p>

            {/* Attendance Selection UI */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Group Members (Attendance) *
              </label>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2.5">
                {reportModal.group?.members?.map(m => {
                  const isChecked = reportForm.membersPresent.includes(m.enrollmentNumber);
                  return (
                    <label key={m._id} className="flex items-center gap-3 cursor-pointer text-sm text-gray-700 dark:text-gray-300 select-none">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          const updated = isChecked
                            ? reportForm.membersPresent.filter(enroll => enroll !== m.enrollmentNumber)
                            : [...reportForm.membersPresent, m.enrollmentNumber];
                          setReportForm({ ...reportForm, membersPresent: updated });
                        }}
                        className="w-4.5 h-4.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 transition-colors"
                      />
                      <span>
                        <span className="font-medium">{m.name}</span>{' '}
                        <span className="text-gray-400 font-mono text-xs">({m.enrollmentNumber})</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discussion *</label>
              <textarea value={reportForm.discussion} onChange={e => setReportForm({...reportForm, discussion: e.target.value})}
                rows={3} placeholder="Topics discussed in the meeting…" className="input-field resize-none" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Outcomes *</label>
              <textarea value={reportForm.outcomes} onChange={e => setReportForm({...reportForm, outcomes: e.target.value})}
                rows={3} placeholder="Key outcomes and decisions…" className="input-field resize-none" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action Items</label>
              <textarea value={reportForm.actionItems} onChange={e => setReportForm({...reportForm, actionItems: e.target.value})}
                rows={2} placeholder="Tasks assigned to students…" className="input-field resize-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Next Meeting Date (optional)</label>
              <input type="date" value={reportForm.nextMeetingDate}
                onChange={e => setReportForm({...reportForm, nextMeetingDate: e.target.value})}
                className="input-field" />
            </div>

            <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
              ✍️ Submitting this form will auto-generate a digital signature OTP and create a downloadable PDF report.
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Submitting & Generating PDF…' : 'Submit Report'}
            </button>
          </form>
        )}
      </Modal>

      {/* Schedule Modal */}
      <Modal isOpen={showSchedule} onClose={() => setShowSchedule(false)} title="Schedule Meeting">
        <form onSubmit={handleScheduleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Group *</label>
            <select
              value={scheduleForm.groupId}
              onChange={e => setScheduleForm({...scheduleForm, groupId: e.target.value})}
              className="input-field"
              required
            >
              <option value="">Select a Group</option>
              {groups.map(g => (
                <option key={g._id} value={g._id}>{g.groupName}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input type="date" value={scheduleForm.scheduledDate}
                onChange={e => setScheduleForm({...scheduleForm, scheduledDate: e.target.value})}
                className="input-field" required min={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
              <input type="time" value={scheduleForm.scheduledTime}
                onChange={e => setScheduleForm({...scheduleForm, scheduledTime: e.target.value})}
                className="input-field" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mode *</label>
            <select value={scheduleForm.mode} onChange={e => setScheduleForm({...scheduleForm, mode: e.target.value})}
              className="input-field">
              <option>Offline</option>
              <option>Online</option>
            </select>
          </div>
          
          {scheduleForm.mode === 'Offline' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-1">Venue *</label>
                <input value={scheduleForm.venue} onChange={e => setScheduleForm({...scheduleForm, venue: e.target.value})}
                  className="input-field text-sm" placeholder="Campus A" required />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-1">Building *</label>
                <input value={scheduleForm.building} onChange={e => setScheduleForm({...scheduleForm, building: e.target.value})}
                  className="input-field text-sm" placeholder="CS Block" required />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-1">Room *</label>
                <input value={scheduleForm.roomNumber} onChange={e => setScheduleForm({...scheduleForm, roomNumber: e.target.value})}
                  className="input-field text-sm" placeholder="401" required />
              </div>
            </div>
          )}

          {scheduleForm.mode === 'Online' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link</label>
              <input value={scheduleForm.meetingLink} onChange={e => setScheduleForm({...scheduleForm, meetingLink: e.target.value})}
                placeholder="https://meet.google.com/..." className="input-field" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agenda *</label>
            <textarea value={scheduleForm.agenda} onChange={e => setScheduleForm({...scheduleForm, agenda: e.target.value})}
              rows={3} placeholder="Topics to discuss…" className="input-field resize-none" required />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Scheduling…' : 'Schedule Meeting'}
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
