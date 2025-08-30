/**
 * Formats a date string into a standard localized format
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted date (e.g., "Jan 15, 2024, 2:30 PM")
 */
export default function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
