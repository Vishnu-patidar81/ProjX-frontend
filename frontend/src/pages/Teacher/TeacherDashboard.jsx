import { useEffect, useState } from 'react'
import PageLayout from '../../components/common/PageLayout'
import api from '../../services/api'
import { FiUsers, FiCheckSquare, FiUserCheck, FiAlertCircle, FiFileText } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import GroupSearch from '../../components/shared/GroupSearch'

export default function TeacherDashboard() {
  const { user } = useAuth()
  const [stats, setStats]   = useState({ groups: 0, pending: 0, approved: 0 })
  const [recentGroups, setRecentGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSearchActive, setIsSearchActive] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [gRes, pRes] = await Promise.allSettled([
          api.get('/groups/all'),
          api.get('/projects/pending'),
        ])
        if (gRes.status === 'fulfilled') {
          const groups = gRes.value.data.groups || []
          setRecentGroups(groups.slice(0, 5))
          setStats(prev => ({
            ...prev,
            groups: groups.length,
            approved: groups.filter(g => g.projectStatus === 'approved').length,
          }))
        }
        if (pRes.status === 'fulfilled') {
          setStats(prev => ({ ...prev, pending: pRes.value.data.total || 0 }))
        }
      } finally { setLoading(false) }
    }
    load()
  }, [])

  const cards = [
    { label: 'Pending Approvals', value: stats.pending, icon: FiAlertCircle, color: 'yellow', link: '/teacher/approvals' },
    { label: 'Approved Projects', value: stats.approved, icon: FiCheckSquare, color: 'green', link: '/teacher/marks' },
    { label: 'Total Groups', value: stats.groups, icon: FiUsers, color: 'blue', link: '/teacher/marks' },
  ]

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-md">
          <h1 className="text-xl font-bold">Teacher Dashboard</h1>
          <p className="text-blue-100 text-sm mt-1">Manage project submissions, guide allocations, and milestone marks</p>
        </div>

        {/* Group Search Bar */}
        <GroupSearch onSearchActive={setIsSearchActive} />

        {!isSearchActive ? (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cards.map(({ label, value, icon: Icon, color, link }) => (
                <Link to={link} key={label}
                  className="card flex items-start gap-3 hover:shadow-md transition-shadow bg-white p-4 border border-gray-100 rounded-xl">
                  <div className={`p-2.5 rounded-lg ${
                    color === 'yellow' ? 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950/30 dark:text-yellow-400' :
                    color === 'green' ? 'bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400' :
                    'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">{label}</p>
                    <p className="text-2xl font-bold text-gray-800">{loading ? '…' : value}</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              <Link to="/teacher/approvals" className="card flex items-center gap-3 hover:shadow-md transition-shadow bg-white p-4 border border-gray-100 rounded-xl">
                <div className="p-3 bg-yellow-50 rounded-lg"><FiCheckSquare className="w-6 h-6 text-yellow-600" /></div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Review Submissions</p>
                  <p className="text-xs text-gray-400">{stats.pending} pending</p>
                </div>
              </Link>
              <Link to="/teacher/guide-assign" className="card flex items-center gap-3 hover:shadow-md transition-shadow bg-white p-4 border border-gray-100 rounded-xl">
                <div className="p-3 bg-green-50 rounded-lg"><FiUserCheck className="w-6 h-6 text-green-600" /></div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Allocate Guides</p>
                  <p className="text-xs text-gray-400">Assign faculty guides</p>
                </div>
              </Link>
              <Link to="/teacher/marks" className="card flex items-center gap-3 hover:shadow-md transition-shadow bg-white p-4 border border-gray-100 rounded-xl">
                <div className="p-3 bg-blue-50 rounded-lg"><FiUsers className="w-6 h-6 text-blue-600" /></div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Marks Management</p>
                  <p className="text-xs text-gray-400">Manage review evaluations</p>
                </div>
              </Link>
              <Link to="/teacher/reports" className="card flex items-center gap-3 hover:shadow-md transition-shadow bg-white p-4 border border-gray-100 rounded-xl">
                <div className="p-3 bg-purple-50 rounded-lg"><FiFileText className="w-6 h-6 text-purple-600" /></div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Meeting Reports</p>
                  <p className="text-xs text-gray-400">Verify guide reports</p>
                </div>
              </Link>
              {user?.isClassTeacher && (
                <Link to="/teacher/students" className="card flex items-center gap-3 hover:shadow-md transition-shadow bg-white p-4 border border-gray-100 rounded-xl">
                  <div className="p-3 bg-indigo-50 rounded-lg"><FiUsers className="w-6 h-6 text-indigo-600" /></div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">Student Management</p>
                    <p className="text-xs text-gray-400">Manage classroom students</p>
                  </div>
                </Link>
              )}
            </div>

            {/* Active project listing */}
            <div className="card bg-white p-6 border border-gray-100 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">Recent Group Activity</h2>
              </div>
              {loading ? (
                <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div>
              ) : (
                <>
                  <div className="overflow-x-auto hidden md:block">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-400 text-xs font-semibold uppercase">
                          <th className="text-left pb-2">Group</th>
                          <th className="text-left pb-2">Project</th>
                          <th className="text-left pb-2">Status</th>
                          <th className="text-left pb-2">Guide</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {recentGroups.map(g => (
                          <tr key={g._id}>
                            <td className="py-3 font-semibold text-gray-700">{g.groupName}</td>
                            <td className="py-3 text-gray-500">{g.projectDetails?.title || '—'}</td>
                            <td className="py-3">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                g.projectStatus === 'approved' ? 'bg-green-100 text-green-800' :
                                g.projectStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                                g.projectStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {g.projectStatus?.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-3 text-gray-500">{g.guide?.name || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="block md:hidden space-y-3">
                    {recentGroups.map(g => (
                      <div key={g._id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 text-sm space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-800 dark:text-gray-200">{g.groupName}</span>
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            g.projectStatus === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                            g.projectStatus === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                            g.projectStatus === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {g.projectStatus?.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                          <p><strong className="text-gray-700 dark:text-gray-300">Project:</strong> {g.projectDetails?.title || '—'}</p>
                          <p><strong className="text-gray-700 dark:text-gray-300">Guide:</strong> {g.guide?.name || '—'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        ) : null}
      </div>
    </PageLayout>
  )
}
