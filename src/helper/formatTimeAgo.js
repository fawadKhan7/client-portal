/**
 * Formats a date string into a relative time display
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted relative time (e.g., "2 hours ago", "Just now")
 */
export default function formatTimeAgo(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = (now - date) / (1000 * 60 * 60)

  if (diffInHours < 1) return 'Just now'
  if (diffInHours < 24) return `${Math.floor(diffInHours)} hours ago`
  if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`
  return date.toLocaleDateString()
}
