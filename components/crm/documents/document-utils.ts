/*
=====================================
CRM Document Interface
Matches Backend Document Model
=====================================
*/

export interface CRMDocument {

  id: string

  leadId?: string

  name: string

  type: string        // MIME type from backend

  size: number

  url: string

  createdAt?: string

}

/*
=====================================
Format File Size Utility
=====================================
*/

export function formatFileSize(bytes: number) {

  if (!bytes) return "0 KB"

  const kb = bytes / 1024

  if (kb < 1024)
    return kb.toFixed(1) + " KB"

  const mb = kb / 1024

  if (mb < 1024)
    return mb.toFixed(1) + " MB"

  const gb = mb / 1024

  return gb.toFixed(1) + " GB"

}

/*
=====================================
Get File Type Label
=====================================
*/

export function getFileType(type: string) {

  if (!type) return "File"

  if (type.includes("pdf"))
    return "PDF"

  if (type.includes("image"))
    return "Image"

  if (type.includes("word"))
    return "Document"

  if (type.includes("excel"))
    return "Spreadsheet"

  return "File"

}