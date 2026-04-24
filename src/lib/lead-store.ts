import { deduplicateLeads } from "@/lib/deduplication-service";

export type LeadStatus = "hot" | "warm" | "cold";

export type LeadRequirements = {
  features: string[];
  budgetSummary: string;
  timelineSummary: string;
  prioritySummary: string;
  frontend: string[];
  backend: string[];
  integrations: string[];
};

export type LeadRecord = {
  id: number;
  dealId: string;
  name: string;
  company: string;
  project: string;
  status: LeadStatus;
  budgetLabel: string;
  budgetValue: number;
  score: number;
  source: string;
  owner: string;
  phone: string;
  email: string;
  insight: string;
  nextAction: string;
  lastActivity: string;
  notes: string;
  projectDescription?: string;
  meetingNotes?: string;
  requirements?: LeadRequirements;
  createdAt: number;
};

const STORAGE_KEY = "ai-project-os.leads";

export const defaultLeads: LeadRecord[] = [
  {
    id: 1,
    dealId: "DEAL-1042",
    name: "Rahul Sharma",
    company: "Rahul Enterprises",
    project: "E-commerce Website",
    status: "hot",
    budgetLabel: "₹1,50,000",
    budgetValue: 150000,
    score: 94,
    source: "Website",
    owner: "Meera",
    phone: "+91 98765 43210",
    email: "rahul@rahulent.com",
    insight: "Decision maker, ready to close",
    nextAction: "Send proposal and lock discovery call",
    lastActivity: "2 hours ago",
    notes: "Looking for a fast launch with payment integration and analytics.",
    createdAt: Date.now() - 1000 * 60 * 120,
  },
  {
    id: 2,
    dealId: "DEAL-1043",
    name: "Priya Patel",
    company: "Priya Design Studio",
    project: "Portfolio Website",
    status: "warm",
    budgetLabel: "₹50,000",
    budgetValue: 50000,
    score: 78,
    source: "Referral",
    owner: "Aarav",
    phone: "+91 98111 44556",
    email: "priya@priyadesign.com",
    insight: "Needs follow-up call",
    nextAction: "Share reference projects and schedule a call",
    lastActivity: "1 day ago",
    notes: "Portfolio site with subtle motion, case studies, and fast load times.",
    createdAt: Date.now() - 1000 * 60 * 60 * 30,
  },
  {
    id: 3,
    dealId: "DEAL-1044",
    name: "Amit Kumar",
    company: "TechStart Inc",
    project: "Mobile App MVP",
    status: "hot",
    budgetLabel: "₹3,00,000",
    budgetValue: 300000,
    score: 91,
    source: "Campaign",
    owner: "Nikhil",
    phone: "+91 99222 77889",
    email: "amit@techstart.in",
    insight: "Urgent deadline, high value",
    nextAction: "Prepare MVP scope and proposal",
    lastActivity: "30 min ago",
    notes: "Needs a launch-ready MVP with authentication and admin controls.",
    createdAt: Date.now() - 1000 * 60 * 45,
  },
  {
    id: 4,
    dealId: "DEAL-1045",
    name: "Sneha Verma",
    company: "EduLearn",
    project: "LMS Platform",
    status: "cold",
    budgetLabel: "₹2,00,000",
    budgetValue: 200000,
    score: 63,
    source: "WhatsApp",
    owner: "Priya",
    phone: "+91 97771 90002",
    email: "sneha@edulearn.co",
    insight: "Exploring options, not urgent",
    nextAction: "Nurture with a follow-up brochure",
    lastActivity: "3 days ago",
    notes: "Evaluating LMS vendors; timeline still flexible.",
    createdAt: Date.now() - 1000 * 60 * 60 * 48,
  },
  {
    id: 5,
    dealId: "DEAL-1046",
    name: "Vikram Singh",
    company: "FoodChain",
    project: "Delivery App",
    status: "warm",
    budgetLabel: "₹4,00,000",
    budgetValue: 400000,
    score: 82,
    source: "Website",
    owner: "Meera",
    phone: "+91 98888 11223",
    email: "vikram@foodchain.com",
    insight: "Interested but comparing vendors",
    nextAction: "Send pricing matrix and timeline comparison",
    lastActivity: "5 hours ago",
    notes: "Delivery app with restaurant onboarding and live tracking.",
    createdAt: Date.now() - 1000 * 60 * 60 * 10,
  },
];

const safeRead = (): LeadRecord[] => {
  if (typeof window === "undefined") {
    return defaultLeads;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultLeads;
    }

    const parsed = JSON.parse(raw) as LeadRecord[];
    return Array.isArray(parsed) && parsed.length ? parsed : defaultLeads;
  } catch {
    return defaultLeads;
  }
};

export const saveLeads = (leads: LeadRecord[]) => {
  if (typeof window === "undefined") {
    return;
  }

  // Deduplicate before saving
  const { unique } = deduplicateLeads(leads);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
};

export const getLeads = () => {
  const leads = safeRead();
  if (typeof window !== "undefined" && !window.localStorage.getItem(STORAGE_KEY)) {
    saveLeads(leads);
  }
  return leads;
};

export const getLeadById = (id?: number | string) => {
  if (id === undefined || id === null) return undefined;
  const numericId = Number(id);
  return getLeads().find((lead) => lead.id === numericId);
};

export const updateLead = (updatedLead: LeadRecord) => {
  const leads = getLeads();
  const next = [updatedLead, ...leads.filter((lead) => lead.id !== updatedLead.id)];
  saveLeads(next);
  return updatedLead;
};
