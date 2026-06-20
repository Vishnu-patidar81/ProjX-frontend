import { useState, useEffect } from 'react'
import PageLayout from '../../components/common/PageLayout'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { FiPlus, FiFileText, FiTrash2, FiEdit2, FiPaperclip, FiCalendar, FiEye, FiDownload } from 'react-icons/fi'
import Modal from '../../components/shared/Modal'
import { format } from 'date-fns'
import { useAuth } from '../../context/AuthContext'
import { uploadToImageKit, resolveFileUrl } from '../../utils/uploadHelper'

export default function GuideAnnouncements() {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    title: '',
    message: '',
    expiryDate: '',
  })
  const [selectedGroups, setSelectedGroups] = useState([])
  const [attachments, setAttachments] = useState([])

  const fetchAnnouncementsAndGroups = async () => {
    try {
      const [annRes, grpRes] = await Promise.allSettled([
        api.get('/announcements'),
        api.get('/groups/guide-groups')
      ])
      if (annRes.status === 'fulfilled') setAnnouncements(annRes.value.data.announcements || [])
      if (grpRes.status === 'fulfilled') setGroups(grpRes.value.data.groups || [])
    } catch (err) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnnouncementsAndGroups()
  }, [])

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || [])
    const newAttachments = files.map(file => ({
      name: file.name,
      fileSize: file.size,
      fileObject: file
    }))
    setAttachments(prev => [...prev, ...newAttachments])
  }

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleGroupToggle = (groupId) => {
    setSelectedGroups(prev =>
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    )
  }

  const openCreateModal = () => {
    if (groups.length === 0) {
      return toast.error('You do not have any accepted groups assigned yet.')
    }
    setEditingId(null)
    setForm({ title: '', message: '', expiryDate: '' })
    setSelectedGroups([])
    setAttachments([])
    setShowModal(true)
  }

  const openEditModal = (ann) => {
    setEditingId(ann._id)
    setForm({
      title: ann.title,
      message: ann.message,
      expiryDate: ann.expiryDate ? ann.expiryDate.split('T')[0] : '',
    })
    setSelectedGroups(ann.targetGroups?.map(g => typeof g === 'object' ? g._id : g) || [])
    setAttachments(ann.attachments || [])
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.message) {
      return toast.error('Title and message are required')
    }
    if (selectedGroups.length === 0) {
      return toast.error('Please target at least one group')
    }

    setSubmitting(true)
    const uploadToast = toast.loading('Uploading attachments to ImageKit...')
    try {
      const processedAttachments = await Promise.all(
        attachments.map(async (file) => {
          if (file.fileObject) {
            const uploadResult = await uploadToImageKit(file.fileObject, 'announcements', user)
            return {
              fileName: uploadResult.name,
              originalName: file.name,
              mimeType: file.fileObject.type || 'application/octet-stream',
              filePath: uploadResult.url,
              fileSize: uploadResult.size
            }
          }
          return file
        })
      )

      toast.dismiss(uploadToast)

      const payload = {
        title: form.title,
        message: form.message,
        attachments: processedAttachments,
        targetType: 'groups',
        targetGroups: selectedGroups,
        expiryDate: form.expiryDate || undefined
      }

      const activeMode = localStorage.getItem('projx_mode')
      const config = activeMode === 'guide' ? { params: { mode: 'guide' } } : {}

      if (editingId) {
        await api.put(`/announcements/${editingId}`, payload, config)
        toast.success('Announcement updated successfully')
      } else {
        await api.post('/announcements', payload, config)
        toast.success('Announcement posted successfully')
      }
      setShowModal(false)
      fetchAnnouncementsAndGroups()
    } catch (err) {
      toast.dismiss(uploadToast)
      toast.error(err.response?.data?.message || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return
    try {
      await api.delete(`/announcements/${id}`)
      toast.success('Announcement deleted')
      fetchAnnouncementsAndGroups()
    } catch (err) {
      toast.error('Failed to delete announcement')
    }
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1>Announcements</h1>
            <p className="text-sm text-gray-500 mt-1">Manage announcements sent to your guided groups</p>
          </div>
          {groups.length > 0 && (
            <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
              <FiPlus className="w-4 h-4" /> New Announcement
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="card animate-pulse h-28" />)}
          </div>
        ) : announcements.length === 0 ? (
          <div className="card text-center py-12">
            <FiFileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">No announcements posted yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map(ann => (
              <div key={ann._id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3>{ann.title}</h3>
                      <span className="badge-info text-xs">Group Announcement</span>
                      {ann.expiryDate && (
                        <span className="inline-flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded">
                          <FiCalendar className="w-3 h-3" /> Expires: {format(new Date(ann.expiryDate), 'PP')}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      Posted on {format(new Date(ann.createdAt), 'PPp')} ·{' '}
                      <strong>Target:</strong>{' '}
                      {ann.targetGroups?.map(g => g.groupName).join(', ') || 'No Groups'}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {ann.message}
                    </p>

                    {ann.attachments && ann.attachments.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                        <p className="text-xs font-semibold text-gray-400 mb-2">Attachments:</p>
                        <div className="flex flex-wrap gap-2">
                          {ann.attachments.map((file, idx) => (
                            <a
                              key={idx}
                              href={resolveFileUrl(file.filePath)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors"
                            >
                              <FiPaperclip className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate max-w-[150px]">{file.originalName}</span>
                              <span className="text-[10px] text-gray-400">
                                ({Math.round(file.fileSize / 1024)} KB)
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditModal(ann)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(ann._id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Edit Announcement' : 'New Announcement'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="E.g., Submission Deadline Extension"
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
            <textarea
              value={form.message}
              onChange={e => setForm({ ...form, message: e.target.value })}
              placeholder="Write announcement description..."
              rows={5}
              className="input-field resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Groups *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              {groups.map(g => {
                const isSelected = selectedGroups.includes(g._id)
                return (
                  <label key={g._id} className="flex items-center gap-2 text-xs text-gray-750 dark:text-gray-250 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleGroupToggle(g._id)}
                      className="rounded text-primary-600 focus:ring-primary-500 w-4 h-4 border-gray-300"
                    />
                    <span>{g.groupName}</span>
                  </label>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date (Optional)</label>
            <input
              type="date"
              value={form.expiryDate}
              onChange={e => setForm({ ...form, expiryDate: e.target.value })}
              className="input-field"
              min={new Date().toISOString().split('T')[0]}
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Expired announcements are automatically archived and hidden from the student feed.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Attachments</label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-200 font-medium py-2 px-3 rounded-lg border border-gray-300 dark:border-gray-700 transition-colors">
                <FiPaperclip className="w-4 h-4" /> Choose Files
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {attachments.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {attachments.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-4 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-150 dark:border-gray-700 text-xs"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <FiFileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate text-gray-700 dark:text-gray-300">
                        {file.originalName || file.name}
                      </span>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        ({Math.round(file.fileSize / 1024)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full mt-2">
            {submitting ? 'Posting...' : editingId ? 'Update Announcement' : 'Post Announcement'}
          </button>
        </form>
      </Modal>
    </PageLayout>
  )
}
