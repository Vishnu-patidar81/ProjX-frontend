import axios from 'axios'
import api from '../services/api'

/**
 * Reusable ImageKit upload service.
 * Automatically organizes uploads into folders based on collegeId/moduleName.
 * Example: collegeId/announcements, collegeId/student-submissions, etc.
 * 
 * @param {File} file - The file to upload.
 * @param {string} moduleName - The module folder identifier (e.g. 'announcements', 'student-submissions', 'meeting-reports', 'profile-images', 'chat-files').
 * @param {Object} user - The current logged in user object to derive collegeId.
 * @returns {Promise<Object>} The upload result containing url, fileId, name, size etc.
 */
export const uploadToImageKit = async (file, moduleName, user) => {
  // 1. Get ImageKit Signature from backend
  const { data: auth } = await api.get('/submissions/imagekit-auth')

  const collegeId = user?.collegeId || 'default-college'
  const folder = `${collegeId}/${moduleName}`

  if (!auth.publicKey || auth.publicKey === 'your_public_key' || auth.publicKey === 'dummy_public_key' || auth.publicKey.startsWith('your_')) {
    // Dev Mock Fallback
    await new Promise(resolve => setTimeout(resolve, 1000))
    return {
      name: file.name,
      url: `https://ik.imagekit.io/demo/${folder}/mock_${Date.now()}_${file.name}`,
      fileId: `file_${Math.random().toString(36).substring(2, 9)}`,
      size: file.size
    }
  } else {
    // 2. Post file directly to ImageKit
    const uploadFormData = new FormData()
    uploadFormData.append('file', file)
    uploadFormData.append('fileName', file.name)
    uploadFormData.append('publicKey', auth.publicKey)
    uploadFormData.append('signature', auth.signature)
    uploadFormData.append('expire', auth.expire)
    uploadFormData.append('token', auth.token)
    uploadFormData.append('useUniqueFileName', 'true')
    uploadFormData.append('folder', folder)

    const response = await axios.post(
      'https://upload.imagekit.io/api/v1/files/upload',
      uploadFormData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response.data
  }
}

/**
 * Resolves a file URL to make it absolute if it is a relative path.
 * If the path starts with http/https, it returns it as is.
 * 
 * @param {string} path - The file path (ImageKit URL or relative path like /uploads/...)
 * @returns {string} The fully qualified URL
 */
export const resolveFileUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  // Path is relative, resolve with backend host (derived from VITE_API_URL)
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
  const host = apiUrl.replace(/\/api\/?$/, '')
  return `${host}${path.startsWith('/') ? '' : '/'}${path}`
}
