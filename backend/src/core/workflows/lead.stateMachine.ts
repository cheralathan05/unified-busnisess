/**
 * 🔄 LEAD STATE MACHINE
 * Defines the complete lifecycle of a lead with valid state transitions
 * Ensures data consistency and enforces business rules
 */

export type LeadStage =
  | "INITIAL_CONTACT"
  | "QUALIFIED"
  | "PROPOSAL"
  | "NEGOTIATION"
  | "CLOSED_WON"
  | "CLOSED_LOST"
  | "STALLED";

export type LeadHealth =
  | "EXCELLENT"
  | "HEALTHY"
  | "AT_RISK"
  | "STALLED";

// ═══════════════════════════════════════════════════════════════════════════
// STATE TRANSITION RULES
// ═══════════════════════════════════════════════════════════════════════════

const VALID_TRANSITIONS: Record<LeadStage, LeadStage[]> = {
  "INITIAL_CONTACT": [
    "QUALIFIED",
    "CLOSED_LOST",
    "STALLED"
  ],
  "QUALIFIED": [
    "PROPOSAL",
    "NEGOTIATION",
    "CLOSED_LOST",
    "STALLED"
  ],
  "PROPOSAL": [
    "NEGOTIATION",
    "CLOSED_WON",
    "CLOSED_LOST",
    "STALLED"
  ],
  "NEGOTIATION": [
    "CLOSED_WON",
    "CLOSED_LOST",
    "STALLED"
  ],
  "CLOSED_WON": [
    "STALLED"
  ],
  "CLOSED_LOST": [
    "INITIAL_CONTACT" // Can reopen
  ],
  "STALLED": [
    "QUALIFIED",
    "CLOSED_LOST"
  ]
};

// ═══════════════════════════════════════════════════════════════════════════
// LEAD INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

export interface LeadInitialState {
  stage: LeadStage;
  score: number;
  health: LeadHealth;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

/**
 * Determine initial lead state based on value/stage
 */
export function initializeLead(stageInput: string): LeadInitialState {
  const stage = translateLeadStage(stageInput);

  const stageToScore: Record<LeadStage, number> = {
    "INITIAL_CONTACT": 30,
    "QUALIFIED": 45,
    "PROPOSAL": 65,
    "NEGOTIATION": 80,
    "CLOSED_WON": 100,
    "CLOSED_LOST": 0,
    "STALLED": 20
  };

  const stageToHealth: Record<LeadStage, LeadHealth> = {
    "INITIAL_CONTACT": "HEALTHY",
    "QUALIFIED": "HEALTHY",
    "PROPOSAL": "EXCELLENT",
    "NEGOTIATION": "EXCELLENT",
    "CLOSED_WON": "EXCELLENT",
    "CLOSED_LOST": "AT_RISK",
    "STALLED": "STALLED"
  };

  return {
    stage,
    score: stageToScore[stage],
    health: stageToHealth[stage],
    priority: calculatePriority(stageToScore[stage])
  };
}

function calculatePriority(score: number): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  if (score >= 85) return "CRITICAL";
  if (score >= 70) return "HIGH";
  if (score >= 50) return "MEDIUM";
  return "LOW";
}

// ═══════════════════════════════════════════════════════════════════════════
// STATE TRANSITION VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if transition is valid
 */
export function isValidTransition(from: LeadStage, to: LeadStage): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) || false;
}

/**
 * Get available next states
 */
export function getAvailableTransitions(from: LeadStage): LeadStage[] {
  return VALID_TRANSITIONS[from] || [];
}

// ═══════════════════════════════════════════════════════════════════════════
// STAGE TRANSLATION & NORMALIZATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Convert various stage formats to canonical LeadStage
 */
export function translateLeadStage(input: string): LeadStage {
  const normalized = input?.toUpperCase().trim() || "INITIAL_CONTACT";

  const translations: Record<string, LeadStage> = {
    // Direct matches
    "INITIAL_CONTACT": "INITIAL_CONTACT",
    "QUALIFIED": "QUALIFIED",
    "PROPOSAL": "PROPOSAL",
    "NEGOTIATION": "NEGOTIATION",
    "CLOSED_WON": "CLOSED_WON",
    "CLOSED_LOST": "CLOSED_LOST",
    "STALLED": "STALLED",

    // Aliases
    "NEW": "INITIAL_CONTACT",
    "PROSPECT": "INITIAL_CONTACT",
    "LEAD": "INITIAL_CONTACT",
    "COLD": "INITIAL_CONTACT",
    "WARM": "QUALIFIED",
    "ACTIVE": "QUALIFIED",
    "HOT": "PROPOSAL",
    "DEALING": "PROPOSAL",
    "DISCUSSING": "NEGOTIATION",
    "NEGOTIATING": "NEGOTIATION",
    "FINALIZING": "NEGOTIATION",
    "WON": "CLOSED_WON",
    "VICTORY": "CLOSED_WON",
    "DEAL": "CLOSED_WON",
    "LOST": "CLOSED_LOST",
    "FAILED": "CLOSED_LOST",
    "NO_DEAL": "CLOSED_LOST",
    "DEAD": "STALLED",
    "FROZEN": "STALLED",
    "PAUSED": "STALLED",
    "INACTIVE": "STALLED"
  };

  return translations[normalized] || "INITIAL_CONTACT";
}

// ═══════════════════════════════════════════════════════════════════════════
// HEALTH SCORE CALCULATION
// ═══════════════════════════════════════════════════════════════════════════

