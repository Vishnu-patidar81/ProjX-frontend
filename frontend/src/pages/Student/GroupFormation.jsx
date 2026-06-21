import { useState, useEffect } from 'react'
import PageLayout from '../../components/common/PageLayout'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { FiPlus, FiTrash2, FiSend, FiEdit3, FiUsers } from 'react-icons/fi'
import Modal from '../../components/shared/Modal'

const DOMAINS = ['Web Development', 'Mobile Development', 'Machine Learning', 'Data Science', 'IoT', 'Cybersecurity', 'Cloud Computing', 'Blockchain', 'AR/VR', 'Other']
const CATEGORIES = ['Research', 'Development', 'Design', 'Analysis', 'Other']

export default function GroupFormation() {
  const { user } = useAuth()
  const [group, setGroup] = useState(null)
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showProject, setShowProject] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [newEnrollment, setNewEnrollment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [createForm, setCreateForm] = useState({ groupName: '', memberEnrollments: '' })
  const [projectForm, setProjectForm] = useState({ title: '', description: '', domain: '', category: '', techStack: '' })

  const getStatusClass = (status) => {
    if (status === 'Completed') return 'badge-approved'
    if (status === 'In Progress') return 'badge-pending'
    return 'badge-info'
  }

  const fetchGroup = async () => {
    try {
      const { data } = await api.get('/groups/my-group')
      setGroup(data.group)
      if (data.group.projectDetails?.title) {
        setProjectForm({
          title: data.group.projectDetails.title,
          description: data.group.projectDetails.description || '',
          domain: data.group.projectDetails.domain || '',
          category: data.group.projectDetails.category || '',
          techStack: (data.group.projectDetails.techStack || []).join(', '),
        })
      }
      if (data.group && data.group.projectStatus === 'approved') {
        try {
          const pRes = await api.get(`/progress/group/${data.group._id}`)
          setProgress(pRes.data.progress)
        } catch (e) {
          console.error('Failed to fetch progress:', e)
        }
      }
    } catch { setGroup(null) } finally { setLoading(false) }
  }

  useEffect(() => { fetchGroup() }, [])

  const isLeader = group?.leader?._id === user?._id || group?.leader === user?._id

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const enrollments = createForm.memberEnrollments
        ? createForm.memberEnrollments.split(',').map(s => s.trim()).filter(Boolean)
        : []
      await api.post('/groups', { groupName: createForm.groupName, memberEnrollments: enrollments })
      toast.success('Group created!')
      setShowCreate(false)
      fetchGroup()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') } finally { setSubmitting(false) }
  }

  const handleProjectSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const techStack = projectForm.techStack.split(',').map(s => s.trim()).filter(Boolean)
      await api.post('/projects/submit', { ...projectForm, techStack })
      toast.success('Project submitted for approval!')
      setShowProject(false)
      fetchGroup()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') } finally { setSubmitting(false) }
  }

  const handleAddMember = async (e) => {
    e.preventDefault()
    if (!newEnrollment) return
    setSubmitting(true)
    try {
      await api.post('/groups/add-member', { enrollmentNumber: newEnrollment })
      toast.success('Member added!')
      setNewEnrollment('')
      setShowAddMember(false)
      fetchGroup()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') } finally { setSubmitting(false) }
  }

  const handleRemoveMember = async (memberId, name) => {
    if (!window.confirm(`Remove ${name} from group?`)) return
    try {
      await api.delete(`/groups/remove-member/${memberId}`)
      toast.success('Member removed')
      fetchGroup()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const statusBadge = (s) => {
    const map = { not_submitted: 'badge-info', pending: 'badge-pending', approved: 'badge-approved', rejected: 'badge-rejected' }
    return map[s] || 'badge-info'
  }

  if (loading) return <PageLayout><div className="card animate-pulse h-48" /></PageLayout>

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1>My Group & Project</h1>
          {!group && (
            <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
              <FiPlus className="w-4 h-4" /> Create Group
            </button>
          )}
        </div>

        {!group ? (
          <div className="card text-center py-12">
            <FiUsers className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">You are not part of any group. Create one to get started.</p>
          </div>
        ) : (
          <>
            {/* Group Info */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2>{group.groupName}</h2>
                {isLeader && (
                  <button onClick={() => setShowAddMember(true)} className="btn-secondary flex items-center gap-2 text-sm">
                    <FiPlus className="w-4 h-4" /> Add Member
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {group.members?.map(m => (
                  <div key={m._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{m.name}</p>
                      <p className="text-xs text-gray-500">{m.enrollmentNumber} · {m.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {group.leader?._id === m._id && (
                        <span className="badge-info">Leader</span>
                      )}
                      {isLeader && group.leader?._id !== m._id && (
                        <button onClick={() => handleRemoveMember(m._id, m.name)}
                          className="text-red-400 hover:text-red-650 p-1">
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Project Section */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2>Project Registration</h2>
                {isLeader && group.projectStatus !== 'approved' && (
                  <button onClick={() => setShowProject(true)} className="btn-primary flex items-center gap-2 text-sm">
                    <FiEdit3 className="w-4 h-4" />
                    {group.projectStatus === 'not_submitted' ? 'Submit Project' : 'Edit & Resubmit'}
                  </button>
                )}
              </div>

              {group.projectDetails?.title ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className={statusBadge(group.projectStatus)}>
                      {group.projectStatus.replace('_', ' ')}
                    </span>
                    {group.projectStatus === 'approved' && (
                      <span className="text-sm text-green-600">
                        {group.guide ? '✓ Guide assignment completed' : '✓ Guide assignment in progress'}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div><p className="text-xs text-gray-400">Title</p><p className="font-medium">{group.projectDetails.title}</p></div>
                    <div><p className="text-xs text-gray-400">Domain</p><p className="font-medium">{group.projectDetails.domain}</p></div>
                    <div><p className="text-xs text-gray-400">Category</p><p className="font-medium">{group.projectDetails.category}</p></div>
                    <div><p className="text-xs text-gray-400">Tech Stack</p><p className="font-medium">{group.projectDetails.techStack?.join(', ') || '—'}</p></div>
                  </div>
                  <div><p className="text-xs text-gray-400">Description</p><p className="text-sm text-gray-700">{group.projectDetails.description}</p></div>
                  {group.adminRemarks && (
                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-250">
                      <p className="text-xs font-semibold text-yellow-700">Admin Remarks</p>
                      <p className="text-sm text-yellow-800">{group.adminRemarks}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">
                  {isLeader ? 'No project submitted yet. Click "Submit Project" to begin.' : 'Waiting for group leader to submit project details.'}
                </p>
              )}
            </div>

            {/* Guide Status */}
            {group.projectStatus === 'approved' && (
              <div className="card">
                <h2 className="mb-3">Guide Assignment</h2>
                {group.guide ? (
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-700 font-bold text-sm">G</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{group.guide.name}</p>
                      <p className="text-xs text-gray-550">{group.guide.email} · {group.guide.phoneNumber || 'Phone not provided'} · {group.guide.department}</p>
                      <span className={group.guideStatus === 'accepted' ? 'badge-approved' : 'badge-pending'}>
                        {group.guideStatus === 'accepted' ? 'Guide Accepted' : 'Awaiting Consent'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">Admin will assign a guide shortly.</p>
                )}
              </div>
            )}

            {/* Project Progress */}
            {group.projectStatus === 'approved' && progress && (
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2>Project Progress</h2>
                  <span className="text-lg font-bold text-primary-600">{progress.progressPercentage}%</span>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-primary-600 h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress.progressPercentage}%` }} />
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {progress.milestones?.map(m => (
                      <div key={m.milestoneId} className="py-3 flex flex-col sm:flex-row sm:items-start justify-between gap-2 text-sm">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800 dark:text-gray-205">Milestone {m.milestoneId}: {m.title}</p>
                          {m.remarks && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              <span className="font-semibold text-gray-400">Remarks:</span> {m.remarks}
                            </p>
                          )}
                        </div>
                        <span className={`badge ${getStatusClass(m.status)} text-[10px] shrink-0`}>
                          {m.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Group Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Group">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Group Name *</label>
            <input value={createForm.groupName} onChange={e => setCreateForm({ ...createForm, groupName: e.target.value })}
              placeholder="Team Alpha" className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Member Enrollment Numbers (comma-separated)
            </label>
            <input value={createForm.memberEnrollments}
              onChange={e => setCreateForm({ ...createForm, memberEnrollments: e.target.value })}
              placeholder="0101CS21001, 0101CS21002" className="input-field" />
            <p className="text-xs text-gray-400 mt-1">Leave blank to add members later</p>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Creating…' : 'Create Group'}
          </button>
        </form>
      </Modal>

      {/* Submit Project Modal */}
      <Modal isOpen={showProject} onClose={() => setShowProject(false)} title="Submit Project Details" size="lg">
        <form onSubmit={handleProjectSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Title *</label>
            <input value={projectForm.title} onChange={e => setProjectForm({ ...projectForm, title: e.target.value })}
              placeholder="Smart Attendance System" className="input-field" required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Domain *</label>
              <select value={projectForm.domain} onChange={e => setProjectForm({ ...projectForm, domain: e.target.value })}
                className="input-field" required>
                <option value="">Select domain</option>
                {DOMAINS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select value={projectForm.category} onChange={e => setProjectForm({ ...projectForm, category: e.target.value })}
                className="input-field" required>
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tech Stack (comma-separated)</label>
            <input value={projectForm.techStack} onChange={e => setProjectForm({ ...projectForm, techStack: e.target.value })}
              placeholder="React, Node.js, MongoDB" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea value={projectForm.description} onChange={e => setProjectForm({ ...projectForm, description: e.target.value })}
              rows={4} placeholder="Brief description of your project..." className="input-field resize-none" required />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-2">
            <FiSend className="w-4 h-4" />
            {submitting ? 'Submitting…' : 'Submit for Approval'}
          </button>
        </form>
      </Modal>

      {/* Add Member Modal */}
      <Modal isOpen={showAddMember} onClose={() => setShowAddMember(false)} title="Add Group Member">
        <form onSubmit={handleAddMember} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student Enrollment Number</label>
            <input value={newEnrollment} onChange={e => setNewEnrollment(e.target.value)}
              placeholder="0101CS21005" className="input-field" required />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Adding…' : 'Add Member'}
          </button>
        </form>
      </Modal>
    </PageLayout>
  )
}
