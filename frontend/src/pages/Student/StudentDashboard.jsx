import { useEffect, useState } from 'react'
import PageLayout from '../../components/common/PageLayout'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import api from '../../services/api'
import { FiUsers, FiCalendar, FiBarChart2, FiCheckCircle, FiClock, FiAlertCircle, FiMessageSquare } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import GroupChat from '../../components/chat/GroupChat'
import { formatDistanceToNow } from 'date-fns'

const statusConfig = {
  not_submitted: { label: 'Not Submitted', color: 'badge-info',     icon: FiClock },
  pending:       { label: 'Pending Review',color: 'badge-pending',  icon: FiClock },
  approved:      { label: 'Approved',      color: 'badge-approved', icon: FiCheckCircle },
  rejected:      { label: 'Rejected',      color: 'badge-rejected', icon: FiAlertCircle },
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const { socket } = useSocket()
  const [group, setGroup]         = useState(null)
  const [meetings, setMeetings]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [chatSummary, setChatSummary] = useState({ unreadCount: 0, lastMessage: null })
  const [showChat, setShowChat] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [gRes, mRes] = await Promise.allSettled([
          api.get('/groups/my-group'),
          api.get('/meetings/my-meetings'),
        ])
        let activeGroup = null
        if (gRes.status === 'fulfilled') {
          activeGroup = gRes.value.data.group
          setGroup(activeGroup)
        }
        if (mRes.status === 'fulfilled') setMeetings(mRes.value.data.meetings || [])

        if (activeGroup && activeGroup.guide && ['accepted', 'pending_consent'].includes(activeGroup.guideStatus)) {
          const chatRes = await api.get(`/chat/${activeGroup._id}/summary`)
          setChatSummary(chatRes.data)
        }
      } catch (err) {
        console.error('Dashboard load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!socket || !group?._id) return

    const handleNewMsg = (msg) => {
      setChatSummary(prev => ({
        lastMessage: msg,
        unreadCount: showChat ? 0 : prev.unreadCount + (msg.sender._id !== user._id ? 1 : 0)
      }))
    }

    socket.on('chat:message', handleNewMsg)
    return () => {
      socket.off('chat:message', handleNewMsg)
    }
  }, [socket, group?._id, showChat, user?._id])

  const openChat = () => {
    setShowChat(true)
    setChatSummary(prev => ({ ...prev, unreadCount: 0 }))
  }

  const projectStatus = group?.projectStatus || 'not_submitted'
  const StatusCfg = statusConfig[projectStatus]
  const StatusIcon = StatusCfg.icon
  const upcomingMeetings = meetings.filter(m => ['pending', 'accepted', 'scheduled'].includes(m.status))
  const completedMeetings = meetings.filter(m => m.status === 'completed')

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-primary-600 to-accent rounded-xl p-6 text-white">
          <h1 className="text-xl font-bold">Welcome back, {user?.name}! 👋</h1>
          <p className="text-primary-100 text-sm mt-1">Enrollment: {user?.enrollmentNumber}</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard icon={FiUsers} label="Group Members"
            value={group ? group.members?.length : '—'}
            sub={group ? group.groupName : 'No group yet'}
            color="blue" />
          <StatCard icon={FiCalendar} label="Upcoming Meetings"
            value={upcomingMeetings.length}
            sub={`${completedMeetings.length} completed`}
            color="green" />
          <StatCard icon={FiBarChart2} label="Project Status"
            value={<span className={StatusCfg.color}>{StatusCfg.label}</span>}
            sub={group?.projectDetails?.title || 'No project submitted'}
            color="purple" />
        </div>

        {/* Project info */}
        {loading ? (
          <div className="card animate-pulse h-32" />
        ) : group ? (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2>Group Overview</h2>
              <span className={StatusCfg.color}>
                <StatusIcon className="inline w-3 h-3 mr-1" />{StatusCfg.label}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <InfoRow label="Group" value={group.groupName} />
              <InfoRow label="Leader" value={group.leader?.name} />
              <InfoRow label="Project" value={group.projectDetails?.title || 'Not submitted'} />
              <InfoRow label="Domain"  value={group.projectDetails?.domain  || '—'} />
              <InfoRow label="Guide"
                value={group.guide ? (
                  <div className="normal-case">
                    <span className="block capitalize">{group.guide.name}</span>
                    <span className="block text-[11px] text-gray-500 mt-0.5">
                      {group.guide.email} · {group.guide.phoneNumber || 'Phone not provided'} · {group.guide.department}
                    </span>
                  </div>
                ) : group.guideStatus === 'pending_consent' ? 'Awaiting consent' : 'Not assigned'} />
              <InfoRow label="Phase" value={group.phase?.replace('_', ' ')} />
            </div>
            {group.adminRemarks && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                <strong>Admin Remarks:</strong> {group.adminRemarks}
              </div>
            )}
          </div>
        ) : (
          <div className="card text-center py-10">
            <FiUsers className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">You're not part of any group yet.</p>
            <Link to="/student/group" className="btn-primary">Create or Join Group</Link>
          </div>
        )}

        {/* Group Chat Section */}
        {group && group.guide && ['accepted', 'pending_consent'].includes(group.guideStatus) && (
          <div className="card cursor-pointer hover:shadow-md transition-all duration-200 border-l-4 border-l-primary-500" onClick={openChat}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary-50 rounded text-primary-600">
                  <FiMessageSquare className="w-5 h-5" />
                </div>
                <h2 className="text-base font-semibold">Group Discussion Room</h2>
              </div>
              {chatSummary.unreadCount > 0 ? (
                <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full animate-bounce">
                  {chatSummary.unreadCount} New
                </span>
              ) : (
                <span className="text-xs text-gray-400 font-medium">Open Room →</span>
              )}
            </div>
            {chatSummary.lastMessage ? (
              <div className="bg-gray-50 rounded-lg p-3 text-sm border border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-700 text-xs flex items-center gap-1">
                    {chatSummary.lastMessage.sender.name}
                    <span className="text-[9px] bg-gray-200 text-gray-600 px-1 rounded uppercase font-bold">
                      {chatSummary.lastMessage.senderRole}
                    </span>
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {formatDistanceToNow(new Date(chatSummary.lastMessage.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-gray-600 text-xs truncate italic">
                  "{chatSummary.lastMessage.message}"
                </p>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No messages yet. Click to start collaborating in real-time!</p>
            )}
          </div>
        )}

        {/* Next meetings */}
        {upcomingMeetings.length > 0 && (
          <div className="card">
            <h2 className="mb-4">Upcoming Meetings</h2>
            <div className="space-y-3">
              {upcomingMeetings.slice(0, 3).map(m => (
                <div key={m._id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Meeting #{m.meetingNumber}</p>
                    <p className="text-xs text-gray-500">{new Date(m.scheduledDate).toDateString()} at {m.scheduledTime}</p>
                    <p className="text-xs text-gray-500">{m.mode} — {m.agenda}</p>
                  </div>
                  <span className="badge-info">{m.mode}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Chat Trigger */}
      {group && group.guide && ['accepted', 'pending_consent'].includes(group.guideStatus) && (
        <button
          onClick={openChat}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-primary-600 to-indigo-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 group hover:scale-105 animate-bounce"
        >
          <FiMessageSquare className="w-6 h-6" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-medium text-sm whitespace-nowrap">
            Group Chat
          </span>
          {chatSummary.unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ring-2 ring-white">
              {chatSummary.unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Group Chat Drawer */}
      {showChat && group && (
        <GroupChat
          groupId={group._id}
          groupName={group.groupName}
          members={group.members}
          guide={group.guide}
          onClose={() => setShowChat(false)}
        />
      )}
    </PageLayout>
  )
}

function StatCard({ icon: Icon, label, value, sub, color }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  }
  return (
    <div className="card flex items-start gap-4">
      <div className={`p-3 rounded-lg ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-gray-800 mt-0.5">{value}</p>
        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <div className="text-gray-800 font-medium capitalize">{value || '—'}</div>
    </div>
  )
}
