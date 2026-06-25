"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Textarea } from "@/components/ui/input";
import { Send, MessageCircle, CheckCircle, Clock, Zap, Target, Loader2, Copy, ExternalLink, Check, X, Bot, Brain, Lightbulb } from "lucide-react";
import { getLeads, generateMessage, sendOutreachMessage, getSequences, createLead, getReplySuggestions } from "@/lib/api";
import type { Lead, ReplySuggestion } from "@/lib/api";

const openerTemplate = [
  "Hey [Name]",
  "[Company] looks interesting",
  "That's all you? Or you have a team",
  "your work /w [niche] goes pretty deep - i like it",
  "How long you been running it?",
  "Gotta visit [city] btw [genuine local line]",
];

const flowSteps = [
  { step: 1, name: "Opener", desc: "Line by line, one per send. No pitch. No AI mention.", status: "active" },
  { step: 2, name: "Reply to Warm", desc: "Match energy. One casual line plus ONE question about their business.", status: "active" },
  { step: 3, name: "Surface Pain", desc: "Ask about lead follow-up speed. Pick the right angle for their industry.", status: "active" },
  { step: 4, name: "Pain Pivot", desc: "If slow use cold facts. If fast try the volume angle. If auto talk conversion rate.", status: "active" },
  { step: 5, name: "Drop the Frame", desc: "Sell outcome not build. Offer demo video or 20 min call.", status: "active" },
  { step: 6, name: "Book Call", desc: "Calendly link. No pitch. No deck. Just map out where leads are lost.", status: "active" },
];

const objections = [
  { them: '"We\'re doing fine"', reply: '"That\'s the best position to be in you already have demand. Quick question: what\'s your lead-to-booked-call rate right now?"' },
  { them: '"We use a VA"', reply: '"How fast can your VA respond when a lead comes in at 9pm on a Friday? That\'s where the system breaks."' },
  { them: '"Not interested in AI"', reply: '"I get that most people that say that have seen chatbots that feel robotic. What I build is conversational. Your leads don\'t know it\'s automated."' },
  { them: '"What does it cost?"', reply: '"Depends on what you need that\'s what the call is for. But bigger question: how much are slow responses costing you right now?"' },
  { them: 'Gone quiet 1-2 messages', reply: '"Hey no pressure. Curious though: what does your current lead follow-up actually look like end to end?"' },
  { them: '"Not now / too busy"', reply: '"No worries at all drop me a message whenever the time is right" then wait 2-3 weeks.' },
];

const followUpSequence = [
  { day: "Day 1", action: "Send opener (line by line)", done: true },
  { day: "Day 4", action: "Bump: just bumping this up in case it got buried", done: false },
  { day: "Day 8", action: "New angle: ask about follow-up process directly", done: false },
  { day: "Day 14", action: "Move on. Mark for 30-60 day re-engage", done: false },
];

function getStage(lead: Lead): string {
  switch (lead.status) {
    case "NEW": return "Opener Ready";
    case "CONNECTED": return "Connected";
    case "DM_SENT": return "Waiting Reply";
    case "RESPONDED": return "Surface Pain";
    case "MEETING_BOOKED": return "Meeting Booked";
    case "DEMO_SENT": return "Demo Sent";
    case "CLIENT_WON": return "Client Won";
    default: return lead.status;
  }
}

function getNextAction(lead: Lead): string {
  switch (lead.status) {
    case "NEW": return "Send opener";
    case "CONNECTED": return "Surface the pain";
    case "DM_SENT": return "Wait for reply";
    case "RESPONDED": return "Drop the frame";
    case "MEETING_BOOKED": return "Send demo";
    case "DEMO_SENT": return "Follow up";
    case "CLIENT_WON": return "Onboard";
    default: return "Review";
  }
}

