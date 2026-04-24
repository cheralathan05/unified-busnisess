import { z } from "zod";

export const createLeadSchema = z.object({
  name: z.string().min(2),
  company: z.string().min(2),
  value: z.number().positive(),
  stage: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional()
});

export const updateLeadSchema = z.object({
  name: z.string().optional(),
  company: z.string().optional(),
  value: z.number().optional(),
  stage: z.string().optional(),
  score: z.number().optional()
});

export const ingestMeetingTranscriptSchema = z.object({
  transcript: z.string().min(40),
  meetingTitle: z.string().min(2).optional(),
  meetingDate: z.string().optional(),
  attendees: z.array(z.string()).optional(),
  source: z.enum(["google_meet", "google_meeting", "meeting_notes", "manual"]).optional()
});