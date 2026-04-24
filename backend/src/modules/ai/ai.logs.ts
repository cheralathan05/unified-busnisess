import { db } from "../../config/db";

interface LogInput {
  leadId?: string;
  userId?: string;
  prompt: string;
  response?: string;
  latencyMs: number;
  success: boolean;
  promptVersion?: string;
  error?: string;
}

export async function logAIEvent(input: LogInput): Promise<void> {
  try {
    await db.aILog.create({
      data: {
        leadId: input.leadId,
        userId: input.userId,
        prompt: input.prompt,
        response: input.response,
        latencyMs: input.latencyMs,
        success: input.success,
        promptVersion: input.promptVersion,
        error: input.error
      }
    });
  } catch (error) {
    // Never let observability break the request path.
    console.error("[ai.log] failed to persist", error);
  }
}
