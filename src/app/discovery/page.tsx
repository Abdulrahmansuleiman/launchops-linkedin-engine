"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, Target, Loader2, X, CheckCircle, AlertCircle, ChevronDown, ChevronUp, UserCheck, Briefcase, Users, Import
} from "lucide-react";
import { discoverLeads, importDiscoveredLeads, type DiscoveredLead } from "@/lib/api";

const verdictColor = (v: string) => {
  switch (v) {
    case "hot": return { text: "#4ade80", bg: "#052e16" };
    case "warm": return { text: "#fbbf24", bg: "#422006" };
    case "cold": return { text: "#9ca3af", bg: "#1f2937" };
    default: return { text: "#9ca3af", bg: "#1f2937" };
  }
};

const scoreColor = (s: number) =>
  s >= 80 ? "#4ade80" : s >= 50 ? "#fbbf24" : "#9ca3af";

const defaultKeywords = "founder CEO owner entrepreneur managing director";

export default function Discovery() {
  const [keywords, setKeywords] = useState(defaultKeywords);
  const [limit, setLimit] = useState("20");
  const [minFollowers, setMinFollowers] = useState("0");
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<DiscoveredLead[] | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedAbout, setExpandedAbout] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [importDone, setImportDone] = useState(false);
  const queryClient = useQueryClient();

  const showMsg = (text: string, ok: boolean) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 6000);
  };

  const handleSearch = async () => {
    setSearching(true);
    setResults(null);
    setSelectedIds(new Set());
    setImportDone(false);
    try {
      const res = await discoverLeads({
        keywords,
        limit: parseInt(limit) || 20,
        followerCountMin: parseInt(minFollowers) || 0,
      });
      setResults(res.leads);
      if (res.leads.length === 0) {
        showMsg("No leads found. Try different keywords.", false);
      }
    } catch (e: any) {
      showMsg("Search failed: " + (e.message || "Unknown error"), false);
    } finally {
      setSearching(false);
    }
  };

  const toggleSelect = (linkedinUrl: string) => {
    const next = new Set(selectedIds);
    if (next.has(linkedinUrl)) {
      next.delete(linkedinUrl);
    } else {
      next.add(linkedinUrl);
    }
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (!results) return;
    const available = results.filter((r) => !r.alreadyExists);
    if (selectedIds.size === available.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(available.map((r) => r.linkedinUrl)));
    }
  };

  const handleImport = async () => {
    if (!results) return;
    const toImport = results.filter((r) => selectedIds.has(r.linkedinUrl));
    if (toImport.length === 0) return;
    setImporting(true);
    try {
      const res = await importDiscoveredLeads(toImport);
      const parts: string[] = [];
      if (res.imported > 0) parts.push(`Imported ${res.imported} new lead${res.imported > 1 ? "s" : ""}`);
      if (res.skipped > 0) parts.push(`${res.skipped} already existed`);
      showMsg(parts.join(", "), true);
      setImportDone(true);
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    } catch (e: any) {
      showMsg("Import failed: " + (e.message || "Unknown error"), false);
    } finally {
      setImporting(false);
    }
  };

  const availableCount = results ? results.filter((r) => !r.alreadyExists).length : 0;
  const hotCount = results ? results.filter((r) => !r.alreadyExists && r.verdict === "hot").length : 0;
  const warmCount = results ? results.filter((r) => !r.alreadyExists && r.verdict === "warm").length : 0;

  const modalOverlay: React.CSSProperties = {
    position: "fixed", inset: 0, zIndex: 50,
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
  };

  const modalBox: React.CSSProperties = {
    width: "100%", maxWidth: "520px",
    background: "var(--card)", borderRadius: "12px",
    border: "1px solid var(--card-border)",
    padding: "24px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  };

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            Lead Discovery
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Search LinkedIn for business owners matching your ICP. AI-qualified instantly.
          </p>
        </div>
        {msg && (
          <span className="text-xs" style={{ color: msg.ok ? "#4ade80" : "#f87171" }}>
            {msg.text}
          </span>
        )}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[250px]">
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted)" }}>
                Search Keywords
              </label>
              <Input
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="founder CEO owner entrepreneur"
              />
            </div>
            <div className="w-24">
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted)" }}>
                Max Leads
              </label>
              <Input
                type="number"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                min={1}
                max={50}
              />
            </div>
            <div className="w-28">
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted)" }}>
                Min Followers
              </label>
              <Input
                type="number"
                value={minFollowers}
                onChange={(e) => setMinFollowers(e.target.value)}
                min={0}
                placeholder="0"
              />
            </div>
            <Button onClick={handleSearch} disabled={searching || !keywords.trim()}>
              {searching ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Search className="w-4 h-4 mr-1.5" />}
              {searching ? "Searching..." : "Discover"}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#1e3a5f", color: "#93c5fd" }}>
              Keywords: {keywords || "(none)"}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#1e3a5f", color: "#93c5fd" }}>
              Max: {limit}
            </span>
            {parseInt(minFollowers) > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#1e3a5f", color: "#93c5fd" }}>
                Min followers: {minFollowers}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {searching && (
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: "#3b82f6" }} />
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Searching LinkedIn for matching profiles...</p>
            <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>This may take 30-60 seconds. AI qualification runs automatically.</p>
          </CardContent>
        </Card>
      )}

      {results && !searching && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                {results.length} profiles found
              </span>
              {results.filter((r) => !r.alreadyExists).length !== results.length && (
                <span className="text-xs" style={{ color: "#fbbf24" }}>
                  ({results.filter((r) => r.alreadyExists).length} already in pipeline)
                </span>
              )}
              <div className="flex gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#052e16", color: "#4ade80" }}>
                  {hotCount} Hot
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#422006", color: "#fbbf24" }}>
                  {warmCount} Warm
                </span>
              </div>
            </div>
            {!importDone && (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={toggleSelectAll}
                  disabled={availableCount === 0}
                >
                  <UserCheck className="w-3.5 h-3.5 mr-1" />
                  {selectedIds.size === availableCount ? "Deselect All" : `Select All (${availableCount})`}
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={importing || selectedIds.size === 0}
                  size="sm"
                >
                  {importing ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Import className="w-4 h-4 mr-1.5" />}
                  {importing ? "Importing..." : `Import (${selectedIds.size})`}
                </Button>
              </div>
            )}
            {importDone && (
              <span className="text-sm" style={{ color: "#4ade80" }}>
                <CheckCircle className="w-4 h-4 inline mr-1" />Import complete
              </span>
            )}
          </div>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>Results</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ color: "var(--muted)" }}>
                      <th className="text-left font-medium pb-3 pr-2 pl-4 pt-2 w-10">
                        {!importDone && <input type="checkbox" checked={selectedIds.size === availableCount && availableCount > 0} onChange={toggleSelectAll} />}
                      </th>
                      <th className="text-left font-medium pb-3 pr-4 pt-2">Name</th>
                      <th className="text-left font-medium pb-3 pr-4 pt-2 hidden sm:table-cell">Company</th>
                      <th className="text-left font-medium pb-3 pr-4 pt-2 hidden md:table-cell">Followers</th>
                      <th className="text-left font-medium pb-3 pr-4 pt-2">Score</th>
                      <th className="text-left font-medium pb-3 pr-4 pt-2 hidden lg:table-cell">Verdict</th>
                      <th className="text-right font-medium pb-3 pr-4 pt-2">About</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.length > 0 ? results.map((lead) => {
                      const isSelected = selectedIds.has(lead.linkedinUrl);
                      const isExpanded = expandedAbout.has(lead.linkedinUrl);
                      const vc = verdictColor(lead.verdict);
                      return (
                        <tr
                          key={lead.linkedinUrl || lead.name}
                          className="border-t transition-colors"
                          style={{
                            borderColor: "var(--card-border)",
                            opacity: lead.alreadyExists ? 0.5 : 1,
                            background: isSelected && !importDone ? "var(--nav-active)" : "transparent",
                          }}
                        >
                          <td className="py-3 pr-2 pl-4">
                            {!importDone && !lead.alreadyExists && (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelect(lead.linkedinUrl)}
                              />
                            )}
                            {(importDone || lead.alreadyExists) && (
                              <CheckCircle className="w-4 h-4" style={{ color: lead.alreadyExists ? "#fbbf24" : "#4ade80" }} />
                            )}
                          </td>
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-3">
                              {lead.profilePicture ? (
                                <img
                                  src={lead.profilePicture}
                                  alt={lead.name}
                                  className="w-8 h-8 rounded-full object-cover shrink-0"
                                  style={{ border: "1px solid var(--card-border)" }}
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-medium"
                                  style={{ background: "var(--badge-bg)", color: "var(--muted)" }}>
                                  {lead.name[0]}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-medium truncate max-w-[200px]" style={{ color: "var(--foreground)" }}>
                                  {lead.name}
                                  {lead.alreadyExists && (
                                    <span className="ml-1.5 text-xs" style={{ color: "#fbbf24" }}>(exists)</span>
                                  )}
                                </p>
                                <p className="text-xs truncate max-w-[200px]" style={{ color: "var(--muted)" }}>
                                  {lead.headline || lead.company || ""}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 pr-4 hidden sm:table-cell">
                            <span className="text-sm" style={{ color: "var(--foreground)" }}>
                              {lead.company || <span style={{ color: "var(--muted)" }}>—</span>}
                            </span>
                          </td>
                          <td className="py-3 pr-4 hidden md:table-cell">
                            <span className="text-sm" style={{ color: "var(--foreground)" }}>
                              {lead.followerCount > 0 ? `${(lead.followerCount / 1000).toFixed(1)}K` : <span style={{ color: "var(--muted)" }}>—</span>}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            <span className="font-medium" style={{ color: scoreColor(lead.score) }}>
                              {lead.score}
                            </span>
                            {lead.scoreReason && (
                              <span
                                className="ml-1 inline-block cursor-help text-xs"
                                style={{ color: "var(--muted)" }}
                                title={lead.scoreReason}
                              >
                                ⓘ
                              </span>
                            )}
                          </td>
                          <td className="py-3 pr-4 hidden lg:table-cell">
                            <span
                              className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{ color: vc.text, background: vc.bg }}
                            >
                              {lead.verdict.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-right">
                            {lead.about ? (
                              <button
                                className="text-xs flex items-center gap-1 ml-auto"
                                style={{ color: "#60a5fa" }}
                                onClick={() => {
                                  const next = new Set(expandedAbout);
                                  if (isExpanded) next.delete(lead.linkedinUrl);
                                  else next.add(lead.linkedinUrl);
                                  setExpandedAbout(next);
                                }}
                              >
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                {isExpanded ? "Hide" : "About"}
                              </button>
                            ) : (
                              <span className="text-xs" style={{ color: "var(--muted)" }}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-sm" style={{ color: "var(--muted)" }}>
                          No profiles found matching your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {results.some((r) => expandedAbout.has(r.linkedinUrl)) && (
                <div className="border-t p-4 space-y-3" style={{ borderColor: "var(--card-border)" }}>
                  {results.filter((r) => expandedAbout.has(r.linkedinUrl)).map((lead) => (
                    <div key={lead.linkedinUrl} className="text-sm" style={{ color: "var(--foreground)" }}>
                      <p className="font-medium mb-1">{lead.name}</p>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                        {lead.about}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {[
              { label: "Found", value: results.length.toString(), color: "var(--foreground)" },
              { label: "New (not in pipeline)", value: availableCount.toString(), color: "#60a5fa" },
              { label: "Hot", value: hotCount.toString(), color: "#4ade80" },
              { label: "Warm", value: warmCount.toString(), color: "#fbbf24" },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-4">
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{s.label}</p>
                  <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {!results && !searching && (
        <Card>
          <CardContent className="p-8 text-center">
            <Target className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--muted)" }} />
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
              Ready to find leads
            </p>
            <p className="text-xs mt-1 max-w-md mx-auto" style={{ color: "var(--muted)" }}>
              Set your search keywords above and click "Discover" to search LinkedIn for business owners and founders matching your ICP. Results are AI-qualified automatically.
            </p>
            <p className="text-xs mt-3" style={{ color: "#fbbf24" }}>
              Requires the scrapepilot LinkedIn actor rented at Apify console.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
