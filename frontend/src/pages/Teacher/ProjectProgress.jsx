import { useState, useEffect } from 'react'
import PageLayout from '../../components/common/PageLayout'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { FiArrowLeft, FiSave, FiActivity, FiUsers, FiCalendar, FiClock, FiFileText } from 'react-icons/fi'

export default function ProjectProgress() {
  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [detailsLoading, setDetailsLoading] = useState(false)

  // Detailed group state
  const [groupDetails, setGroupDetails] = useState(null)
  const [activityInfo, setActivityInfo] = useState(null)
  const [milestones, setMilestones] = useState([])
  const [progressPercent, setProgressPercent] = useState(0)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchDashboard = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/progress/dashboard')
      setGroups(data.groups || [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch progress dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  const handleSelectGroup = async (groupId) => {
    setDetailsLoading(true)
    setSelectedGroup(groupId)
    try {
      const { data } = await api.get(`/progress/group/${groupId}`)
      setGroupDetails(data.group)
      setActivityInfo(data.activity)
      setMilestones(data.progress?.milestones || [])
      setProgressPercent(data.progress?.progressPercentage || 0)
      setLastUpdated({
        by: data.progress?.updatedBy?.name || 'Never Updated',
        at: data.progress?.updatedAt ? new Date(data.progress.updatedAt) : null
      })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch group progress details')
      setSelectedGroup(null)
    } finally {
      setDetailsLoading(false)
    }
  }

  const handleStatusChange = (milestoneId, newStatus) => {
    const updatedMilestones = milestones.map(m =>
      m.milestoneId === milestoneId ? { ...m, status: newStatus } : m
    )
    setMilestones(updatedMilestones)

    // Live recalculation: Completed count / 5 * 100
    const completedCount = updatedMilestones.filter(m => m.status === 'Completed').length
    setProgressPercent(Math.round((completedCount / 5) * 100))
  }

  const handleRemarksChange = (milestoneId, newRemarks) => {
    setMilestones(prev => prev.map(m =>
      m.milestoneId === milestoneId ? { ...m, remarks: newRemarks } : m
    ))
  }

  const handleSaveProgress = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const { data } = await api.put(`/progress/group/${selectedGroup}`, { milestones })
      toast.success('Progress saved successfully!')
      setMilestones(data.progress?.milestones || [])
      setProgressPercent(data.progress?.progressPercentage || 0)
      setLastUpdated({
        by: data.progress?.updatedBy?.name || 'System',
        at: data.progress?.updatedAt ? new Date(data.progress.updatedAt) : null
      })
      // Refresh dashboard info
      fetchDashboard()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save progress')
    } finally {
      setSubmitting(false)
    }
  }

  // Visual ProgressBar Component
  const ProgressBar = ({ pct }) => (
    <div className="w-full bg-gray-200 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
      <div
        className="bg-primary-600 h-full rounded-full transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  )

  const getStatusClass = (status) => {
    if (status === 'Completed') return 'badge-approved'
    if (status === 'In Progress') return 'badge-pending'
    return 'badge-info'
  }

  if (loading) {
    return (
      <PageLayout>
        <div className="space-y-4">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="card h-40 animate-pulse bg-gray-100 dark:bg-gray-900" />
            ))}
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        {!selectedGroup ? (
          <>
            {/* Dashboard Header */}
            <div>
              <h1>Project Progress</h1>
              <p className="text-gray-400 text-sm mt-1">Monitor, evaluate and update student milestones</p>
            </div>

            {/* Dashboard Cards Grid */}
            {groups.length === 0 ? (
              <div className="card text-center py-12">
                <FiUsers className="w-12 h-12 text-gray-300 dark:text-gray-750 mx-auto mb-3" />
                <p className="text-gray-500">No project groups found for your Class and Section.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map(g => (
                  <div
                    key={g.groupId}
                    className="card hover:shadow-md cursor-pointer transition-all duration-300 transform hover:-translate-y-1"
                    onClick={() => handleSelectGroup(g.groupId)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-base font-bold text-gray-950 dark:text-white leading-tight">{g.groupName}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs mt-1">
                          {g.projectTitle || 'No Title Registered'}
                        </p>
                      </div>
                      <span className="text-lg font-bold text-primary-600">{g.progressPercentage}%</span>
                    </div>

                    <div className="space-y-3 mt-4">
                      <div>
                        <p className="text-[11px] text-gray-400 dark:text-gray-550 uppercase font-semibold">Guide</p>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{g.guideName}</p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-gray-400 font-semibold uppercase">Overall Progress</span>
                          <span className="text-gray-650 font-semibold">{g.progressPercentage}%</span>
                        </div>
                        <ProgressBar pct={g.progressPercentage} />
                      </div>

                      <div className="border-t border-gray-100 dark:border-gray-800 pt-2.5 flex justify-between items-center text-[10px] text-gray-400">
                        <span>Last Updated</span>
                        <span>
                          {g.lastUpdatedDate
                            ? new Date(g.lastUpdatedDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
                            : 'Never'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Detailed Group View Header */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedGroup(null)}
                className="btn-secondary p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                aria-label="Back to dashboard"
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold">{groupDetails?.groupName}</h1>
                <p className="text-gray-400 text-sm mt-1">{groupDetails?.projectDetails?.title || 'No Title'}</p>
              </div>
            </div>

            {detailsLoading ? (
              <div className="card h-64 animate-pulse bg-gray-100 dark:bg-gray-900" />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Columns - Info Panels */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Group Info Card */}
                  <div className="card">
                    <h2 className="text-base font-bold mb-4 flex items-center gap-2">
                      <FiUsers className="text-primary-600" /> Group Information
                    </h2>
                    <div className="space-y-3.5 text-sm">
                      <div>
                        <span className="block text-xs text-gray-400">Project Title</span>
                        <span className="font-semibold">{groupDetails?.projectDetails?.title || '—'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="block text-xs text-gray-400">Class & Section</span>
                          <span className="font-medium">{groupDetails?.className} - {groupDetails?.section}</span>
                        </div>
                        <div>
                          <span className="block text-xs text-gray-400">Academic Year</span>
                          <span className="font-medium">{groupDetails?.academicYear || '—'}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="block text-xs text-gray-400">Category</span>
                          <span className="font-medium">{groupDetails?.projectDetails?.category || '—'}</span>
                        </div>
                        <div>
                          <span className="block text-xs text-gray-400">Domain</span>
                          <span className="font-medium">{groupDetails?.projectDetails?.domain || '—'}</span>
                        </div>
                      </div>
                      <div>
                        <span className="block text-xs text-gray-400">Tech Stack</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {groupDetails?.projectDetails?.techStack && groupDetails.projectDetails.techStack.length > 0 ? (
                            groupDetails.projectDetails.techStack.map(tech => (
                              <span key={tech} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded">
                                {tech}
                              </span>
                            ))
                          ) : '—'}
                        </div>
                      </div>
                      <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
                        <span className="block text-xs text-gray-400">Guide</span>
                        <span className="font-semibold">{groupDetails?.guide?.name || 'Not Assigned'}</span>
                        {groupDetails?.guide?.phoneNumber && (
                          <span className="block text-xs text-gray-500 mt-0.5">{groupDetails.guide.phoneNumber}</span>
                        )}
                      </div>
                      <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
                        <span className="block text-xs text-gray-400">Group Leader</span>
                        <span className="font-semibold text-primary-600">{groupDetails?.leader?.name}</span>
                        <span className="block text-xs text-gray-550">{groupDetails?.leader?.enrollmentNumber}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-gray-400">Members</span>
                        <ul className="space-y-1.5 mt-1">
                          {groupDetails?.members?.map(m => (
                            <li key={m._id} className="text-xs flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              <span className="font-medium">{m.name}</span>
                              <span className="text-gray-400 font-mono text-[10px]">{m.enrollmentNumber}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Activity Info Card */}
                  <div className="card">
                    <h2 className="text-base font-bold mb-4 flex items-center gap-2">
                      <FiActivity className="text-primary-600" /> Activity Information
                    </h2>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{activityInfo?.totalMeetings || 0}</p>
                        <p className="text-[10px] text-gray-400 uppercase mt-0.5">Total Meetings</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-700 dark:text-green-400">{activityInfo?.completedMeetings || 0}</p>
                        <p className="text-[10px] text-green-600 uppercase mt-0.5">Completed</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-3.5 text-sm">
                      <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                        <span className="text-gray-500">Reports Submitted</span>
                        <span className="font-bold text-gray-700 dark:text-gray-200">{activityInfo?.reportsSubmitted || 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                        <span className="text-gray-500">Last Meeting Date</span>
                        <span className="font-medium text-gray-700 dark:text-gray-200">
                          {activityInfo?.lastMeetingDate
                            ? new Date(activityInfo.lastMeetingDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
                            : 'No completed meetings'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Columns - Editor & History */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Milestones Editor */}
                  <form onSubmit={handleSaveProgress} className="card space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-4">
                      <div>
                        <h2 className="text-base font-bold">Progress Tracking & Milestones</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Set milestones status and write custom reviews</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="block text-[10px] text-gray-400 uppercase font-semibold">Overall Percentage</span>
                          <span className="text-2xl font-black text-primary-600">{progressPercent}%</span>
                        </div>
                        <div className="w-24">
                          <ProgressBar pct={progressPercent} />
                        </div>
                      </div>
                    </div>

                    {/* Milestones Form Fields */}
                    <div className="space-y-5">
                      {milestones.map((m) => (
                        <div key={m.milestoneId} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                              Milestone {m.milestoneId}: {m.title}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className={`badge ${getStatusClass(m.status)} text-[10px] shrink-0`}>
                                {m.status}
                              </span>
                              <select
                                value={m.status}
                                onChange={(e) => handleStatusChange(m.milestoneId, e.target.value)}
                                className="input-field py-1 text-xs w-32"
                              >
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[11px] text-gray-400 font-semibold mb-1">Teacher Remarks</label>
                            <input
                              type="text"
                              value={m.remarks || ''}
                              onChange={(e) => handleRemarksChange(m.milestoneId, e.target.value)}
                              placeholder="Add milestone remarks..."
                              className="input-field text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 focus:ring-primary-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Save Button */}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn-primary w-full flex items-center justify-center gap-2 text-sm font-semibold shadow-sm hover:shadow"
                    >
                      <FiSave className="w-4 h-4" />
                      {submitting ? 'Saving changes...' : 'Save Progress'}
                    </button>
                  </form>

                  {/* Progress History Card */}
                  <div className="card">
                    <h2 className="text-base font-bold mb-3 flex items-center gap-2">
                      <FiClock className="text-primary-600" /> Progress History
                    </h2>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Last Updated By</span>
                        <span className="font-semibold text-gray-850 dark:text-gray-200">{lastUpdated?.by}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Updated Date</span>
                        <span className="font-medium text-gray-850 dark:text-gray-200">
                          {lastUpdated?.at
                            ? lastUpdated.at.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
                            : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Updated Time</span>
                        <span className="font-medium text-gray-850 dark:text-gray-200">
                          {lastUpdated?.at
                            ? lastUpdated.at.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
                            : '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            )}
          </>
        )}
      </div>
    </PageLayout>
  )
}
