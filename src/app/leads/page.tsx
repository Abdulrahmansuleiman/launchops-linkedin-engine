"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Search, Filter, MessageCircle, Send, MoreHorizontal, Target,
  Loader2, Link2, CheckCircle, XCircle, Plus
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

export default function Leads() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
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
      const urls = prompt("Enter LinkedIn profile URLs (one per line):");
      if (!urls) { setImporting(false); return; }
      const profileUrls = urls.split("\n").map((u) => u.trim()).filter(Boolean);
      const result = await importLeads(profileUrls);
      setImportMsg(`Imported ${result.imported} new leads`);
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    } catch (e: any) {
      setImportMsg("Import failed: " + (e.message || "Unknown error"));
    } finally {
      setImporting(false);
      setTimeout(() => setImportMsg(null), 4000);
    }
  };

  const handleAddManually = async () => {
    const name = prompt("Lead name:")?.trim();
    if (!name) return;
    const linkedinUrl = prompt("LinkedIn profile URL (optional):")?.trim() || "";
    const company = prompt("Company (optional):")?.trim() || "";
    const headline = prompt("Headline / title (optional):")?.trim() || "";
    try {
      await createLead({ linkedinUrl, name, company, headline, location: "" });
      setImportMsg(`Added ${name} to leads`);
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    } catch (e: any) {
      setImportMsg("Failed to add lead: " + (e.message || "Error"));
    } finally {
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

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            Leads
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Import real LinkedIn profiles. Mark when you connect. Track every stage.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {importMsg && (
            <span className="text-xs" style={{ color: importMsg.includes("failed") ? "#f87171" : "#4ade80" }}>
              {importMsg}
            </span>
          )}
          <Button onClick={handleImport} disabled={importing}>
            {importing ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Target className="w-4 h-4 mr-1.5" />}
            {importing ? "Importing..." : "Import from LinkedIn"}
          </Button>
          <Button variant="secondary" onClick={handleAddManually}>
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
                  <th className="text-left font-medium pb-3 pr-4 hidden sm:table-cell">LinkedIn</th>
                  <th className="text-left font-medium pb-3 pr-4 hidden md:table-cell">Status</th>
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
                      <p className="font-medium" style={{ color: "var(--foreground)" }}>
                        {lead.name || "Unknown"}
                      </p>
                      <p className="text-xs truncate max-w-[200px]" style={{ color: "var(--muted)" }}>
                        {lead.headline || lead.company || ""}
                      </p>
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
                    <td className="py-3 pr-4 hidden md:table-cell">
                      <Badge variant={statusColor(lead.status)}>{statusLabel(lead.status)}</Badge>
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
                        <div className="relative inline-block">
                          <select
                            className="appearance-none bg-transparent p-1.5 text-xs cursor-pointer rounded"
                            style={{ color: "var(--muted)", border: "1px solid transparent" }}
                            value=""
                            onChange={(e) => {
                              if (e.target.value) handleStatusChange(lead.id, e.target.value);
                              e.target.value = "";
                            }}
                          >
                            <option value="" disabled>Set...</option>
                            {statusOptions.filter(s => s !== lead.status).map((s) => (
                              <option key={s} value={s}>{statusLabel(s)}</option>
                            ))}
                          </select>
                          <MoreHorizontal className="w-3.5 h-3.5 pointer-events-none absolute right-1 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-sm" style={{ color: "var(--muted)" }}>
                      {importing ? "Importing leads from LinkedIn..." : "No leads yet. Import from LinkedIn to start building your pipeline."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-3">
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
