"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import Link from "next/link"

const PIPELINE_STAGES = [
  "Discovery", "Proposal", "Onboarding", "Active", "Growth", "At Risk", "Churned",
]

const STAGE_META: Record<string, { color: string; glow: string }> = {
  Discovery:  { color: "#6366f1", glow: "rgba(99,102,241,0.3)" },
  Proposal:   { color: "#8b5cf6", glow: "rgba(139,92,246,0.3)" },
  Onboarding: { color: "#06b6d4", glow: "rgba(6,182,212,0.3)" },
  Active:     { color: "#22c55e", glow: "rgba(34,197,94,0.3)" },
  Growth:     { color: "#eab308", glow: "rgba(234,179,8,0.3)" },
  "At Risk":  { color: "#f97316", glow: "rgba(249,115,22,0.3)" },
  Churned:    { color: "#ef4444", glow: "rgba(239,68,68,0.3)" },
}

interface Client {
  id: string; companyName: string; contactName: string
  contactEmail: string | null; contactPhone: string | null
  industry: string | null; services: string[]
  monthlyRetainer: number | null; pipelineStage: string
  onboardingStatus: string; contractGeneratedAt: string | null
  createdAt: string
  lead: { name: string; linkedinUrl: string | null; score: number | null; profilePicture: string | null } | null
  projects: { id: string; name: string; status: string; tasks: { id: string; status: string; deadline: string | null }[] }[]
  _count: { projects: number; tasks: number; overdueTasks: number }
}

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
}

