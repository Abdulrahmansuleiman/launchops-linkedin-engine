"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"

const PIPELINE_STAGES = [
  "Discovery", "Proposal", "Onboarding", "Active", "Growth", "At Risk", "Churned",
]

const STAGE_COLORS: Record<string, string> = {
  Discovery: "#6366f1", Proposal: "#8b5cf6", Onboarding: "#06b6d4",
  Active: "#22c55e", Growth: "#eab308", "At Risk": "#f97316", Churned: "#ef4444",
}


const TABS = ["Overview", "Projects & Tasks", "Contract", "Notes"]

interface Task {
  id: string; title: string; description: string | null
  status: string; priority: string; assignee: string | null
  deadline: string | null; completedAt: string | null; createdAt: string
}

interface Project {
  id: string; name: string; description: string | null
  status: string; startDate: string | null; deadline: string | null
  createdAt: string; tasks: Task[]
}

interface Client {
  id: string; companyName: string; contactName: string
  contactEmail: string | null; contactPhone: string | null
  website: string | null; industry: string | null
  services: string[]; scope: string | null; goals: string | null
  monthlyRetainer: number | null; setupFee: number | null
  contractDuration: number | null; paymentTerms: string | null
  pipelineStage: string; onboardingStatus: string
  contractContent: string | null; contractGeneratedAt: string | null
  notes: string | null; createdAt: string
  lead: { name: string; linkedinUrl: string | null; score: number | null; profilePicture: string | null } | null
  projects: Project[]
}

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
}

