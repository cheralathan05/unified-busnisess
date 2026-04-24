import { deduplicateRequirements } from "@/lib/deduplication-service";

export type RequirementType = "editable" | "manual" | "auto-extracted";

export type Requirement = {
  id: string;
  leadId?: number;
  title: string;
  description: string;
  type: RequirementType;
  source?: string; // from settings or meeting
  category: "feature" | "technical" | "functional" | "non-functional";
  priority: "high" | "medium" | "low";
  status: "active" | "archived" | "draft" | "pending-review";
  confidence?: number; // for auto-extracted (0-1)
  editedFromAuto?: boolean; // true if manually edited from auto-extracted
  createdAt: number;
  updatedAt: number;
};

export type RequirementsGroup = {
  id: string;
  name: string;
  category: "feature" | "technical" | "functional" | "non-functional";
  requirements: Requirement[];
  createdAt: number;
  updatedAt: number;
};

const STORAGE_KEY = "ai-project-os.requirements";

export const defaultRequirements: Requirement[] = [
  {
    id: "req-1",
    title: "User Authentication",
    description: "Secure login and registration system with email verification",
    type: "editable",
    source: "Settings",
    category: "technical",
    priority: "high",
    status: "active",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "req-2",
    title: "Payment Gateway Integration",
    description: "Integrate Stripe or Razorpay for payment processing",
    type: "editable",
    source: "Settings",
    category: "technical",
    priority: "high",
    status: "active",
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now(),
  },
  {
    id: "req-3",
    title: "Dashboard Analytics",
    description: "Real-time analytics and reporting dashboard",
    type: "manual",
    category: "feature",
    priority: "medium",
    status: "active",
    createdAt: Date.now() - 172800000,
    updatedAt: Date.now(),
  },
  {
    id: "req-4",
    title: "Email Notifications",
    description: "Automated email notifications for user actions",
    type: "editable",
    source: "Settings",
    category: "functional",
    priority: "medium",
    status: "active",
    createdAt: Date.now() - 259200000,
    updatedAt: Date.now(),
  },
];

export const getRequirements = (type?: RequirementType): Requirement[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const requirements = stored ? JSON.parse(stored) : defaultRequirements;
    
    if (type) {
      return requirements.filter((r: Requirement) => r.type === type);
    }
    return requirements;
  } catch {
    return defaultRequirements;
  }
};

export const getRequirementById = (id: string): Requirement | undefined => {
  const requirements = getRequirements();
  return requirements.find((r) => r.id === id);
};

export const getRequirementsByCategory = (category: Requirement["category"]): Requirement[] => {
  const requirements = getRequirements();
  return requirements.filter((r) => r.category === category);
};

export const createRequirement = (
  title: string,
  description: string,
  type: RequirementType,
  category: Requirement["category"],
  priority: Requirement["priority"] = "medium",
  source?: string,
  leadId?: number
): Requirement => {
  const id = `req-${Date.now()}`;
  const newRequirement: Requirement = {
    id,
    leadId,
    title,
    description,
    type,
    source,
    category,
    priority,
    status: "draft",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const requirements = getRequirements();
  const updated = [...requirements, newRequirement];
  // Deduplicate before saving
  const { unique } = deduplicateRequirements(updated);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));

  return newRequirement;
};

export const updateRequirement = (id: string, updates: Partial<Requirement>): Requirement | null => {
  const requirements = getRequirements();
  const index = requirements.findIndex((r) => r.id === id);

  if (index === -1) return null;

  const updated = {
    ...requirements[index],
    ...updates,
    updatedAt: Date.now(),
  };

  requirements[index] = updated;
  // Deduplicate before saving
  const { unique } = deduplicateRequirements(requirements);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));

  return updated;
};

export const deleteRequirement = (id: string): boolean => {
  const requirements = getRequirements();
  const filtered = requirements.filter((r) => r.id !== id);

  if (filtered.length === requirements.length) return false;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
};

export const toggleRequirementStatus = (id: string): Requirement | null => {
  const requirement = getRequirementById(id);
  if (!requirement) return null;

  const newStatus: Requirement["status"] = requirement.status === "active" ? "archived" : "active";
  return updateRequirement(id, { status: newStatus });
};

export const groupRequirementsByCategory = (): Record<Requirement["category"], Requirement[]> => {
  const requirements = getRequirements();
  return {
    feature: requirements.filter((r) => r.category === "feature"),
    technical: requirements.filter((r) => r.category === "technical"),
    functional: requirements.filter((r) => r.category === "functional"),
    "non-functional": requirements.filter((r) => r.category === "non-functional"),
  };
};

export const getRequirementsByLeadId = (leadId?: number): Requirement[] => {
  if (leadId === undefined) {
    return getRequirements();
  }
  const requirements = getRequirements();
  return requirements.filter((req) => req.leadId === leadId);
};

export const importRequirementsFromSettings = (settingsData: any[]): Requirement[] => {
  // Extract requirements from settings data
  const imported = settingsData.map((item, index) => {
    const id = `req-imported-${Date.now()}-${index}`;
    return createRequirement(
      item.name || item.title || "Untitled",
      item.description || "",
      "editable",
      "technical",
      "medium",
      item.source || "Settings"
    );
  });

  return imported;
};

/**
 * Create auto-extracted requirements from meeting
 */
