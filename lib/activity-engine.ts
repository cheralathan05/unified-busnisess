export interface Activity {

  id: string
  leadId: string
  type:
    | "lead_created"
    | "email_sent"
    | "call_made"
    | "status_changed"
    | "note_added"

  message: string
  timestamp: Date

}

export function createActivity(
  leadId: string,
  type: Activity["type"],
  message: string
): Activity {

  return {

    id: Date.now().toString(),
    leadId,
    type,
    message,
    timestamp: new Date()

  }

}