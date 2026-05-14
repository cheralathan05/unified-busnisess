import { useMemo, useState } from "react";
import { Brain, TrendingUp, Mail, Send, MessageCircle, Phone, Video, Pencil, Loader2, CheckCircle2, CalendarDays, Clock3, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { getAuthSession } from "@/lib/auth-store";
import { sendClientLink } from "@/lib/client-intake-api";

type Tone = "formal" | "friendly" | "sales";
type MeetingType = "phone" | "google_meet" | "zoom";

type LeadActionLead = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  score: number;
  budgetValue: number;
  stage: string;
  lastActivity: string;
};

type LeadIntelligence = {
  score: number;
  label: string;
  breakdown: {
    budgetMatch: number;
    urgency: string;
    industryFit: string;
    communication: string;
    decisionPower: string;
  };
  prediction: {
    closeProbability: number;
    expectedDealValue: number;
    bestAction: string;
    closeDate?: string;
  };
  reasoning: string;
  provider: string;
  model: string;
};

type Props = {
  lead: LeadActionLead;
  onRefresh?: () => Promise<void> | void;
  onEdit?: () => void;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

const authHeaders = () => {
  const token = getAuthSession()?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function apiRequest<T>(path: string, init?: RequestInit, timeoutMs = 12000): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        ...authHeaders(),
        ...(init?.headers || {}),
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.message || "Request failed");
  }

  return (payload?.data ?? payload) as T;
}

const parseAttendees = (text: string) =>
  text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const formatRupee = (value: number) => `₹${Math.max(0, Number(value || 0)).toLocaleString("en-IN")}`;

const formatLocalDateInput = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const parseLocalDateInput = (value: string) => {
  if (!value) return undefined;
  const [y, m, d] = value.split("-").map((item) => Number(item));
  if (!y || !m || !d) return undefined;

  const parsed = new Date(y, m - 1, d);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
};

