"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Search, Filter, MoreHorizontal, Target,
  Loader2, Link2, CheckCircle, Send, Plus, X
} from "lucide-react";
import { getLeads, importLeads, markLeadConnected, updateLeadStatus, createLead, type Lead } from "@/lib/api";

const statusColor = (status: string) => {
  switch (status) {
    case "MEETING_BOOKED": case "DEMO_SENT": return "success" as const;
    case "RESPONDED": case "CONNECTED": return "info" as const;
    case "DM_SENT": return "warning" as const;
    case "CLIENT_WON": return "success" as const;
    case "NEW": return "default" as const;
    case "CLIENT_LOST": return "danger" as const;
    default: return "default" as const;
  }
};

const statusLabel = (status: string) => {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const statusOptions = [
  "NEW", "CONNECTED", "DM_SENT", "RESPONDED",
  "MEETING_BOOKED", "DEMO_SENT", "CLIENT_WON", "CLIENT_LOST"
];

const stageColors: Record<string, { text: string; bg: string }> = {
  NEW: { text: "#6b7280", bg: "#f3f4f6" },
  CONNECTED: { text: "#1d4ed8", bg: "#dbeafe" },
  DM_SENT: { text: "#a16207", bg: "#fef9c3" },
  RESPONDED: { text: "#1d4ed8", bg: "#dbeafe" },
  MEETING_BOOKED: { text: "#15803d", bg: "#dcfce7" },
  DEMO_SENT: { text: "#15803d", bg: "#dcfce7" },
  CLIENT_WON: { text: "#15803d", bg: "#dcfce7" },
  CLIENT_LOST: { text: "#b91c1c", bg: "#fee2e2" },
};

export default function Leads() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [form, setForm] = useState({ name: "", linkedinUrl: "", company: "", headline: "", location: "", profilePicture: "", followerCount: "" });
  const [importUrls, setImportUrls] = useState("");
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: allLeads = [] } = useQuery({
    queryKey: ["leads", filterStatus, search],
    queryFn: () => getLeads({ status: filterStatus, search }),
  });

  const { data: stats } = useQuery({
    queryKey: ["leads-stats"],
    queryFn: async () => {
      const all = await getLeads();
      return {
        total: all.length,
        hot: all.filter((l) => l.score >= 80).length,
        engaged: all.filter((l) => ["RESPONDED", "CONNECTED", "DM_SENT"].includes(l.status)).length,
      };
    },
  });

  const handleImport = async () => {
    setImporting(true);
    setImportMsg(null);
    try {
      const profileUrls = importUrls.split("\n").map((u) => u.trim()).filter(Boolean);
      if (!profileUrls.length) { setImporting(false); return; }
      const result = await importLeads(profileUrls);
      const parts: string[] = [];
      if (result.imported > 0) parts.push(`Imported ${result.imported} new`);
      if (result.merged > 0) parts.push(`Merged ${result.merged} duplicates`);
      setImportMsg(parts.length > 0 ? parts.join(", ") : "No new leads found");
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setShowImportForm(false);
      setImportUrls("");
    } catch (e: any) {
      setImportMsg("Import failed: " + (e.message || "Unknown error"));
    } finally {
      setImporting(false);
      setTimeout(() => setImportMsg(null), 4000);
    }
  };

  const handleAddManually = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const result = await createLead({
        linkedinUrl: form.linkedinUrl.trim(),
        name: form.name.trim(),
        company: form.company.trim(),
        headline: form.headline.trim(),
        location: form.location.trim(),
        profilePicture: form.profilePicture.trim() || undefined,
        followerCount: form.followerCount ? parseInt(form.followerCount) : undefined,
      });
      if (result.merged) {
        setImportMsg(`Merged "${form.name.trim()}" into existing lead`);
      } else {
        setImportMsg(`Added ${form.name.trim()} to leads`);
      }
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setShowAddForm(false);
      setForm({ name: "", linkedinUrl: "", company: "", headline: "", location: "", profilePicture: "", followerCount: "" });
    } catch (e: any) {
      setImportMsg("Failed to add lead: " + (e.message || "Error"));
    } finally {
      setSaving(false);
      setTimeout(() => setImportMsg(null), 4000);
    }
  };

  const handleMarkConnected = async (leadId: string) => {
    setUpdatingId(leadId);
    try {
      await markLeadConnected(leadId);
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    } catch (e: any) {
      console.error("Mark connected failed:", e);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    setUpdatingId(leadId);
    try {
      await updateLeadStatus(leadId, newStatus);
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    } catch (e: any) {
      console.error("Status update failed:", e);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = allLeads;

  const modalOverlay: React.CSSProperties = {
    position: "fixed", inset: 0, zIndex: 50,
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
  };

  const modalBox: React.CSSProperties = {
    width: "100%", maxWidth: "480px",
    background: "var(--card)", borderRadius: "12px",
    border: "1px solid var(--card-border)",
    padding: "24px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  };

  return (
    <div className="space-y-5 max-w-7xl">
      {showAddForm && (
        <div style={modalOverlay} onClick={() => setShowAddForm(false)}>
          <div style={modalBox} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>Add Lead</h2>
              <button onClick={() => setShowAddForm(false)} className="p-1 rounded hover:opacity-70">
                <X className="w-5 h-5" style={{ color: "var(--muted)" }} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted)" }}>Name *</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Full name"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted)" }}>LinkedIn URL</label>
                <Input
                  value={form.linkedinUrl}
                  onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted)" }}>Company</label>
                <Input
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="Company name"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted)" }}>Headline / Title</label>
                <Input
                  value={form.headline}
                  onChange={(e) => setForm({ ...form, headline: e.target.value })}
                  placeholder="e.g. Founder at Company"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted)" }}>Location</label>
                <Input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="City, Country"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted)" }}>Follower Count</label>
                <Input
                  type="number"
                  value={form.followerCount}
                  onChange={(e) => setForm({ ...form, followerCount: e.target.value })}
                  placeholder="e.g. 5000"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted)" }}>Profile Picture URL</label>
                <Input
                  value={form.profilePicture}
                  onChange={(e) => setForm({ ...form, profilePicture: e.target.value })}
                  placeholder="https://media.licdn.com/..."
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleAddManually} disabled={saving || !form.name.trim()}>
                  {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Plus className="w-4 h-4 mr-1.5" />}
                  {saving ? "Saving..." : "Add Lead"}
                </Button>
                <Button variant="secondary" onClick={() => setShowAddForm(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showImportForm && (
        <div style={modalOverlay} onClick={() => setShowImportForm(false)}>
          <div style={modalBox} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>Import from LinkedIn</h2>
              <button onClick={() => setShowImportForm(false)} className="p-1 rounded hover:opacity-70">
                <X className="w-5 h-5" style={{ color: "var(--muted)" }} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted)" }}>Profile URLs (one per line)</label>
                <textarea
                  className="w-full rounded-lg p-3 text-sm min-h-[120px] resize-none focus:outline-none focus:ring-2"
                  style={{
                    background: "var(--badge-bg)", color: "var(--foreground)",
                    border: "1px solid var(--card-border)"
                  }}
                  value={importUrls}
                  onChange={(e) => setImportUrls(e.target.value)}
                  placeholder="https://www.linkedin.com/in/...&#10;https://www.linkedin.com/in/..."
                />
              </div>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                Apify scrapepilot actor required. Rent at <a href="https://console.apify.com/actors/J3zhh32m1J1uacIb6" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "#60a5fa" }}>console.apify.com</a>
              </p>
              <div className="flex gap-2">
                <Button onClick={handleImport} disabled={importing || !importUrls.trim()}>
                  {importing ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Target className="w-4 h-4 mr-1.5" />}
                  {importing ? "Importing..." : "Import"}
                </Button>
                <Button variant="secondary" onClick={() => setShowImportForm(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            Leads
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Import real LinkedIn profiles. Mark when you connect. Track every stage.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {importMsg && (
            <span className="text-xs" style={{ color: importMsg.includes("failed") ? "#f87171" : "#4ade80" }}>
              {importMsg}
            </span>
          )}
          <Button onClick={() => setShowImportForm(true)} disabled={importing} className="!text-xs !px-3">
            {importing ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Target className="w-4 h-4 mr-1.5" />}
            {importing ? "Importing..." : "Import"}
          </Button>
          <Button variant="secondary" onClick={() => setShowAddForm(true)} className="!text-xs !px-3">
            <Plus className="w-4 h-4 mr-1.5" /> Add Lead
          </Button>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted)" }} />
          <Input
            placeholder="Search leads..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-44">
          <option value="all">All Status</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>{statusLabel(s)}</option>
          ))}
        </Select>
        <Button variant="secondary" size="sm" onClick={() => setFilterStatus("all")}>
          <Filter className="w-3.5 h-3.5 mr-1" /> Clear
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Pipeline ({filtered.length})</CardTitle>
            {filtered.length === 0 && !importing && (
              <span className="text-xs" style={{ color: "var(--muted)" }}>
                Import leads above to get started
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ color: "var(--muted)" }}>
                  <th className="text-left font-medium pb-3 pr-4">Name</th>
                  <th className="text-left font-medium pb-3 pr-4 hidden sm:table-cell">Followers</th>
                  <th className="text-left font-medium pb-3 pr-4 hidden sm:table-cell">LinkedIn</th>
                  <th className="text-left font-medium pb-3 pr-4 hidden md:table-cell">Pipeline Stage</th>
                  <th className="text-left font-medium pb-3 pr-4">Score</th>
                  <th className="text-right font-medium pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? filtered.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-t transition-colors"
                    style={{ borderColor: "var(--card-border)" }}
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        {lead.profilePicture ? (
                          <img
                            src={lead.profilePicture}
                            alt={lead.name || ""}
                            className="w-8 h-8 rounded-full object-cover shrink-0"
                            style={{ border: "1px solid var(--card-border)" }}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-medium"
                            style={{ background: "var(--badge-bg)", color: "var(--muted)" }}>
                            {(lead.name || "?")[0]}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium" style={{ color: "var(--foreground)" }}>
                            {lead.name || "Unknown"}
                          </p>
                          <p className="text-xs truncate max-w-[180px]" style={{ color: "var(--muted)" }}>
                            {lead.headline || lead.company || ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 hidden sm:table-cell">
                      {lead.followerCount ? (
                        <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                          {(lead.followerCount / 1000).toFixed(1)}K
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: "var(--muted)" }}>—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 hidden sm:table-cell">
                      {lead.linkedinUrl ? (
                        <a
                          href={lead.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs"
                          style={{ color: "#60a5fa" }}
                        >
                          <Link2 className="w-3 h-3" /> Profile
                        </a>
                      ) : (
                        <span className="text-xs" style={{ color: "var(--muted)" }}>—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 hidden md:table-cell relative">
                      <button
                        className="w-full text-left rounded-md px-2 py-1.5 text-xs font-medium transition-colors"
                        style={{
                          color: stageColors[lead.status]?.text || "var(--foreground)",
                          background: stageColors[lead.status]?.bg || "var(--badge-bg)",
                          border: "1px solid var(--card-border)",
                        }}
                        onClick={() => setOpenDropdown(openDropdown === lead.id ? null : lead.id)}
                      >
                        {statusLabel(lead.status)}
                      </button>
                      {openDropdown === lead.id && (
                        <div
                          className="absolute left-0 right-0 top-full mt-1 z-50 rounded-md overflow-hidden shadow-lg"
                          style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
                        >
                          {statusOptions.map((s) => (
                            <button
                              key={s}
                              className="w-full text-left px-3 py-2 text-xs font-medium transition-colors hover:opacity-80"
                              style={{
                                color: stageColors[s]?.text || "var(--foreground)",
                                background: stageColors[s]?.bg || "transparent",
                              }}
                              onClick={() => {
                                if (s !== lead.status) handleStatusChange(lead.id, s);
                                setOpenDropdown(null);
                              }}
                            >
                              {statusLabel(s)}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={
                        lead.score >= 80 ? "text-green-400 font-medium" :
                        lead.score >= 50 ? "text-yellow-400" :
                        "text-gray-400"
                      }>
                        {lead.score}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {lead.linkedinUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="!p-1.5"
                            title="Open LinkedIn"
                            onClick={() => window.open(lead.linkedinUrl!, "_blank")}
                          >
                            <Link2 className="w-3.5 h-3.5" style={{ color: "#60a5fa" }} />
                          </Button>
                        )}
                        {lead.status === "NEW" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="!p-1.5"
                            title="Mark Connected"
                            disabled={updatingId === lead.id}
                            onClick={() => handleMarkConnected(lead.id)}
                          >
                            {updatingId === lead.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <CheckCircle className="w-3.5 h-3.5" style={{ color: "#4ade80" }} />
                            }
                          </Button>
                        )}
                        {lead.status !== "NEW" && lead.status !== "CLIENT_LOST" && lead.status !== "ARCHIVED" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="!p-1.5"
                            title="Next stage"
                            onClick={() => {
                              const idx = statusOptions.indexOf(lead.status);
                              const next = statusOptions[Math.min(idx + 1, statusOptions.length - 1)];
                              if (next && next !== lead.status) handleStatusChange(lead.id, next);
                            }}
                          >
                            <Send className="w-3.5 h-3.5" style={{ color: "#fbbf24" }} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-sm" style={{ color: "var(--muted)" }}>
                      {importing ? "Importing leads from LinkedIn..." : "No leads yet. Import from LinkedIn to start building your pipeline."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Total Leads", value: stats?.total ?? "0", color: "var(--foreground)" },
          { label: "Hot (score 80+)", value: stats?.hot ?? "0", color: "#4ade80" },
          { label: "Engaged", value: stats?.engaged ?? "0", color: "#60a5fa" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs" style={{ color: "var(--muted)" }}>{s.label}</p>
              <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
