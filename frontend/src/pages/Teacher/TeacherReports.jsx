import { useState, useEffect } from 'react'
import PageLayout from '../../components/common/PageLayout'
import api from '../../services/api'
import { FiFileText, FiDownload, FiCheckCircle, FiAlertCircle, FiEye } from 'react-icons/fi'
import { format } from 'date-fns'
import Modal from '../../components/shared/Modal'

export default function TeacherReports() {
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)
  const [detailsModal, setDetailsModal] = useState(null)

  const fetchMeetings = async () => {
    try {
      const { data } = await api.get('/meetings/all')
      // Only show meetings that have a report filled
      const reportedMeetings = (data.meetings || []).filter(m => m.meetingReport && m.meetingReport.isReportFilled)
      setMeetings(reportedMeetings)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMeetings()
  }, [])

  const downloadPDF = async (meetingId, meetingNum) => {
    try {
      const { data } = await api.get(`/meetings/${meetingId}/pdf`)
      const byteChars = atob(data.pdfBase64)
      const bytes = new Uint8Array(byteChars.length).map((_, i) => byteChars.charCodeAt(i))
      const blob = new Blob([bytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = data.filename
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('PDF not available')
    }
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1>Meeting Reports Verification</h1>
        </div>

        <div className="card">
          <p className="text-sm text-gray-500 mb-4">
            System automatically verifies guide reports matching the generated verification code with the digital signature securely.
          </p>
          
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-50 rounded animate-pulse" />)}
            </div>
          ) : meetings.length === 0 ? (
            <div className="text-center py-12">
              <FiFileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">No meeting reports submitted by guides yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Group & Project</th>
                    <th className="px-4 py-3">Guide Details</th>
                    <th className="px-4 py-3">Verification Info</th>
                    <th className="px-4 py-3">Submission Time</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 rounded-tr-lg">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {meetings.map(m => {
                    const r = m.meetingReport
                    const isVerified = m.verificationStatus === 'Verified'
                    const isLegacy = m.verificationStatus === 'Legacy Report'
                    const isFailed = m.verificationStatus === 'Verification Failed'

                    return (
                      <tr key={m._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-800">{m.group?.groupName || '—'}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[200px]" title={m.group?.projectDetails?.title}>
                            {m.group?.projectDetails?.title || 'No Project'}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-700">{m.guide?.name || '—'}</p>
                          <p className="text-xs text-gray-500">ID: {m.guide?.facultyId || 'N/A'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded inline-block">
                            {r.verificationCode || r.guideSignatureOtp || 'N/A'}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {r.reportSubmittedAt ? format(new Date(r.reportSubmittedAt), 'PPp') : 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          {isVerified ? (
                            <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-semibold">
                              <FiCheckCircle className="w-3.5 h-3.5" /> Verified Guide Report
                            </span>
                          ) : isFailed ? (
                            <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-semibold">
                              <FiAlertCircle className="w-3.5 h-3.5" /> Verification Failed
                            </span>
                          ) : (
                            <span className="text-gray-500 bg-gray-100 px-2 py-1 rounded text-xs font-semibold">
                              {m.verificationStatus}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {m.pdfGenerated && (
                              <button onClick={() => downloadPDF(m._id, m.meetingNumber)}
                                className="text-primary-600 hover:text-primary-800 p-2 rounded hover:bg-primary-50 transition-colors"
                                title="Download PDF">
                                <FiDownload className="w-4 h-4" />
                              </button>
                            )}
                            <button onClick={() => setDetailsModal(m)}
                              className="text-indigo-600 hover:text-indigo-800 p-2 rounded hover:bg-indigo-50 transition-colors"
                              title="View Details">
                              <FiEye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Report Details Modal */}
      <Modal isOpen={!!detailsModal} onClose={() => setDetailsModal(null)}
        title={`Report Details — Meeting #${detailsModal?.meetingNumber} (${detailsModal?.group?.groupName || ''})`}>
        {detailsModal && (
          <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase">Project Title</p>
              <p className="font-semibold text-gray-900 dark:text-white mt-0.5">{detailsModal.group?.projectDetails?.title || 'No Project'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase">Guide Name</p>
                <p className="font-medium mt-0.5">{detailsModal.guide?.name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase">Date & Time</p>
                <p className="mt-0.5">{new Date(detailsModal.scheduledDate).toDateString()} at {detailsModal.scheduledTime}</p>
              </div>
            </div>
            <hr className="border-gray-150 dark:border-gray-800" />
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase">Discussion</p>
              <p className="whitespace-pre-line leading-relaxed mt-0.5">{detailsModal.meetingReport.discussion}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase">Outcomes</p>
              <p className="whitespace-pre-line leading-relaxed mt-0.5">{detailsModal.meetingReport.outcomes}</p>
            </div>
            {detailsModal.meetingReport.actionItems && (
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase">Action Items</p>
                <p className="whitespace-pre-line leading-relaxed mt-0.5">{detailsModal.meetingReport.actionItems}</p>
              </div>
            )}
            <hr className="border-gray-150 dark:border-gray-800" />
            
            {/* Attendance Summary & Details */}
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700 space-y-1">
              <p className="text-xs text-gray-400 font-semibold uppercase mb-1">Attendance Summary</p>
              <p className="text-sm font-medium">Total Members: {detailsModal.group?.members?.length || 0}</p>
              <p className="text-sm font-medium">Present: {detailsModal.meetingReport.membersPresent?.length || 0}</p>
              <p className="text-sm font-medium">Absent: {Math.max(0, (detailsModal.group?.members?.length || 0) - (detailsModal.meetingReport.membersPresent?.length || 0))}</p>
              <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                Attendance: {detailsModal.group?.members?.length > 0 ? Math.round(((detailsModal.meetingReport.membersPresent?.length || 0) / detailsModal.group.members.length) * 100) : 0}%
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase mb-1.5">Present Students</p>
                <div className="flex flex-wrap gap-1.5">
                  {detailsModal.group?.members?.filter(mem => detailsModal.meetingReport.membersPresent?.includes(mem.enrollmentNumber)).map(p => (
                    <span key={p.enrollmentNumber} className="text-xs bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-full border border-indigo-150 dark:border-indigo-800 font-medium">
                      {p.name} ({p.enrollmentNumber})
                    </span>
                  )) || detailsModal.meetingReport.membersPresent?.map(enrollment => (
                    <span key={enrollment} className="text-xs bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-full border border-indigo-150 dark:border-indigo-800 font-medium">
                      {enrollment}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase mb-1.5">Absent Students</p>
                <div className="flex flex-wrap gap-1.5">
                  {detailsModal.group?.members?.filter(mem => !detailsModal.meetingReport.membersPresent?.includes(mem.enrollmentNumber)).map(p => (
                    <span key={p.enrollmentNumber} className="text-xs bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 px-2.5 py-1 rounded-full border border-red-150 dark:border-red-800 font-medium">
                      {p.name} ({p.enrollmentNumber})
                    </span>
                  ))}
                  {(!detailsModal.group?.members || detailsModal.group.members.filter(mem => !detailsModal.meetingReport.membersPresent?.includes(mem.enrollmentNumber)).length === 0) && (
                    <span className="text-xs text-gray-400 italic">None</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700 font-mono text-xs flex flex-col gap-1">
              <p className="text-gray-500">Verification Code: {detailsModal.meetingReport.verificationCode || 'N/A'}</p>
              <p className="text-gray-500">Signature OTP: {detailsModal.meetingReport.guideSignatureOtp || 'N/A'}</p>
            </div>
            <button onClick={() => setDetailsModal(null)} className="btn-primary w-full mt-2">Close</button>
          </div>
        )}
      </Modal>
    </PageLayout>
  )
}
