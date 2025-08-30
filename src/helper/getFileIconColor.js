/**
 * Returns appropriate Tailwind color class based on file extension
 * @param {string} filename - The filename to check extension for
 * @returns {string} - Tailwind color class (e.g., "text-red-500")
 */
export default function getFileIconColor(filename) {
  const ext = filename?.split('.').pop()?.toLowerCase()
  const colorMap = {
    pdf: 'text-red-500',
    doc: 'text-blue-500', 
    docx: 'text-blue-500',
    jpg: 'text-green-500', 
    jpeg: 'text-green-500', 
    png: 'text-green-500',
    zip: 'text-purple-500', 
    rar: 'text-purple-500',
    txt: 'text-gray-500'
  }
  return colorMap[ext] || 'text-gray-500'
}
