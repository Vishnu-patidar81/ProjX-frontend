import { FiX } from 'react-icons/fi'

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null

  const sizeClasses = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
    xl: 'sm:max-w-4xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/45 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />
      {/* Panel */}
      <div className={`relative bg-white dark:bg-gray-900 shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] sm:max-h-[85vh] flex flex-col rounded-t-2xl sm:rounded-xl border border-gray-100 dark:border-gray-800`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4 text-gray-700 dark:text-gray-300">{children}</div>
      </div>
    </div>
  )
}
