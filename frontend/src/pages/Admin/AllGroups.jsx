import { useState, useEffect } from 'react'
import PageLayout from '../../components/common/PageLayout'
import api from '../../services/api'
import { FiSearch, FiUsers } from 'react-icons/fi'
import Modal from '../../components/shared/Modal'

export default function AllGroups() {
  const [groups, setGroups]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState('all')
  const [detail, setDetail]   = useState(null)

  useEffect(() => {
    api.get('/groups/all')
      .then(res => setGroups(res.data.groups || []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = groups.filter(g => {
    const matchSearch = search
      ? g.groupName.toLowerCase().includes(search.toLowerCase()) ||
        g.projectDetails?.title?.toLowerCase().includes(search.toLowerCase()) ||
        g.leader?.name?.toLowerCase().includes(search.toLowerCase())
      : true
    const matchFilter = filter === 'all' || g.projectStatus === filter
    return matchSearch && matchFilter
  })

  const statusBadge = (s) => ({
    not_submitted: 'badge-info', pending: 'badge-pending',
    approved: 'badge-approved', rejected: 'badge-rejected',
  })[s] || 'badge-info'

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1>All Groups ({groups.length})</h1>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by group, project, or leader…"
              className="input-field pl-10" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 max-w-full scrollbar-none whitespace-nowrap">
            {['all','pending','approved','rejected','not_submitted'].map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors inline-block
                  ${filter === s ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="card animate-pulse h-64" />
        ) : filtered.length === 0 ? (
          <div className="card text-center py-12">
            <FiUsers className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">No groups found.</p>
          </div>
        ) : (
          <>
            <div className="card overflow-x-auto hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs text-gray-400 pb-3">#</th>
                    <th className="text-left text-xs text-gray-400 pb-3">Group</th>
                    <th className="text-left text-xs text-gray-400 pb-3">Leader</th>
                    <th className="text-left text-xs text-gray-400 pb-3">Project</th>
                    <th className="text-left text-xs text-gray-400 pb-3">Status</th>
                    <th className="text-left text-xs text-gray-400 pb-3">Guide</th>
                    <th className="text-left text-xs text-gray-400 pb-3">Members</th>
                    <th className="text-left text-xs text-gray-400 pb-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((g, i) => (
                    <tr key={g._id} className="hover:bg-gray-50">
                      <td className="py-3 text-gray-400">{i + 1}</td>
                      <td className="py-3 font-medium">{g.groupName}</td>
                      <td className="py-3 text-gray-600">
                        <div>{g.leader?.name}</div>
                        <div className="text-xs text-gray-400">{g.leader?.enrollmentNumber}</div>
                      </td>
                      <td className="py-3 text-gray-500">{g.projectDetails?.title || '—'}</td>
                      <td className="py-3">
                        <span className={statusBadge(g.projectStatus)}>
                          {g.projectStatus?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 text-gray-500">{g.guide?.name || '—'}</td>
                      <td className="py-3 text-center">{g.members?.length || 0}</td>
                      <td className="py-3">
                        <button onClick={() => setDetail(g)}
                          className="text-primary-600 text-xs hover:underline">Details</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="block md:hidden space-y-3">
              {filtered.map((g, i) => (
                <div key={g._id} className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xs text-gray-400">#{i + 1}</span>
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm ml-1.5 inline-block">{g.groupName}</h3>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(g.projectStatus)}`}>
                      {g.projectStatus?.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <p><strong className="text-gray-700 dark:text-gray-300">Project:</strong> {g.projectDetails?.title || '—'}</p>
                    <p><strong className="text-gray-700 dark:text-gray-300">Leader:</strong> {g.leader?.name} ({g.leader?.enrollmentNumber})</p>
                    <p><strong className="text-gray-700 dark:text-gray-300">Guide:</strong> {g.guide?.name || '—'}</p>
                    <p><strong className="text-gray-700 dark:text-gray-300">Members:</strong> {g.members?.length || 0}</p>
                  </div>
                  <div className="pt-2 border-t border-gray-50 dark:border-gray-850 flex justify-end">
                    <button onClick={() => setDetail(g)} className="btn-secondary py-1.5 px-3 text-xs">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      <Modal isOpen={!!detail} onClose={() => setDetail(null)}
        title={detail?.groupName} size="lg">
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <Info label="Project" value={detail.projectDetails?.title} />
              <Info label="Domain"  value={detail.projectDetails?.domain} />
              <Info label="Category" value={detail.projectDetails?.category} />
              <Info label="Phase" value={detail.phase?.replace('_',' ')} />
              <Info label="Guide Status" value={detail.guideStatus?.replace('_',' ')} />
              <Info label="Year" value={detail.academicYear} />
            </div>

            {detail.projectDetails?.description && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Description</p>
                <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{detail.projectDetails.description}</p>
              </div>
            )}

            <div>
              <p className="text-xs text-gray-400 mb-2 uppercase font-medium">Members</p>
              <div className="space-y-1">
                {detail.members?.map(m => (
                  <div key={m._id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                    <div>
                      <span className="text-sm font-medium">{m.name}</span>
                      {detail.leader?._id === m._id && <span className="ml-2 badge-info">Leader</span>}
                    </div>
                    <span className="ml-auto text-xs text-gray-400">{m.enrollmentNumber}</span>
                  </div>
                ))}
              </div>
            </div>

            {detail.guide && (
              <div>
                <p className="text-xs text-gray-400 mb-1 uppercase font-medium">Assigned Guide</p>
                <p className="text-sm font-medium">{detail.guide.name}</p>
                <p className="text-xs text-gray-400">{detail.guide.email}</p>
              </div>
            )}

            {detail.adminRemarks && (
              <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                <strong>Remarks:</strong> {detail.adminRemarks}
              </div>
            )}
          </div>
        )}
      </Modal>
    </PageLayout>
  )
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="font-medium capitalize">{value || '—'}</p>
    </div>
  )
}
