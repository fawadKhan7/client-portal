import React from 'react'
import { PdfIcon, WordIcon, ExcelIcon, ImageIcon, FileIcon } from '@/components/icons'

/**
 * Returns appropriate file icon component based on MIME type or filename extension
 * @param {string} fileName - The filename
 * @param {string} fileType - The MIME type of the file
 * @param {string} className - CSS class for the icon (default: "w-6 h-6")
 * @returns {JSX.Element} - React icon component with appropriate styling
 */
export default function getFileIcon(fileName, fileType, className = "w-6 h-6") {
  // Try to determine type from MIME type first
  const mimeTypeIcons = {
    'application/pdf': <PdfIcon className={`${className} text-red-500`} />,
    'application/msword': <WordIcon className={`${className} text-blue-500`} />,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': <WordIcon className={`${className} text-blue-500`} />,
    'application/vnd.ms-excel': <ExcelIcon className={`${className} text-green-500`} />,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': <ExcelIcon className={`${className} text-green-500`} />
  }

  if (mimeTypeIcons[fileType]) {
    return mimeTypeIcons[fileType]
  }

  // Fallback to filename extension
  const ext = fileName?.split('.').pop()?.toLowerCase()
  
  switch (ext) {
    case 'pdf':
      return <PdfIcon className={`${className} text-red-500`} />
    case 'doc':
    case 'docx':
      return <WordIcon className={`${className} text-blue-500`} />
    case 'xls':
    case 'xlsx':
      return <ExcelIcon className={`${className} text-green-500`} />
    case 'txt':
      return <FileIcon className={`${className} text-gray-500`} />
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return <ImageIcon className={`${className} text-purple-500`} />
    default:
      return <FileIcon className={`${className} text-gray-500`} />
  }
}