export interface LeadHealthMetrics {
  activityFrequency: number; // Activities in last 7 days
  lastActivityDaysAgo: number;
  avgResponseTime: number; // hours
  engagementScore: number; // 0-100
  value: number;
  stage: LeadStage;
  daysSinceCreation?: number;
}

/**
 * Calculate dynamic health based on engagement metrics
 */
export function calculateDynamicHealth(metrics: LeadHealthMetrics): LeadHealth {
  // If no activity in 14+ days, it's at risk
  if (metrics.lastActivityDaysAgo > 14) {
    return "AT_RISK";
  }

  // If no activity in 7+ days, watch closely
  if (metrics.lastActivityDaysAgo > 7) {
    return "HEALTHY";
  }

  // Active engagement = excellent
  if (metrics.activityFrequency >= 3 && metrics.engagementScore > 70) {
    return "EXCELLENT";
  }

  // Medium activity = healthy
  if (metrics.activityFrequency >= 1 && metrics.engagementScore > 50) {
    return "HEALTHY";
  }

  // Stalled = no movement
  if (metrics.activityFrequency === 0 && metrics.lastActivityDaysAgo > 30) {
    return "STALLED";
  }

  return "HEALTHY";
}

// ═══════════════════════════════════════════════════════════════════════════
// SCORE CALCULATION
// ═══════════════════════════════════════════════════════════════════════════

export interface ScoreComponent {
  stageScore: number; // 0-40 (stage advancement)
  engagementScore: number; // 0-30 (activity + response)
  valueScore: number; // 0-20 (deal size multiplier)
  velocityScore: number; // 0-10 (movement speed)
}

/**
 * Calculate comprehensive lead score
 */
export function calculateLeadScore(
  stage: LeadStage,
  engagement: number,
  value: number,
  activityCount: number,
  daysInStage: number
): number {
  // Stage component (0-40)
  const stageMap: Record<LeadStage, number> = {
    "INITIAL_CONTACT": 5,
    "QUALIFIED": 15,
    "PROPOSAL": 25,
    "NEGOTIATION": 35,
    "CLOSED_WON": 40,
    "CLOSED_LOST": 0,
    "STALLED": 5
  };
  const stageScore = stageMap[stage];

  // Engagement component (0-30): activities + engagement quality
  const engagementScore = Math.min(30, engagement);

  // Value component (0-20): deal size multiplier
  const valueScore = Math.min(20, (value / 50000) * 20);

  // Velocity component (0-10): how fast they're moving
  const velocityScore = daysInStage > 30 ? 0 : Math.min(10, (30 - daysInStage) / 3);

  const total = stageScore + engagementScore + valueScore + velocityScore;
  return Math.round(Math.min(100, total));
}

// ═══════════════════════════════════════════════════════════════════════════
// WORKFLOW ENFORCEMENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Enforce workflow constraints on state change
 */
export function validateStateChange(
  currentStage: LeadStage,
  newStage: LeadStage,
  context: {
    hasActivity?: boolean;
    hasPayment?: boolean;
    daysSinceCreation?: number;
  }
): { valid: boolean; reason?: string } {
  // Check if transition is allowed
  if (!isValidTransition(currentStage, newStage)) {
    return {
      valid: false,
      reason: `Cannot transition from ${currentStage} to ${newStage}`
    };
  }

  // Moving to CLOSED_WON requires payment
  if (newStage === "CLOSED_WON" && !context.hasPayment) {
    return {
      valid: false,
      reason: "Cannot close won without payment record"
    };
  }

  // Can't close before 3 days
  if (
    (newStage === "CLOSED_WON" || newStage === "CLOSED_LOST") &&
    context.daysSinceCreation !== undefined &&
    context.daysSinceCreation < 3
  ) {
    return {
      valid: false,
      reason: "Cannot close deal within 3 days of creation"
    };
  }

  return { valid: true };
}

// ═══════════════════════════════════════════════════════════════════════════
// TRIGGER DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

export interface StateTrigger {
  name: string;
  condition: (metrics: LeadHealthMetrics) => boolean;
  action: string;
}

/**
 * Automatic triggers based on lead state
 */
export const AUTO_TRIGGERS: StateTrigger[] = [
  {
    name: "ESCALATE_HIGH_VALUE",
    condition: (m) => m.value > 100000 && m.stage === "QUALIFIED",
    action: "IMMEDIATE_FOLLOWUP"
  },
  {
    name: "WARN_AT_RISK",
    condition: (m) => m.lastActivityDaysAgo > 14,
    action: "URGENT_OUTREACH"
  },
  {
    name: "STALL_DETECTION",
    condition: (m) => m.activityFrequency === 0 && m.lastActivityDaysAgo > 30,
    action: "AUTO_STALL"
  },
  {
    name: "MILESTONE_NOTIFICATION",
    condition: (m) =>
      m.stage === "PROPOSAL" && m.activityFrequency > 2,
    action: "NOTIFY_MANAGER"
  },
  {
    name: "QUICK_WIN",
    condition: (m) =>
      m.stage === "CLOSED_WON" && m.daysSinceCreation && m.daysSinceCreation < 14,
    action: "CELEBRATE"
  }
];

/**
 * Get triggered actions for current state
 */
export function getTriggeredActions(metrics: LeadHealthMetrics): string[] {
  return AUTO_TRIGGERS
    .filter((t) => t.condition(metrics))
    .map((t) => t.action);
}
