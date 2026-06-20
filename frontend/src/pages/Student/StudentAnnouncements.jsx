import { useState, useEffect } from 'react'
import PageLayout from '../../components/common/PageLayout'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { FiFileText, FiPaperclip, FiCalendar, FiChevronDown, FiChevronUp, FiInfo } from 'react-icons/fi'
import { format } from 'date-fns'
import { resolveFileUrl } from '../../utils/uploadHelper'

export default function StudentAnnouncements() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)

  const fetchAnnouncements = async () => {
    try {
      const { data } = await api.get('/announcements')
      setAnnouncements(data.announcements || [])
    } catch (err) {
      toast.error('Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const handleExpand = async (ann) => {
    const isExpanding = expandedId !== ann._id
    setExpandedId(prev => prev === ann._id ? null : ann._id)

    // Mark as read on the backend if expanding an unread announcement
    if (isExpanding && !ann.isRead) {
      try {
        await api.put(`/announcements/${ann._id}/read`)
        // Update local state to clear unread indicator
        setAnnouncements(prev =>
          prev.map(a => a._id === ann._id ? { ...a, isRead: true } : a)
        )
      } catch (err) {
        console.error('Failed to mark announcement as read', err)
      }
    }
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        <div>
          <h1>Announcements Feed</h1>
          <p className="text-sm text-gray-500 mt-1">Centralised feed for announcements from your Class Teacher and Project Guide</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="card animate-pulse h-24" />)}
          </div>
        ) : announcements.length === 0 ? (
          <div className="card text-center py-12">
            <FiFileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">No active announcements for you at this time.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map(ann => {
              const isExpanded = expandedId === ann._id
              const typeLabel = ann.creatorRole === 'teacher' ? 'Teacher Announcement' : 'Guide Announcement'
              
              return (
                <div
                  key={ann._id}
                  onClick={() => handleExpand(ann)}
                  className={`card cursor-pointer border transition-all duration-200 select-none ${
                    isExpanded 
                      ? 'ring-2 ring-primary-500/10 border-primary-200 dark:border-primary-800' 
                      : 'hover:border-gray-300 dark:hover:border-gray-700'
                  } ${!ann.isRead ? 'border-l-4 border-l-primary-500' : ''}`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-gray-950 dark:text-white font-bold text-base md:text-lg">
                            {ann.title}
                          </h3>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                            ann.creatorRole === 'teacher' 
                              ? 'bg-blue-50 text-blue-700' 
                              : 'bg-indigo-50 text-indigo-700'
                          }`}>
                            {typeLabel}
                          </span>
                          {!ann.isRead && (
                            <span className="inline-flex items-center text-[10px] bg-primary-600 text-white font-bold px-2 py-0.5 rounded-full">
                              NEW
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex flex-wrap gap-x-3 gap-y-1">
                          <span>
                            <strong>Posted by:</strong> {ann.createdBy?.name || 'Academic Faculty'} ({ann.creatorRole === 'teacher' ? 'Class Teacher' : 'Project Guide'})
                          </span>
                          <span>·</span>
                          <span>{format(new Date(ann.createdAt), 'PPp')}</span>
                        </div>
                      </div>

                      <div className="text-gray-400 p-1 hover:text-gray-600 shrink-0">
                        {isExpanded ? <FiChevronUp className="w-5 h-5" /> : <FiChevronDown className="w-5 h-5" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-4 cursor-default" onClick={e => e.stopPropagation()}>
                        <p className="text-sm text-gray-750 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                          {ann.message}
                        </p>

                        {ann.attachments && ann.attachments.length > 0 && (
                          <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                            <p className="text-xs font-semibold text-gray-400 mb-2">Attachments:</p>
                            <div className="flex flex-wrap gap-2">
                              {ann.attachments.map((file, idx) => (
                                <a
                                  key={idx}
                                  href={resolveFileUrl(file.filePath)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-750 dark:text-gray-300 px-3.5 py-2 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors font-medium"
                                >
                                  <FiPaperclip className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span className="truncate max-w-[180px]">{file.originalName}</span>
                                  <span className="text-[10px] text-gray-400 font-normal">
                                    ({Math.round(file.fileSize / 1024)} KB)
                                  </span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </PageLayout>
  )
}
