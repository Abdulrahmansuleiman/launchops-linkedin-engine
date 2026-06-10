"use client";

import { useState, type FormEvent } from "react";
import { X, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConvertModalProps {
  leadId: string;
  leadName: string;
  onClose: () => void;
  onSuccess: (client: any) => void;
}

const defaultServices = [
  "LinkedIn Content Strategy & Creation",
  "LinkedIn Outreach Automation",
  "Lead Pipeline Management",
  "AI-Powered DM Sequences",
  "Performance Analytics & Reporting",
];

export function ConvertToClientModal({ leadId, leadName, onClose, onSuccess }: ConvertModalProps) {
  const [form, setForm] = useState({
    companyName: "",
    contactName: leadName,
    contactEmail: "",
    contactPhone: "",
    website: "",
    industry: "",
    monthlyRetainer: "",
    setupFee: "",
    contractDuration: "3",
    paymentTerms: "Net 14 days from invoice date",
    scope: "",
    goals: "",
  });
  const [selectedServices, setSelectedServices] = useState<string[]>(["LinkedIn Content Strategy & Creation"]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggleService = (s: string) => {
    setSelectedServices((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.companyName.trim()) { setError("Company name is required"); return; }
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, leadId, services: selectedServices }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create client");
      onSuccess(data);
    } catch (err: any) {
      setError(err.message || "Failed to create client");
    } finally {
      setSaving(false);
    }
  };

  const modalOverlay: React.CSSProperties = {
    position: "fixed", inset: 0, zIndex: 50,
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
  };
  const modalBox: React.CSSProperties = {
    width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto",
    background: "var(--card)", borderRadius: "12px",
    border: "1px solid var(--card-border)",
    padding: "24px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  };

  const labelStyle: React.CSSProperties = { fontSize: "12px", fontWeight: 500, color: "var(--foreground)", marginBottom: "4px", display: "block" };
  const inputStyle: React.CSSProperties = { width: "100%", height: "36px", padding: "0 10px", borderRadius: "8px", fontSize: "13px", outline: "none", background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--foreground)", boxSizing: "border-box" };
  const textareaStyle: React.CSSProperties = { ...inputStyle, height: "72px", padding: "8px 10px", resize: "vertical" };

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={modalBox} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" style={{ color: "#3b82f6" }} />
            <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
              Convert to Client
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:opacity-70"><X className="w-5 h-5" style={{ color: "var(--muted)" }} /></button>
        </div>

        <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
          Converting <strong>{leadName}</strong> — fill in the details and a contract draft will be auto-generated.
        </p>

        {error && <p className="text-sm mb-3" style={{ color: "#f87171" }}>{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Company Name *</label>
              <input style={inputStyle} value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} placeholder="Acme Ltd" />
            </div>
            <div>
              <label style={labelStyle}>Contact Name</label>
              <input style={inputStyle} value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input style={inputStyle} value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} placeholder="client@company.com" />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input style={inputStyle} value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} placeholder="+44..." />
            </div>
            <div>
              <label style={labelStyle}>Website</label>
              <input style={inputStyle} value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="company.com" />
            </div>
            <div>
              <label style={labelStyle}>Industry</label>
              <input style={inputStyle} value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} placeholder="SaaS, Real Estate..." />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Services</label>
            <div className="flex flex-wrap gap-2">
              {defaultServices.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleService(s)}
                  className="text-xs px-3 py-1.5 rounded-full transition-colors"
                  style={{
                    background: selectedServices.includes(s) ? "#2563eb" : "var(--badge-bg)",
                    color: selectedServices.includes(s) ? "#fff" : "var(--foreground)",
                    border: "1px solid",
                    borderColor: selectedServices.includes(s) ? "#2563eb" : "var(--card-border)",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Scope of Work</label>
            <textarea style={textareaStyle} value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })} placeholder="Describe the work you'll do for this client..." />
          </div>

          <div>
            <label style={labelStyle}>Goals & Objectives</label>
            <textarea style={textareaStyle} value={form.goals} onChange={(e) => setForm({ ...form, goals: e.target.value })} placeholder="What does the client want to achieve?" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label style={labelStyle}>Monthly Retainer (£)</label>
              <input style={inputStyle} type="number" value={form.monthlyRetainer} onChange={(e) => setForm({ ...form, monthlyRetainer: e.target.value })} placeholder="2000" />
            </div>
            <div>
              <label style={labelStyle}>Setup Fee (£)</label>
              <input style={inputStyle} type="number" value={form.setupFee} onChange={(e) => setForm({ ...form, setupFee: e.target.value })} placeholder="500" />
            </div>
            <div>
              <label style={labelStyle}>Duration (months)</label>
              <select style={inputStyle} value={form.contractDuration} onChange={(e) => setForm({ ...form, contractDuration: e.target.value })}>
                <option value="1">1 month</option>
                <option value="3">3 months</option>
                <option value="6">6 months</option>
                <option value="12">12 months</option>
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Payment Terms</label>
            <input style={inputStyle} value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <FileText className="w-4 h-4 mr-1" />}
              {saving ? "Generating..." : "Generate Contract & Convert"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