export default function Outreach() {
  const [selectedProspect, setSelectedProspect] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [messageContent, setMessageContent] = useState("");
  const [showCustomize, setShowCustomize] = useState(false);
  const [showProspectForm, setShowProspectForm] = useState(false);
  const [prospectForm, setProspectForm] = useState({ name: "", linkedinUrl: "", location: "" });
  const [saving, setSaving] = useState(false);
  const [customTemplate, setCustomTemplate] = useState(openerTemplate.join("\n"));
  const queryClient = useQueryClient();

  const { data: leads = [] } = useQuery({ queryKey: ["leads"], queryFn: () => getLeads() });
  const { data: sequences = [] } = useQuery({ queryKey: ["sequences"], queryFn: () => getSequences() });

  const activeLeads = leads.filter((l) => l.linkedinUrl && l.status !== "CLIENT_LOST" && l.status !== "ARCHIVED");

  const selectedLead = leads.find((l) => l.name === selectedProspect);

  const handleNewProspect = async () => {
    if (!prospectForm.name.trim()) return;
    setSaving(true);
    try {
      await createLead({
        linkedinUrl: prospectForm.linkedinUrl.trim(),
        name: prospectForm.name.trim(),
        company: "",
        headline: "",
        location: prospectForm.location.trim()
      });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setShowProspectForm(false);
      setProspectForm({ name: "", linkedinUrl: "", location: "" });
    } catch (e: any) {
      console.error("Create lead failed:", e);
    } finally {
      setSaving(false);
    }
  };

  const extractMessage = (result: any): string => {
    if (!result) return "";
    const arr = result.messages;
    if (Array.isArray(arr) && arr.length) return arr.join("\n");
    const msg = result.message;
    if (!msg) return "";
    if (typeof msg === "string") return msg;
    if (msg.message) return msg.message;
    if (Array.isArray(msg.messages)) return msg.messages.join("\n");
    return "";
  };

  const handleGenerateOpener = async () => {
    if (!selectedProspect) return;
    setGenerating(true);
    try {
      const lead = leads.find((l) => l.name === selectedProspect);
      const niche = lead?.headline || lead?.company || "";
      const result = await generateMessage({
        prospectName: selectedProspect,
        prospectCompany: lead?.company || undefined,
        prospectLocation: lead?.location || undefined,
        prospectDetail: niche || undefined,
        step: "opener",
      });
      setMessageContent(extractMessage(result));
    } catch (e: any) {
      console.error("Generate opener failed:", e);
    } finally {
      setGenerating(false);
    }
  };

  const handleAIOptimize = async () => {
    if (!selectedProspect || !messageContent.trim()) return;
    setGenerating(true);
    try {
      const result = await generateMessage({
        prospectName: selectedProspect,
        step: "opener",
        context: messageContent,
      });
      setMessageContent(extractMessage(result));
    } catch (e: any) {
      console.error("AI optimize failed:", e);
    } finally {
      setGenerating(false);
    }
  };

  const handleSendOnLinkedIn = async () => {
    if (!selectedProspect || !messageContent.trim() || !selectedLead) return;
    setSending(true);
    try {
      const defaultSeq = sequences[0];
      await sendOutreachMessage({
        sequenceId: defaultSeq?.id || "default",
        leadId: selectedLead.id,
        stepNumber: 1,
        content: messageContent,
      });

      await navigator.clipboard.writeText(messageContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);

      const linkedinUrl = selectedLead.linkedinUrl || `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(selectedLead.name || selectedProspect)}`;
      window.open(linkedinUrl, "_blank");

      queryClient.invalidateQueries({ queryKey: ["sequences"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    } catch (e: any) {
      console.error("Send failed:", e);
    } finally {
      setSending(false);
    }
  };

  const handleCopyMessage = async () => {
    if (!messageContent.trim()) return;
    try {
      await navigator.clipboard.writeText(messageContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (e: any) {
      console.error("Copy failed:", e);
    }
  };

  const modalOverlay: React.CSSProperties = {
    position: "fixed", inset: 0, zIndex: 50,
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
  };

  const modalBox: React.CSSProperties = {
    width: "100%", maxWidth: "440px",
    background: "var(--card)", borderRadius: "12px",
    border: "1px solid var(--card-border)",
    padding: "24px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  };

  return (
    <>
      {showProspectForm && (
        <div style={modalOverlay} onClick={() => setShowProspectForm(false)}>
          <div style={modalBox} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>New Prospect</h2>
              <button onClick={() => setShowProspectForm(false)} className="p-1 rounded hover:opacity-70">
                <X className="w-5 h-5" style={{ color: "var(--muted)" }} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted)" }}>Name *</label>
                <Input
                  value={prospectForm.name}
                  onChange={(e) => setProspectForm({ ...prospectForm, name: e.target.value })}
                  placeholder="Full name"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted)" }}>LinkedIn Profile URL</label>
                <Input
                  value={prospectForm.linkedinUrl}
                  onChange={(e) => setProspectForm({ ...prospectForm, linkedinUrl: e.target.value })}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted)" }}>Location</label>
                <Input
                  value={prospectForm.location}
                  onChange={(e) => setProspectForm({ ...prospectForm, location: e.target.value })}
                  placeholder="e.g. London, UK"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleNewProspect} disabled={saving || !prospectForm.name.trim()}>
                  {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Target className="w-4 h-4 mr-1.5" />}
                  {saving ? "Saving..." : "Add Prospect"}
                </Button>
                <Button variant="secondary" onClick={() => setShowProspectForm(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            Outreach Engine
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Casual, brotherly, research heavy. Never pitch in the opener
          </p>
        </div>
        <Button onClick={() => setShowProspectForm(true)}>
          <Target className="w-4 h-4 mr-1.5" />
          New Prospect
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Conversation Flow</CardTitle>
                <Badge variant="info">6 steps</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {flowSteps.map((s) => (
                  <div
                    key={s.step}
                    className="flex items-start gap-3 p-3 rounded-lg"
                    style={{ background: "var(--badge-bg)" }}
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center shrink-0 mt-0.5 font-medium">
                      {s.step}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{s.name}</p>
                        {s.status === "active" && <Badge variant="success" className="text-[10px]">Active</Badge>}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Opener Template</CardTitle>
                  <Badge variant="warning">One line per send, like real time typing</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {showCustomize ? (
                <Textarea
                  value={customTemplate}
                  onChange={(e) => setCustomTemplate(e.target.value)}
                  rows={8}
                />
              ) : (
                <div className="space-y-1.5 p-4 rounded-lg font-mono text-sm leading-relaxed" style={{ background: "var(--badge-bg)", color: "var(--foreground)" }}>
                  {openerTemplate.map((line, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-blue-400 shrink-0">&rarr;</span>
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  onClick={handleGenerateOpener}
                  disabled={generating || !selectedProspect}
                >
                  {generating ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Zap className="w-3.5 h-3.5 mr-1" />}
                  Generate Opener
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setShowCustomize(!showCustomize)}>
                  {showCustomize ? "Done" : "Customize"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Objection Pivots</CardTitle>
                <Badge variant="info">6 scripts ready</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2" style={{ maxHeight: 320, overflowY: "auto" }}>
                {objections.map((o, i) => (
                  <div key={i} className="p-3 rounded-lg" style={{ background: "var(--badge-bg)" }}>
                    <p className="text-xs font-medium mb-1" style={{ color: "#f87171" }}>They say: {o.them}</p>
                    <p className="text-sm" style={{ color: "#4ade80" }}>You say: {o.reply}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Active Conversations</CardTitle>
                <Badge variant="success">{activeLeads.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2" style={{ maxHeight: 480, overflowY: "auto" }}>
              {activeLeads.length > 0 ? activeLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="p-3 rounded-lg cursor-pointer transition-all"
                  style={{
                    background: selectedProspect === lead.name ? "var(--nav-active)" : "var(--badge-bg)",
                    border: selectedProspect === lead.name ? "1px solid var(--nav-active-border)" : "1px solid transparent",
                  }}
                  onClick={() => {
                    setSelectedProspect(lead.name);
                    setMessageContent("");
                    setCopied(false);
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      {lead.profilePicture ? (
                        <img
                          src={lead.profilePicture}
                          alt={lead.name || ""}
                          className="w-6 h-6 rounded-full object-cover shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-medium"
                          style={{ background: "var(--badge-bg)", color: "var(--muted)" }}>
                          {(lead.name || "?")[0]}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{lead.name}</p>
                        <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{lead.company || lead.headline || ""}</p>
                        {lead.location && (
                          <p className="text-[10px] truncate" style={{ color: "var(--text-secondary)" }}>{lead.location}</p>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={lead.score >= 80 ? "warning" : "info"}
                      className="ml-2 shrink-0 text-[10px]"
                    >
                      {lead.score >= 80 ? "Hot" : "Warm"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="info" className="text-[10px]">{getStage(lead)}</Badge>
                    <span className="text-[11px]" style={{ color: "var(--muted)" }}>Score: {lead.score}</span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: "#60a5fa" }}>Next: {getNextAction(lead)}</p>
                </div>
              )) : (
                <div className="text-center py-4">
                  <p className="text-sm" style={{ color: "var(--muted)" }}>No active conversations yet</p>
                  <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Import leads from LinkedIn to get started</p>
                </div>
              )}
              <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => window.location.href = "/leads"}>View All Leads</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Compose DM</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {selectedProspect ? (
                <>
                  <div className="mb-3 p-3 rounded-lg" style={{ background: "var(--badge-bg)" }}>
                    <p className="text-xs font-medium" style={{ color: "var(--foreground)" }}>Sending to: {selectedProspect}</p>
                    {selectedLead?.linkedinUrl && (
                      <a
                        href={selectedLead.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs flex items-center gap-1 mt-1"
                        style={{ color: "#60a5fa" }}
                      >
                        <ExternalLink className="w-3 h-3" /> Open LinkedIn Profile
                      </a>
                    )}
                  </div>
                  <Textarea
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder="Type your message here or generate an opener..."
                    rows={6}
                  />
                  <div className="mt-3 flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      onClick={handleAIOptimize}
                      disabled={generating || !messageContent.trim()}
                    >
                      {generating ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Zap className="w-3.5 h-3.5 mr-1" />}
                      AI Optimize
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyMessage}
                      disabled={!messageContent.trim()}
                      title="Copy message to clipboard"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleSendOnLinkedIn}
                      disabled={sending || !messageContent.trim()}
                    >
                      {sending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-1" />}
                      Send on LinkedIn
                    </Button>
                  </div>
                  {copied && (
                    <p className="text-xs mt-2" style={{ color: "#4ade80" }}>
                      Message copied. LinkedIn opens in a new tab. Paste and send.
                    </p>
                  )}
                </>
              ) : (
                <div className="text-center py-6">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--muted)" }} />
                  <p className="text-sm" style={{ color: "var(--muted)" }}>Select a conversation to compose a message</p>
                </div>
              )}
            </CardContent>
          </Card>

            {/* Reply Assistant Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>Reply Assistant</CardTitle>
                  <Badge variant="warning" className="text-[10px]">Ty Style</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>
                  Paste your DM conversation below. Get 3 reply options in Ty's voice.
                </p>
                {(() => {
                  const [conversation, setConversation] = useState("");
                  const [replying, setReplying] = useState(false);
                  const [replies, setReplies] = useState<ReplySuggestion[] | null>(null);
                  const [replyError, setReplyError] = useState<string | null>(null);
                  const [copiedReply, setCopiedReply] = useState<number | null>(null);

                  const handleGenerate = async () => {
                    if (!conversation.trim()) return;
                    setReplying(true);
                    setReplyError(null);
                    setReplies(null);
                    try {
                      const result = await getReplySuggestions(conversation);
                      setReplies(result.replies);
                    } catch (e: any) {
                      setReplyError(e.message || "Failed to generate replies");
                    } finally {
                      setReplying(false);
                    }
                  };

                  const handleCopy = async (text: string, id: number) => {
                    await navigator.clipboard.writeText(text);
                    setCopiedReply(id);
                    setTimeout(() => setCopiedReply(null), 2000);
                  };

                  return (
                    <>
                      <Textarea
                        value={conversation}
                        onChange={(e) => setConversation(e.target.value)}
                        placeholder={`Paste the conversation here...\n\nYou: Hey mate\nLead: Yo what's up\nYou: Your site looks cool — just you or you got a team?\nLead: Yeah just me atm`}
                        rows={5}
                      />
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleGenerate}
                          disabled={replying || !conversation.trim()}
                        >
                          {replying ? (
                            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                          ) : (
                            <Brain className="w-3.5 h-3.5 mr-1" />
                          )}
                          {replying ? "Thinking..." : "Top 3 Replies"}
                        </Button>
                      </div>

                      {replyError && (
                        <p className="text-xs mt-2" style={{ color: "#ef4444" }}>{replyError}</p>
                      )}

                      {replies && replies.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {replies.map((r) => (
                            <div
                              key={r.id}
                              className="p-3 rounded-lg cursor-pointer transition-all hover:opacity-90"
                              style={{
                                background: "var(--badge-bg)",
                                border: "1px solid var(--card-border)",
                              }}
                              onClick={() => handleCopy(r.reply, r.id)}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span
                                  className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                                  style={{ background: "var(--nav-active, rgba(59,130,246,0.15))", color: "#60a5fa" }}
                                >
                                  {r.label}
                                </span>
                                <span className="text-[10px]" style={{ color: "var(--muted)" }}>
                                  {r.type}
                                </span>
                              </div>
                              <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
                                {r.reply}
                              </p>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-[10px]" style={{ color: "var(--muted)" }}>
                                  {copiedReply === r.id ? "Copied!" : "Tap to copy"}
                                </span>
                                {copiedReply === r.id && (
                                  <Check className="w-3 h-3" style={{ color: "#4ade80" }} />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </CardContent>
            </Card>

            <Card>
            <CardHeader>
              <CardTitle>Follow-up Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {followUpSequence.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg" style={{ background: "var(--badge-bg)" }}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${f.done ? "bg-green-600" : "bg-gray-600"}`}>
                      {f.done ? <CheckCircle className="w-3 h-3 text-white" /> : <Clock className="w-3 h-3 text-white" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium" style={{ color: "var(--foreground)" }}>{f.day}</p>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>{f.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Active Conversations", value: `${activeLeads.length}`, sub: `${leads.filter(l => l.status === "DM_SENT" || l.status === "RESPONDED").length} in progress`, icon: MessageCircle, color: "#60a5fa" },
          { label: "Total Leads", value: `${leads.length}`, sub: `${leads.filter(l => l.linkedinUrl).length} with LinkedIn`, icon: Send, color: "#4ade80" },
          { label: "Hot Leads", value: `${leads.filter(l => l.score >= 80).length}`, sub: "Need action", icon: CheckCircle, color: "#c084fc" },
          { label: "Reply Rate", value: "62%", sub: "Industry avg: 28%", icon: Clock, color: "#fbbf24" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg shrink-0" style={{ background: "var(--badge-bg)" }}>
                  <Icon className="w-4 h-4" style={{ color: s.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{s.value}</p>
                  <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{s.label}</p>
                  <p className="text-[10px]" style={{ color: "#4ade80" }}>{s.sub}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Real Conversation Example</CardTitle>
          <Badge variant="success">Muaaz &middot; Agency Owner &middot; Karachi</Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-2" style={{ maxHeight: 400, overflowY: "auto", paddingRight: 4 }}>
            {[
              { sender: "You", text: "Hey Muaaz" },
              { sender: "You", text: "NovaReach looks interesting" },
              { sender: "You", text: "That's all you? Or you have a team" },
              { sender: "You", text: "You guys do lead gen and follow-up systems for real estate brands right?" },
              { sender: "You", text: "How long you been running it?" },
              { sender: "You", text: "Gotta visit Karachi btw, heard the food scene there is absolutely insane, especially the BBQ" },
              { sender: "Lead", text: "Yeah I run NovaReach... been refining systems... And trust me Karachi BBQ won't disappoint." },
              { sender: "You", text: "haha I'm holding you to that Karachi BBQ" },
              { sender: "You", text: "So when your real estate clients get leads from ads, how fast is someone actually following up on those?" },
              { sender: "Lead", text: "Honestly, the faster the follow-up, the better... I've been exploring more automation and follow-up systems lately" },
              { sender: "You", text: "that's exactly it the follow-up gap is where most leads die" },
              { sender: "You", text: "are your real estate clients handling that part themselves or is that something you're building out for them too?" },
              { sender: "Lead", text: "Mostly clients handling it themselves... I've been looking more into automation" },
              { sender: "You", text: "that's the gap right there clients getting leads but losing them on the follow up" },
              { sender: "You", text: "that's actually exactly what I build automated follow up systems that respond in under 60 seconds, qualify the lead and book the call without any manual work" },
              { sender: "You", text: "would make a lot of sense for your real estate clients honestly" },
              { sender: "You", text: "want me to show you what that looks like?" },
              { sender: "Lead", text: "Yeah that actually sounds really interesting... Definitely open to seeing how your system works" },
              { sender: "You", text: "perfect easiest is just a quick 20 mins on a call" },
              { sender: "You", text: "I'll walk you through exactly how it works and we can see if it makes sense for your clients" },
            ].map((msg, i) => (
              <div
                key={i}
                className="p-2.5 rounded-lg text-sm max-w-[80%]"
                style={{
                  background: msg.sender === "You" ? "var(--badge-info-bg)" : "var(--badge-bg)",
                  color: msg.sender === "You" ? "var(--badge-info-text)" : "var(--foreground)",
                  marginLeft: msg.sender === "You" ? "auto" : "0",
                  marginRight: msg.sender === "You" ? "0" : "auto",
                }}
              >
                <div className="text-[10px] mb-0.5 opacity-60">{msg.sender}</div>
                {msg.text}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
