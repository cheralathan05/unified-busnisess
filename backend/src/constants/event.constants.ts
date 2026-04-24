export const EVENTS = {
  LEAD_CREATED: "lead.created",
  LEAD_UPDATED: "lead.updated",
  LEAD_DELETED: "lead.deleted",
  LEAD_AT_RISK: "lead.atRisk",
  LEAD_INACTIVE: "lead.inactive",

  ACTIVITY_CREATED: "activity.created",
  PAYMENT_INITIATED: "payment.initiated",
  PAYMENT_COMPLETED: "payment.completed",
  PAYMENT_SUCCESS: "payment.success",
  PAYMENT_FAILED: "payment.failed",
  PAYMENT_PARTIAL: "payment.partial",
  PAYMENT_PROOF_UPLOADED: "payment.proof.uploaded",
  PAYMENT_VERIFICATION_COMPLETED: "payment.verification.completed",

  INVOICE_CREATED: "invoice.created",
  INVOICE_OVERDUE: "invoice.overdue",

  EMAIL_SENT: "email.sent",
  EMAIL_OPENED: "email.opened",
  EMAIL_REPLIED: "email.replied",
  WHATSAPP_SENT: "whatsapp.sent",
  WHATSAPP_REPLIED: "whatsapp.replied",
  CALL_SCHEDULED: "call.scheduled",
  MEETING_SCHEDULED: "meeting.scheduled",
  MEETING_COMPLETED: "meeting.completed",
  MEETING_MISSED: "meeting.missed",
  CALL_CANCELLED: "call.cancelled",
  CALL_RESCHEDULED: "call.rescheduled",

  DASHBOARD_REFRESH_REQUESTED: "dashboard.refresh.requested",
  DASHBOARD_UPDATED: "dashboard.updated",
  NOTIFICATION_REQUESTED: "notification.requested",

  BRAIN_DECISION_SUGGESTED: "brain.decision.suggested",
  BRAIN_DECISION_APPROVED: "brain.decision.approved",
  BRAIN_DECISION_REJECTED: "brain.decision.rejected",

  AI_RECALCULATION_REQUESTED: "ai.recalculation.requested",
  AI_PROCESSED: "ai.processed",
  AI_FAILED: "ai.failed"
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];
