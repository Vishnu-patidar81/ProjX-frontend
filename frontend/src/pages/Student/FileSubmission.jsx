import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import api from '../../services/api'
import toast from 'react-hot-toast'
import PageLayout from '../../components/common/PageLayout'
import Modal from '../../components/shared/Modal'
import {
  FiUploadCloud, FiFileText, FiPlus, FiArrowRight,
  FiClock, FiCheckCircle, FiAlertCircle, FiDownload,
  FiCornerDownRight, FiPaperclip, FiUser, FiCalendar
} from 'react-icons/fi'
import { format } from 'date-fns'
import { useAuth } from '../../context/AuthContext'
import { uploadToImageKit, resolveFileUrl } from '../../utils/uploadHelper'

export default function FileSubmission() {
  const { user } = useAuth()
  const [submissions, setSubmissions] = useState([])
  const [recipients, setRecipients] = useState({ teachers: [], guide: null })
  const [loading, setLoading] = useState(true)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showVersionModal, setShowVersionModal] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState(null)

  const location = useLocation()
  const navigate = useNavigate()
  const { highlightId } = location.state || {}

  useEffect(() => {
    if (highlightId && submissions.length > 0) {
      const targetSub = submissions.find(s => s._id === highlightId)
      if (targetSub) {
        setSelectedSubmission(targetSub)
        setShowDetailModal(true)
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
    }
  }, [highlightId, submissions])
  
  // Submit Form States
  const [form, setForm] = useState({
    title: '',
    description: '',
    recipientType: 'teacher', // 'teacher' or 'guide'
    recipientId: '',
  })
  const [file, setFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Version Upload States
  const [versionFile, setVersionFile] = useState(null)
  const [versionSubmitting, setVersionSubmitting] = useState(false)

  const fetchSubmissions = async () => {
    try {
      const { data } = await api.get('/submissions/student')
      setSubmissions(data.submissions || [])
    } catch (err) {
      toast.error('Failed to load submissions')
    }
  }

  const fetchRecipients = async () => {
    try {
      const { data } = await api.get('/submissions/recipients')
      setRecipients(data)
      // Set default recipient
      if (data.teachers && data.teachers.length > 0) {
        setForm(prev => ({ ...prev, recipientId: data.teachers[0]._id }))
      } else if (data.guide) {
        setForm(prev => ({ ...prev, recipientType: 'guide', recipientId: data.guide._id }))
      }
    } catch (err) {
      toast.error('Failed to fetch recipients')
    }
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([fetchSubmissions(), fetchRecipients()])
      setLoading(false)
    }
    init()
  }, [])

  const handleRecipientTypeChange = (type) => {
    let defaultId = ''
    if (type === 'teacher' && recipients.teachers.length > 0) {
      defaultId = recipients.teachers[0]._id
    } else if (type === 'guide' && recipients.guide) {
      defaultId = recipients.guide._id
    }
    setForm(prev => ({
      ...prev,
      recipientType: type,
      recipientId: defaultId
    }))
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleVersionFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setVersionFile(e.target.files[0])
    }
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.description.trim()) {
      return toast.error('Title and Description are required')
    }
    if (!form.recipientId) {
      return toast.error('Please select a recipient')
    }
    if (!file) {
      return toast.error('Please select a file to upload')
    }
    setSubmitting(true)
    const uploadToast = toast.loading('Uploading file to ImageKit...')
    try {
      const uploadResult = await uploadToImageKit(file, 'student-submissions', user)
      toast.dismiss(uploadToast)
      toast.loading('Saving submission details...', { id: uploadToast })

      // 3. Save to backend database
      await api.post('/submissions/submit', {
        title: form.title.trim(),
        description: form.description.trim(),
        submittedTo: form.recipientId,
        submissionType: form.recipientType,
        fileName: uploadResult.name,
        fileUrl: uploadResult.url,
        imageKitFileId: uploadResult.fileId,
        fileSize: uploadResult.size
      })

      toast.dismiss(uploadToast)
      toast.success('File submitted successfully!')
      setShowSubmitModal(false)
      setForm(prev => ({ ...prev, title: '', description: '' }))
      setFile(null)
      fetchSubmissions()
    } catch (err) {
      toast.dismiss(uploadToast)
      toast.error(err.response?.data?.message || err.message || 'Submission failed')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleVersionSubmit = async (e) => {
    e.preventDefault()
    if (!versionFile) {
      return toast.error('Please select a file')
    }
    setVersionSubmitting(true)
    const uploadToast = toast.loading('Uploading new version to ImageKit...')
    try {
      const uploadResult = await uploadToImageKit(versionFile, 'student-submissions', user)
      toast.dismiss(uploadToast)
      toast.loading('Adding new version to submission...', { id: uploadToast })

      // 3. Save version in database
      await api.post(`/submissions/${selectedSubmission._id}/version`, {
        fileName: uploadResult.name,
        fileUrl: uploadResult.url,
        imageKitFileId: uploadResult.fileId,
        fileSize: uploadResult.size
      })

      toast.dismiss(uploadToast)
      toast.success('New version submitted successfully!')
      setShowVersionModal(false)
      setVersionFile(null)
      fetchSubmissions()
    } catch (err) {
      toast.dismiss(uploadToast)
      toast.error(err.response?.data?.message || err.message || 'Version submission failed')
    } finally {
      setVersionSubmitting(false)
    }
  }

  const getStatusBadge = (status) => {
    const classes = {
      'Pending Review': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800',
      'Reviewed': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
      'Needs Changes': 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800',
      'Approved': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
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
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Academic File Submissions</h1>
            <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
              Submit reports, presentations, and draft copies to your class Teacher or group Guide.
            </p>
          </div>
          <button
            onClick={() => setShowSubmitModal(true)}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <FiPlus className="w-4 h-4" /> New Submission
          </button>
        </div>

        {/* Submissions List */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="card text-center py-16 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl shadow-xs">
            <FiUploadCloud className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-700 dark:text-gray-300">No submissions uploaded yet</h2>
            <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">
              Start by uploading your project proposals, report files, or document drafts for review.
            </p>
            <button
              onClick={() => setShowSubmitModal(true)}
              className="btn-primary mt-6 inline-flex items-center gap-2"
            >
              <FiPlus className="w-4 h-4" /> Upload File Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {submissions.map((sub) => (
              <div
                key={sub._id}
                id={`card-${sub._id}`}
                className="card bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-xs hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-bold text-gray-950 dark:text-white truncate">{sub.title}</h3>
                    {getStatusBadge(sub.status)}
                    <span className="badge-secondary text-xs uppercase font-medium">
                      Version {sub.versions ? sub.versions.length : 1}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                    {sub.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <FiUser className="w-3.5 h-3.5" /> Recipient: <span className="font-semibold text-gray-600 dark:text-gray-300 capitalize">{sub.submittedTo?.name} ({sub.submissionType})</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <FiCalendar className="w-3.5 h-3.5" /> Updated: {format(new Date(sub.updatedAt), 'PPP p')}
                    </span>
                  </div>

                  {/* Active file preview */}
                  <div className="mt-3 inline-flex items-center gap-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/40 dark:hover:bg-gray-800/70 p-2 rounded-lg border border-gray-200 dark:border-gray-700 max-w-full">
                    <FiPaperclip className="w-4 h-4 text-gray-400 shrink-0" />
                    <a
                      href={resolveFileUrl(sub.fileUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-semibold truncate max-w-xs md:max-w-md"
                    >
                      {sub.fileName}
                    </a>
                    <span className="text-[10px] text-gray-400 shrink-0">
                      ({Math.round(sub.fileSize / 1024)} KB)
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => {
                      setSelectedSubmission(sub)
                      setShowDetailModal(true)
                    }}
                    className="btn-secondary text-xs flex items-center gap-1.5"
                  >
                    View History & Reviews
                  </button>
                  {sub.status !== 'Approved' && (
                    <button
                      onClick={() => {
                        setSelectedSubmission(sub)
                        setShowVersionModal(true)
                      }}
                      className="btn-primary text-xs flex items-center gap-1.5"
                    >
                      <FiUploadCloud className="w-3.5 h-3.5" /> Submit New Version
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Upload Academic Submission"
        size="lg"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Title *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Synopsis Draft, Phase 1 Report"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Description / Notes *</label>
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Add submission remarks, changes list, or questions for your reviewer..."
              className="input-field resize-none"
            />
          </div>

          {/* Recipient Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Recipient Category</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                  <input
                    type="radio"
                    checked={form.recipientType === 'teacher'}
                    onChange={() => handleRecipientTypeChange('teacher')}
                    className="text-primary-600 focus:ring-primary-500 w-4 h-4"
                  />
                  Class Teacher
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                  <input
                    type="radio"
                    checked={form.recipientType === 'guide'}
                    onChange={() => handleRecipientTypeChange('guide')}
                    className="text-primary-600 focus:ring-primary-500 w-4 h-4"
                  />
                  Project Guide
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Select Recipient Name *</label>
              {form.recipientType === 'teacher' ? (
                recipients.teachers.length > 0 ? (
                  <select
                    value={form.recipientId}
                    onChange={e => setForm({ ...form, recipientId: e.target.value })}
                    className="input-field text-sm"
                  >
                    {recipients.teachers.map(t => (
                      <option key={t._id} value={t._id}>{t.name} ({t.email})</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-rose-500 mt-2 font-medium">No Class Teacher found for your class/section.</p>
                )
              ) : (
                recipients.guide ? (
                  <select
                    value={form.recipientId}
                    onChange={e => setForm({ ...form, recipientId: e.target.value })}
                    className="input-field text-sm"
                  >
                    <option value={recipients.guide._id}>{recipients.guide.name} ({recipients.guide.email})</option>
                  </select>
                ) : (
                  <p className="text-xs text-yellow-600 mt-2 font-medium">No project guide assigned / accepted yet.</p>
                )
              )}
            </div>
          </div>

          {/* File Picker */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">File Attachment *</label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-400 transition-colors rounded-xl p-6 text-center cursor-pointer relative">
              <input
                type="file"
                required
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <FiUploadCloud className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {file ? file.name : 'Drag & drop or click to browse'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Supports PDF, PPT, PPTX, DOC, DOCX, XLS, XLSX, ZIP, RAR, Images (Max 15MB)
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {submitting ? 'Uploading directly to ImageKit...' : 'Submit File'}
            </button>
          </div>
        </form>
      </Modal>

      {/* New Version Modal */}
      <Modal
        isOpen={showVersionModal}
        onClose={() => setShowVersionModal(false)}
        title={`Submit New Version - ${selectedSubmission?.title}`}
        size="md"
      >
        <form onSubmit={handleVersionSubmit} className="space-y-4">
          <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
            Uploading a new version resets the submission status back to <strong>Pending Review</strong>. The recipient will be notified automatically.
          </p>

          <div>
            <label className="block text-sm font-semibold text-gray-750 dark:text-gray-300 mb-2">Select File Version *</label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-400 transition-colors rounded-xl p-6 text-center cursor-pointer relative">
              <input
                type="file"
                required
                onChange={handleVersionFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <FiUploadCloud className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {versionFile ? versionFile.name : 'Select new version file'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Academic attachments: PDF, Documents, Archives.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={versionSubmitting}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {versionSubmitting ? 'Uploading to ImageKit...' : 'Upload New Version'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Details / History Drawer Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={selectedSubmission ? `Submission History: ${selectedSubmission.title}` : ''}
        size="xl"
      >
        {selectedSubmission && (
          <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
            <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
              <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Original Description</h4>
              <p className="text-sm text-gray-850 dark:text-gray-250 mt-1 leading-relaxed whitespace-pre-wrap">{selectedSubmission.description}</p>
            </div>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white pb-2 border-b border-gray-150 dark:border-gray-800">Version History</h3>
            
            <div className="space-y-6 relative border-l-2 border-gray-100 dark:border-gray-800 ml-4 pl-6">
              {selectedSubmission.versions && selectedSubmission.versions.map((ver, idx) => (
                <div key={idx} className="relative space-y-3">
                  {/* Version indicator bubble */}
                  <span className="absolute -left-[35px] top-1.5 flex items-center justify-center w-6 h-6 rounded-full bg-white dark:bg-gray-950 border-2 border-primary-500 text-xs font-bold text-primary-600">
                    v{ver.versionNumber}
                  </span>

                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-gray-800 dark:text-white">Version {ver.versionNumber} Submitted</h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Uploaded on {format(new Date(ver.uploadedAt), 'PPP p')}
                      </p>
                    </div>
                    {getStatusBadge(ver.status)}
                  </div>

                  {/* Submitted File */}
                  <div className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/30 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 max-w-full">
                    <FiPaperclip className="w-4 h-4 text-gray-400 shrink-0" />
                    <a
                      href={resolveFileUrl(ver.fileUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-semibold truncate"
                    >
                      {ver.fileName}
                    </a>
                    <span className="text-[10px] text-gray-400 shrink-0">
                      ({Math.round(ver.fileSize / 1024)} KB)
                    </span>
                  </div>

                  {/* Review / Comments panel */}
                  {ver.reviewedBy ? (
                    <div className="bg-blue-50/40 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/40 rounded-lg p-3.5 space-y-2 mt-2 ml-4">
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span className="font-semibold text-blue-700 dark:text-blue-400">Reviewer Feedback:</span>
                        <span>{format(new Date(ver.reviewedAt), 'PPp')}</span>
                      </div>
                      
                      {ver.review && (
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Review</p>
                          <p className="text-sm text-gray-750 dark:text-gray-300 mt-0.5 leading-relaxed">{ver.review}</p>
                        </div>
                      )}

                      {ver.comments && (
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Comments</p>
                          <p className="text-sm text-gray-750 dark:text-gray-300 mt-0.5 leading-relaxed">{ver.comments}</p>
                        </div>
                      )}

                      {/* Reviewed Attachment */}
                      {ver.reviewAttachment && ver.reviewAttachment.fileUrl && (
                        <div className="pt-2 border-t border-blue-100/50 dark:border-blue-900/20">
                          <p className="text-xs font-semibold text-gray-400 mb-1 flex items-center gap-1">
                            <FiCornerDownRight className="w-3.5 h-3.5" /> Reviewed File Attachment:
                          </p>
                          <a
                            href={resolveFileUrl(ver.reviewAttachment.fileUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors"
                          >
                            <FiDownload className="w-3.5 h-3.5 text-primary-500" />
                            <span className="truncate max-w-[200px]">{ver.reviewAttachment.fileName}</span>
                            <span className="text-[10px] text-gray-400">
                              ({Math.round(ver.reviewAttachment.fileSize / 1024)} KB)
                            </span>
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 italic bg-gray-50/50 dark:bg-gray-800/20 border border-gray-150 dark:border-gray-800 rounded-lg p-3 ml-4">
                      Pending review. Feedback will appear here once graded.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </PageLayout>
  )
}
