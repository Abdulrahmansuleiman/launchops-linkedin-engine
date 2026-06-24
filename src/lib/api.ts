const BASE = "";

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let detail = `API error: ${res.status}`;
    try {
      const body = await res.json();
      if (body.error) detail = body.error;
      if (body.detail) detail += ` — ${body.detail}`;
    } catch {}
    throw new Error(detail);
  }
  return res.json();
}

export interface Lead {
  id: string;
  name: string | null;
  headline: string | null;
  company: string | null;
  location: string | null;
  linkedinUrl: string | null;
  profilePicture: string | null;
  followerCount: number | null;
  score: number;
  scoreReason: string | null;
  scoreComponents: any;
  status: string;
  notes: string | null;
  connectedAt: string | null;
  lastContactedAt: string | null;
  createdAt: string;
}

export interface Post {
  id: string;
  content: string;
  topic: string | null;
  score: number | null;
  scoreReason: string | null;
  impressionPrediction: string | null;
  status: string;
  impressions: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  weekLabel: string | null;
  createdAt: string;
  feedbackRating: string | null;
  feedbackNotes: string | null;
}

export interface OutreachSequence {
  id: string;
  name: string;
  steps: any;
  isActive: boolean;
  messages: OutreachMessage[];
}

export interface OutreachMessage {
  id: string;
  content: string;
  stepNumber: number;
  status: string;
  sentAt: string | null;
}

export interface WeeklyReport {
  id: string;
  weekLabel: string;
  report: any;
  createdAt: string;
}

