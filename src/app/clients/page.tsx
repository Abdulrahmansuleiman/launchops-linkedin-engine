"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

const PIPELINE_STAGES = [
  "Discovery",
  "Proposal",
  "Onboarding",
  "Active",
  "Growth",
  "At Risk",
  "Churned",
]

const STAGE_COLORS: Record<string, string> = {
  Discovery: "var(--chart-1)",
  Proposal: "var(--chart-2)",
  Onboarding: "var(--chart-3)",
  Active: "var(--chart-4)",
  Growth: "var(--chart-5)",
  "At Risk": "#f59e0b",
  Churned: "#ef4444",
}

interface LeadInfo {
  name: string
  linkedinUrl: string | null
  score: number | null
}

interface TaskInfo {
  id: string
  status: string
  deadline: string | null
}

interface ProjectInfo {
  id: string
  name: string
  status: string
  tasks: TaskInfo[]
}

interface Client {
  id: string
  companyName: string
  contactName: string
  contactEmail: string | null
  contactPhone: string | null
  industry: string | null
  services: string[]
  monthlyRetainer: number | null
  pipelineStage: string
  onboardingStatus: string
  contractGeneratedAt: string | null
  createdAt: string
  lead: LeadInfo | null
  projects: ProjectInfo[]
  _count: {
    projects: number
    tasks: number
    overdueTasks: number
  }
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedStage, setExpandedStage] = useState<string | null>(null)
  const [stageFilter, setStageFilter] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data: Client[]) => {
        setClients(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const stats = {
    active: clients.filter((c) => c.pipelineStage === "Active" || c.pipelineStage === "Growth").length,
    mrr: clients.reduce((sum, c) => sum + (c.monthlyRetainer || 0), 0),
    atRisk: clients.filter((c) => c.pipelineStage === "At Risk").length,
    overdueTasks: clients.reduce((sum, c) => sum + c._count.overdueTasks, 0),
  }

  const grouped = PIPELINE_STAGES.map((stage) => ({
    stage,
    clients: clients
      .filter((c) => c.pipelineStage === stage)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  }))

  const displayGroups = stageFilter
    ? grouped.filter((g) => g.stage === stageFilter)
    : grouped

  if (loading) {
    return (
      <div className="page-container">
        <div className="skeleton-title" />
        <div className="skeleton-row" />
        <div className="skeleton-row" />
      </div>
    )
  }

  if (clients.length === 0) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Clients</h1>
          <p className="text-secondary">Manage client relationships, projects, and tasks</p>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No clients yet</h3>
          <p className="text-secondary">
            Convert a lead to a client from the Leads page to get started
          </p>
          <Link href="/leads" className="btn btn-primary">
            Go to Leads
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Client Pipeline</h1>
        <p className="text-secondary">
          {clients.length} client{clients.length !== 1 ? "s" : ""} · £{stats.mrr.toLocaleString()} MRR
        </p>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{stats.active}</div>
          <div className="stat-label">Active Clients</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">£{stats.mrr.toLocaleString()}</div>
          <div className="stat-label">Monthly Recurring Revenue</div>
        </div>
        <div className="stat-card accent-warning">
          <div className="stat-value">{stats.atRisk}</div>
          <div className="stat-label">At Risk</div>
        </div>
        <div className="stat-card accent-danger">
          <div className="stat-value">{stats.overdueTasks}</div>
          <div className="stat-label">Overdue Tasks</div>
        </div>
      </div>

      <div className="pipeline-filters">
        <button
          className={`btn btn-sm ${!stageFilter ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setStageFilter(null)}
        >
          All Stages
        </button>
        {PIPELINE_STAGES.map((stage) => (
          <button
            key={stage}
            className={`btn btn-sm ${stageFilter === stage ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setStageFilter(stage === stageFilter ? null : stage)}
          >
            {stage}
          </button>
        ))}
      </div>

      <div className="pipeline-board">
        {displayGroups.map(({ stage, clients: stageClients }) =>
          !stageClients.length ? null : (
            <div key={stage} className="pipeline-column">
              <div
                className="pipeline-column-header"
                style={{ borderLeftColor: STAGE_COLORS[stage] || "var(--border)" }}
              >
                <span className="pipeline-stage-name">{stage}</span>
                <span className="pipeline-count">{stageClients.length}</span>
              </div>
              {stageClients.map((client) => (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}`}
                  className="client-card"
                >
                  <div className="client-card-header">
                    <h3 className="client-name">{client.companyName}</h3>
                    <span className="client-retainer">
                      {client.monthlyRetainer ? `£${client.monthlyRetainer.toLocaleString()}/mo` : ""}
                    </span>
                  </div>
                  <div className="client-card-body">
                    <div className="client-card-info">
                      <span>{client.contactName}</span>
                      {client.industry && <span className="text-secondary">{client.industry}</span>}
                    </div>
                    <div className="client-card-meta">
                      <span>{client._count.projects} projects</span>
                      <span>{client._count.tasks} tasks</span>
                      {client._count.overdueTasks > 0 && (
                        <span className="overdue-badge">{client._count.overdueTasks} overdue</span>
                      )}
                    </div>
                  </div>
                  <div className="client-card-footer">
                    {client.onboardingStatus && (
                      <span className="badge">{client.onboardingStatus.replace(/_/g, " ")}</span>
                    )}
                    <span className="text-secondary date">
                      {new Date(client.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )
        )}
      </div>

      <style>{`
        .page-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 24px;
        }
        .page-header {
          margin-bottom: 24px;
        }
        .page-header h1 {
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 4px;
        }
        .text-secondary {
          color: var(--text-secondary);
          font-size: 14px;
        }
        .stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .stat-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 20px;
        }
        .stat-card.accent-warning {
          border-left: 3px solid #f59e0b;
        }
        .stat-card.accent-danger {
          border-left: 3px solid #ef4444;
        }
        .stat-value {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .stat-label {
          font-size: 13px;
          color: var(--text-secondary);
        }
        .pipeline-filters {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text);
          cursor: pointer;
          font-size: 14px;
          text-decoration: none;
          transition: all 0.2s;
        }
        .btn:hover {
          opacity: 0.85;
        }
        .btn-sm {
          padding: 4px 12px;
          font-size: 13px;
        }
        .btn-primary {
          background: var(--accent);
          color: #fff;
          border-color: var(--accent);
        }
        .btn-ghost {
          background: transparent;
          border-color: var(--border);
        }
        .pipeline-board {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          padding-bottom: 16px;
        }
        .pipeline-column {
          min-width: 280px;
          max-width: 320px;
          flex-shrink: 0;
        }
        .pipeline-column-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          margin-bottom: 12px;
          background: var(--card);
          border: 1px solid var(--border);
          border-left: 4px solid;
          border-radius: 8px;
        }
        .pipeline-stage-name {
          font-weight: 600;
          font-size: 14px;
        }
        .pipeline-count {
          background: var(--bg);
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .client-card {
          display: block;
          padding: 16px;
          margin-bottom: 12px;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 10px;
          text-decoration: none;
          color: inherit;
          transition: all 0.2s;
        }
        .client-card:hover {
          border-color: var(--accent);
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          transform: translateY(-1px);
        }
        .client-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }
        .client-name {
          font-size: 15px;
          font-weight: 600;
          margin: 0;
        }
        .client-retainer {
          font-size: 13px;
          font-weight: 600;
          color: var(--accent);
          white-space: nowrap;
        }
        .client-card-body {
          margin-bottom: 8px;
        }
        .client-card-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-size: 13px;
          margin-bottom: 6px;
        }
        .client-card-meta {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: var(--text-secondary);
        }
        .overdue-badge {
          color: #ef4444;
          font-weight: 600;
        }
        .client-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 8px;
          border-top: 1px solid var(--border);
        }
        .badge {
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 4px;
          background: var(--bg);
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .date {
          font-size: 12px;
        }
        .empty-state {
          text-align: center;
          padding: 80px 20px;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 12px;
        }
        .empty-state-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        .skeleton-title {
          height: 36px;
          width: 200px;
          background: var(--border);
          border-radius: 8px;
          margin-bottom: 24px;
        }
        .skeleton-row {
          height: 120px;
          background: var(--border);
          border-radius: 12px;
          margin-bottom: 12px;
        }
      `}</style>
    </div>
  )
}