function getAvatarColor(name: string) {
  const colors = ["#6366f1","#8b5cf6","#06b6d4","#22c55e","#eab308","#f97316","#ec4899","#14b8a6"]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function taskProgress(projects: Client["projects"]) {
  const all = projects.flatMap(p => p.tasks)
  if (!all.length) return 1
  return all.filter(t => t.status === "done").length / all.length
}

function daysFromNow(d: string | null) {
  if (!d) return null
  const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
  if (diff < 0) return `${Math.abs(diff)}d overdue`
  if (diff === 0) return "Today"
  return `${diff}d left`
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [stageFilter, setStageFilter] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<string | null>(null)
  const [animatingId, setAnimatingId] = useState<string | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)

  const fetchClients = useCallback(async () => {
    const res = await fetch("/api/clients")
    const data: Client[] = await res.json()
    setClients(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchClients() }, [fetchClients])

  const moveStage = async (id: string, stage: string) => {
    setAnimatingId(id)
    setClients(prev => prev.map(c => c.id === id ? { ...c, pipelineStage: stage } : c))
    await fetch(`/api/clients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pipelineStage: stage }),
    })
    setTimeout(() => setAnimatingId(null), 400)
  }

  const filtered = clients.filter(c => {
    const q = search.toLowerCase()
    return (
      !q ||
      c.companyName.toLowerCase().includes(q) ||
      c.contactName.toLowerCase().includes(q) ||
      (c.industry && c.industry.toLowerCase().includes(q))
    )
  })

  const stats = {
    total: clients.length,
    active: clients.filter(c => c.pipelineStage === "Active" || c.pipelineStage === "Growth").length,
    mrr: clients.reduce((s, c) => s + (c.monthlyRetainer || 0), 0),
    atRisk: clients.filter(c => c.pipelineStage === "At Risk").length,
    overdueTasks: clients.reduce((s, c) => s + c._count.overdueTasks, 0),
    churned: clients.filter(c => c.pipelineStage === "Churned").length,
    onboarding: clients.filter(c => c.pipelineStage === "Onboarding").length,
  }

  const grouped = PIPELINE_STAGES.map(stage => ({
    stage,
    clients: filtered
      .filter(c => c.pipelineStage === stage)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  }))

  const displayGroups = stageFilter ? grouped.filter(g => g.stage === stageFilter) : grouped

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", id)
  }

  const handleDragOver = (e: React.DragEvent, stage: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverStage(stage)
  }

  const handleDragLeave = () => setDragOverStage(null)

  const handleDrop = async (e: React.DragEvent, stage: string) => {
    e.preventDefault()
    const id = e.dataTransfer.getData("text/plain")
    if (id) await moveStage(id, stage)
    setDraggingId(null)
    setDragOverStage(null)
  }

  const handleDragEnd = () => {
    setDraggingId(null)
    setDragOverStage(null)
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: 32 }}>
        <div className="skeleton-gradient" />
        <div style={{ display: "flex", gap: 16, marginTop: 24 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton-stat" />)}
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 24 }}>
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton-column" />)}
        </div>
      </div>
    )
  }

  if (clients.length === 0) {
    return (
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: 32 }}>
        <div className="hero-section">
          <div className="hero-content">
            <span style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, color: "var(--text-secondary)" }}>Pipeline</span>
            <h1 className="hero-title">Client Pipeline</h1>
            <p className="hero-subtitle">Manage your agency's client relationships from first conversation to long-term growth</p>
          </div>
        </div>
        <div className="empty-state">
          <div className="empty-icon">+</div>
          <h3>No clients in the pipeline yet</h3>
          <p>Convert a lead to a client from the Leads page to populate your pipeline</p>
          <Link href="/leads" className="btn-primary-lg">Go to Leads</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 32px 40px" }}>
      <div className="pipeline-header-card">
        <div className="pipeline-header-inner">
          <div className="pipeline-header-left">
            <div className="live-badge">
              <span className="live-dot" />
              LIVE PIPELINE
            </div>
            <h1 className="pipeline-title">Client Pipeline</h1>
            <div className="pipeline-meta">
              <span className="meta-item">
                <svg className="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                {clients.length} client{clients.length !== 1 && "s"}
              </span>
              <span className="meta-divider" />
              <span className="meta-item">
                <svg className="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                £{stats.mrr.toLocaleString()} MRR
              </span>
              <span className="meta-divider" />
              <span className="meta-item">
                <svg className="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                {stats.active} active
              </span>
            </div>
          </div>
          <div className="pipeline-header-right">
            <button className="header-btn">Filter</button>
            <button className="header-btn">Export</button>
            <button className="header-btn-primary">+ Add Client</button>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="pipeline-stat" style={{ borderTopColor: "var(--accent)" }}>
          <span className="pipeline-stat-value" style={{ color: "var(--foreground)" }}>{stats.active}</span>
          <span className="pipeline-stat-label">Active Clients</span>
          <span className="pipeline-stat-sub" style={{ color: "var(--badge-success-text)" }}>+{stats.active} active</span>
        </div>
        <div className="pipeline-stat" style={{ borderTopColor: "#22c55e" }}>
          <span className="pipeline-stat-value" style={{ color: "var(--foreground)" }}>£{stats.mrr.toLocaleString()}</span>
          <span className="pipeline-stat-label">Monthly Revenue</span>
          <span className="pipeline-stat-sub" style={{ color: stats.mrr > 0 ? "var(--badge-success-text)" : "var(--text-secondary)" }}>{stats.mrr > 0 ? "Recurring" : "No MRR yet"}</span>
        </div>
        <div className="pipeline-stat" style={{ borderTopColor: "#f97316" }}>
          <span className="pipeline-stat-value" style={{ color: "var(--foreground)" }}>{stats.atRisk}</span>
          <span className="pipeline-stat-label">At Risk</span>
          <span className="pipeline-stat-sub" style={{ color: "var(--badge-danger-text)" }}>Needs attention</span>
        </div>
        <div className="pipeline-stat" style={{ borderTopColor: "#ef4444" }}>
          <span className="pipeline-stat-value" style={{ color: "var(--foreground)" }}>{stats.overdueTasks}</span>
          <span className="pipeline-stat-label">Overdue Tasks</span>
          <span className="pipeline-stat-sub" style={{ color: "var(--badge-danger-text)" }}>Requires action</span>
        </div>
        <div className="pipeline-stat" style={{ borderTopColor: "#06b6d4" }}>
          <span className="pipeline-stat-value" style={{ color: "var(--foreground)" }}>{stats.onboarding}</span>
          <span className="pipeline-stat-label">Onboarding</span>
          <span className="pipeline-stat-sub" style={{ color: "var(--badge-info-text)" }}>In progress</span>
        </div>
        <div className="pipeline-stat" style={{ borderTopColor: "#6b7280" }}>
          <span className="pipeline-stat-value" style={{ color: "var(--foreground)" }}>{stats.total}</span>
          <span className="pipeline-stat-label">Total Clients</span>
          <span className="pipeline-stat-sub" style={{ color: "var(--text-secondary)" }}>{stats.churned} churned</span>
        </div>
      </div>

      <div className="pipeline-toolbar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by company, contact, or industry..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          {search && <button className="search-clear" onClick={() => setSearch("")}>✕</button>}
        </div>
        <div className="stage-filters">
          <button
            className={`filter-chip ${!stageFilter ? "active" : ""}`}
            onClick={() => setStageFilter(null)}
          >All</button>
          {PIPELINE_STAGES.map(stage => {
            const count = clients.filter(c => c.pipelineStage === stage).length
            if (!count) return null
            return (
              <button
                key={stage}
                className={`filter-chip ${stageFilter === stage ? "active" : ""}`}
                style={stageFilter === stage ? { background: STAGE_META[stage].color, borderColor: STAGE_META[stage].color } : {}}
                onClick={() => setStageFilter(stage === stageFilter ? null : stage)}
              >
                {stage}
                <span className="filter-count">{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="pipeline-board" ref={boardRef}>
        {displayGroups.map(({ stage, clients: stageClients }) => {
          const meta = STAGE_META[stage]
          const stageMrr = stageClients.reduce((s, c) => s + (c.monthlyRetainer || 0), 0)
          return (
            <div
              key={stage}
              className={`pipeline-column ${dragOverStage === stage ? "drag-over" : ""} ${animatingId ? "column-animating" : ""}`}
              onDragOver={(e) => handleDragOver(e, stage)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage)}
            >
              <div className="column-header" style={{ borderTopColor: meta.color }}>
                <div className="column-header-top">
                  <span className="stage-name">{stage}</span>
                  <span className="stage-count" style={{ background: meta.color }}>{stageClients.length}</span>
                </div>
                <div className="column-header-bottom">
                  <span className="stage-mrr">£{stageMrr.toLocaleString()}</span>
                  <span className="stage-mrr-label">MRR</span>
                </div>
              </div>

              <div className="column-body">
                {stageClients.length === 0 ? (
                  <div className="column-empty">
                    <span>Drop client here</span>
                  </div>
                ) : (
                  stageClients.map(client => {
                    const progress = taskProgress(client.projects)
                    const avatarColor = getAvatarColor(client.companyName)
                    const initials = getInitials(client.companyName)
                    const overdueCount = client._count.overdueTasks
                    const nearestDeadline = client.projects
                      .flatMap(p => p.tasks)
                      .filter(t => t.status !== "done" && t.deadline)
                      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())[0]?.deadline || null
                    const dayLabel = daysFromNow(nearestDeadline)

                    return (
                      <Link
                        key={client.id}
                        href={`/clients/${client.id}`}
                        className={`client-card ${draggingId === client.id ? "dragging" : ""} ${animatingId === client.id ? "card-animate" : ""}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, client.id)}
                        onDragEnd={handleDragEnd}
                        onClick={(e) => { if (draggingId) e.preventDefault() }}
                      >
                        <div className="card-top">
                          {client.lead?.profilePicture ? (
                            <img src={client.lead.profilePicture} alt="" className="card-avatar-img" />
                          ) : (
                            <div className="card-avatar" style={{ background: avatarColor }}>
                              {initials}
                            </div>
                          )}
                          <div className="card-info">
                            <div className="card-company">{client.companyName}</div>
                            <div className="card-contact">{client.contactName}</div>
                          </div>
                          {client.monthlyRetainer && (
                            <div className="card-retainer">£{client.monthlyRetainer.toLocaleString()}</div>
                          )}
                        </div>

                        <div className="card-progress">
                          <div className="progress-bar-bg">
                            <div
                              className="progress-bar-fill"
                              style={{ width: `${Math.round(progress * 100)}%`, background: meta.color }}
                            />
                          </div>
                          <span className="progress-text">{Math.round(progress * 100)}%</span>
                        </div>

                        <div className="card-meta">
                          {dayLabel && (
                            <span className={`card-deadline ${dayLabel.includes("overdue") ? "overdue" : dayLabel === "Today" ? "today" : ""}`}>
                              {dayLabel}
                            </span>
                          )}
                          {overdueCount > 0 && (
                            <span className="card-overdue-badge">{overdueCount} overdue</span>
                          )}
                          {client.industry && (
                            <span className="card-industry">{client.industry}</span>
                          )}
                        </div>

                        <div className="card-footer">
                          <div className="card-footer-stats">
                            <span>{client._count.projects} projects</span>
                            <span>{client._count.tasks} tasks</span>
                          </div>
                          <div className="card-footer-status">
                            <span className="status-dot" style={{ background: meta.color }} />
                            <span className="status-text">{client.onboardingStatus.replace(/_/g, " ")}</span>
                          </div>
                        </div>
                      </Link>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>

      {stageFilter && (
        <button className="btn-clear-filter" onClick={() => setStageFilter(null)}>
          ✕ Clear stage filter
        </button>
      )}

      <style>{`
        .pipeline-header-card {
          background: var(--card);
          border: 0.5px solid var(--border);
          border-radius: 16px;
          padding: 28px 32px;
          margin-bottom: 24px;
        }
        .pipeline-header-inner {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
        }
        .pipeline-header-left { flex: 1; min-width: 0; }
        .pipeline-header-right {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
          flex-wrap: wrap;
        }
        .live-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 5px 14px;
          border-radius: 20px;
          background: var(--badge-info-bg);
          border: 1px solid var(--nav-active-border);
          font-size: 11px;
          font-weight: 700;
          color: var(--badge-info-text);
          margin-bottom: 14px;
          letter-spacing: 0.8px;
        }
        .live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--badge-success-text);
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        .pipeline-title {
          font-size: clamp(26px, 3vw, 34px);
          font-weight: 700;
          margin: 0 0 14px;
          color: var(--foreground);
          line-height: 1.2;
        }
        .pipeline-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .meta-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          color: var(--text-secondary);
        }
        .meta-icon {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          color: var(--text-secondary);
        }
        .meta-divider {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: var(--border);
        }
        .header-btn {
          padding: 8px 18px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--card);
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }
        .header-btn:hover { border-color: var(--accent); color: var(--accent); }
        .header-btn-primary {
          padding: 8px 18px;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, var(--accent), #4f46e5);
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(99,102,241,0.25);
          font-family: inherit;
        }
        .header-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(99,102,241,0.35); }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 14px;
          margin-bottom: 28px;
        }
        .pipeline-stat {
          background: var(--card);
          border: 1px solid var(--border);
          border-top: 3px solid var(--border);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          transition: box-shadow 0.2s;
        }
        .pipeline-stat:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
        .pipeline-stat-value {
          font-size: 24px;
          font-weight: 500;
          line-height: 1.2;
          margin-bottom: 2px;
        }
        .pipeline-stat-label {
          font-size: 12px;
          color: var(--text-secondary);
        }
        .pipeline-stat-sub {
          font-size: 12px;
          font-weight: 500;
          margin-top: 2px;
        }

        .pipeline-toolbar {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 24px;
        }
        .search-box {
          position: relative;
          display: flex;
          align-items: center;
        }
        .search-input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          background: #ffffff;
          color: #111827;
          font-size: 14px;
          transition: all 0.2s;
          box-sizing: border-box;
        }
        .search-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }
        .search-input::placeholder { color: #9ca3af; }
        .search-clear {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          font-size: 14px;
          padding: 4px;
        }
        .search-clear:hover { color: #111827; }
        .stage-filters {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .filter-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 16px;
          border-radius: 20px;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          color: #374151;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .filter-chip:hover { border-color: #3b82f6; color: #1d4ed8; }
        .filter-chip.active {
          background: #1e3a5f;
          color: #ffffff;
          border-color: #1e3a5f;
        }
        .filter-chip.active:hover {
          background: #1e40af;
          border-color: #1e40af;
        }
        .filter-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          border-radius: 10px;
          background: rgba(0,0,0,0.08);
          font-size: 11px;
          font-weight: 700;
          color: inherit;
        }
        .filter-chip.active .filter-count {
          background: rgba(255,255,255,0.2);
          color: #ffffff;
        }

        .pipeline-board {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          padding: 8px 2px 24px;
          scrollbar-width: thin;
          scrollbar-color: #d1d5db transparent;
        }
        .pipeline-board::-webkit-scrollbar { height: 6px; }
        .pipeline-board::-webkit-scrollbar-track { background: transparent; }
        .pipeline-board::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }

        .pipeline-column {
          min-width: 290px;
          max-width: 290px;
          flex-shrink: 0;
          transition: all 0.3s;
        }
        .pipeline-column.drag-over { transform: scale(1.01); }
        .column-header {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-top: 3px solid;
          border-radius: 12px;
          padding: 14px 16px;
          margin-bottom: 12px;
        }
        .column-header-top {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }
        .stage-name { font-weight: 700; font-size: 14px; flex: 1; color: #111827; }
        .stage-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 22px;
          height: 22px;
          padding: 0 6px;
          border-radius: 11px;
          color: #fff;
          font-size: 12px;
          font-weight: 700;
        }
        .column-header-bottom {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .stage-mrr { font-size: 15px; font-weight: 700; color: #111827; }
        .stage-mrr-label { font-size: 11px; color: #6b7280; }

        .column-body {
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-height: 60px;
          border-radius: 12px;
          padding: 2px;
          transition: background 0.2s;
        }
        .pipeline-column.drag-over .column-body {
          background: rgba(99,102,241,0.04);
        }
        .column-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          border: 2px dashed #d1d5db;
          border-radius: 12px;
          color: #9ca3af;
          font-size: 13px;
          font-weight: 500;
        }
        .pipeline-column.drag-over .column-empty {
          border-color: #3b82f6;
          background: rgba(59,130,246,0.04);
          color: #3b82f6;
        }

        .client-card {
          display: block;
          padding: 16px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          text-decoration: none;
          color: inherit;
          cursor: grab;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: visible;
        }
        .client-card:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 16px rgba(0,0,0,0.06);
          transform: translateY(-2px);
        }
        .client-card:active { cursor: grabbing; }
        .client-card.dragging {
          opacity: 0.5;
          transform: rotate(2deg) scale(0.95);
        }
        .client-card.card-animate {
          animation: cardPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes cardPop {
          0% { transform: scale(0.95); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }

        .card-top {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        .card-avatar, .card-avatar-img {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          flex-shrink: 0;
          object-fit: cover;
        }
        .card-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 13px;
          font-weight: 700;
        }
        .card-info { flex: 1; min-width: 0; }
        .card-company {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .card-contact {
          font-size: 12px;
          color: #6b7280;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .card-retainer {
          font-size: 13px;
          font-weight: 700;
          color: #3b82f6;
          white-space: nowrap;
        }

        .card-progress {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }
        .progress-bar-bg {
          flex: 1;
          height: 4px;
          background: #e5e7eb;
          border-radius: 2px;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .progress-text { font-size: 11px; font-weight: 600; color: #6b7280; min-width: 28px; text-align: right; }

        .card-meta {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 10px;
        }
        .card-deadline {
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 6px;
          background: #f9fafb;
          color: #374151;
        }
        .card-deadline.overdue { color: #dc2626; background: #fef2f2; }
        .card-deadline.today { color: #ea580c; background: #fff7ed; }
        .card-overdue-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 6px;
          color: #fff;
          background: #dc2626;
        }
        .card-industry {
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 6px;
          background: #f9fafb;
          color: #6b7280;
        }

        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 10px;
          border-top: 1px solid #e5e7eb;
        }
        .card-footer-stats {
          display: flex;
          gap: 10px;
          font-size: 11px;
          font-weight: 500;
          color: #6b7280;
        }
        .card-footer-status {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        .status-text {
          font-size: 10px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .btn-primary-lg {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 28px;
          border-radius: 12px;
          background: linear-gradient(135deg, #3b82f6, #4f46e5);
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s;
          box-shadow: 0 4px 16px rgba(99,102,241,0.3);
        }
        .btn-primary-lg:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(99,102,241,0.4);
        }
        .btn-clear-filter {
          margin-top: 8px;
          padding: 8px 16px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          background: #ffffff;
          color: #6b7280;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s;
        }
        .btn-clear-filter:hover { border-color: #dc2626; color: #dc2626; }

        .empty-state {
          text-align: center;
          padding: 80px 20px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          margin-top: 24px;
        }
        .empty-icon { font-size: 32px; font-weight: 800; margin-bottom: 8px; color: #9ca3af; }
        .empty-state h3 { font-size: 22px; margin: 0 0 8px; color: #111827; }
        .empty-state p { color: #6b7280; margin: 0 0 24px; font-size: 15px; }

        .skeleton-gradient {
          height: 160px;
          background: linear-gradient(135deg, var(--border) 0%, var(--card) 100%);
          border-radius: 20px;
        }
        .skeleton-stat {
          height: 100px;
          flex: 1;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 12px;
        }
        .skeleton-column {
          height: 400px;
          flex: 1;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 12px;
        }

        @media (max-width: 1200px) {
          .stats-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 768px) {
          .pipeline-title { font-size: 24px; }
          .pipeline-header-card { padding: 20px; }
          .pipeline-header-inner { flex-direction: column; }
          .pipeline-header-right { width: 100%; }
          .header-btn, .header-btn-primary { flex: 1; text-align: center; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .pipeline-board { padding: 8px 0 24px; }
          .pipeline-column { min-width: 260px; max-width: 260px; }
        }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr; }
          .pipeline-header-card { padding: 16px; }
          .pipeline-meta { flex-direction: column; align-items: flex-start; gap: 6px; }
          .meta-divider { display: none; }
        }
      `}</style>
    </div>
  )
}