function avatarColor(name: string) {
  const colors = ["#6366f1","#8b5cf6","#06b6d4","#22c55e","#eab308","#f97316","#ec4899","#14b8a6"]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function formatDate(d: string | null) {
  if (!d) return ""
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

function formatDateFull(d: string | null) {
  if (!d) return ""
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
}

function isOverdue(d: string | null) {
  return d && new Date(d) < new Date()
}

function daysUntil(d: string | null) {
  if (!d) return null
  const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
  if (diff < 0) return { label: `${Math.abs(diff)} days overdue`, urgent: true }
  if (diff === 0) return { label: "Due today", urgent: true }
  if (diff <= 3) return { label: `${diff} days left`, urgent: true }
  return { label: `${diff} days left`, urgent: false }
}

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("Overview")
  const [showContract, setShowContract] = useState(false)
  const [showAddProject, setShowAddProject] = useState(false)
  const [showAddTask, setShowAddTask] = useState<string | null>(null)
  const [projectForm, setProjectForm] = useState({ name: "", description: "", deadline: "" })
  const [taskForm, setTaskForm] = useState({ title: "", description: "", priority: "medium", deadline: "", assignee: "" })
  const [saving, setSaving] = useState(false)
  const [clientNotes, setClientNotes] = useState("")
  const [savingNotes, setSavingNotes] = useState(false)
  const [noteDirty, setNoteDirty] = useState(false)
  const [stageAnimating, setStageAnimating] = useState(false)

  const fetchClient = useCallback(async () => {
    const res = await fetch(`/api/clients/${params.id}`)
    if (!res.ok) { router.push("/clients"); return }
    const data = await res.json()
    setClient(data)
    setClientNotes(data.notes || "")
    setLoading(false)
  }, [params.id, router])

  useEffect(() => { fetchClient() }, [fetchClient])

  const updatePipeline = async (stage: string) => {
    if (!client) return
    setStageAnimating(true)
    setClient({ ...client, pipelineStage: stage })
    await fetch(`/api/clients/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pipelineStage: stage }),
    })
    setTimeout(() => setStageAnimating(false), 400)
  }

  const saveNotes = async () => {
    setSavingNotes(true)
    await fetch(`/api/clients/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: clientNotes }),
    })
    setSavingNotes(false)
    setNoteDirty(false)
  }

  const addProject = async () => {
    if (!projectForm.name) return
    setSaving(true)
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: params.id, name: projectForm.name, description: projectForm.description || undefined, deadline: projectForm.deadline || undefined }),
    })
    setProjectForm({ name: "", description: "", deadline: "" })
    setShowAddProject(false)
    setSaving(false)
    fetchClient()
  }

  const updateProjectStatus = async (projectId: string, status: string) => {
    await fetch("/api/projects", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: projectId, status }) })
    fetchClient()
  }

  const deleteProject = async (projectId: string) => {
    await fetch(`/api/projects/${projectId}`, { method: "DELETE" })
    fetchClient()
  }

  const addTask = async (projectId: string) => {
    if (!taskForm.title) return
    setSaving(true)
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, title: taskForm.title, description: taskForm.description || undefined, priority: taskForm.priority, deadline: taskForm.deadline || undefined, assignee: taskForm.assignee || undefined }),
    })
    setTaskForm({ title: "", description: "", priority: "medium", deadline: "", assignee: "" })
    setShowAddTask(null)
    setSaving(false)
    fetchClient()
  }

  const updateTaskStatus = async (taskId: string, status: string) => {
    await fetch("/api/tasks", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: taskId, status }) })
    fetchClient()
  }

  const updateTaskPriority = async (taskId: string, priority: string) => {
    await fetch("/api/tasks", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: taskId, priority }) })
    fetchClient()
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 32 }}>
        <div className="skeleton-cover" />
        <div style={{ display: "flex", gap: 16, marginTop: 24 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton-meta" />)}
        </div>
      </div>
    )
  }

  if (!client) return null

  const ac = avatarColor(client.companyName)
  const initials = getInitials(client.companyName)
  const stageColor = STAGE_COLORS[client.pipelineStage] || "#6366f1"
  const allTasks = client.projects.flatMap(p => p.tasks)
  const doneTasks = allTasks.filter(t => t.status === "done")
  const overdueTasks = allTasks.filter(t => t.status !== "done" && isOverdue(t.deadline))
  const todoTasks = allTasks.filter(t => t.status === "todo")
  const inProgressTasks = allTasks.filter(t => t.status === "in_progress")
  const taskCompletion = allTasks.length ? Math.round((doneTasks.length / allTasks.length) * 100) : 0

  const timeline = [
    { date: client.createdAt, icon: "🎉", label: "Client created", desc: `${client.companyName} was added to the pipeline` },
    ...(client.contractGeneratedAt ? [{ date: client.contractGeneratedAt, icon: "📝", label: "Contract generated", desc: "Service contract was drafted and saved" }] : []),
    ...client.projects.map(p => ({ date: p.createdAt, icon: "📁", label: `Project created: ${p.name}`, desc: p.description || "No description" })),
    ...allTasks.filter(t => t.completedAt).map(t => ({ date: t.completedAt!, icon: "✅", label: `Task completed: ${t.title}`, desc: "Marked as done" })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8)

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: 24, background: "#111", borderRadius: 16 }}>
      <button className="back-btn" onClick={() => router.push("/clients")}>
        <span>←</span> Back to Pipeline
      </button>

      <div className="cover-section" style={{ background: `linear-gradient(135deg, ${ac}15, ${ac}05)` }}>
        <div className="cover-bg-pattern" />
        <div className="cover-content">
          {client.lead?.profilePicture ? (
            <img src={client.lead.profilePicture} alt="" className="cover-avatar-img" style={{ boxShadow: `0 8px 32px ${ac}40` }} />
          ) : (
            <div className="cover-avatar" style={{ background: ac, boxShadow: `0 8px 32px ${ac}40` }}>
              {initials}
            </div>
          )}
          <div className="cover-info">
            <h1 className="cover-title">{client.companyName}</h1>
            <div className="cover-contact">
              <span>{client.contactName}</span>
              {client.contactEmail && <><span className="cover-divider">|</span><span>{client.contactEmail}</span></>}
              {client.industry && <><span className="cover-divider">|</span><span>{client.industry}</span></>}
            </div>
          </div>
        </div>
      </div>

      <div className="action-bar">
        <div className="action-bar-left">
          <select
            value={client.pipelineStage}
            onChange={(e) => updatePipeline(e.target.value)}
            className="stage-select-compact"
            style={{ color: stageColor, borderColor: `${stageColor}40` }}
          >
            {PIPELINE_STAGES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <span className={`onboarding-badge ${client.onboardingStatus === "contract_drafted" ? "badge-contract" : "badge-onboarding"}`}>
            {client.onboardingStatus === "contract_drafted" ? "CONTRACT DRAFTED" : client.onboardingStatus.replace(/_/g, " ")}
          </span>
        </div>
        <div className="action-bar-right">
          {client.contractContent && (
            <button className="btn btn-primary" onClick={() => setShowContract(true)}>
              📄 View Contract
            </button>
          )}
        </div>
      </div>

      <div className="stats-mini-grid">
        <div className="mini-stat">
          <span className="mini-stat-icon">💰</span>
          <span className="mini-stat-value">{client.monthlyRetainer ? `£${client.monthlyRetainer.toLocaleString()}` : "—"}</span>
          <span className="mini-stat-label">Monthly Retainer</span>
        </div>
        <div className="mini-stat">
          <span className="mini-stat-icon">📦</span>
          <span className="mini-stat-value">{client.setupFee ? `£${client.setupFee.toLocaleString()}` : "—"}</span>
          <span className="mini-stat-label">Setup Fee</span>
        </div>
        <div className="mini-stat">
          <span className="mini-stat-icon">📅</span>
          <span className="mini-stat-value">{client.contractDuration ? `${client.contractDuration}m` : "—"}</span>
          <span className="mini-stat-label">Duration</span>
        </div>
        <div className="mini-stat">
          <span className="mini-stat-icon">💳</span>
          <span className="mini-stat-value">{client.paymentTerms || "—"}</span>
          <span className="mini-stat-label">Payment Terms</span>
        </div>
        <div className="mini-stat wide">
          <span className="mini-stat-icon">🛠️</span>
          <div className="mini-stat-value-wrap">
            <span className="mini-stat-value-service">{client.services.length ? client.services.join(", ") : "—"}</span>
            <span className="mini-stat-label">Services</span>
          </div>
        </div>
        <div className="mini-stat">
          <span className="mini-stat-icon">📊</span>
          <span className="mini-stat-value">{client.projects.length}</span>
          <span className="mini-stat-label">Projects</span>
        </div>
        <div className="mini-stat">
          <span className="mini-stat-icon">✅</span>
          <span className="mini-stat-value">{taskCompletion}%</span>
          <span className="mini-stat-label">Tasks Done</span>
        </div>
        <div className="mini-stat">
          <span className="mini-stat-icon">🔥</span>
          <span className="mini-stat-value">{overdueTasks.length}</span>
          <span className="mini-stat-label">Overdue</span>
        </div>
      </div>

      <div className="tab-bar">
        {TABS.map(tab => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === "Overview" && (
          <>
            {client.goals && (
              <div className="section-card">
                <div className="section-card-header">
                  <span className="section-card-icon">🎯</span>
                  <h3>Goals & Scope</h3>
                </div>
                <p className="section-card-text">{client.goals}</p>
                {client.scope && <p className="section-card-text secondary">{client.scope}</p>}
              </div>
            )}

            <div className="section-card">
              <div className="section-card-header">
                <span className="section-card-icon">⏱️</span>
                <h3>Recent Activity</h3>
              </div>
              <div className="timeline">
                {timeline.length === 0 ? (
                  <p className="text-secondary">No activity yet</p>
                ) : (
                  timeline.map((entry, i) => (
                    <div key={i} className="timeline-item">
                      <div className="timeline-dot">{entry.icon}</div>
                      <div className="timeline-line" />
                      <div className="timeline-content">
                        <div className="timeline-label">{entry.label}</div>
                        <div className="timeline-desc">{entry.desc}</div>
                        <div className="timeline-date">{formatDateFull(entry.date)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === "Projects & Tasks" && (
          <>
            <div className="tasks-summary-bar">
              <span><strong>{allTasks.length}</strong> total</span>
              <span className="dot" />
              <span style={{ color: "#22c55e" }}><strong>{doneTasks.length}</strong> done</span>
              <span className="dot" />
              <span style={{ color: "#f97316" }}><strong>{inProgressTasks.length}</strong> in progress</span>
              <span className="dot" />
              <span style={{ color: "#6366f1" }}><strong>{todoTasks.length}</strong> todo</span>
              {overdueTasks.length > 0 && (
                <>
                  <span className="dot" />
                  <span style={{ color: "#ef4444" }}><strong>{overdueTasks.length}</strong> overdue</span>
                </>
              )}
            </div>

            <div className="section-header">
              <h2>Projects</h2>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddProject(true)}>
                + New Project
              </button>
            </div>

            {client.projects.length === 0 ? (
              <div className="empty-card">
                <p>No projects yet. Add your first project to track work.</p>
              </div>
            ) : (
              <div className="projects-list">
                {client.projects.map(project => {
                  const pTasks = project.tasks
                  const pDone = pTasks.filter(t => t.status === "done").length
                  const pProgress = pTasks.length ? Math.round((pDone / pTasks.length) * 100) : 0
                  const pOverdue = pTasks.filter(t => t.status !== "done" && isOverdue(t.deadline))
                  const pDue = daysUntil(project.deadline)
                  const statusColors: Record<string, string> = { active: "#22c55e", paused: "#f97316", completed: "#6366f1", cancelled: "#ef4444" }

                  return (
                    <div key={project.id} className="project-card">
                      <div className="project-card-header">
                        <div className="project-card-title-row">
                          <div className="project-info">
                            <h3 className="project-name">{project.name}</h3>
                            {project.description && <p className="project-desc">{project.description}</p>}
                          </div>
                          <div className="project-actions">
                            <select
                              className="status-select"
                              value={project.status}
                              onChange={(e) => updateProjectStatus(project.id, e.target.value)}
                              style={{ borderColor: `${statusColors[project.status] || "var(--border)"}50`, color: statusColors[project.status] || "var(--text)" }}
                            >
                              {["active","paused","completed","cancelled"].map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {(project.deadline || pTasks.length > 0) && (
                          <div className="project-stats-row">
                            {project.deadline && (
                              <span className={`project-deadline ${pDue?.urgent && project.status !== "completed" ? "urgent" : ""}`}>
                                📅 {formatDate(project.deadline)}
                                {pDue && project.status !== "completed" && <span className="due-label"> ({pDue.label})</span>}
                              </span>
                            )}
                            {pTasks.length > 0 && (
                              <div className="project-progress">
                                <div className="progress-bg">
                                  <div className="progress-fill" style={{ width: `${pProgress}%`, background: statusColors[project.status] || "#6366f1" }} />
                                </div>
                                <span className="progress-pct">{pProgress}%</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="tasks-section">
                        <div className="tasks-header">
                          <span className="tasks-count">{pTasks.length} task{pTasks.length !== 1 ? "s" : ""} · {pDone} done</span>
                          <button className="btn btn-ghost btn-xs" onClick={() => { setTaskForm({ title: "", description: "", priority: "medium", deadline: "", assignee: "" }); setShowAddTask(project.id) }}>
                            + Add Task
                          </button>
                        </div>

                        {showAddTask === project.id && (
                          <div className="task-form">
                            <input type="text" placeholder="Task title *" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} />
                            <input type="text" placeholder="Description (optional)" value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} />
                            <div className="task-form-grid">
                              <select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
                                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                              </select>
                              <input type="date" value={taskForm.deadline} onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })} />
                              <input type="text" placeholder="Assignee" value={taskForm.assignee} onChange={(e) => setTaskForm({ ...taskForm, assignee: e.target.value })} />
                            </div>
                            <div className="task-form-actions">
                              <button className="btn btn-primary btn-sm" onClick={() => addTask(project.id)} disabled={saving || !taskForm.title}>{saving ? "Adding..." : "Add Task"}</button>
                              <button className="btn btn-ghost btn-sm" onClick={() => setShowAddTask(null)}>Cancel</button>
                            </div>
                          </div>
                        )}

                        <div className="task-list">
                          {pTasks.length === 0 ? (
                            <div className="task-empty">No tasks yet</div>
                          ) : (
                            pTasks.map(task => {
                              const tDue = daysUntil(task.deadline)
                              const priorityColors: Record<string, string> = { high: "#ef4444", medium: "#f97316", low: "#22c55e" }
                              return (
                                <div key={task.id} className={`task-row ${task.status === "done" ? "done" : ""} ${isOverdue(task.deadline) && task.status !== "done" ? "overdue" : ""}`}>
                                  <label className="task-check-label">
                                    <input type="checkbox" checked={task.status === "done"} onChange={() => updateTaskStatus(task.id, task.status === "done" ? "todo" : "done")} />
                                    <span className="check-custom" />
                                  </label>
                                  <div className="task-body">
                                    <div className="task-title-row">
                                      <span className="task-title-text">{task.title}</span>
                                      <span className="task-priority-badge" style={{ background: `${priorityColors[task.priority]}18`, color: priorityColors[task.priority] }}>
                                        {task.priority}
                                      </span>
                                    </div>
                                    {task.description && <span className="task-desc-text">{task.description}</span>}
                                    <div className="task-meta-row">
                                      {task.deadline && (
                                        <span className={`task-meta-deadline ${tDue?.urgent && task.status !== "done" ? "urgent" : ""}`}>
                                          📅 {formatDate(task.deadline)}
                                          {tDue && task.status !== "done" && <span className="due-label"> ({tDue.label})</span>}
                                        </span>
                                      )}
                                      <select value={task.priority} onChange={(e) => updateTaskPriority(task.id, e.target.value)} className="priority-select">
                                        <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                                      </select>
                                      {task.assignee && <span className="task-assignee">👤 {task.assignee}</span>}
                                      {task.completedAt && <span className="task-completed">✅ {formatDate(task.completedAt)}</span>}
                                    </div>
                                  </div>
                                </div>
                              )
                            })
                          )}
                        </div>
                      </div>

                      {pOverdue.length > 0 && project.status !== "completed" && (
                        <div className="project-overdue-banner">
                          🔥 {pOverdue.length} overdue task{pOverdue.length !== 1 ? "s" : ""} need{pOverdue.length === 1 ? "s" : ""} attention
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {activeTab === "Contract" && (
          <div className="section-card">
            <div className="section-card-header">
              <span className="section-card-icon">📄</span>
              <h3>Service Contract</h3>
              {client.contractGeneratedAt && <span className="text-secondary">Generated {formatDateFull(client.contractGeneratedAt)}</span>}
            </div>
            {client.contractContent ? (
              <div className="contract-actions">
                <button className="btn btn-primary" onClick={() => setShowContract(true)}>👁️ View Full Contract</button>
                <button className="btn btn-ghost" onClick={() => window.print()}>📥 Download PDF</button>
              </div>
            ) : (
              <p className="text-secondary" style={{ padding: "20px 0" }}>No contract has been generated for this client yet.</p>
            )}
          </div>
        )}

        {activeTab === "Notes" && (
          <div className="section-card">
            <div className="section-card-header">
              <span className="section-card-icon">✏️</span>
              <h3>Internal Notes</h3>
              {noteDirty && <span className="unsaved-badge">Unsaved</span>}
            </div>
            <textarea
              className="notes-textarea"
              value={clientNotes}
              onChange={(e) => { setClientNotes(e.target.value); setNoteDirty(true) }}
              placeholder="Add internal notes, meeting summaries, or important details about this client..."
              rows={6}
            />
            <div className="notes-actions">
              <button className="btn btn-primary btn-sm" onClick={saveNotes} disabled={savingNotes || !noteDirty}>
                {savingNotes ? "Saving..." : "Save Notes"}
              </button>
              {noteDirty && <button className="btn btn-ghost btn-sm" onClick={() => { setClientNotes(client.notes || ""); setNoteDirty(false) }}>Cancel</button>}
              <span className="notes-hint">Press Ctrl+Enter to save</span>
            </div>
          </div>
        )}
      </div>

      {showAddProject && (
        <div className="modal-overlay" onClick={() => setShowAddProject(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-bar" style={{ background: "linear-gradient(90deg, #6366f1, #06b6d4)" }} />
            <h2 className="modal-title">New Project</h2>
            <div className="modal-body">
              <label className="modal-label">Project Name</label>
              <input type="text" placeholder="e.g. LinkedIn Content Strategy" value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} autoFocus />
              <label className="modal-label">Description (optional)</label>
              <input type="text" placeholder="Brief description of the project" value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} />
              <label className="modal-label">Deadline</label>
              <input type="date" value={projectForm.deadline} onChange={(e) => setProjectForm({ ...projectForm, deadline: e.target.value })} />
              <div className="modal-actions">
                <button className="btn btn-primary" onClick={addProject} disabled={saving || !projectForm.name}>{saving ? "Creating..." : "Create Project"}</button>
                <button className="btn btn-ghost" onClick={() => setShowAddProject(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showContract && client.contractContent && (
        <div className="modal-overlay" onClick={() => setShowContract(false)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Contract — {client.companyName}</h2>
              <div className="modal-header-actions">
                <button className="btn btn-primary btn-sm" onClick={() => window.print()}>📥 Download PDF</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowContract(false)}>✕ Close</button>
              </div>
            </div>
            <div className="contract-preview" dangerouslySetInnerHTML={{ __html: client.contractContent }} />
          </div>
        </div>
      )}

      <style>{`
        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          margin-bottom: 20px;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--text-secondary);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .back-btn:hover { border-color: var(--accent); color: var(--accent); }

        .cover-section {
          position: relative;
          border-radius: 20px;
          padding: 40px;
          margin-bottom: 24px;
          overflow: hidden;
        }
        .cover-bg-pattern {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle at 20% 50%, rgba(255,255,255,0.05) 0%, transparent 50%);
          pointer-events: none;
        }
        .cover-content {
          display: flex;
          align-items: center;
          gap: 24px;
          position: relative;
          z-index: 1;
        }
        .cover-avatar, .cover-avatar-img {
          width: 72px;
          height: 72px;
          border-radius: 18px;
          flex-shrink: 0;
          object-fit: cover;
        }
        .cover-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 26px;
          font-weight: 800;
        }
        .cover-title {
          font-size: 32px;
          font-weight: 800;
          margin: 0 0 6px;
        }
        .cover-contact {
          font-size: 15px;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .cover-divider { color: var(--border); }

        .action-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 24px;
        }
        .action-bar-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .action-bar-right { display: flex; gap: 8px; }

        .stage-select-compact {
          background: rgba(255,255,255,0.04);
          border: 0.5px solid;
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          outline: none;
          appearance: auto;
        }
        .onboarding-badge {
          border-radius: 999px;
          padding: 5px 12px;
          font-size: 12px;
          font-weight: 600;
        }
        .badge-onboarding {
          background: rgba(55,138,221,0.15);
          color: #7ab8f5;
          border: 0.5px solid rgba(55,138,221,0.3);
        }
        .badge-contract {
          background: #185FA5;
          color: #fff;
          font-size: 11px;
          letter-spacing: 0.05em;
        }

        .stats-mini-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 28px;
        }
        .mini-stat {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 6px;
          padding: 14px 16px;
          background: #1a1a1a;
          border: 0.5px solid #2a2a2a;
          border-radius: 12px;
          min-height: 0;
        }
        .mini-stat.wide { grid-column: span 2; }
        .mini-stat-icon { font-size: 20px; line-height: 1; }
        .mini-stat-value { display: block; font-size: 18px; font-weight: 500; color: #fff; line-height: 1.2; }
        .mini-stat-value-wrap { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
        .mini-stat-value-service { display: block; font-size: 13px; color: #aaa; font-weight: 400; line-height: 1.3; }
        .mini-stat-label { display: block; font-size: 11px; color: #666; }

        .tab-bar {
          display: flex;
          gap: 0;
          margin-bottom: 24px;
          border-bottom: 0.5px solid #222;
          overflow-x: auto;
        }
        .tab-btn {
          padding: 12px 20px;
          border: none;
          border-bottom: 2px solid transparent;
          margin-bottom: -0.5px;
          background: transparent;
          color: #666;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .tab-btn:hover { color: #fff; }
        .tab-btn.active {
          color: #fff;
          border-bottom-color: #2563EB;
          font-weight: 600;
        }

        .tab-content { min-height: 300px; }

        .section-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 20px;
        }
        .section-card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }
        .section-card-header h3 { margin: 0; font-size: 16px; font-weight: 600; }
        .section-card-header .text-secondary { font-size: 12px; margin-left: auto; }
        .section-card-icon { font-size: 20px; }
        .section-card-text { font-size: 14px; line-height: 1.7; margin: 0 0 12px; color: var(--text); }
        .section-card-text.secondary { color: var(--text-secondary); }

        .timeline { position: relative; }
        .timeline-item {
          display: flex;
          gap: 14px;
          padding-bottom: 20px;
          position: relative;
        }
        .timeline-item:last-child { padding-bottom: 0; }
        .timeline-item:last-child .timeline-line { display: none; }
        .timeline-dot {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--bg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
          z-index: 1;
        }
        .timeline-line {
          position: absolute;
          left: 15px;
          top: 32px;
          bottom: 0;
          width: 2px;
          background: var(--border);
        }
        .timeline-content { flex: 1; padding-top: 4px; }
        .timeline-label { font-size: 14px; font-weight: 600; }
        .timeline-desc { font-size: 13px; color: var(--text-secondary); }
        .timeline-date { font-size: 11px; color: var(--text-secondary); margin-top: 4px; }

        .tasks-summary-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 20px;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 12px;
          margin-bottom: 20px;
          font-size: 13px;
        }
        .dot { width: 4px; height: 4px; border-radius: 50%; background: var(--border); }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .section-header h2 { margin: 0; font-size: 18px; font-weight: 700; }

        .empty-card {
          text-align: center;
          padding: 48px;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 14px;
          color: var(--text-secondary);
        }

        .projects-list { display: flex; flex-direction: column; gap: 16px; }

        .project-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.2s;
        }
        .project-card:hover { border-color: var(--accent); }
        .project-card-header {
          padding: 20px 20px 16px;
          border-bottom: 1px solid var(--border);
        }
        .project-card-title-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          flex-wrap: wrap;
        }
        .project-info { flex: 1; }
        .project-name { font-size: 16px; font-weight: 700; margin: 0 0 4px; }
        .project-desc { font-size: 13px; color: var(--text-secondary); margin: 0; }
        .project-actions { display: flex; gap: 6px; align-items: center; flex-shrink: 0; }
        .status-select {
          padding: 4px 10px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--bg);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          outline: none;
        }
        .project-stats-row {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 12px;
          flex-wrap: wrap;
        }
        .project-deadline { font-size: 12px; color: var(--text-secondary); }
        .project-deadline.urgent { color: #ef4444; font-weight: 600; }
        .due-label { font-weight: 400; }
        .project-progress { display: flex; align-items: center; gap: 8px; flex: 1; max-width: 200px; }
        .progress-bg { flex: 1; height: 4px; background: var(--border); border-radius: 2px; overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 2px; transition: width 0.5s; }
        .progress-pct { font-size: 11px; font-weight: 600; color: var(--text-secondary); min-width: 30px; text-align: right; }

        .tasks-section { padding: 16px 20px; }
        .tasks-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .tasks-count { font-size: 13px; color: var(--text-secondary); }
        .btn-xs { padding: 4px 10px; font-size: 12px; }

        .task-form {
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
        }
        .task-form input, .task-form select {
          width: 100%;
          padding: 10px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--card);
          color: var(--text);
          font-size: 13px;
          margin-bottom: 10px;
          box-sizing: border-box;
        }
        .task-form-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
        .task-form-actions { display: flex; gap: 8px; margin-top: 8px; }

        .task-list { display: flex; flex-direction: column; gap: 6px; }
        .task-empty { padding: 24px; text-align: center; color: var(--text-secondary); font-size: 13px; }
        .task-row {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 12px;
          border-radius: 10px;
          background: var(--bg);
          border: 1px solid var(--border);
          transition: all 0.2s;
        }
        .task-row:hover { border-color: var(--accent); }
        .task-row.done { opacity: 0.55; }
        .task-row.done .task-title-text { text-decoration: line-through; }
        .task-row.overdue { background: rgba(239,68,68,0.04); border-color: rgba(239,68,68,0.15); }
        .task-check-label {
          position: relative;
          cursor: pointer;
          margin-top: 3px;
        }
        .task-check-label input { position: absolute; opacity: 0; cursor: pointer; }
        .check-custom {
          display: block;
          width: 18px;
          height: 18px;
          border: 2px solid var(--border);
          border-radius: 5px;
          transition: all 0.2s;
        }
        .task-check-label input:checked + .check-custom { background: #22c55e; border-color: #22c55e; position: relative; }
        .task-check-label input:checked + .check-custom::after {
          content: "✓";
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #fff;
          font-size: 12px;
          font-weight: 700;
        }
        .task-body { flex: 1; min-width: 0; }
        .task-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
          flex-wrap: wrap;
        }
        .task-title-text { font-size: 14px; font-weight: 500; }
        .task-priority-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 1px 8px;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .task-desc-text { display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; }
        .task-meta-row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
        .task-meta-deadline { font-size: 12px; color: var(--text-secondary); }
        .task-meta-deadline.urgent { color: #ef4444; font-weight: 600; }
        .priority-select {
          padding: 2px 8px;
          border-radius: 4px;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text);
          font-size: 11px;
          cursor: pointer;
        }
        .task-assignee { font-size: 12px; color: var(--text-secondary); }
        .task-completed { font-size: 11px; color: #22c55e; font-weight: 500; }

        .project-overdue-banner {
          padding: 10px 20px;
          background: rgba(239,68,68,0.06);
          border-top: 1px solid rgba(239,68,68,0.15);
          color: #ef4444;
          font-size: 13px;
          font-weight: 600;
        }

        .contract-actions { display: flex; gap: 10px; padding: 12px 0; }

        .notes-textarea {
          width: 100%;
          padding: 14px;
          border: 1px solid var(--border);
          border-radius: 10px;
          background: var(--bg);
          color: var(--text);
          font-size: 14px;
          resize: vertical;
          margin-bottom: 12px;
          box-sizing: border-box;
          line-height: 1.6;
        }
        .notes-textarea:focus { outline: none; border-color: var(--accent); }
        .notes-actions { display: flex; align-items: center; gap: 8px; }
        .notes-hint { font-size: 12px; color: var(--text-secondary); margin-left: auto; }
        .unsaved-badge {
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 4px;
          background: #f97316;
          color: #fff;
          margin-left: auto;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text);
          cursor: pointer;
          font-size: 14px;
          text-decoration: none;
          transition: all 0.2s;
          font-family: inherit;
        }
        .btn:hover { opacity: 0.85; }
        .btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-sm { padding: 6px 14px; font-size: 13px; }
        .btn-primary { background: linear-gradient(135deg, var(--accent), #4f46e5); color: #fff; border: none; box-shadow: 0 2px 8px rgba(99,102,241,0.25); }
        .btn-ghost { background: transparent; border-color: var(--border); }
        .text-secondary { color: var(--text-secondary); font-size: 14px; }

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
        .modal-wide { max-width: 800px; }
        @keyframes modalIn { 0% { opacity: 0; transform: scale(0.9) translateY(10px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
        .modal-header-bar { height: 4px; border-radius: 16px 16px 0 0; }
        .modal-title { padding: 20px 24px 0; margin: 0; font-size: 18px; font-weight: 700; }
        .modal-body { padding: 16px 24px 24px; }
        .modal-label { display: block; font-size: 13px; font-weight: 500; color: var(--text-secondary); margin-bottom: 6px; margin-top: 12px; }
        .modal-label:first-child { margin-top: 0; }
        .modal-body input, .modal-body select {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid var(--border);
          border-radius: 10px;
          background: var(--bg);
          color: var(--text);
          font-size: 14px;
          box-sizing: border-box;
        }
        .modal-body input:focus { outline: none; border-color: var(--accent); }
        .modal-actions { display: flex; gap: 8px; margin-top: 20px; }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
        }
        .modal-header h2 { margin: 0; font-size: 17px; }
        .modal-header-actions { display: flex; gap: 8px; }
        .contract-preview { padding: 24px; background: #fff; color: #000; font-size: 14px; line-height: 1.7; }

        .skeleton-cover { height: 160px; background: var(--card); border: 1px solid var(--border); border-radius: 20px; }
        .skeleton-meta { height: 70px; flex: 1; background: var(--card); border: 1px solid var(--border); border-radius: 12px; }

        @media (max-width: 768px) {
          .stats-mini-grid { grid-template-columns: repeat(2, 1fr); }
          .mini-stat.wide { grid-column: span 2; }
          .cover-content { flex-direction: column; text-align: center; }
          .cover-contact { justify-content: center; }
          .task-form-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 480px) {
          .stats-mini-grid { grid-template-columns: 1fr; }
          .mini-stat.wide { grid-column: span 1; }
        }
      `}</style>
    </div>
  )
}
