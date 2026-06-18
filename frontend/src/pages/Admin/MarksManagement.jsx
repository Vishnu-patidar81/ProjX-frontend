import { useState, useEffect } from 'react'
import PageLayout from '../../components/common/PageLayout'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { FiPlus, FiDownload, FiFileText, FiLock } from 'react-icons/fi'
import Modal from '../../components/shared/Modal'

const MILESTONE_TYPES = [
  'Progress Review 1','Progress Review 2','Mid-Term',
  'Pre-Final','Final Presentation','Viva','Report Submission','Custom',
]

export default function MarksManagement() {
  const [groups, setGroups]       = useState([])
  const [evaluations, setEvals]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [marksModal, setMarksModal] = useState(null) // selected group
  const [submitting, setSubmitting] = useState(false)

    const [form, setForm] = useState({
    milestone: '', milestoneType: 'Custom', maxMarks: '100',
    overallComments: '', studentMarks: [],
  })

  // Progress supporting info states
  const [progressInfo, setProgressInfo] = useState(null)
  const [progressLoading, setProgressLoading] = useState(false)

  const fetchData = async () => {
    try {
      const [gRes, eRes] = await Promise.allSettled([
        api.get('/groups/all'),
        api.get('/evaluations/all'),
      ])
      if (gRes.status === 'fulfilled') setGroups(gRes.value.data.groups || [])
      if (eRes.status === 'fulfilled') setEvals(eRes.value.data.evaluations || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const openMarksModal = async (group) => {
    setMarksModal(group)
    setProgressInfo(null)
    setProgressLoading(true)
    // Pre-populate student marks array
    setForm(prev => ({
      ...prev,
      milestone: '', milestoneType: 'Custom', maxMarks: '100', overallComments: '',
      studentMarks: (group.members || []).map(m => ({
        student: m._id, name: m.name, enrollment: m.enrollmentNumber, marks: '', remarks: '',
      })),
    }))
    try {
      const { data } = await api.get(`/progress/group/${group._id}`)
      setProgressInfo(data)
    } catch (e) {
      console.error('Failed to fetch group progress supporting info:', e)
    } finally {
      setProgressLoading(false)
    }
  }

  const handleMarkChange = (idx, field, val) => {
    setForm(prev => {
      const sm = [...prev.studentMarks]
      sm[idx] = { ...sm[idx], [field]: val }
      return { ...prev, studentMarks: sm }
    })
  }

  const handleSubmitMarks = async (e) => {
    e.preventDefault()
    if (!form.milestone) return toast.error('Milestone name is required')
    setSubmitting(true)
    try {
      const payload = {
        groupId: marksModal._id,
        milestone: form.milestone,
        milestoneType: form.milestoneType,
        maxMarks: parseInt(form.maxMarks, 10),
        overallComments: form.overallComments,
        studentMarks: form.studentMarks.map(sm => ({
          student: sm.student,
          marks: parseFloat(sm.marks) || 0,
          remarks: sm.remarks,
        })),
      }
      await api.post('/evaluations', payload)
      toast.success('Marks saved!')
      setMarksModal(null)
      fetchData()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') } finally { setSubmitting(false) }
  }

  const handleFinalize = async (evalId) => {
    if (!window.confirm('Finalize this evaluation? It will be locked.')) return
    try {
      await api.put(`/evaluations/${evalId}/finalize`)
      toast.success('Evaluation finalized')
      fetchData()
    } catch { toast.error('Failed') }
  }

  const exportCSV = async () => {
    try {
      const res = await api.get('/evaluations/export/csv', { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }))
      const a   = document.createElement('a'); a.href = url; a.download = 'evaluations.csv'; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Export failed') }
  }

  const exportPDF = async () => {
    try {
      const { data } = await api.get('/evaluations/export/pdf')
      const byteChars = atob(data.pdfBase64)
      const bytes = new Uint8Array(byteChars.length).map((_, i) => byteChars.charCodeAt(i))
      const blob  = new Blob([bytes], { type: 'application/pdf' })
      const url   = URL.createObjectURL(blob)
      const a     = document.createElement('a'); a.href = url; a.download = data.filename; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Export failed') }
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1>Marks Management</h1>
          <div className="flex gap-2">
            <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 text-sm">
              <FiDownload className="w-4 h-4" /> CSV
            </button>
            <button onClick={exportPDF} className="btn-secondary flex items-center gap-2 text-sm">
              <FiFileText className="w-4 h-4" /> PDF
            </button>
          </div>
        </div>

        {/* Groups table */}
        <div className="card">
          <h2 className="mb-4">Groups</h2>
          {loading ? (
            <div className="animate-pulse space-y-2">{[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded" />)}</div>
          ) : (
            <>
              <div className="overflow-x-auto hidden md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-xs text-gray-400 pb-2">Group</th>
                      <th className="text-left text-xs text-gray-400 pb-2">Project</th>
                      <th className="text-left text-xs text-gray-400 pb-2">Members</th>
                      <th className="text-left text-xs text-gray-400 pb-2">Evaluations</th>
                      <th className="text-left text-xs text-gray-400 pb-2">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {groups.map(g => {
                      const groupEvals = evaluations.filter(ev => ev.group?._id === g._id)
                      return (
                        <tr key={g._id}>
                          <td className="py-2.5 font-medium">{g.groupName}</td>
                          <td className="py-2.5 text-gray-500">{g.projectDetails?.title || '—'}</td>
                          <td className="py-2.5">{g.members?.length}</td>
                          <td className="py-2.5">{groupEvals.length} milestone(s)</td>
                          <td className="py-2.5">
                            <button onClick={() => openMarksModal(g)}
                              className="btn-primary text-xs py-1 px-3 flex items-center gap-1">
                              <FiPlus className="w-3 h-3" /> Add/Update
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="block md:hidden space-y-3">
                {groups.map(g => {
                  const groupEvals = evaluations.filter(ev => ev.group?._id === g._id)
                  return (
                    <div key={g._id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 text-sm space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{g.groupName}</span>
                        <button onClick={() => openMarksModal(g)}
                          className="btn-primary text-xs py-1 px-3 flex items-center gap-1">
                          <FiPlus className="w-3.5 h-3.5" /> Add/Update
                        </button>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                        <p><strong className="text-gray-700 dark:text-gray-300">Project:</strong> {g.projectDetails?.title || '—'}</p>
                        <p><strong className="text-gray-700 dark:text-gray-300">Members:</strong> {g.members?.length}</p>
                        <p><strong className="text-gray-700 dark:text-gray-300">Evaluations:</strong> {groupEvals.length} milestone(s)</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* All Evaluations */}
        <div className="card">
          <h2 className="mb-4">All Evaluations</h2>
          {evaluations.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No evaluations recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {evaluations.map(ev => (
                <div key={ev._id} className="p-3 border border-gray-100 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-medium text-sm">{ev.group?.groupName}</span>
                      <span className="text-gray-400 text-xs mx-2">·</span>
                      <span className="text-sm text-gray-600">{ev.milestone}</span>
                      <span className={`ml-2 ${ev.isFinalized ? 'badge-approved' : 'badge-pending'}`}>
                        {ev.isFinalized ? 'Finalized' : 'Draft'}
                      </span>
                    </div>
                    {!ev.isFinalized && (
                      <button onClick={() => handleFinalize(ev._id)}
                        className="text-xs flex items-center gap-1 text-gray-500 hover:text-gray-800">
                        <FiLock className="w-3 h-3" /> Finalize
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ev.studentMarks?.map(sm => (
                      <span key={sm._id} className="text-xs bg-gray-50 text-gray-700 px-2 py-1 rounded">
                        {sm.student?.name}: <strong>{sm.marks}/{ev.maxMarks}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Marks Entry Modal */}
      <Modal isOpen={!!marksModal} onClose={() => setMarksModal(null)}
        title={`Enter Marks — ${marksModal?.groupName}`} size="lg">
        {marksModal && (
          <form onSubmit={handleSubmitMarks} className="space-y-4">
            {/* Supporting progress and activity info */}
            {progressLoading ? (
              <div className="animate-pulse bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-xs space-y-2 mb-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
              </div>
            ) : progressInfo ? (
              <div className="bg-gray-50 dark:bg-gray-800 p-3.5 rounded-xl border border-gray-150 dark:border-gray-700 text-xs space-y-3 mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-semibold text-gray-400 uppercase tracking-wider text-[10px]">Project Progress</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-bold text-sm text-gray-800 dark:text-gray-200">
                        {progressInfo.progress?.progressPercentage || 0}% Completed
                      </span>
                      <div className="w-24 bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden shrink-0">
                        <div className="bg-primary-600 h-full rounded-full" 
                          style={{ width: `${progressInfo.progress?.progressPercentage || 0}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 sm:border-l sm:border-gray-200 dark:sm:border-gray-700 sm:pl-4 text-gray-600 dark:text-gray-300">
                    <div>
                      <span className="block text-gray-450 font-semibold text-[9px] uppercase">Meetings Completed</span>
                      <span className="font-bold text-sm">{progressInfo.activity?.completedMeetings || 0}</span>
                    </div>
                    <div>
                      <span className="block text-gray-455 font-semibold text-[9px] uppercase">Reports Submitted</span>
                      <span className="font-bold text-sm">{progressInfo.activity?.reportsSubmitted || 0}</span>
                    </div>
                  </div>
                </div>
                {/* Last milestone and remarks */}
                {progressInfo.progress?.milestones && (
                  <div className="border-t border-gray-150 dark:border-gray-700 pt-2.5">
                    <span className="font-semibold text-gray-400 uppercase tracking-wider text-[9px]">Milestones & Remarks</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1 max-h-24 overflow-y-auto">
                      {progressInfo.progress.milestones.map(m => (
                        <div key={m.milestoneId} className="p-1.5 bg-white dark:bg-gray-905 rounded border border-gray-100 dark:border-gray-800 flex justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-[11px] text-gray-800 dark:text-gray-200 truncate">{m.title}</p>
                            {m.remarks && <p className="text-[10px] text-gray-400 italic truncate">"{m.remarks}"</p>}
                          </div>
                          <span className={`text-[9px] font-semibold uppercase px-1 rounded shrink-0 ${
                            m.status === 'Completed' ? 'text-green-600' :
                            m.status === 'In Progress' ? 'text-yellow-600' : 'text-blue-600'
                          }`}>
                            {m.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Milestone Name *</label>
                <input value={form.milestone}
                  onChange={e => setForm({...form, milestone: e.target.value})}
                  placeholder="e.g. Mid-Term Review" className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={form.milestoneType}
                  onChange={e => setForm({...form, milestoneType: e.target.value})}
                  className="input-field">
                  {MILESTONE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Marks</label>
              <input type="number" value={form.maxMarks}
                onChange={e => setForm({...form, maxMarks: e.target.value})}
                className="input-field w-32" min="1" max="200" />
            </div>

            {/* Per-student marks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Student Marks</label>
              <div className="space-y-2">
                {form.studentMarks.map((sm, idx) => (
                  <div key={sm.student} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 sm:p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{sm.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{sm.enrollment}</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <input type="number" value={sm.marks}
                        onChange={e => handleMarkChange(idx, 'marks', e.target.value)}
                        placeholder="Marks" className="input-field w-24 text-center shrink-0"
                        min="0" max={form.maxMarks} />
                      <input value={sm.remarks}
                        onChange={e => handleMarkChange(idx, 'remarks', e.target.value)}
                        placeholder="Remarks" className="input-field flex-1 text-sm" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Overall Comments</label>
              <textarea value={form.overallComments}
                onChange={e => setForm({...form, overallComments: e.target.value})}
                rows={2} className="input-field resize-none" placeholder="Overall feedback…" />
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Saving…' : 'Save Marks'}
            </button>
          </form>
        )}
      </Modal>
    </PageLayout>
  )
}