export interface Ad {
  id: string;
  content: string;
  hook: string | null;
  body: string | null;
  cta: string | null;
  angle: string | null;
  score: number | null;
  scoreReason: string | null;
  impressionPrediction: string | null;
  stage: string;
  topic: string | null;
  platform: string | null;
  tags: string[];
  service: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export async function getAds(stage?: string) {
  const qs = stage ? `?stage=${stage}` : "";
  return fetchJSON<Ad[]>(`/api/ads${qs}`);
}

export async function generateAds(params: {
  niche: string;
  offer: string;
  service: string;
  targetAudience: string;
  platform: string;
  count?: number;
}) {
  return fetchJSON<{ ads: Ad[] }>("/api/ads", {
    method: "POST",
    body: JSON.stringify({ action: "generate", ...params }),
  });
}

export async function updateAd(id: string, data: Partial<Ad>) {
  return fetchJSON<Ad>(`/api/ads/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteAd(id: string) {
  return fetchJSON<{ success: boolean }>(`/api/ads/${id}`, { method: "DELETE" });
}

// === Leads ===
export async function importLeads(profileUrls: string[]) {
  return fetchJSON<{ imported: number; merged: number; leads: Lead[] }>("/api/leads", {
    method: "POST",
    body: JSON.stringify({ action: "import", profileUrls }),
  });
}

export async function getLeads(params?: { status?: string; search?: string }) {
  const query = new URLSearchParams();
  if (params?.status && params.status !== "all") query.set("status", params.status);
  if (params?.search) query.set("search", params.search);
  const qs = query.toString();
  return fetchJSON<Lead[]>(`/api/leads${qs ? `?${qs}` : ""}`);
}

export async function getLeadStats() {
  const leads = await getLeads();
  const total = leads.length;
  const hot = leads.filter((l) => l.status === "MEETING_BOOKED" || l.status === "DEMO_SENT").length;
  const engaged = leads.filter((l) => l.status === "RESPONDED" || l.status === "CONNECTED").length;
  const pipelineValue = leads.filter((l) => l.score >= 80).length * 3000;
  return { total, hot, engaged, pipelineValue };
}

// === Content ===
export async function getPosts(params?: { weekLabel?: string; status?: string }) {
  const query = new URLSearchParams();
  if (params?.weekLabel) query.set("weekLabel", params.weekLabel);
  if (params?.status) query.set("status", params.status);
  const qs = query.toString();
  return fetchJSON<Post[]>(`/api/content${qs ? `?${qs}` : ""}`);
}

export async function generateDrafts(topic: string, weekLabel?: string, day?: string) {
  return fetchJSON<{ drafts: Post[] }>("/api/content", {
    method: "POST",
    body: JSON.stringify({ action: "generate", topic, weekLabel, day }),
  });
}

export async function publishPost(id: string) {
  return fetchJSON<Post>("/api/content", {
    method: "PATCH",
    body: JSON.stringify({ id, status: "PUBLISHED", publishedAt: new Date().toISOString() }),
  });
}

export async function submitPostFeedback(id: string, feedbackRating: string, feedbackNotes: string) {
  return fetchJSON<Post>("/api/content", {
    method: "PATCH",
    body: JSON.stringify({ id, feedbackRating, feedbackNotes }),
  });
}

export async function updatePostMetrics(id: string, metrics: { impressions?: number; likes?: number; comments?: number }) {
  return fetchJSON<Post>("/api/content", {
    method: "PATCH",
    body: JSON.stringify({ id, ...metrics }),
  });
}

export async function deletePost(id: string) {
  return fetchJSON<{ success: boolean }>(`/api/content/${id}`, { method: "DELETE" });
}

export async function polishPost(content: string) {
  return fetchJSON<any>("/api/openai", {
    method: "POST",
    body: JSON.stringify({ action: "polishPost", content }),
  });
}

// === Outreach ===
export async function getSequences() {
  return fetchJSON<OutreachSequence[]>("/api/outreach");
}

export async function createLead(data: { linkedinUrl: string; name: string; company: string; headline: string; location: string; profilePicture?: string; followerCount?: number }) {
  return fetchJSON<Lead & { merged?: boolean }>("/api/leads", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function markLeadConnected(leadId: string) {
  return fetchJSON<Lead>("/api/leads", {
    method: "PATCH",
    body: JSON.stringify({ action: "markConnected", leadId }),
  });
}

export async function updateLeadStatus(leadId: string, status: string) {
  return fetchJSON<Lead>("/api/leads", {
    method: "PATCH",
    body: JSON.stringify({ action: "updateStatus", leadId, status }),
  });
}

export async function deleteLead(leadId: string) {
  return fetchJSON<{ success: boolean }>(`/api/leads/${leadId}`, { method: "DELETE" });
}

export async function generateMessage(params: {
  prospectName: string;
  prospectCompany?: string;
  prospectLocation?: string;
  prospectDetail?: string;
  step: string;
  context?: string;
}) {
  return fetchJSON<{ message: any }>("/api/openai", {
    method: "POST",
    body: JSON.stringify({ action: "generateOutreach", ...params }),
  });
}

export async function sendOutreachMessage(data: {
  sequenceId: string;
  leadId: string;
  stepNumber: number;
  content: string;
}) {
  return fetchJSON<any>("/api/outreach", {
    method: "POST",
    body: JSON.stringify({ action: "send", ...data }),
  });
}

// === Analytics ===
export async function getWeeklyReports() {
  return fetchJSON<WeeklyReport[]>("/api/content?status=PUBLISHED");
}

// === Lead Discovery ===
export interface DiscoveredLead {
  name: string;
  headline: string;
  company: string;
  location: string;
  linkedinUrl: string;
  profilePicture: string;
  followerCount: number;
  about: string;
  score: number;
  scoreReason: string | null;
  strengths: string[];
  concerns: string[];
  verdict: string;
  alreadyExists: boolean;
  existingStatus: string | null;
  existingScore: number | null;
}

export async function discoverLeads(criteria?: { keywords?: string; limit?: number; followerCountMin?: number }) {
  return fetchJSON<{ leads: DiscoveredLead[] }>("/api/discovery", {
    method: "POST",
    body: JSON.stringify({ action: "search", ...criteria }),
  });
}

export async function importDiscoveredLeads(leads: DiscoveredLead[]) {
  return fetchJSON<{ imported: number; skipped: number; skippedDetails: { name: string; reason: string; id: string }[]; leads: Lead[] }>("/api/discovery", {
    method: "POST",
    body: JSON.stringify({ action: "import", leads }),
  });
}

export async function generateWeeklyInsights() {
  return fetchJSON<any>("/api/openai", {
    method: "POST",
    body: JSON.stringify({ action: "weeklyInsights", weekPosts: [] }),
  });
}
