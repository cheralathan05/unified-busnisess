export interface CallLog {

  id: string
  leadId: string
  duration: number
  note: string
  createdAt: Date

}

export function formatDuration(sec: number) {

  const minutes = Math.floor(sec / 60)
  const seconds = sec % 60

  return `${minutes}:${seconds}`

}