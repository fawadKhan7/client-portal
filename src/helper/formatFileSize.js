/**
 * Formats file size from bytes to human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size (e.g., "1.5 MB", "256 KB", "0 Bytes")
 */
export default function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  if (!bytes) return 'Unknown size'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
