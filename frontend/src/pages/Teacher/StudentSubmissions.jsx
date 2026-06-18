import { useState, useEffect } from 'react'
import axios from 'axios'
import api from '../../services/api'
import toast from 'react-hot-toast'
import PageLayout from '../../components/common/PageLayout'
import Modal from '../../components/shared/Modal'
import {
  FiFolder, FiUser, FiCalendar, FiClock,
  FiCheckCircle, FiAlertCircle, FiDownload, FiUploadCloud,
  FiPaperclip, FiBookOpen, FiCornerDownRight, FiMessageSquare
} from 'react-icons/fi'
import { format } from 'date-fns'

export default function StudentSubmissions() {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState(null)

  // Review Form States
  const [reviewForm, setReviewForm] = useState({
    status: 'Reviewed',
    review: '',
    comments: '',
  })
  const [reviewFile, setReviewFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchSubmissions = async () => {
    try {
      const { data } = await api.get('/submissions/reviewer?mode=teacher')
      setSubmissions(data.submissions || [])
    } catch (err) {
      toast.error('Failed to load submissions')
    }
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await fetchSubmissions()
      setLoading(false)
    }
    init()
  }, [])

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setReviewFile(e.target.files[0])
    }
  }

  const openReviewModal = (sub) => {
    setSelectedSubmission(sub)
    setReviewForm({
      status: sub.status || 'Reviewed',
      review: sub.review || '',
      comments: sub.comments || '',
    })
    setReviewFile(null)
    setShowReviewModal(true)
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    const reviewToast = toast.loading('Submitting review feedback...')

    try {
      let reviewAttachment = undefined

      // 1. Upload reviewed file to ImageKit if selected
      if (reviewFile) {
        toast.loading('Uploading corrected file to ImageKit...', { id: reviewToast })
        const { data: auth } = await api.get('/submissions/imagekit-auth')

        if (!auth.publicKey || auth.publicKey === 'your_public_key' || auth.publicKey === 'dummy_public_key' || auth.publicKey.startsWith('your_')) {
          // Dev Mock Fallback
          await new Promise(resolve => setTimeout(resolve, 1000))
          reviewAttachment = {
            fileName: reviewFile.name,
            fileUrl: `https://ik.imagekit.io/demo/reviews/mock_${Date.now()}_${reviewFile.name}`,
            imageKitFileId: `file_${Math.random().toString(36).substring(2, 9)}`,
            fileSize: reviewFile.size,
          }
        } else {
          const uploadFormData = new FormData()
          uploadFormData.append('file', reviewFile)
          uploadFormData.append('fileName', reviewFile.name)
          uploadFormData.append('publicKey', auth.publicKey)
          uploadFormData.append('signature', auth.signature)
          uploadFormData.append('expire', auth.expire)
          uploadFormData.append('token', auth.token)
          uploadFormData.append('useUniqueFileName', 'true')
          uploadFormData.append('folder', '/reviews')

          const response = await axios.post(
            'https://upload.imagekit.io/api/v1/files/upload',
            uploadFormData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
          )

          reviewAttachment = {
            fileName: response.data.name,
            fileUrl: response.data.url,
            imageKitFileId: response.data.fileId,
            fileSize: response.data.size,
          }
        }
      }

      toast.loading('Saving review details in database...', { id: reviewToast })

      // 2. Submit review to backend
      await api.put(`/submissions/${selectedSubmission._id}/review`, {
        status: reviewForm.status,
        review: reviewForm.review.trim(),
        comments: reviewForm.comments.trim(),
        reviewAttachment,
      })

      toast.dismiss(reviewToast)
      toast.success('Submission reviewed successfully!')
      setShowReviewModal(false)
      fetchSubmissions()
    } catch (err) {
      toast.dismiss(reviewToast)
      toast.error(err.response?.data?.message || err.message || 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status) => {
    const classes = {
      'Pending Review': 'bg-yellow-100 text-yellow-850 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800',
      'Reviewed': 'bg-blue-100 text-blue-850 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
      'Needs Changes': 'bg-rose-100 text-rose-850 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800',
      'Approved': 'bg-emerald-100 text-emerald-850 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
    }
    const icons = {
      'Pending Review': <FiClock className="w-3.5 h-3.5" />,
      'Reviewed': <FiAlertCircle className="w-3.5 h-3.5" />,
      'Needs Changes': <FiAlertCircle className="w-3.5 h-3.5" />,
      'Approved': <FiCheckCircle className="w-3.5 h-3.5" />,
    }
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${classes[status] || classes['Pending Review']}`}>
        {icons[status] || icons['Pending Review']}
        {status}
      </span>
    )
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Student Submissions (Class Teacher View)</h1>
          <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
            Review academic file uploads from students in your assigned class and section.
          </p>
        </div>

        {/* List submissions */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="card text-center py-16 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl shadow-xs">
            <FiFolder className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-700 dark:text-gray-300">No student files submitted yet</h2>
            <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">
              Submissions made by students in your class for review will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-850/50 text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-150 dark:border-gray-800">
                  <th className="px-6 py-4">Student Info</th>
                  <th className="px-6 py-4">Submission Details</th>
                  <th className="px-6 py-4">Version</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 dark:divide-gray-800 text-sm">
                {submissions.map((sub) => (
                  <tr key={sub._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white">{sub.submittedBy?.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">Roll: {sub.submittedBy?.enrollmentNumber || 'N/A'}</div>
                        <div className="text-xs text-gray-400">Class: {sub.className} - {sub.section}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div>
                        <div className="font-semibold text-gray-850 dark:text-gray-200 truncate">{sub.title}</div>
                        <div className="text-xs text-gray-450 dark:text-gray-400 mt-0.5 line-clamp-1">{sub.description}</div>
                        <div className="mt-2 text-xs">
                          <a
                            href={sub.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-medium text-primary-600 dark:text-primary-400 hover:underline"
                          >
                            <FiPaperclip className="w-3.5 h-3.5" /> {sub.fileName}
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="badge-secondary text-xs uppercase font-medium">
                        v{sub.versions?.length || 1}
                      </span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(sub.status)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openReviewModal(sub)}
                        className="btn-primary text-xs inline-flex items-center gap-1"
                      >
                        <FiBookOpen className="w-3.5 h-3.5" /> Review & History
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title={selectedSubmission ? `Review Submission: ${selectedSubmission.title}` : ''}
        size="xl"
      >
        {selectedSubmission && (
          <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
            {/* Submission Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-150 dark:border-gray-800 text-sm">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Student Information</p>
                <p className="font-bold text-gray-850 dark:text-white mt-1">{selectedSubmission.submittedBy?.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">Roll: {selectedSubmission.submittedBy?.enrollmentNumber || '—'}</p>
                <p className="text-xs text-gray-500">Class: {selectedSubmission.className} - {selectedSubmission.section}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Description</p>
                <p className="text-sm text-gray-650 dark:text-gray-300 mt-1 whitespace-pre-wrap leading-relaxed">
                  {selectedSubmission.description}
                </p>
              </div>
            </div>

            {/* Version History Collapsible */}
            <div>
              <h3 className="text-md font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-1.5">
                <FiClock className="w-4 h-4 text-primary-500" /> Complete Submission History
              </h3>
              <div className="border border-gray-150 dark:border-gray-800 rounded-xl overflow-hidden divide-y divide-gray-150 dark:divide-gray-800">
                {selectedSubmission.versions && selectedSubmission.versions.map((ver) => (
                  <div key={ver.versionNumber} className="p-4 bg-white dark:bg-gray-900 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
                      <span className="font-bold text-gray-800 dark:text-white flex items-center gap-1">
                        <span className="w-5 h-5 flex items-center justify-center rounded-full bg-primary-100 dark:bg-primary-950 text-xs text-primary-700 dark:text-primary-300 font-bold">
                          {ver.versionNumber}
                        </span>
                        Version {ver.versionNumber}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{format(new Date(ver.uploadedAt), 'PPp')}</span>
                        {getStatusBadge(ver.status)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/40 p-2 rounded-lg border border-gray-200 dark:border-gray-750 max-w-full">
                      <FiPaperclip className="w-4 h-4 text-gray-400" />
                      <a
                        href={ver.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-semibold truncate"
                      >
                        {ver.fileName}
                      </a>
                      <span className="text-[10px] text-gray-400">({Math.round(ver.fileSize / 1024)} KB)</span>
                    </div>

                    {ver.reviewedBy ? (
                      <div className="bg-blue-50/20 dark:bg-blue-950/5 border border-blue-100 dark:border-blue-900/40 rounded-lg p-3 space-y-2 mt-2 ml-4">
                        <div className="text-xs font-semibold text-blue-700 dark:text-blue-400">Review Details:</div>
                        {ver.review && <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed"><span className="font-bold">Review:</span> {ver.review}</p>}
                        {ver.comments && <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed"><span className="font-bold">Comments:</span> {ver.comments}</p>}
                        {ver.reviewAttachment && (
                          <div className="pt-1">
                            <a
                              href={ver.reviewAttachment.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-primary-600 dark:text-primary-400 hover:underline font-medium"
                            >
                              <FiDownload className="w-3.5 h-3.5" /> Reviewed File: {ver.reviewAttachment.fileName}
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 italic ml-4">No review recorded for this version yet.</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Review form */}
            <form onSubmit={handleReviewSubmit} className="space-y-4 pt-4 border-t border-gray-150 dark:border-gray-800">
              <h3 className="text-md font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <FiMessageSquare className="w-4 h-4 text-primary-500" /> Grade Latest Version (v{selectedSubmission.versions?.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Status Decision *</label>
                  <select
                    value={reviewForm.status}
                    onChange={e => setReviewForm({ ...reviewForm, status: e.target.value })}
                    className="input-field text-sm"
                  >
                    <option value="Reviewed">Reviewed</option>
                    <option value="Needs Changes">Needs Changes</option>
                    <option value="Approved">Approved</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">General Review Summary *</label>
                  <input
                    type="text"
                    required
                    value={reviewForm.review}
                    onChange={e => setReviewForm({ ...reviewForm, review: e.target.value })}
                    placeholder="e.g. Code works well, documentation needs minor edit"
                    className="input-field text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Detailed Remarks / Comments</label>
                <textarea
                  rows={4}
                  value={reviewForm.comments}
                  onChange={e => setReviewForm({ ...reviewForm, comments: e.target.value })}
                  placeholder="Provide structured feedback or write directions for changes here..."
                  className="input-field text-sm resize-none"
                />
              </div>

              {/* Optional reviewed file upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Reviewed File Attachment <span className="text-xs font-normal text-gray-400">(Optional: upload corrected copy)</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-400 transition-colors rounded-xl p-4 text-center cursor-pointer relative">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <FiUploadCloud className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {reviewFile ? reviewFile.name : 'Select annotated/graded copy to attach'}
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {submitting ? 'Processing file and saving review...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </PageLayout>
  )
}
