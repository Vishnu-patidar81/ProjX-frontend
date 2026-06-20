import { useAuth } from '../../context/AuthContext'
import { FiLogOut, FiAward, FiShield } from 'react-icons/fi'

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-primary-600 text-white p-2 rounded-lg">
            <FiShield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">ProjX Super Admin Console</h1>
            <p className="text-xs text-gray-500">System Configuration Portal</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 font-medium">Logged in as {user?.email}</span>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors border border-red-200"
          >
            <FiLogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-12 flex flex-col justify-center items-center text-center">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8 md:p-12 max-w-lg w-full flex flex-col items-center">
          <div className="bg-emerald-100 text-emerald-600 p-4 rounded-2xl mb-6">
            <FiAward className="w-12 h-12 animate-pulse" />
          </div>

          <h2 className="text-3xl font-extrabold text-gray-800 mb-2">Super Admin</h2>
          <p className="text-emerald-600 font-semibold text-lg bg-emerald-50 px-4 py-1.5 rounded-full mb-6 inline-block">
            Authentication Foundation Completed
          </p>
          
          <div className="border-t border-gray-100 pt-6 w-full text-left space-y-4">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <span className="text-xs uppercase tracking-wider text-gray-400 font-bold block mb-1">Status Report</span>
              <p className="text-sm font-medium text-gray-700">ERP Phase 3B Pending (Invite & Activation System)</p>
            </div>
            <p className="text-xs text-gray-400 text-center">
              All essential schemas, database seeders, and routing overrides have been initialized for Phase 3A.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
