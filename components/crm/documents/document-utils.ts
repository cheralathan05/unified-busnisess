export interface CRMDocument {

  id: string
  leadId: string
  name: string
  size: number
  type: "proposal" | "contract" | "invoice" | "other"
  url: string
  createdAt: Date

}

export function formatFileSize(bytes: number) {

  if (bytes === 0) return "0 KB"

  const kb = bytes / 1024

  if (kb < 1024) return kb.toFixed(1) + " KB"

  return (kb / 1024).toFixed(1) + " MB"

}