/**
 * Data Deduplication Utility
 * Removes duplicate entries from various data stores
 */

export type DeduplicationResult = {
  duplicatesFound: number;
  duplicatesRemoved: number;
  source: string;
};

/**
 * Deduplicate requirements by ID and title
 */
export const deduplicateRequirements = (
  requirements: any[]
): { unique: any[]; result: DeduplicationResult } => {
  const seen = new Set<string>();
  const unique: any[] = [];
  let duplicatesFound = 0;

  for (const req of requirements) {
    // Use ID as primary key
    if (!seen.has(req.id)) {
      unique.push(req);
      seen.add(req.id);
    } else {
      duplicatesFound++;
    }
  }

  return {
    unique,
    result: {
      duplicatesFound,
      duplicatesRemoved: duplicatesFound,
      source: "requirements",
    },
  };
};

/**
 * Deduplicate leads by ID and email
 */
export const deduplicateLeads = (leads: any[]): { unique: any[]; result: DeduplicationResult } => {
  const seenIds = new Set<number | string>();
  const seenEmails = new Set<string>();
  const unique: any[] = [];
  let duplicatesFound = 0;

  for (const lead of leads) {
    const isDuplicateId = seenIds.has(lead.id);
    const isDuplicateEmail = lead.email ? seenEmails.has(lead.email.toLowerCase()) : false;

    if (!isDuplicateId && !isDuplicateEmail) {
      unique.push(lead);
      seenIds.add(lead.id);
      if (lead.email) {
        seenEmails.add(lead.email.toLowerCase());
      }
    } else {
      duplicatesFound++;
    }
  }

  return {
    unique,
    result: {
      duplicatesFound,
      duplicatesRemoved: duplicatesFound,
      source: "leads",
    },
  };
};

/**
 * Deduplicate projects by ID
 */
export const deduplicateProjects = (
  projects: any[]
): { unique: any[]; result: DeduplicationResult } => {
  const seen = new Set<string>();
  const unique: any[] = [];
  let duplicatesFound = 0;

  for (const project of projects) {
    if (!seen.has(project.id)) {
      unique.push(project);
      seen.add(project.id);
    } else {
      duplicatesFound++;
    }
  }

  return {
    unique,
    result: {
      duplicatesFound,
      duplicatesRemoved: duplicatesFound,
      source: "projects",
    },
  };
};

/**
 * Deduplicate team members by ID
 */
export const deduplicateTeamMembers = (
  members: any[]
): { unique: any[]; result: DeduplicationResult } => {
  const seen = new Set<string>();
  const unique: any[] = [];
  let duplicatesFound = 0;

  for (const member of members) {
    if (!seen.has(member.id)) {
      unique.push(member);
      seen.add(member.id);
    } else {
      duplicatesFound++;
    }
  }

  return {
    unique,
    result: {
      duplicatesFound,
      duplicatesRemoved: duplicatesFound,
      source: "team-members",
    },
  };
};

/**
 * Clean all storage - Remove duplicates from all stores
 */
export const cleanAllDuplicateData = (): DeduplicationResult[] => {
  const results: DeduplicationResult[] = [];

  // Clean requirements
  try {
    const reqKey = "ai-project-os.requirements";
    const reqData = localStorage.getItem(reqKey);
    if (reqData) {
      const parsed = JSON.parse(reqData);
      if (Array.isArray(parsed)) {
        const { unique: cleanReqs, result } = deduplicateRequirements(parsed);
        if (result.duplicatesRemoved > 0) {
          localStorage.setItem(reqKey, JSON.stringify(cleanReqs));
          results.push(result);
        }
      }
    }
  } catch (e) {
    console.error("Error cleaning requirements:", e);
  }

  // Clean leads
  try {
    const leadKey = "ai-project-os.leads";
    const leadData = localStorage.getItem(leadKey);
    if (leadData) {
      const parsed = JSON.parse(leadData);
      if (Array.isArray(parsed)) {
        const { unique: cleanLeads, result } = deduplicateLeads(parsed);
        if (result.duplicatesRemoved > 0) {
          localStorage.setItem(leadKey, JSON.stringify(cleanLeads));
          results.push(result);
        }
      }
    }
  } catch (e) {
    console.error("Error cleaning leads:", e);
  }

  // Clean projects
  try {
    const projectKey = "ai-project-os.projects";
    const projectData = localStorage.getItem(projectKey);
    if (projectData) {
      const parsed = JSON.parse(projectData);
      if (Array.isArray(parsed)) {
        const { unique: cleanProjects, result } = deduplicateProjects(parsed);
        if (result.duplicatesRemoved > 0) {
          localStorage.setItem(projectKey, JSON.stringify(cleanProjects));
          results.push(result);
        }
      }
    }
  } catch (e) {
    console.error("Error cleaning projects:", e);
  }

  return results;
};

/**
 * Get deduplication report without modifying data
 */
export const getDeduplicationReport = (): {
  report: DeduplicationResult[];
  totalDuplicates: number;
} => {
  const report: DeduplicationResult[] = [];
  let totalDuplicates = 0;

  // Check requirements
  try {
    const reqKey = "ai-project-os.requirements";
    const reqData = localStorage.getItem(reqKey);
    if (reqData) {
      const parsed = JSON.parse(reqData);
      if (Array.isArray(parsed)) {
        const { result } = deduplicateRequirements(parsed);
        if (result.duplicatesFound > 0) {
          report.push(result);
          totalDuplicates += result.duplicatesFound;
        }
      }
    }
  } catch (e) {
    console.error("Error checking requirements:", e);
  }

  // Check leads
  try {
    const leadKey = "ai-project-os.leads";
    const leadData = localStorage.getItem(leadKey);
    if (leadData) {
      const parsed = JSON.parse(leadData);
      if (Array.isArray(parsed)) {
        const { result } = deduplicateLeads(parsed);
        if (result.duplicatesFound > 0) {
          report.push(result);
          totalDuplicates += result.duplicatesFound;
        }
      }
    }
  } catch (e) {
    console.error("Error checking leads:", e);
  }

  // Check projects
  try {
    const projectKey = "ai-project-os.projects";
    const projectData = localStorage.getItem(projectKey);
    if (projectData) {
      const parsed = JSON.parse(projectData);
      if (Array.isArray(parsed)) {
        const { result } = deduplicateProjects(parsed);
        if (result.duplicatesFound > 0) {
          report.push(result);
          totalDuplicates += result.duplicatesFound;
        }
      }
    }
  } catch (e) {
    console.error("Error checking projects:", e);
  }

  return { report, totalDuplicates };
};
