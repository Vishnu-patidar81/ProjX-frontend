import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import PageLayout from '../../components/common/PageLayout'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { FiBarChart2, FiAward } from 'react-icons/fi'

export default function MyMarks() {
  const { user }  = useAuth()
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  const location = useLocation()
  const navigate = useNavigate()
  const { highlightId } = location.state || {}

  useEffect(() => {
    api.get('/evaluations/my-marks')
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (highlightId && data) {
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
  }, [highlightId, data])

  if (loading) return <PageLayout><div className="card animate-pulse h-48" /></PageLayout>

  const evaluations = data?.evaluations || []

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1>My Marks</h1>
          {data?.group && (
            <span className="badge-info">{data.group.groupName}</span>
          )}
        </div>

        {evaluations.length === 0 ? (
          <div className="card text-center py-12">
            <FiBarChart2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">No evaluations recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {evaluations.map((ev) => {
              // Find this student's marks in the evaluation
              const myMark = ev.studentMarks.find(
                sm => sm.student?._id === user._id || sm.student === user._id
              )
              const pct = myMark ? Math.round((myMark.marks / ev.maxMarks) * 100) : null

              return (
                <div key={ev._id} id={`card-${ev._id}`} className="card">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-800">{ev.milestone}</h3>
                      <p className="text-xs text-gray-400">{ev.milestoneType} · {new Date(ev.evaluationDate).toDateString()}</p>
                      <p className="text-xs text-gray-400">Evaluated by: {ev.evaluatedBy?.name}</p>
                    </div>
                    {myMark && (
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary-600">{myMark.marks}</p>
                        <p className="text-xs text-gray-400">/ {ev.maxMarks}</p>
                        <div className={`text-xs font-medium mt-1 ${pct >= 60 ? 'text-green-600' : 'text-red-500'}`}>
                          {pct}%
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  {myMark && (
                    <div className="mb-3">
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {myMark?.remarks && (
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      <strong>Remarks:</strong> {myMark.remarks}
                    </p>
                  )}

                  {ev.overallComments && (
                    <p className="text-sm text-gray-600 mt-2">
                      <strong>Overall Comments:</strong> {ev.overallComments}
                    </p>
                  )}

                  {/* All group members' marks */}
                  <div className="mt-4 border-t border-gray-100 pt-3">
                    <p className="text-xs text-gray-400 font-medium uppercase mb-2">Group Marks</p>
                    <div className="space-y-1">
                      {ev.studentMarks.map(sm => (
                        <div key={sm._id} className="flex items-center justify-between text-sm">
                          <span className={`${sm.student?._id === user._id ? 'font-semibold text-primary-700' : 'text-gray-600'}`}>
                            {sm.student?.name} {sm.student?._id === user._id && '(you)'}
                          </span>
                          <span className="font-medium">{sm.marks}/{ev.maxMarks}</span>
                        </div>
                      ))}
                    </div>
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
