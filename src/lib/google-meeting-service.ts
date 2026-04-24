/**
 * Google Meeting Integration Service
 * Handles parsing of meeting transcripts/notes to extract requirements
 */

export type ExtractedRequirement = {
  text: string;
  confidence: number; // 0-1
  category: "feature" | "technical" | "functional" | "non-functional";
  suggestedPriority: "high" | "medium" | "low";
  source: string; // meeting date, speaker, etc.
};

export type MeetingData = {
  id: string;
  title: string;
  date: Date;
  transcript: string;
  attendees?: string[];
  duration?: number;
};

const REQUIREMENT_KEYWORDS = {
  feature: [
    "need", "want", "should have", "must have", "feature", "functionality",
    "capability", "require", "add", "implement", "build", "create", "develop",
    "support", "handle", "provide", "enable", "allow"
  ],
  technical: [
    "database", "api", "backend", "frontend", "server", "client", "integration",
    "authentication", "security", "encrypt", "ssl", "https", "payment gateway",
    "webhook", "rest", "graphql", "microservice", "docker", "kubernetes",
    "scalable", "performance", "optimization", "cache", "cdn"
  ],
  functional: [
    "user", "admin", "dashboard", "report", "notification", "email", "sms",
    "export", "import", "search", "filter", "sort", "pagination", "validation",
    "workflow", "process", "automation", "approval"
  ],
  "non-functional": [
    "responsive", "mobile", "accessibility", "seo", "performance",
    "load time", "uptime", "availability", "reliability", "maintenance",
    "documentation", "testing", "monitoring", "analytics", "compliance"
  ]
};

const PRIORITY_KEYWORDS = {
  high: ["critical", "urgent", "immediately", "asap", "must", "blocking", "essential"],
  low: ["nice to have", "optional", "future", "later", "consider", "maybe"]
};

/**
 * Extract requirements from meeting transcript/notes
 */
export const extractRequirementsFromMeeting = (
  transcript: string,
  meetingTitle?: string,
  meetingDate?: Date
): ExtractedRequirement[] => {
  const extractedRequirements: ExtractedRequirement[] = [];
  const sentences = transcript.split(/[.!?]+/).filter((s) => s.trim().length > 0);

  sentences.forEach((sentence) => {
    const lowerSentence = sentence.toLowerCase().trim();

    // Skip very short sentences or generic text
    if (lowerSentence.length < 20) return;

    // Determine category
    let category: "feature" | "technical" | "functional" | "non-functional" = "feature";
    let categoryScore = 0;

    for (const [key, keywords] of Object.entries(REQUIREMENT_KEYWORDS)) {
      const matches = keywords.filter((kw) => lowerSentence.includes(kw)).length;
      if (matches > categoryScore) {
        category = key as any;
        categoryScore = matches;
      }
    }

    // Determine priority
    let suggestedPriority: "high" | "medium" | "low" = "medium";
    if (PRIORITY_KEYWORDS.high.some((kw) => lowerSentence.includes(kw))) {
      suggestedPriority = "high";
    } else if (PRIORITY_KEYWORDS.low.some((kw) => lowerSentence.includes(kw))) {
      suggestedPriority = "low";
    }

    // Calculate confidence based on keyword matches
    const allKeywords = Object.values(REQUIREMENT_KEYWORDS).flat();
    const keywordMatches = allKeywords.filter((kw) => lowerSentence.includes(kw)).length;
    const confidence = Math.min(0.95, 0.3 + (keywordMatches * 0.15));

    // Only add if confidence is above threshold
    if (confidence > 0.4 && categoryScore > 0) {
      extractedRequirements.push({
        text: sentence.trim(),
        confidence,
        category,
        suggestedPriority,
        source: meetingTitle || meetingDate?.toLocaleDateString() || "Meeting",
      });
    }
  });

  // Remove duplicates and very similar requirements
  return deduplicateRequirements(extractedRequirements);
};

/**
 * Remove duplicate and highly similar requirements
 */
const deduplicateRequirements = (requirements: ExtractedRequirement[]): ExtractedRequirement[] => {
  const unique: ExtractedRequirement[] = [];
  const seen: string[] = [];

  for (const req of requirements) {
    const normalized = req.text.toLowerCase().replace(/\s+/g, " ");
    
    // Check if similar requirement already exists
    const isDuplicate = seen.some((s) => {
      const similarity = calculateStringSimilarity(normalized, s);
      return similarity > 0.75; // 75% similarity threshold
    });

    if (!isDuplicate) {
      unique.push(req);
      seen.push(normalized);
    }
  }

  return unique;
};

/**
 * Simple string similarity calculation (Levenshtein distance based)
 */
const calculateStringSimilarity = (str1: string, str2: string): number => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / parseFloat(longer.length.toString());
};

const getEditDistance = (s1: string, s2: string): number => {
  const costs: number[] = [];

  for (let k = 0; k <= s1.length; k++) {
    let lastValue = k;
    for (let i = 0; i <= s2.length; i++) {
      if (k === 0) {
        costs[i] = i;
      } else if (i > 0) {
        let newValue = costs[i - 1];
        if (s1.charAt(k - 1) !== s2.charAt(i - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[i]) + 1;
        }
        costs[i - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (k > 0) {
      costs[s2.length] = lastValue;
    }
  }

  return costs[s2.length];
};

/**
 * Parse Google Meet transcript from various formats
 */
export const parseMeetingTranscript = (input: string): string => {
  // Remove timestamps and speaker labels if present
  let cleaned = input
    .replace(/\d{1,2}:\d{2}:\d{2}/g, "") // Remove timestamps HH:MM:SS
    .replace(/\[.*?\]:/g, "") // Remove [Speaker Name]:
    .replace(/^[A-Z][a-z]+\s*:$/gm, "") // Remove plain "Speaker:" pattern
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .join(" ");

  return cleaned;
};

/**
 * Validate meeting transcript/notes
 */
export const validateMeetingInput = (transcript: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!transcript || transcript.trim().length === 0) {
    errors.push("Meeting transcript cannot be empty");
  }

  if (transcript.length < 50) {
    errors.push("Meeting transcript is too short to extract meaningful requirements");
  }

  if (transcript.split(" ").length < 20) {
    errors.push("Meeting transcript must contain at least 20 words");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Group extracted requirements by category
 */
export const groupExtractedByCategory = (
  requirements: ExtractedRequirement[]
): Record<string, ExtractedRequirement[]> => {
  return requirements.reduce(
    (acc, req) => {
      if (!acc[req.category]) {
        acc[req.category] = [];
      }
      acc[req.category].push(req);
      return acc;
    },
    {} as Record<string, ExtractedRequirement[]>
  );
};
