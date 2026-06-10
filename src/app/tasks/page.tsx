"use client"

import { useEffect, useState, useCallback } from "react"

const PIPELINE_STAGES = [
  "Discovery", "Proposal", "Onboarding", "Active", "Growth", "At Risk", "Churned",
]

const PRIORITIES = ["high", "medium", "low"] as const
const STATUSES = ["todo", "in_progress", "done"] as const

interface TaskProject {
  id: string
  name: string
  clientId: string
  client: { id: string; companyName: string } | null
}

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  scope: string
  pipelineStage: string | null
  assignee: string | null
  deadline: string | null
  completedAt: string | null
  createdAt: string
  project: TaskProject | null
}

interface TaskStats {
  total: number
  overdue: number
  dueToday: number
  pipeline: number
  client: number
  byStage: Record<string, number>
}

function isOverdue(d: string | null) {
  return d && new Date(d) < new Date()
}

function isToday(d: string | null) {
  if (!d) return false
  const date = new Date(d)
  const now = new Date()
  return date.toDateString() === now.toDateString()
}

function formatDate(d: string | null) {
  if (!d) return ""
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

function daysLabel(d: string | null) {
  if (!d) return null
  const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
  if (diff < 0) return `${Math.abs(diff)}d overdue`
  if (diff === 0) return "Due today"
  return `${diff}d left`
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [clients, setClients] = useState<{ id: string; companyName: string; projects: { id: string; name: string }[] }[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [scopeFilter, setScopeFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [stageFilter, setStageFilter] = useState<string | null>(null)
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null)
  const [showNewTask, setShowNewTask] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    title: "",
    description: "",
    scope: "pipeline",
    pipelineStage: "Active",
    projectId: "",
    priority: "medium",
    assignee: "",
    deadline: "",
  })

  const fetchTasks = useCallback(async () => {
    const params = new URLSearchParams()
    if (scopeFilter) params.set("scope", scopeFilter)
    if (statusFilter) params.set("status", statusFilter)
    if (stageFilter) params.set("pipelineStage", stageFilter)
    if (priorityFilter) params.set("priority", priorityFilter)
    if (search) params.set("search", search)
    const res = await fetch(`/api/tasks?${params}`)
    const data = await res.json()
    setTasks(data)
    setLoading(false)
  }, [scopeFilter, statusFilter, stageFilter, priorityFilter, search])

  const fetchClients = useCallback(async () => {
    const res = await fetch("/api/clients")
    const data: any[] = await res.json()
    setClients(data.map((c: any) => ({ id: c.id, companyName: c.companyName, projects: (c.projects || []).map((p: any) => ({ id: p.id, name: p.name })) })))
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])
  useEffect(() => { fetchClients() }, [fetchClients])

  const createTask = async () => {
    if (!form.title) return
    setSaving(true)
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description || undefined,
        scope: form.scope,
        pipelineStage: form.scope === "pipeline" ? form.pipelineStage : undefined,
        projectId: form.scope === "client" ? form.projectId : undefined,
        priority: form.priority,
        assignee: form.assignee || undefined,
        deadline: form.deadline || undefined,
      }),
    })
    setForm({ title: "", description: "", scope: "pipeline", pipelineStage: "Active", projectId: "", priority: "medium", assignee: "", deadline: "" })
    setShowNewTask(false)
    setSaving(false)
    fetchTasks()
  }

  const updateStatus = async (id: string, status: string) => {
    await fetch("/api/tasks", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) })
    fetchTasks()
  }

  const updatePriority = async (id: string, priority: string) => {
    await fetch("/api/tasks", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, priority }) })
    fetchTasks()
  }

  const deleteTask = async (id: string) => {
    await fetch(`/api/tasks?id=${id}`, { method: "DELETE" })
    fetchTasks()
  }

  const overdueCount = tasks.filter(t => t.status !== "done" && isOverdue(t.deadline)).length
  const todayCount = tasks.filter(t => t.status !== "done" && isToday(t.deadline)).length
  const pipelineCount = tasks.filter(t => t.scope === "pipeline").length
  const clientCount = tasks.filter(t => t.scope === "client").length

  const byStage: Record<string, number> = {}
  PIPELINE_STAGES.forEach(s => { byStage[s] = tasks.filter(t => t.scope === "pipeline" && t.pipelineStage === s).length })

  const filtered = tasks
  const pipelineTasks = filtered.filter(t => t.scope === "pipeline")
  const clientTasks = filtered.filter(t => t.scope === "client")

  const selectedClient = form.scope === "client" ? clients.find(c => c.projects.some(p => p.id === form.projectId)) : null

  if (loading) {
    return (
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: 32 }}>
        <div className="sk-h" style={{ width: 200 }} />
        <div className="sk-h" style={{ width: 400, height: 20, marginTop: 8 }} />
        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          {[1,2,3,4,5].map(i => <div key={i} className="sk-stat" />)}
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          {[1,2,3].map(i => <div key={i} className="sk-row" />)}
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px 48px" }}>
      <div className="page-head">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">Manage your workflow across pipeline stages and client projects</p>
        </div>
        <button className="btn-primary" onClick={() => setShowNewTask(true)}>
          + New Task
        </button>
      </div>

      <div className="stat-grid">
        <div className="stat-box accent-primary">
          <span className="stat-num">{tasks.length}</span>
          <span className="stat-lbl">Total Tasks</span>
        </div>
        <div className="stat-box accent-danger">
          <span className="stat-num">{overdueCount}</span>
          <span className="stat-lbl">Overdue</span>
          {overdueCount > 0 && <span className="stat-sub">Requires immediate action</span>}
        </div>
        <div className="stat-box accent-warning">
          <span className="stat-num">{todayCount}</span>
          <span className="stat-lbl">Due Today</span>
        </div>
        <div className="stat-box accent-info">
          <span className="stat-num">{pipelineCount}</span>
          <span className="stat-lbl">Pipeline Tasks</span>
        </div>
        <div className="stat-box accent-success">
          <span className="stat-num">{clientCount}</span>
          <span className="stat-lbl">Client Tasks</span>
        </div>
      </div>

      <div className="stage-breakdown">
        <span className="breakdown-label">Pipeline breakdown:</span>
        {PIPELINE_STAGES.map(s => {
          const count = byStage[s] || 0
          if (!count) return null
          return (
            <button
              key={s}
              className={`breakdown-chip ${stageFilter === s ? "active" : ""}`}
              onClick={() => setStageFilter(stageFilter === s ? null : s)}
            >
              {s} <span className="chip-count">{count}</span>
            </button>
          )
        })}
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <span className="filter-label">Scope</span>
          <div className="filter-pills">
            {["All", "pipeline", "client"].map(s => (
              <button
                key={s}
                className={`pill ${scopeFilter === (s === "All" ? null : s) ? "active" : ""}`}
                onClick={() => setScopeFilter(s === "All" ? null : s)}
              >{s === "All" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}</button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <span className="filter-label">Status</span>
          <div className="filter-pills">
            {["All", ...STATUSES].map(s => (
              <button
                key={s}
                className={`pill ${statusFilter === (s === "All" ? null : s) ? "active" : ""}`}
                onClick={() => setStatusFilter(s === "All" ? null : s)}
              >{s === "All" ? "All" : s === "in_progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)}</button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <span className="filter-label">Priority</span>
          <div className="filter-pills">
            {["All", ...PRIORITIES].map(s => (
              <button
                key={s}
                className={`pill ${priorityFilter === (s === "All" ? null : s) ? "active" : ""}`}
                onClick={() => setPriorityFilter(s === "All" ? null : s)}
              >{s === "All" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}</button>
            ))}
          </div>
        </div>
        <div className="search-wrap">
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-field"
          />
          {search && <button className="search-x" onClick={() => setSearch("")}>x</button>}
        </div>
      </div>

      <div className="task-columns">
        <div className="task-column">
          <div className="column-title">
            <span>Pipeline Tasks</span>
            <span className="title-count">{pipelineTasks.length}</span>
          </div>
          {pipelineTasks.length === 0 ? (
            <div className="empty-col">No pipeline tasks match your filters</div>
          ) : (
            pipelineTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={updateStatus}
                onPriorityChange={updatePriority}
                onDelete={deleteTask}
              />
            ))
          )}
        </div>
        <div className="task-column">
          <div className="column-title">
            <span>Client Tasks</span>
            <span className="title-count">{clientTasks.length}</span>
          </div>
          {clientTasks.length === 0 ? (
            <div className="empty-col">No client tasks match your filters</div>
          ) : (
            clientTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={updateStatus}
                onPriorityChange={updatePriority}
                onDelete={deleteTask}
              />
            ))
          )}
        </div>
      </div>

      {showNewTask && (
        <div className="modal-overlay" onClick={() => setShowNewTask(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-bar" />
            <div className="modal-body">
              <h2 className="modal-title">New Task</h2>

              <label className="field-label">Title</label>
              <input type="text" className="field" placeholder="What needs to be done?" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus />

              <label className="field-label">Description</label>
              <input type="text" className="field" placeholder="Add details (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

              <label className="field-label">Scope</label>
              <div className="scope-toggle">
                <button className={`scope-btn ${form.scope === "pipeline" ? "active" : ""}`} onClick={() => setForm({ ...form, scope: "pipeline" })}>Pipeline</button>
                <button className={`scope-btn ${form.scope === "client" ? "active" : ""}`} onClick={() => setForm({ ...form, scope: "client" })}>Client</button>
              </div>

              {form.scope === "pipeline" ? (
                <div>
                  <label className="field-label">Pipeline Stage</label>
                  <select className="field" value={form.pipelineStage} onChange={(e) => setForm({ ...form, pipelineStage: e.target.value })}>
                    {PIPELINE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="field-label">Client Project</label>
                  <select className="field" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                    <option value="">Select a project...</option>
                    {clients.filter(c => c.projects.length > 0).map(c => (
                      <optgroup key={c.id} label={c.companyName}>
                        {c.projects.map(p => (
                          <option key={p.id} value={p.id}>{c.companyName} — {p.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {clients.filter(c => c.projects.length === 0).length > 0 && (
                    <p className="field-hint">{clients.filter(c => c.projects.length === 0).length} client(s) with no projects — add a project first</p>
                  )}
                </div>
              )}

              <div className="field-row">
                <div style={{ flex: 1 }}>
                  <label className="field-label">Priority</label>
                  <select className="field" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="field-label">Deadline</label>
                  <input type="date" className="field" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
                </div>
              </div>

              <label className="field-label">Assignee</label>
              <input type="text" className="field" placeholder="Who is responsible?" value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} />

              <div className="modal-actions">
                <button className="btn-primary" onClick={createTask} disabled={saving || !form.title}>
                  {saving ? "Creating..." : "Create Task"}
                </button>
                <button className="btn-ghost" onClick={() => setShowNewTask(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .page-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 28px;
          gap: 16px;
        }
        .page-title {
          font-size: 32px;
          font-weight: 800;
          margin: 0 0 4px;
        }
        .page-subtitle {
          margin: 0;
          color: var(--text-secondary);
          font-size: 15px;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 22px;
          border: none;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--accent), #4f46e5);
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(99,102,241,0.25);
          font-family: inherit;
          white-space: nowrap;
        }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(99,102,241,0.35); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .btn-ghost {
          padding: 10px 22px;
          border: 1px solid var(--border);
          border-radius: 10px;
          background: transparent;
          color: var(--text);
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }
        .btn-ghost:hover { border-color: var(--accent); }

        .stat-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }
        .stat-box {
          position: relative;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 18px 20px;
          overflow: hidden;
        }
        .stat-box::before {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
        }
        .accent-primary::before { background: linear-gradient(90deg, #6366f1, #8b5cf6); }
        .accent-danger::before { background: linear-gradient(90deg, #ef4444, #f97316); }
        .accent-warning::before { background: linear-gradient(90deg, #f97316, #eab308); }
        .accent-info::before { background: linear-gradient(90deg, #06b6d4, #6366f1); }
        .accent-success::before { background: linear-gradient(90deg, #22c55e, #06b6d4); }
        .stat-num { display: block; font-size: 28px; font-weight: 800; line-height: 1; margin-bottom: 4px; }
        .stat-lbl { display: block; font-size: 13px; color: var(--text-secondary); font-weight: 500; }
        .stat-sub { display: block; font-size: 11px; color: #ef4444; font-weight: 600; margin-top: 4px; }

        .stage-breakdown {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 20px;
          padding: 12px 16px;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 12px;
        }
        .breakdown-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          margin-right: 4px;
        }
        .breakdown-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--bg);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--text);
        }
        .breakdown-chip:hover { border-color: var(--accent); }
        .breakdown-chip.active { background: var(--accent); color: #fff; border-color: var(--accent); }
        .chip-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          border-radius: 9px;
          background: rgba(255,255,255,0.2);
          font-size: 11px;
          font-weight: 700;
        }
        .breakdown-chip:not(.active) .chip-count { background: var(--border); }

        .filter-bar {
          display: flex;
          gap: 16px;
          align-items: flex-end;
          flex-wrap: wrap;
          margin-bottom: 24px;
          padding: 16px 20px;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 14px;
        }
        .filter-group { display: flex; flex-direction: column; gap: 6px; }
        .filter-label { font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
        .filter-pills { display: flex; gap: 4px; flex-wrap: wrap; }
        .pill {
          padding: 4px 10px;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: var(--bg);
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--text-secondary);
        }
        .pill:hover { border-color: var(--accent); color: var(--text); }
        .pill.active { background: var(--accent); color: #fff; border-color: var(--accent); }
        .search-wrap { position: relative; margin-left: auto; min-width: 200px; }
        .search-field {
          width: 100%;
          padding: 8px 32px 8px 12px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--bg);
          color: var(--text);
          font-size: 13px;
          box-sizing: border-box;
        }
        .search-field:focus { outline: none; border-color: var(--accent); }
        .search-x {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 13px;
          padding: 2px 6px;
        }

        .task-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .task-column {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .column-title {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .title-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 22px;
          height: 22px;
          padding: 0 6px;
          border-radius: 11px;
          background: var(--bg);
          font-size: 12px;
          font-weight: 700;
          color: var(--text-secondary);
        }
        .empty-col {
          padding: 32px;
          text-align: center;
          color: var(--text-secondary);
          font-size: 14px;
          background: var(--card);
          border: 1px dashed var(--border);
          border-radius: 12px;
        }

        .task-card {
          display: block;
          padding: 16px;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 12px;
          transition: all 0.2s;
        }
        .task-card:hover { border-color: var(--accent); }
        .task-card.done { opacity: 0.55; }
        .task-card.overdue { border-color: rgba(239,68,68,0.3); background: rgba(239,68,68,0.03); }

        .task-row1 {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 8px;
        }
        .task-check {
          flex-shrink: 0;
          margin-top: 2px;
        }
        .task-check input { display: none; }
        .check-box {
          display: block;
          width: 18px;
          height: 18px;
          border: 2px solid var(--border);
          border-radius: 5px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .check-box.checked { background: #22c55e; border-color: #22c55e; position: relative; }
        .check-box.checked::after {
          content: "";
          position: absolute;
          top: 2px; left: 5px;
          width: 5px; height: 9px;
          border: solid #fff;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }

        .task-info { flex: 1; min-width: 0; }
        .task-title-line {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 2px;
        }
        .task-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
        }
        .task-card.done .task-title { text-decoration: line-through; color: var(--text-secondary); }
        .task-desc {
          font-size: 12px;
          color: var(--text-secondary);
          display: block;
          margin-bottom: 6px;
        }
        .task-meta {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
          margin-top: 4px;
        }
        .scope-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .scope-badge.pipeline { background: rgba(99,102,241,0.12); color: #6366f1; }
        .scope-badge.client { background: rgba(34,197,94,0.12); color: #22c55e; }
        .pipe-tag {
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 4px;
          background: var(--bg);
          color: var(--text-secondary);
        }
        .client-tag {
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 4px;
          background: rgba(99,102,241,0.08);
          color: #6366f1;
        }
        .priority-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .priority-badge.high { background: rgba(239,68,68,0.12); color: #ef4444; }
        .priority-badge.medium { background: rgba(249,115,22,0.12); color: #f97316; }
        .priority-badge.low { background: rgba(34,197,94,0.12); color: #22c55e; }
        .task-deadline { font-size: 12px; color: var(--text-secondary); font-weight: 500; }
        .task-deadline.warning { color: #f97316; font-weight: 600; }
        .task-deadline.danger { color: #ef4444; font-weight: 700; }
        .assignee-tag {
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 4px;
          background: var(--bg);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .assignee-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent);
        }

        .task-row2 {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding-top: 8px;
          border-top: 1px solid var(--border);
        }
        .task-actions {
          display: flex;
          gap: 6px;
          align-items: center;
        }
        .action-btn {
          padding: 4px 8px;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: transparent;
          color: var(--text-secondary);
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }
        .action-btn:hover { border-color: var(--accent); color: var(--text); }
        .action-btn.danger:hover { border-color: #ef4444; color: #ef4444; }
        .status-select-mini {
          padding: 4px 8px;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: var(--bg);
          color: var(--text);
          font-size: 11px;
          cursor: pointer;
          font-weight: 500;
          font-family: inherit;
        }

        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          backdrop-filter: blur(4px);
        }
        .modal {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 16px;
          max-width: 520px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          animation: modalIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes modalIn {
          0% { opacity: 0; transform: scale(0.9) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .modal-header-bar {
          height: 4px;
          background: linear-gradient(90deg, #6366f1, #06b6d4);
          border-radius: 16px 16px 0 0;
        }
        .modal-body { padding: 24px; }
        .modal-title { font-size: 20px; font-weight: 700; margin: 0 0 20px; }
        .field-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 6px;
          margin-top: 16px;
        }
        .field-label:first-of-type { margin-top: 0; }
        .field {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid var(--border);
          border-radius: 10px;
          background: var(--bg);
          color: var(--text);
          font-size: 14px;
          box-sizing: border-box;
          font-family: inherit;
        }
        .field:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 2px rgba(99,102,241,0.1); }
        .field-row { display: flex; gap: 12px; }
        .field-hint { font-size: 12px; color: var(--text-secondary); margin: 6px 0 0; }
        .scope-toggle {
          display: flex;
          gap: 0;
          border: 1px solid var(--border);
          border-radius: 10px;
          overflow: hidden;
        }
        .scope-btn {
          flex: 1;
          padding: 10px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }
        .scope-btn.active {
          background: var(--accent);
          color: #fff;
          font-weight: 600;
        }
        .modal-actions { display: flex; gap: 10px; margin-top: 24px; }

        .sk-h { height: 36px; background: var(--border); border-radius: 8px; margin-bottom: 8px; }
        .sk-stat { height: 90px; flex: 1; background: var(--card); border: 1px solid var(--border); border-radius: 14px; }
        .sk-row { height: 80px; flex: 1; background: var(--card); border: 1px solid var(--border); border-radius: 12px; }

        @media (max-width: 900px) {
          .task-columns { grid-template-columns: 1fr; }
          .stat-grid { grid-template-columns: repeat(3, 1fr); }
          .stat-box:nth-child(4),
          .stat-box:nth-child(5) { grid-column: span 1; }
        }
        @media (max-width: 600px) {
          .stat-grid { grid-template-columns: 1fr 1fr; }
          .filter-bar { flex-direction: column; }
          .search-wrap { margin-left: 0; width: 100%; }
        }
      `}</style>
    </div>
  )
}

function TaskCard({
  task,
  onStatusChange,
  onPriorityChange,
  onDelete,
}: {
  task: Task
  onStatusChange: (id: string, status: string) => void
  onPriorityChange: (id: string, priority: string) => void
  onDelete: (id: string) => void
}) {
  const overdue = task.status !== "done" && isOverdue(task.deadline)
  const dueLabel = daysLabel(task.deadline)

  return (
    <div className={`task-card ${task.status === "done" ? "done" : ""} ${overdue ? "overdue" : ""}`}>
      <div className="task-row1">
        <div className="task-check">
          <div
            className={`check-box ${task.status === "done" ? "checked" : ""}`}
            onClick={() => onStatusChange(task.id, task.status === "done" ? "todo" : "done")}
          />
        </div>
        <div className="task-info">
          <div className="task-title-line">
            <span className="task-title">{task.title}</span>
            <span className={`priority-badge ${task.priority}`}>{task.priority}</span>
          </div>
          {task.description && <span className="task-desc">{task.description}</span>}
          <div className="task-meta">
            <span className={`scope-badge ${task.scope}`}>{task.scope}</span>
            {task.scope === "pipeline" && task.pipelineStage && (
              <span className="pipe-tag">{task.pipelineStage}</span>
            )}
            {task.scope === "client" && task.project?.client && (
              <span className="client-tag">{task.project.client.companyName}</span>
            )}
            {task.deadline && (
              <span className={`task-deadline ${overdue ? "danger" : dueLabel === "Due today" ? "warning" : ""}`}>
                {task.deadline ? formatDate(task.deadline) : ""}
                {dueLabel && ` (${dueLabel})`}
              </span>
            )}
            {task.assignee && (
              <span className="assignee-tag">
                <span className="assignee-dot" />
                {task.assignee}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="task-row2">
        <div className="task-actions">
          <select
            className="status-select-mini"
            value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value)}
          >
            <option value="todo">Todo</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <select
            className="status-select-mini"
            value={task.priority}
            onChange={(e) => onPriorityChange(task.id, e.target.value)}
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <button className="action-btn danger" onClick={() => onDelete(task.id)}>Delete</button>
      </div>
    </div>
  )
}