const formatDateLabel = (value: string) => {
  const parsed = parseLocalDateInput(value);
  if (!parsed) return "Pick a date";

  return parsed.toLocaleDateString([], {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTimeLabel = (value: string) => {
  const [hours, minutes] = value.split(":").map((item) => Number(item));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value;

  const parsed = new Date();
  parsed.setHours(hours, minutes, 0, 0);
  return parsed.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

const TIME_OPTIONS = Array.from({ length: 24 }, (_, hour) => {
  const hh = String(hour).padStart(2, "0");
  return [`${hh}:00`, `${hh}:30`];
}).flat();

const formatSchedulePreview = (date: string, time: string) => {
  if (!date || !time) return "Select date and time";

  const dateTime = new Date(`${date}T${time}:00`);
  if (Number.isNaN(dateTime.getTime())) return "Select date and time";

  return dateTime.toLocaleString([], {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
};

export function LeadActionBar({ lead, onRefresh, onEdit }: Props) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [intelligence, setIntelligence] = useState<LeadIntelligence | null>(null);
  const [isIntelOpen, setIsIntelOpen] = useState(false);

  const [isDraftOpen, setIsDraftOpen] = useState(false);
  const [tone, setTone] = useState<Tone>("formal");
  const [draftSubject, setDraftSubject] = useState("");
  const [draftBody, setDraftBody] = useState("");

  const [isSendOpen, setIsSendOpen] = useState(false);

  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [meetingType, setMeetingType] = useState<MeetingType>("phone");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [attendees, setAttendees] = useState("");

  const canEmail = useMemo(() => Boolean(lead.email && lead.email !== "N/A"), [lead.email]);
  const canWhatsApp = useMemo(() => Boolean(lead.phone && lead.phone !== "N/A"), [lead.phone]);
  const schedulePreview = useMemo(() => formatSchedulePreview(meetingDate, meetingTime), [meetingDate, meetingTime]);
  const meetingTypeLabel = meetingType === "google_meet" ? "Google Meet" : meetingType === "zoom" ? "Zoom" : "Phone Call";
  const selectedMeetingDate = useMemo(() => parseLocalDateInput(meetingDate), [meetingDate]);

  const withLoading = async (key: string, fn: () => Promise<void>) => {
    try {
      console.log(`🔄 Starting action: ${key}`);
      setLoadingAction(key);
      await fn();
      console.log(`✅ Action completed: ${key}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Action failed";
      console.error(`❌ Action failed: ${key}`, error);
      toast.error(errorMessage);
    } finally {
      setLoadingAction(null);
    }
  };

  const loadIntelligence = async () => {
    const scoreData = await apiRequest<{ score: number; reasoning: string; meta?: { source?: string } }>(`/leads/${lead.id}/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const data: LeadIntelligence = {
      score: Number(scoreData.score || lead.score || 0),
      label: Number(scoreData.score || 0) >= 85 ? "Hot Lead" : Number(scoreData.score || 0) >= 65 ? "Warm Lead" : "Cold Lead",
      breakdown: {
        budgetMatch: Math.max(40, Math.min(100, Math.round((lead.budgetValue / 300000) * 100))),
        urgency: ["won", "proposal", "negotiation", "qualified"].includes(String(lead.stage || "").toLowerCase()) ? "High" : "Medium",
        industryFit: Number(scoreData.score || 0) >= 85 ? "Strong" : Number(scoreData.score || 0) >= 65 ? "Moderate" : "Developing",
        communication: Number(scoreData.score || 0) >= 80 ? "Responsive" : "Neutral",
        decisionPower: Number(scoreData.score || 0) >= 85 ? "High" : Number(scoreData.score || 0) >= 65 ? "Medium" : "Low",
      },
      prediction: {
        closeProbability: 0,
        expectedDealValue: lead.budgetValue,
        bestAction: "Run Predict to get close probability",
      },
      reasoning: scoreData.reasoning,
      provider: scoreData.meta?.source === "heuristic" ? "hybrid" : "ollama",
      model: "llama3",
    };

    setIntelligence(data);
    setIsIntelOpen(true);
  };

  const loadPrediction = async () => {
    const prediction = await apiRequest<{ probability: number; closeDate?: string; confidence?: number; riskLevel?: string; riskFactors?: string[] }>(`/leads/${lead.id}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const scoreValue = intelligence?.score ?? lead.score;
    const data: LeadIntelligence = {
      score: scoreValue,
      label: scoreValue >= 85 ? "Hot Lead" : scoreValue >= 65 ? "Warm Lead" : "Cold Lead",
      breakdown: intelligence?.breakdown || {
        budgetMatch: Math.max(40, Math.min(100, Math.round((lead.budgetValue / 300000) * 100))),
        urgency: ["won", "proposal", "negotiation", "qualified"].includes(String(lead.stage || "").toLowerCase()) ? "High" : "Medium",
        industryFit: scoreValue >= 85 ? "Strong" : scoreValue >= 65 ? "Moderate" : "Developing",
        communication: scoreValue >= 80 ? "Responsive" : "Neutral",
        decisionPower: scoreValue >= 85 ? "High" : scoreValue >= 65 ? "Medium" : "Low",
      },
      prediction: {
        closeProbability: Number(prediction.probability || 0),
        expectedDealValue: lead.budgetValue,
        bestAction: lead.stage.toLowerCase() === "proposal" ? "Schedule meeting today" : "Send follow-up and lock timeline",
        closeDate: prediction.closeDate,
      },
      reasoning: intelligence?.reasoning || "Prediction generated from real lead signals",
      provider: "ollama",
      model: "llama3",
    };

    setIntelligence(data);
    setIsIntelOpen(true);
    toast.success(`Close chance ${Math.round(data.prediction.closeProbability)}%`);
  };

  const generateDraftEmail = async (toneOverride?: Tone) => {
    if (!canEmail) {
      throw new Error("Lead has no email address");
    }

    const activeTone = toneOverride || tone;
    const context = `Stage: ${lead.stage}. Last activity: ${lead.lastActivity}. Expected budget: ${formatRupee(lead.budgetValue)}.`;
    const data = await apiRequest<{ subject: string; body: string }>(`/leads/${lead.id}/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadName: lead.name,
        tone: activeTone,
        context,
      }),
    });

    setDraftSubject(data.subject || `Follow-up on ${lead.company}`);
    setDraftBody(data.body || "");
    setIsDraftOpen(true);
  };

  const openSendDialog = async () => {
    if (!canEmail) {
      throw new Error("Lead has no email address");
    }

    if (!draftBody.trim()) {
      await generateDraftEmail();
    }

    setIsSendOpen(true);
  };

  const sendEmail = async () => {
    if (!canEmail) {
      throw new Error("Lead has no email address");
    }

    if (!draftSubject.trim() || !draftBody.trim()) {
      throw new Error("Email subject and body are required");
    }

    await apiRequest(`/communication/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId: lead.id,
        to: lead.email,
        subject: draftSubject,
        text: draftBody,
      }),
    });

    toast.success("Email sent successfully");
    setIsSendOpen(false);
  };

  const sendWhatsApp = async () => {
    if (!canWhatsApp) {
      throw new Error("Lead has no phone number");
    }

    let aiText = "";
    try {
      aiText = await apiRequest<string>("/communication/ai-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead: {
            name: lead.name,
            company: lead.company,
            stage: lead.stage,
            score: lead.score,
            value: lead.budgetValue,
            lastActivity: lead.lastActivity,
          },
          context: "Follow up on project scope and next meeting",
        }),
      }, 7000);
    } catch {
      aiText = `Hi ${lead.name}, quick follow-up on ${lead.company}. We can finalize next steps for ${lead.stage} today. Are you available for a short call?`;
    }

    try {
      await apiRequest("/communication/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          to: lead.phone,
          message: aiText,
        }),
      }, 7000);
      toast.success("WhatsApp message sent");
    } catch {
      window.open(`https://wa.me/?text=${encodeURIComponent(aiText)}`, "_blank");
      toast.success("WhatsApp text generated and opened");
    }
  };

  const openSchedule = (type: MeetingType) => {
    setMeetingType(type);
    setAttendees(lead.email && lead.email !== "N/A" ? lead.email : "");
    setIsScheduleOpen(true);
  };

  const sendIntakeLink = async () => {
    console.log("📧 Starting send client link for lead:", lead.id);
    
    if (!lead.id) {
      throw new Error("Lead ID is required");
    }

    try {
      const response = await sendClientLink({
        leadId: String(lead.id),
        name: lead.name,
        company: lead.company,
        email: canEmail ? lead.email : undefined,
      });

      console.log("✅ Client link response:", response);

      if (!response?.link) {
        throw new Error("No client link returned from server");
      }

      try {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(response.link);
          console.log("📋 Link copied to clipboard");
        }
      } catch (clipboardError) {
        console.warn("⚠️ Failed to copy to clipboard:", clipboardError);
      }

      toast.success("Client intake link sent. Secure URL copied to clipboard.");
      console.log("✅ Send client link completed successfully");
    } catch (error) {
      console.error("❌ Error sending client link:", error);
      throw error;
    }
  };

  const scheduleMeeting = async () => {
    if (!meetingDate || !meetingTime) {
      throw new Error("Date and time are required");
    }

    const attendeeList = parseAttendees(attendees);
    const generatedTitle = meetingType === "google_meet"
      ? `Google Meet with ${lead.name}`
      : meetingType === "zoom"
      ? `Zoom Meeting with ${lead.name}`
      : `Scheduled Call with ${lead.name}`;

    const created = await apiRequest<{ meetingLink?: string }>("/communication/meeting/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId: lead.id,
        title: generatedTitle,
        selectedDate: meetingDate,
        selectedTime: meetingTime,
        meetingType,
        attendees: attendeeList,
        phoneNumber: canWhatsApp ? lead.phone : "",
        reminders: {
          email: true,
          whatsapp: canWhatsApp,
        },
        reminderMinutes: 10,
      }),
    });

    if (created.meetingLink) {
      window.open(created.meetingLink, "_blank");
      toast.success("Meeting scheduled and link created");
    } else {
      toast.success("Meeting scheduled successfully");
    }

    setIsScheduleOpen(false);
    if (onRefresh) await onRefresh();
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-border/30">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => void withLoading("ai-score", loadIntelligence)}
          className="h-7 px-2.5 text-xs rounded-full bg-gradient-to-r from-primary to-purple-500 text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.4)] hover:opacity-90 hover:shadow-[0_0_18px_hsl(var(--primary)/0.5)] transition-all"
        >
          {loadingAction === "ai-score" ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Brain className="w-3 h-3 mr-1" />}
          <span className="hidden sm:inline">AI Score</span>
        </Button>

        <Button size="sm" variant="ghost" onClick={() => void withLoading("predict", loadPrediction)} className="h-7 px-2.5 text-xs rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all">
          {loadingAction === "predict" ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <TrendingUp className="w-3 h-3 mr-1" />}
          <span className="hidden sm:inline">Predict</span>
        </Button>

        <Button size="sm" variant="ghost" onClick={() => void withLoading("draft", generateDraftEmail)} className="h-7 px-2.5 text-xs rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all">
          {loadingAction === "draft" ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Mail className="w-3 h-3 mr-1" />}
          <span className="hidden sm:inline">Draft Email</span>
        </Button>

        <Button size="sm" variant="ghost" onClick={() => void withLoading("send", openSendDialog)} className="h-7 px-2.5 text-xs rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all">
          {loadingAction === "send" ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Send className="w-3 h-3 mr-1" />}
          <span className="hidden sm:inline">Send Email</span>
        </Button>

        <Button size="sm" variant="ghost" onClick={() => void withLoading("whatsapp", sendWhatsApp)} className="h-7 px-2.5 text-xs rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all">
          {loadingAction === "whatsapp" ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <MessageCircle className="w-3 h-3 mr-1" />}
          <span className="hidden sm:inline">WhatsApp</span>
        </Button>

        <Button size="sm" variant="ghost" onClick={() => openSchedule("phone")} className="h-7 px-2.5 text-xs rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all">
          <Phone className="w-3 h-3 mr-1" />
          <span className="hidden sm:inline">Schedule Call</span>
        </Button>

        <Button size="sm" variant="ghost" onClick={() => openSchedule("google_meet")} className="h-7 px-2.5 text-xs rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all">
          <Video className="w-3 h-3 mr-1" />
          <span className="hidden sm:inline">Google Meet</span>
        </Button>

        <Button size="sm" variant="ghost" onClick={() => void withLoading("send-link", sendIntakeLink)} className="h-7 px-2.5 text-xs rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all">
          {loadingAction === "send-link" ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Link2 className="w-3 h-3 mr-1" />}
          <span className="hidden sm:inline">Send Client Link</span>
        </Button>

        <Button size="sm" variant="ghost" onClick={onEdit} className="h-7 px-2.5 text-xs rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all">
          <Pencil className="w-3 h-3 mr-1" />
          <span className="hidden sm:inline">Edit</span>
        </Button>
      </div>

      <Dialog open={isIntelOpen} onOpenChange={setIsIntelOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>AI Lead Intelligence</DialogTitle>
            <DialogDescription>Live analysis from Ollama using current lead data.</DialogDescription>
          </DialogHeader>

          {intelligence ? (
            <div className="space-y-4 text-sm">
              <div className="rounded-xl border border-border/50 bg-secondary/30 p-4">
                <p className="text-muted-foreground">Score</p>
                <p className="text-xl font-semibold">{intelligence.score}/100 · {intelligence.label}</p>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-border/50 bg-secondary/20 p-3">Budget Match: {intelligence.breakdown.budgetMatch}%</div>
                <div className="rounded-xl border border-border/50 bg-secondary/20 p-3">Urgency: {intelligence.breakdown.urgency}</div>
                <div className="rounded-xl border border-border/50 bg-secondary/20 p-3">Industry Fit: {intelligence.breakdown.industryFit}</div>
                <div className="rounded-xl border border-border/50 bg-secondary/20 p-3">Communication: {intelligence.breakdown.communication}</div>
                <div className="rounded-xl border border-border/50 bg-secondary/20 p-3 md:col-span-2">Decision Power: {intelligence.breakdown.decisionPower}</div>
              </div>

              <div className="rounded-xl border border-border/50 bg-secondary/20 p-4 space-y-1">
                <p>Close chance: {Math.round(intelligence.prediction.closeProbability)}%</p>
                <p>Expected deal: {formatRupee(intelligence.prediction.expectedDealValue)}</p>
                <p>Best action: {intelligence.prediction.bestAction}</p>
              </div>

              <div className="rounded-xl border border-border/50 bg-secondary/20 p-4 text-xs text-muted-foreground">
                Provider: {intelligence.provider} · Model: {intelligence.model}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={isDraftOpen} onOpenChange={setIsDraftOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>AI Draft Email</DialogTitle>
            <DialogDescription>Generated from live lead stage, budget, and activity. You can edit before sending.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={tone} onValueChange={(value: Tone) => {
                setTone(value);
                if (isDraftOpen) {
                  void withLoading("draft", () => generateDraftEmail(value));
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subject</Label>
              <Input value={draftSubject} onChange={(event) => setDraftSubject(event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Body</Label>
              <Textarea value={draftBody} onChange={(event) => setDraftBody(event.target.value)} className="min-h-[220px]" />
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={() => void withLoading("draft", () => generateDraftEmail())} disabled={loadingAction === "draft"}>
                {loadingAction === "draft" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Regenerate
              </Button>
              <Button onClick={() => setIsSendOpen(true)}>Use in Send Email</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSendOpen} onOpenChange={setIsSendOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Confirm Email</DialogTitle>
            <DialogDescription>Preview and edit before sending.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Input value={draftSubject} onChange={(event) => setDraftSubject(event.target.value)} />
            <Textarea value={draftBody} onChange={(event) => setDraftBody(event.target.value)} className="min-h-[220px]" />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsSendOpen(false)}>Cancel</Button>
              <Button variant="outline" onClick={() => setIsDraftOpen(true)}>Edit</Button>
              <Button onClick={() => void withLoading("send-now", sendEmail)} disabled={loadingAction === "send-now"}>
                {loadingAction === "send-now" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Send Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{meetingTypeLabel}</DialogTitle>
            <DialogDescription>Pick platform, set time, and confirm. Meeting link is created automatically and email is sent to lead + admin.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <button
                type="button"
                onClick={() => setMeetingType("google_meet")}
                className={`rounded-xl border px-3 py-3 text-left transition-all ${meetingType === "google_meet" ? "border-primary bg-primary/10 shadow-[0_0_14px_hsl(var(--primary)/0.25)]" : "border-border/60 bg-secondary/20 hover:bg-secondary/30"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Google Meet</span>
                  {meetingType === "google_meet" ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Video className="h-4 w-4 text-muted-foreground" />}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Auto-create Meet link</p>
              </button>

              <button
                type="button"
                onClick={() => setMeetingType("zoom")}
                className={`rounded-xl border px-3 py-3 text-left transition-all ${meetingType === "zoom" ? "border-sky-400/70 bg-sky-500/10 shadow-[0_0_14px_rgba(56,189,248,0.25)]" : "border-border/60 bg-secondary/20 hover:bg-secondary/30"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Zoom</span>
                  {meetingType === "zoom" ? <CheckCircle2 className="h-4 w-4 text-sky-300" /> : <Video className="h-4 w-4 text-muted-foreground" />}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Auto-create Zoom link</p>
              </button>

              <button
                type="button"
                onClick={() => setMeetingType("phone")}
                className={`rounded-xl border px-3 py-3 text-left transition-all ${meetingType === "phone" ? "border-emerald-400/60 bg-emerald-500/10 shadow-[0_0_14px_rgba(16,185,129,0.2)]" : "border-border/60 bg-secondary/20 hover:bg-secondary/30"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Phone Call</span>
                  {meetingType === "phone" ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <Phone className="h-4 w-4 text-muted-foreground" />}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">No meeting link</p>
              </button>
            </div>

            <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-primary/10 via-secondary/40 to-background p-4 shadow-sm">
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-background/80 px-2.5 py-1 font-medium text-foreground">
                  {meetingTypeLabel}
                </span>
                <span className="rounded-full bg-background/80 px-2.5 py-1 text-muted-foreground">
                  Reminder: 10 min before
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 w-full justify-between border-border/60 bg-background/90 px-3 text-left font-medium"
                      >
                        <span>{formatDateLabel(meetingDate)}</span>
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-auto border-border/60 bg-background/95 p-0">
                      <Calendar
                        mode="single"
                        selected={selectedMeetingDate}
                        onSelect={(date) => {
                          if (!date) return;
                          setMeetingDate(formatLocalDateInput(date));
                        }}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Select value={meetingTime} onValueChange={setMeetingTime}>
                    <SelectTrigger className="h-11 border-border/60 bg-background/90">
                      <div className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Pick a time" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {TIME_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>{formatTimeLabel(option)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <p className="mt-4 text-sm text-muted-foreground">
                {schedulePreview}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  { label: "10:00", time: "10:00" },
                  { label: "12:00", time: "12:00" },
                  { label: "15:00", time: "15:00" },
                  { label: "18:00", time: "18:00" },
                ].map((slot) => (
                  <button
                    key={slot.label}
                    type="button"
                    onClick={() => {
                      if (!meetingDate) return;
                      setMeetingTime(slot.time);
                    }}
                    disabled={!meetingDate}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${meetingTime === slot.time ? "border-primary/70 bg-primary/15 text-foreground" : "border-border/60 bg-background/70 text-muted-foreground hover:bg-background"}`}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Additional guests (optional, comma separated emails)</Label>
              <Input value={attendees} onChange={(event) => setAttendees(event.target.value)} placeholder="client@company.com, manager@company.com" />
            </div>

            <div className="rounded-xl border border-border/50 bg-secondary/20 px-3 py-2 text-xs text-muted-foreground">
              Confirmation is always sent to the lead and admins, plus any additional guests entered above.
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsScheduleOpen(false)}>Cancel</Button>
              <Button onClick={() => void withLoading("schedule", scheduleMeeting)} disabled={loadingAction === "schedule"}>
                {loadingAction === "schedule" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Confirm Schedule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
