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
  lead: { name: string; linkedinUrl: string | null; score: number | null } | null
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
      <div className="hero-section">
        <div className="hero-bg" />
        <div className="hero-content">
          <div className="hero-badge">Live Pipeline</div>
          <h1 className="hero-title">Client Pipeline</h1>
          <p className="hero-subtitle">
            <span>{clients.length} client{clients.length !== 1 && "s"}</span>
            <span className="hero-dot">·</span>
            <span>£{stats.mrr.toLocaleString()} MRR</span>
            <span className="hero-dot">·</span>
            <span>{stats.active} active</span>
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-primary">
          <div className="stat-body">
            <span className="stat-value">{stats.active}</span>
            <span className="stat-label">Active Clients</span>
          </div>
          <div className="stat-trend up">+{stats.active} active</div>
        </div>
        <div className="stat-card stat-accent">
          <div className="stat-body">
            <span className="stat-value">£{stats.mrr.toLocaleString()}</span>
            <span className="stat-label">Monthly Revenue</span>
          </div>
          <div className="stat-trend up">{stats.mrr > 0 ? "Recurring" : "No MRR yet"}</div>
        </div>
        <div className="stat-card stat-warning">
          <div className="stat-body">
            <span className="stat-value">{stats.atRisk}</span>
            <span className="stat-label">At Risk</span>
          </div>
          <div className="stat-trend down">Needs attention</div>
        </div>
        <div className="stat-card stat-danger">
          <div className="stat-body">
            <span className="stat-value">{stats.overdueTasks}</span>
            <span className="stat-label">Overdue Tasks</span>
          </div>
          <div className="stat-trend down">Requires action</div>
        </div>
        <div className="stat-card stat-info">
          <div className="stat-body">
            <span className="stat-value">{stats.onboarding}</span>
            <span className="stat-label">Onboarding</span>
          </div>
          <div className="stat-trend">In progress</div>
        </div>
        <div className="stat-card stat-neutral">
          <div className="stat-body">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Clients</span>
          </div>
          <div className="stat-trend">{stats.churned} churned</div>
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
                  <span className="stage-icon" />
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
                          <div className="card-avatar" style={{ background: avatarColor }}>
                            {initials}
                          </div>
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
        .hero-section {
          position: relative;
          padding: 48px 0 40px;
          margin-bottom: 32px;
          overflow: hidden;
          border-radius: 20px;
        }
        .hero-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(6,182,212,0.05) 50%, rgba(34,197,94,0.03) 100%);
          border-radius: 20px;
          pointer-events: none;
        }
        .hero-content {
          position: relative;
          z-index: 1;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 14px;
          border-radius: 20px;
          background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.1));
          border: 1px solid rgba(99,102,241,0.2);
          font-size: 12px;
          font-weight: 600;
          color: var(--accent);
          margin-bottom: 16px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .hero-title {
          font-size: 40px;
          font-weight: 800;
          margin: 0 0 8px;
          background: linear-gradient(135deg, var(--text) 0%, var(--text-secondary) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-subtitle {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          color: var(--text-secondary);
          margin: 0;
        }
        .hero-dot { color: var(--border); font-weight: 700; }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 14px;
          margin-bottom: 28px;
        }
        .stat-card {
          position: relative;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 20px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          cursor: default;
        }
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
        }
        .stat-card::before {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          border-radius: 16px 16px 0 0;
        }
        .stat-primary::before { background: linear-gradient(90deg, #6366f1, #06b6d4); }
        .stat-accent::before { background: linear-gradient(90deg, #22c55e, #06b6d4); }
        .stat-warning::before { background: linear-gradient(90deg, #f97316, #eab308); }
        .stat-danger::before { background: linear-gradient(90deg, #ef4444, #f97316); }
        .stat-info::before { background: linear-gradient(90deg, #06b6d4, #6366f1); }
        .stat-neutral::before { background: linear-gradient(90deg, var(--border), var(--text-secondary)); }
        .stat-icon { display: none; }
        .stat-body { margin-bottom: 8px; }
        .stat-value { display: block; font-size: 28px; font-weight: 800; line-height: 1; margin-bottom: 4px; }
        .stat-label { font-size: 13px; color: var(--text-secondary); font-weight: 500; }
        .stat-trend { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 6px; background: var(--bg); display: inline-block; }
        .stat-trend.up { color: #22c55e; }
        .stat-trend.down { color: #ef4444; }

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
        .search-icon { display: none; }
        .search-input {
          width: 100%;
          padding: 12px 40px 12px 42px;
          border: 1px solid var(--border);
          border-radius: 12px;
          background: var(--card);
          color: var(--text);
          font-size: 14px;
          transition: all 0.2s;
          box-sizing: border-box;
        }
        .search-input:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }
        .search-input::placeholder { color: var(--text-secondary); }
        .search-clear {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 14px;
          padding: 4px;
        }
        .search-clear:hover { color: var(--text); }
        .stage-filters {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .filter-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 20px;
          border: 1px solid var(--border);
          background: var(--card);
          color: var(--text);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .filter-chip:hover { border-color: var(--accent); }
        .filter-chip.active { color: #fff; border-color: var(--accent); }
        .filter-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          border-radius: 9px;
          background: rgba(255,255,255,0.2);
          font-size: 11px;
          font-weight: 600;
        }

        .pipeline-board {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          padding: 8px 4px 24px;
          scrollbar-width: thin;
          scrollbar-color: var(--border) transparent;
        }
        .pipeline-board::-webkit-scrollbar { height: 6px; }
        .pipeline-board::-webkit-scrollbar-track { background: transparent; }
        .pipeline-board::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

        .pipeline-column {
          min-width: 290px;
          max-width: 290px;
          flex-shrink: 0;
          transition: all 0.3s;
        }
        .pipeline-column.drag-over {
          transform: scale(1.01);
        }
        .column-header {
          background: var(--card);
          border: 1px solid var(--border);
          border-top: 3px solid;
          border-radius: 14px;
          padding: 16px;
          margin-bottom: 12px;
        }
        .column-header-top {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }
        .stage-icon { display: none; }
        .stage-name { font-weight: 700; font-size: 14px; flex: 1; }
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
        .stage-mrr { font-size: 15px; font-weight: 700; }
        .stage-mrr-label { font-size: 11px; color: var(--text-secondary); }

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
          border: 2px dashed var(--border);
          border-radius: 12px;
          color: var(--text-secondary);
          font-size: 13px;
        }
        .pipeline-column.drag-over .column-empty {
          border-color: var(--accent);
          background: rgba(99,102,241,0.04);
          color: var(--accent);
        }

        .client-card {
          display: block;
          padding: 16px;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 12px;
          text-decoration: none;
          color: inherit;
          cursor: grab;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .client-card:hover {
          border-color: var(--accent);
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
        .card-avatar {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 13px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .card-info { flex: 1; min-width: 0; }
        .card-company {
          font-size: 14px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .card-contact {
          font-size: 12px;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .card-retainer {
          font-size: 13px;
          font-weight: 700;
          color: var(--accent);
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
          background: var(--border);
          border-radius: 2px;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .progress-text { font-size: 11px; font-weight: 600; color: var(--text-secondary); min-width: 28px; text-align: right; }

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
          background: var(--bg);
        }
        .card-deadline.overdue { color: #ef4444; background: rgba(239,68,68,0.08); }
        .card-deadline.today { color: #f97316; background: rgba(249,115,22,0.08); }
        .card-overdue-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 6px;
          color: #fff;
          background: #ef4444;
        }
        .card-industry {
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 6px;
          background: var(--bg);
          color: var(--text-secondary);
        }

        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 10px;
          border-top: 1px solid var(--border);
        }
        .card-footer-stats {
          display: flex;
          gap: 10px;
          font-size: 11px;
          color: var(--text-secondary);
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
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .btn-primary-lg {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 28px;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--accent), #4f46e5);
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
          border: 1px solid var(--border);
          border-radius: 10px;
          background: var(--card);
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s;
        }
        .btn-clear-filter:hover { border-color: #ef4444; color: #ef4444; }

        .empty-state {
          text-align: center;
          padding: 80px 20px;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 20px;
          margin-top: 24px;
        }
        .empty-icon { font-size: 32px; font-weight: 800; margin-bottom: 8px; color: var(--text-secondary); }
        .empty-state h3 { font-size: 22px; margin: 0 0 8px; }
        .empty-state p { color: var(--text-secondary); margin: 0 0 24px; font-size: 15px; }

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
          border-radius: 16px;
        }
        .skeleton-column {
          height: 400px;
          flex: 1;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 14px;
        }

        @media (max-width: 1200px) {
          .stats-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 768px) {
          .hero-title { font-size: 28px; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .pipeline-column { min-width: 260px; max-width: 260px; }
        }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
