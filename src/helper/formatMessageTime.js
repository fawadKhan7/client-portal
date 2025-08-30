/**
 * Formats a date string for message/conversation display
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted time (e.g., "Jan 15, 2:30 PM")
 */
export default function formatMessageTime(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
