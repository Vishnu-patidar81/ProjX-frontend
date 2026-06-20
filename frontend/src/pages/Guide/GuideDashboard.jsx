import { useEffect, useState } from 'react'
import PageLayout from '../../components/common/PageLayout'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import api from '../../services/api'
import { FiUsers, FiCalendar, FiClock, FiCheckCircle, FiMessageSquare, FiTrendingUp } from 'react-icons/fi'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import GroupChat from '../../components/chat/GroupChat'
import { formatDistanceToNow } from 'date-fns'
import Modal from '../../components/shared/Modal'
import toast from 'react-hot-toast'

export default function GuideDashboard() {
  const { user } = useAuth()
  const { socket } = useSocket()
  const [groups, setGroups]   = useState([])
  const [pending, setPending] = useState([])
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading]   = useState(true)
  const [chatSummaries, setChatSummaries] = useState({})
  const [activeChatGroup, setActiveChatGroup] = useState(null)

  const location = useLocation()
  const navigate = useNavigate()
  const { highlightId, openChat, openProgress } = location.state || {}

  // Progress modal states
  const [viewProgressGroupId, setViewProgressGroupId] = useState(null)
  const [viewProgressGroupName, setViewProgressGroupName] = useState('')
  const [progressDetails, setProgressDetails] = useState(null)
  const [progressLoading, setProgressLoading] = useState(false)

  const handleViewProgress = async (groupId, groupName) => {
    setViewProgressGroupId(groupId)
    setViewProgressGroupName(groupName)
    setProgressLoading(true)
    try {
      const { data } = await api.get(`/progress/group/${groupId}`)
      setProgressDetails(data.progress)
    } catch {
      toast.error('Failed to load progress details')
      setViewProgressGroupId(null)
    } finally {
      setProgressLoading(false)
    }
  }

  useEffect(() => {
    if (highlightId && groups.length > 0) {
      const targetGroup = groups.find(g => g._id === highlightId)
      if (targetGroup) {
        if (openChat) {
          setActiveChatGroup(targetGroup)
          setChatSummaries(prev => ({
            ...prev,
            [targetGroup._id]: { ...(prev[targetGroup._id] || {}), unreadCount: 0 }
          }))
        } else if (openProgress) {
          handleViewProgress(targetGroup._id, targetGroup.groupName)
        }

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
  }, [highlightId, groups, openChat, openProgress])

  useEffect(() => {
    const load = async () => {
      try {
        const [gRes, pRes, mRes] = await Promise.allSettled([
          api.get('/groups/guide-groups'),
          api.get('/guides/pending-consents'),
          api.get('/meetings/guide-meetings'),
        ])
        let activeGroups = []
        if (gRes.status === 'fulfilled') {
          activeGroups = gRes.value.data.groups || []
          setGroups(activeGroups)
        }
        if (pRes.status === 'fulfilled') setPending(pRes.value.data.groups || [])
        if (mRes.status === 'fulfilled') setMeetings(mRes.value.data.meetings || [])

        if (activeGroups.length > 0) {
          const summaries = {}
          await Promise.all(
            activeGroups.map(async (g) => {
              try {
                const { data } = await api.get(`/chat/${g._id}/summary`)
                summaries[g._id] = data
              } catch (err) {
                console.error('Error fetching chat summary for group:', g._id, err)
              }
            })
          )
          setChatSummaries(summaries)
        }
      } finally { setLoading(false) }
    }
    load()
  }, [])

  // Join/leave rooms of assigned groups to listen for chat messages
  useEffect(() => {
    if (!socket || groups.length === 0) return
    groups.forEach(g => {
      socket.emit('chat:join', { groupId: g._id })
    })
    return () => {
      groups.forEach(g => {
        socket.emit('chat:leave', { groupId: g._id })
      })
    }
  }, [socket, groups])

  // Listen for message events globally on this dashboard to update counters
  useEffect(() => {
    if (!socket) return
    const handleNewMsg = (msg) => {
      setChatSummaries((prev) => {
        const groupSum = prev[msg.group] || { unreadCount: 0, lastMessage: null }
        const isCurrentChat = activeChatGroup?._id === msg.group
        return {
          ...prev,
          [msg.group]: {
            lastMessage: msg,
            unreadCount: isCurrentChat ? 0 : groupSum.unreadCount + (msg.sender._id !== user._id ? 1 : 0)
          }
        }
      })
    }
    socket.on('chat:message', handleNewMsg)
    return () => {
      socket.off('chat:message', handleNewMsg)
    }
  }, [socket, activeChatGroup, user?._id])

  const upcomingMeetings = meetings.filter(m => ['pending', 'accepted', 'scheduled'].includes(m.status))
  const pendingReports   = meetings.filter(m => m.status === 'completed' && !m.meetingReport?.isReportFilled)
  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl p-6 text-white">
          <h1 className="text-xl font-bold">Guide Dashboard</h1>
          <p className="text-green-100 text-sm mt-1">{user?.name} · {user?.department}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Active Groups',    value: groups.length,          icon: FiUsers,      color: 'blue'  },
            { label: 'Pending Consents', value: pending.length,         icon: FiClock,      color: 'yellow'},
            { label: 'Upcoming Meetings',value: upcomingMeetings.length,icon: FiCalendar,   color: 'green' },
            { label: 'Reports Due',      value: pendingReports.length,  icon: FiCheckCircle,color: 'red'   },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                color === 'blue' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400' :
                color === 'yellow' ? 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950/30 dark:text-yellow-400' :
                color === 'green' ? 'bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400' :
                'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-xl font-bold">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Pending consents alert */}
        {pending.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-yellow-800 font-medium text-sm mb-2">
              ⚠️ You have {pending.length} pending group assignment(s) requiring your consent.
            </p>
            <Link to="/guide/consents" className="btn-primary text-sm py-1.5 px-4 inline-block">
              Review Consents
            </Link>
          </div>
        )}

        {/* Active Groups */}
        <div className="card">
          <h2 className="mb-4">My Assigned Groups</h2>
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1,2].map(i => <div key={i} className="h-16 bg-gray-100 rounded-lg" />)}
            </div>
          ) : groups.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No active groups yet.</p>
          ) : (
            <div className="space-y-3">
              {groups.map(g => {
                const summary = chatSummaries[g._id] || { unreadCount: 0, lastMessage: null }
                return (
                  <div key={g._id} id={`card-${g._id}`} className="flex flex-col p-4 bg-gray-50 rounded-lg hover:shadow-sm transition-shadow border border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-800 flex flex-wrap items-center gap-2">
                          {g.groupName}
                          {g.guideStatus === 'pending_consent' && (
                            <span className="badge-pending text-[10px] px-1.5 py-0.5 ring-1 ring-yellow-400 bg-yellow-100 text-yellow-800 font-bold rounded-md shadow-sm">Awaiting Consent</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          {g.projectDetails?.title || 'No project submitted'} · {g.members?.length} members
                        </p>
                        <p className="text-xs text-gray-450">Leader: {g.leader?.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewProgress(g._id, g.groupName)}
                          className="btn-secondary py-1.5 px-3 flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-750 hover:bg-primary-50 border-primary-200"
                        >
                          <FiTrendingUp className="w-3.5 h-3.5" /> Progress
                        </button>
                        <button
                          onClick={() => {
                            setActiveChatGroup(g)
                            setChatSummaries(prev => ({
                              ...prev,
                              [g._id]: { ...(prev[g._id] || {}), unreadCount: 0 }
                            }))
                          }}
                          className="btn-secondary py-1.5 px-3 flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-750 hover:bg-primary-50 border-primary-200"
                        >
                          <FiMessageSquare className="w-3.5 h-3.5" /> Chat
                          {summary.unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                              {summary.unreadCount}
                            </span>
                          )}
                         </button>
                      </div>
                    </div>

                    {/* Last Message Preview */}
                    {summary.lastMessage ? (
                      <div className="mt-2.5 p-2 bg-white rounded border border-gray-100 text-[11px] text-gray-600 italic">
                        <span className="font-semibold text-gray-700 not-italic">
                          {summary.lastMessage.sender.name}:
                        </span>{' '}
                        "{summary.lastMessage.message}"
                        <span className="text-[9px] text-gray-400 ml-2 not-italic">
                          ({formatDistanceToNow(new Date(summary.lastMessage.createdAt), { addSuffix: true })})
                        </span>
                      </div>
                    ) : (
                      <div className="mt-2 text-[10px] text-gray-400 italic">No chat messages yet</div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent meetings needing reports */}
        {pendingReports.length > 0 && (
          <div className="card">
            <h2 className="mb-4 text-red-650">Reports Due</h2>
            <div className="space-y-2">
              {pendingReports.map(m => (
                <div key={m._id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Meeting #{m.meetingNumber} — {m.group?.groupName}</p>
                    <p className="text-xs text-gray-500">{new Date(m.scheduledDate).toDateString()}</p>
                  </div>
                  <Link to="/guide/meetings" className="btn-primary text-xs py-1 px-3">Fill Report</Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Group Chat Drawer */}
      {activeChatGroup && (
        <GroupChat
          groupId={activeChatGroup._id}
          groupName={activeChatGroup.groupName}
          members={activeChatGroup.members}
          guide={user}
          onClose={() => setActiveChatGroup(null)}
        />
      )}

      {/* View Progress Modal */}
      <Modal 
        isOpen={!!viewProgressGroupId} 
        onClose={() => { setViewProgressGroupId(null); setProgressDetails(null); }} 
        title={`Project Progress — ${viewProgressGroupName}`}
        size="lg"
      >
        {progressLoading ? (
          <div className="animate-pulse space-y-3 p-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
          </div>
        ) : progressDetails ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div>
                <span className="text-xs text-gray-400 font-semibold uppercase">Overall Completion</span>
                <h3 className="text-2xl font-black text-primary-600">{progressDetails.progressPercentage}%</h3>
              </div>
              <div className="w-2/3 max-w-xs">
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary-600 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${progressDetails.progressPercentage}%` }} 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200">Milestone Details</h4>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {progressDetails.milestones?.map(m => (
                  <div key={m.milestoneId} className="py-3 flex flex-col sm:flex-row sm:items-start justify-between gap-2 text-sm">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 dark:text-gray-250">
                        Milestone {m.milestoneId}: {m.title}
                      </p>
                      {m.remarks ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <span className="font-semibold text-gray-450">Remarks:</span> {m.remarks}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 italic mt-0.5">No remarks yet.</p>
                      )}
                    </div>
                    <span className={`badge ${
                      m.status === 'Completed' ? 'badge-approved' :
                      m.status === 'In Progress' ? 'badge-pending' : 'badge-info'
                    } text-[10px] shrink-0`}>
                      {m.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
              <button 
                type="button" 
                onClick={() => { setViewProgressGroupId(null); setProgressDetails(null); }} 
                className="btn-secondary text-sm"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-4">No progress recorded for this group.</p>
        )}
      </Modal>
    </PageLayout>
  )
}