export const createAutoExtractedRequirements = (
  extractedItems: Array<{
    text: string;
    confidence: number;
    category: Requirement["category"];
    suggestedPriority: Requirement["priority"];
    source: string;
    leadId?: number;
  }>
): Requirement[] => {
  const created = extractedItems.map((item, index) => {
    const id = `req-auto-${Date.now()}-${index}`;
    const newRequirement: Requirement = {
      id,
      leadId: item.leadId,
      title: item.text.substring(0, 100), // Use first 100 chars as title
      description: item.text,
      type: "auto-extracted",
      source: item.source,
      category: item.category,
      priority: item.suggestedPriority,
      status: "pending-review",
      confidence: item.confidence,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const requirements = getRequirements();
    const updated = [...requirements, newRequirement];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    return newRequirement;
  });

  return created;
};

/**
 * Get requirements pending review (auto-extracted)
 */
export const getPendingReviewRequirements = (): Requirement[] => {
  const requirements = getRequirements();
  return requirements.filter((r) => r.status === "pending-review");
};

/**
 * Accept auto-extracted requirement
 */
export const acceptAutoExtractedRequirement = (id: string): Requirement | null => {
  const requirement = getRequirementById(id);
  if (!requirement || requirement.type !== "auto-extracted") return null;

  return updateRequirement(id, {
    status: "active",
    type: "auto-extracted",
  });
};

/**
 * Reject/delete auto-extracted requirement
 */
export const rejectAutoExtractedRequirement = (id: string): boolean => {
  return deleteRequirement(id);
};

/**
 * Convert auto-extracted to manual (with edits)
 */
export const autoToManualRequirement = (
  id: string,
  updates: Partial<Requirement>
): Requirement | null => {
  const requirement = getRequirementById(id);
  if (!requirement || requirement.type !== "auto-extracted") return null;

  return updateRequirement(id, {
    ...updates,
    type: "manual",
    status: "active",
    editedFromAuto: true,
  });
};

/**
 * Get auto-extracted requirements by status
 */
export const getAutoExtractedByStatus = (
  status: Requirement["status"]
): Requirement[] => {
  const requirements = getRequirements();
  return requirements.filter((r) => r.type === "auto-extracted" && r.status === status);
};

/**
 * Get all auto-extracted requirements
 */
export const getAllAutoExtracted = (): Requirement[] => {
  const requirements = getRequirements();
  return requirements.filter((r) => r.type === "auto-extracted");
};

type ClientIntakeRequirementInput = {
  leadId?: number;
  leadName: string;
  company: string;
  projectType: string;
  features: string[];
  uploadedFiles?: Array<{
    name: string;
    size: number;
    type: string;
    previewUrl?: string;
    isImage?: boolean;
  }>;
  targetAudience: string;
  ideaDescription: string;
  priority: "high" | "medium" | "low" | "urgent";
  budget: number;
  estimatedPrice: number;
  deadline: string;
  selectedPackage: string;
  aiSummary: string;
};

const toRequirementPriority = (priority: ClientIntakeRequirementInput["priority"]): Requirement["priority"] => {
  if (priority === "urgent") return "high";
  return priority;
};

const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export const createRequirementsFromClientIntake = (input: ClientIntakeRequirementInput): Requirement[] => {
  const now = Date.now();
  const sourceLabel = `Client Intake ${input.company}`;
  const converted: Requirement[] = [
    {
      id: `req-intake-core-${now}`,
      leadId: input.leadId,
      title: `${input.projectType} scope for ${input.company}`,
      description: input.ideaDescription,
      type: "manual",
      source: sourceLabel,
      category: "feature",
      priority: toRequirementPriority(input.priority),
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `req-intake-budget-${now}`,
      leadId: input.leadId,
      title: `Budget and packaging for ${input.company}`,
      description: `Budget starts at INR ${input.budget.toLocaleString("en-IN")}, estimated at INR ${input.estimatedPrice.toLocaleString("en-IN")}, package ${input.selectedPackage}.`,
      type: "manual",
      source: sourceLabel,
      category: "functional",
      priority: "high",
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `req-intake-timeline-${now}`,
      leadId: input.leadId,
      title: `Timeline and audience for ${input.company}`,
      description: `Deadline ${input.deadline || "to be finalized"}. Target audience: ${input.targetAudience}. AI summary: ${input.aiSummary}`,
      type: "manual",
      source: sourceLabel,
      category: "non-functional",
      priority: toRequirementPriority(input.priority),
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
  ];

  const featureRequirements = input.features.map((feature, index) => ({
    id: `req-intake-feature-${now}-${index}`,
    leadId: input.leadId,
    title: `${feature} implementation`,
    description: `Requested by ${input.leadName}${input.leadId ? ` (Lead ${input.leadId})` : ""} in client intake.`,
    type: "manual" as const,
    source: sourceLabel,
    category: "technical" as const,
    priority: toRequirementPriority(input.priority),
    status: "active" as const,
    createdAt: now,
    updatedAt: now,
  }));

  const attachmentRequirements = (input.uploadedFiles || []).map((file, index) => ({
    id: `req-intake-asset-${now}-${index}`,
    leadId: input.leadId,
    title: file.isImage || file.type.startsWith("image/") ? `Review image reference: ${file.name}` : `Review file reference: ${file.name}`,
    description: `Uploaded asset ${file.name} (${formatFileSize(file.size)}). Type: ${file.type || "unknown"}.`,
    type: "manual" as const,
    source: sourceLabel,
    category: "non-functional" as const,
    priority: toRequirementPriority(input.priority),
    status: "active" as const,
    createdAt: now,
    updatedAt: now,
  }));

  const all = [...getRequirements(), ...converted, ...featureRequirements, ...attachmentRequirements];
  const { unique } = deduplicateRequirements(all);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));

  return [...converted, ...featureRequirements, ...attachmentRequirements];
};

