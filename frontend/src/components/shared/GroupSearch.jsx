import { useState, useEffect } from 'react'
import api from '../../services/api'
import Modal from './Modal'
import { FiSearch, FiEye, FiCalendar, FiUsers, FiBookOpen } from 'react-icons/fi'

export default function GroupSearch({ onSearchActive }) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Modals state
  const [activeGroup, setActiveGroup] = useState(null)
  const [modalType, setModalType] = useState(null) // 'group', 'project', 'meetings'
  const [meetings, setMeetings] = useState([])
  const [meetingsLoading, setMeetingsLoading] = useState(false)

  useEffect(() => {
    if (!search.trim()) {
      setResults([])
      onSearchActive(false)
      return
    }

    onSearchActive(true)
    setLoading(true)
    setError('')

    const delayDebounce = setTimeout(async () => {
      try {
        const response = await api.get(`/groups/search?query=${encodeURIComponent(search)}`)
        setResults(response.data || [])
      } catch (err) {
        console.error('Search API error:', err)
        setError('Failed to fetch search results.')
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [search, onSearchActive])

  const handleViewMeetings = async (group) => {
    setActiveGroup(group)
    setMeetingsLoading(true)
    setMeetings([])
    setModalType('meetings')
    try {
      const response = await api.get(`/meetings/all?groupId=${group.groupId}`)
      setMeetings(response.data.meetings || [])
    } catch (err) {
      console.error('Error fetching meetings:', err)
    } finally {
      setMeetingsLoading(false)
    }
  }

  const handleOpenGroupDetails = async (group) => {
    setActiveGroup(null)
    setModalType('group')
    // We fetch full group details using the existing GET /api/groups/:id endpoint
    try {
      const response = await api.get(`/groups/${group.groupId}`)
      setActiveGroup(response.data.group)
    } catch (err) {
      console.error('Error fetching group details:', err)
    }
  }

  const handleOpenProjectDetails = async (group) => {
    setActiveGroup(null)
    setModalType('project')
    try {
      const response = await api.get(`/groups/${group.groupId}`)
      setActiveGroup(response.data.group)
    } catch (err) {
      console.error('Error fetching project details:', err)
    }
  }

  const statusBadge = (s) => ({
    not_submitted: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  })[s] || 'bg-blue-100 text-blue-800'

  return (
    <div className="w-full space-y-4">
      {/* Search Input */}
      <div className="relative w-full">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by Group Name, Project, Student, Enrollment, or Guide"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white shadow-sm"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-semibold"
          >
            Clear
          </button>
        )}
      </div>

      {search.trim() && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h2 className="text-sm font-bold text-gray-700">Search Results ({results.length})</h2>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-800 rounded-xl text-sm">{error}</div>
          ) : results.length === 0 ? (
            <div className="card text-center py-12 bg-white border border-gray-100 rounded-xl">
              <FiUsers className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No groups matched your query.</p>
            </div>
          ) : (
            <>
              {/* Desktop View Table */}
              <div className="hidden md:block overflow-x-auto bg-white border border-gray-100 rounded-xl shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 text-xs font-semibold uppercase">
                      <th className="text-left px-4 py-3">Group Name</th>
                      <th className="text-left px-4 py-3">Project Title</th>
                      <th className="text-left px-4 py-3">Leader</th>
                      <th className="text-left px-4 py-3">Guide</th>
                      <th className="text-left px-4 py-3">Status</th>
                      <th className="text-center px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {results.map((g) => (
                      <tr key={g.groupId} className="hover:bg-gray-50 text-gray-700">
                        <td className="px-4 py-3 font-semibold">{g.groupName}</td>
                        <td className="px-4 py-3 max-w-[200px] truncate">{g.projectTitle || '—'}</td>
                        <td className="px-4 py-3 font-medium text-gray-600">{g.leaderName || '—'}</td>
                        <td className="px-4 py-3 text-gray-500">{g.guideName || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${statusBadge(g.projectStatus)}`}>
                            {g.projectStatus?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenGroupDetails(g)}
                              className="btn btn-outline py-1 px-2.5 text-xs flex items-center gap-1 hover:bg-gray-50 text-primary-600 border border-primary-200 rounded-lg"
                              title="View Group Details"
                            >
                              <FiUsers className="w-3.5 h-3.5" /> Group
                            </button>
                            <button
                              onClick={() => handleOpenProjectDetails(g)}
                              className="btn btn-outline py-1 px-2.5 text-xs flex items-center gap-1 hover:bg-gray-50 text-secondary-600 border border-secondary-200 rounded-lg"
                              title="View Project Details"
                            >
                              <FiBookOpen className="w-3.5 h-3.5" /> Project
                            </button>
                            <button
                              onClick={() => handleViewMeetings(g)}
                              className="btn btn-outline py-1 px-2.5 text-xs flex items-center gap-1 hover:bg-gray-50 text-purple-600 border border-purple-200 rounded-lg"
                              title="View Meetings History"
                            >
                              <FiCalendar className="w-3.5 h-3.5" /> Meetings
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View Cards */}
              <div className="block md:hidden space-y-3">
                {results.map((g) => (
                  <div key={g.groupId} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-800 text-sm">{g.groupName}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${statusBadge(g.projectStatus)}`}>
                        {g.projectStatus?.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="text-xs space-y-1 text-gray-500">
                      <div>
                        <span className="font-medium text-gray-700">Project:</span> {g.projectTitle || '—'}
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Leader:</span> {g.leaderName || '—'}
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Guide:</span> {g.guideName || '—'}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-50">
                      <button
                        onClick={() => handleOpenGroupDetails(g)}
                        className="py-1.5 px-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 flex flex-col items-center justify-center gap-1"
                      >
                        <FiUsers className="w-4 h-4 text-primary-600" />
                        <span>Group</span>
                      </button>
                      <button
                        onClick={() => handleOpenProjectDetails(g)}
                        className="py-1.5 px-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 flex flex-col items-center justify-center gap-1"
                      >
                        <FiBookOpen className="w-4 h-4 text-secondary-600" />
                        <span>Project</span>
                      </button>
                      <button
                        onClick={() => handleViewMeetings(g)}
                        className="py-1.5 px-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 flex flex-col items-center justify-center gap-1"
                      >
                        <FiCalendar className="w-4 h-4 text-purple-600" />
                        <span>Meetings</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Group Detail Modal */}
      <Modal
        isOpen={modalType === 'group'}
        onClose={() => setModalType(null)}
        title={activeGroup ? `Group Profile: ${activeGroup.groupName}` : 'Loading...'}
        size="lg"
      >
        {!activeGroup ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : (
          <div className="space-y-4 text-sm text-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400">Academic Year</p>
                <p className="font-semibold text-gray-800">{activeGroup.academicYear || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Current Phase</p>
                <p className="font-semibold text-gray-800 capitalize">{activeGroup.phase?.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Guide Assignment</p>
                <p className="font-semibold text-gray-800 capitalize">{activeGroup.guideStatus?.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Assigned Guide</p>
                <p className="font-semibold text-gray-800">{activeGroup.guide?.name || '—'}</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Members</h4>
              <div className="space-y-2">
                {activeGroup.members?.map((m) => (
                  <div key={m._id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <p className="font-medium text-gray-800 flex items-center gap-1.5">
                        {m.name}
                        {activeGroup.leader?._id === m._id && (
                          <span className="px-2 py-0.5 text-[10px] bg-primary-100 text-primary-800 font-semibold rounded-full">
                            Leader
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">{m.email}</p>
                    </div>
                    <span className="text-xs text-gray-500 font-mono bg-white border border-gray-100 px-2 py-0.5 rounded-lg">
                      {m.enrollmentNumber}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Project Detail Modal */}
      <Modal
        isOpen={modalType === 'project'}
        onClose={() => setModalType(null)}
        title={activeGroup ? `Project: ${activeGroup.projectDetails?.title || 'Not Submitted'}` : 'Loading...'}
        size="lg"
      >
        {!activeGroup ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : (
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <p className="text-xs text-gray-400">Description</p>
              <p className="mt-1 bg-gray-50 p-3 rounded-xl border border-gray-100 whitespace-pre-line text-gray-600">
                {activeGroup.projectDetails?.description || 'No description provided.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-xs text-gray-400">Domain</p>
                <p className="font-semibold text-gray-800">{activeGroup.projectDetails?.domain || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Category</p>
                <p className="font-semibold text-gray-800">{activeGroup.projectDetails?.category || '—'}</p>
              </div>
            </div>

            {activeGroup.projectDetails?.techStack && activeGroup.projectDetails.techStack.length > 0 && (
              <div>
                <p className="text-xs text-gray-400">Technology Stack</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {activeGroup.projectDetails.techStack.map((tech) => (
                    <span key={tech} className="px-2.5 py-0.5 bg-gray-100 border border-gray-200 text-gray-700 text-xs rounded-full">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {activeGroup.adminRemarks && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 text-xs">
                <strong>Remarks:</strong> {activeGroup.adminRemarks}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Meetings Modal */}
      <Modal
        isOpen={modalType === 'meetings'}
        onClose={() => setModalType(null)}
        title={activeGroup ? `Meeting History: ${activeGroup.groupName}` : 'Meetings'}
        size="lg"
      >
        {meetingsLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : meetings.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No meetings have been scheduled for this group yet.
          </div>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {meetings.map((m) => (
              <div key={m._id} className="p-3 bg-white border border-gray-200 rounded-xl space-y-2 text-sm shadow-sm hover:border-gray-300 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-800">
                    Meeting #{m.meetingNumber} ({m.mode})
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                    m.status === 'completed' ? 'bg-green-100 text-green-800' :
                    m.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    m.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {m.status}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-500">
                  <div>
                    <span className="font-semibold text-gray-700">Date:</span>{' '}
                    {m.scheduledDate ? new Date(m.scheduledDate).toLocaleDateString() : '—'}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Time:</span> {m.scheduledTime || '—'}
                  </div>
                </div>
                <div className="text-xs text-gray-600">
                  <span className="font-semibold text-gray-700">Agenda:</span> {m.agenda}
                </div>
                {m.meetingLink && m.mode === 'Online' && (
                  <div className="text-xs">
                    <span className="font-semibold text-gray-700">Link:</span>{' '}
                    <a
                      href={m.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline break-all"
                    >
                      {m.meetingLink}
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}
