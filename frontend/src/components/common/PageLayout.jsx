/**
 * PageLayout - wraps every authenticated page with Navbar + Sidebar
 */
import { useState } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

export default function PageLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 transition-colors duration-200">
      <Navbar onToggleSidebar={() => setSidebarOpen(prev => !prev)} />
      <div className="flex flex-1 relative">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 p-4 sm:p-6 bg-gray-50 dark:bg-gray-950 overflow-auto w-full max-w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
