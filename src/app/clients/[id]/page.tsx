"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"

const PIPELINE_STAGES = [
  "Discovery",
  "Proposal",
  "Onboarding",
  "Active",
  "Growth",
  "At Risk",
  "Churned",
]

const TASK_STATUSES = ["todo", "in_progress", "done"] as const
const PRIORITIES = ["low", "medium", "high"] as const
const PROJECT_STATUSES = ["active", "paused", "completed", "cancelled"] as const

interface LeadInfo {
  name: string
  linkedinUrl: string | null
  score: number | null
}

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  assignee: string | null
  deadline: string | null
  completedAt: string | null
  createdAt: string
}

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  startDate: string | null
  deadline: string | null
  createdAt: string
  tasks: Task[]
}

interface Client {
  id: string
  companyName: string
  contactName: string
  contactEmail: string | null
  contactPhone: string | null
  website: string | null
  industry: string | null
  services: string[]
  scope: string | null
  goals: string | null
  monthlyRetainer: number | null
  setupFee: number | null
  contractDuration: number | null
  paymentTerms: string | null
  pipelineStage: string
  onboardingStatus: string
  contractContent: string | null
  contractGeneratedAt: string | null
  notes: string | null
  createdAt: string
  lead: LeadInfo | null
  projects: Project[]
}

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [showContract, setShowContract] = useState(false)
  const [showAddProject, setShowAddProject] = useState(false)
  const [showAddTask, setShowAddTask] = useState<string | null>(null)
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  const [projectForm, setProjectForm] = useState({ name: "", description: "", deadline: "" })
  const [taskForm, setTaskForm] = useState({ title: "", description: "", priority: "medium", deadline: "", assignee: "" })
  const [saving, setSaving] = useState(false)
  const [clientNotes, setClientNotes] = useState("")
  const [savingNotes, setSavingNotes] = useState(false)

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
    await fetch(`/api/clients/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pipelineStage: stage }),
    })
    fetchClient()
  }

  const saveNotes = async () => {
    setSavingNotes(true)
    await fetch(`/api/clients/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: clientNotes }),
    })
    setSavingNotes(false)
  }

  const addProject = async () => {
    if (!projectForm.name) return
    setSaving(true)
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: params.id,
        name: projectForm.name,
        description: projectForm.description || undefined,
        deadline: projectForm.deadline || undefined,
      }),
    })
    setProjectForm({ name: "", description: "", deadline: "" })
    setShowAddProject(false)
    setSaving(false)
    fetchClient()
  }

  const updateProjectStatus = async (projectId: string, status: string) => {
    await fetch("/api/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: projectId, status }),
    })
    fetchClient()
  }

  const addTask = async (projectId: string) => {
    if (!taskForm.title) return
    setSaving(true)
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        title: taskForm.title,
        description: taskForm.description || undefined,
        priority: taskForm.priority,
        deadline: taskForm.deadline || undefined,
        assignee: taskForm.assignee || undefined,
      }),
    })
    setTaskForm({ title: "", description: "", priority: "medium", deadline: "", assignee: "" })
    setShowAddTask(null)
    setSaving(false)
    fetchClient()
  }

  const updateTaskStatus = async (taskId: string, status: string) => {
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId, status }),
    })
    fetchClient()
  }

  const updateTaskPriority = async (taskId: string, priority: string) => {
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId, priority }),
    })
    fetchClient()
  }

  const isOverdue = (deadline: string | null) => {
    if (!deadline) return false
    return new Date(deadline) < new Date()
  }

  const formatDate = (d: string | null) => {
    if (!d) return ""
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="skeleton-title" />
        <div className="skeleton-row" />
        <div className="skeleton-row" />
      </div>
    )
  }

  if (!client) return null

  const allTasks = client.projects.flatMap((p) => p.tasks)
  const overdueTasks = allTasks.filter((t) => t.status !== "done" && isOverdue(t.deadline))
  const doneTasks = allTasks.filter((t) => t.status === "done")

  return (
    <div className="page-container">
      <button className="btn btn-ghost btn-back" onClick={() => router.push("/clients")}>
        ← Back to Pipeline
      </button>

      <div className="client-header">
        <div className="client-header-info">
          <h1>{client.companyName}</h1>
          <p className="text-secondary">{client.contactName}{client.contactEmail ? ` · ${client.contactEmail}` : ""}</p>
        </div>
        <div className="client-header-actions">
          <select
            className="stage-select"
            value={client.pipelineStage}
            onChange={(e) => updatePipeline(e.target.value)}
          >
            {PIPELINE_STAGES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {client.contractContent && (
            <button className="btn btn-primary" onClick={() => setShowContract(true)}>
              View Contract
            </button>
          )}
        </div>
      </div>

      <div className="client-meta-row">
        <div className="meta-card">
          <div className="meta-label">Retainer</div>
          <div className="meta-value">{client.monthlyRetainer ? `£${client.monthlyRetainer.toLocaleString()}/mo` : "—"}</div>
        </div>
        <div className="meta-card">
          <div className="meta-label">Setup Fee</div>
          <div className="meta-value">{client.setupFee ? `£${client.setupFee.toLocaleString()}` : "—"}</div>
        </div>
        <div className="meta-card">
          <div className="meta-label">Contract Duration</div>
          <div className="meta-value">{client.contractDuration ? `${client.contractDuration} months` : "—"}</div>
        </div>
        <div className="meta-card">
          <div className="meta-label">Payment Terms</div>
          <div className="meta-value">{client.paymentTerms || "—"}</div>
        </div>
        <div className="meta-card">
          <div className="meta-label">Services</div>
          <div className="meta-value meta-services">{client.services.length ? client.services.join(", ") : "—"}</div>
        </div>
        <div className="meta-card">
          <div className="meta-label">Status</div>
          <div className="meta-value">{client.onboardingStatus.replace(/_/g, " ")}</div>
        </div>
      </div>

      {client.goals && (
        <div className="section-card">
          <h3>Goals</h3>
          <p>{client.goals}</p>
        </div>
      )}

      <div className="section-card">
        <h3>Notes</h3>
        <div className="notes-area">
          <textarea
            value={clientNotes}
            onChange={(e) => setClientNotes(e.target.value)}
            placeholder="Add notes about this client..."
            rows={3}
          />
          <button className="btn btn-primary btn-sm" onClick={saveNotes} disabled={savingNotes}>
            {savingNotes ? "Saving..." : "Save Notes"}
          </button>
        </div>
      </div>

      <div className="tasks-overview">
        <div className="overview-stat">
          <span className="overview-number">{allTasks.length}</span>
          <span className="overview-label">Total Tasks</span>
        </div>
        <div className="overview-stat">
          <span className="overview-number">{doneTasks.length}</span>
          <span className="overview-label">Completed</span>
        </div>
        <div className="overview-stat accent-warning">
          <span className="overview-number">{allTasks.length - doneTasks.length}</span>
          <span className="overview-label">Open</span>
        </div>
        <div className="overview-stat accent-danger">
          <span className="overview-number">{overdueTasks.length}</span>
          <span className="overview-label">Overdue</span>
        </div>
      </div>

      <div className="section-header">
        <h2>Projects & Tasks</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddProject(true)}>
          + Add Project
        </button>
      </div>

      {client.projects.length === 0 ? (
        <div className="empty-projects">
          <p className="text-secondary">No projects yet. Add your first project to get started.</p>
        </div>
      ) : (
        <div className="projects-list">
          {client.projects.map((project) => (
            <div key={project.id} className="project-card">
              <div className="project-header">
                <div className="project-header-left">
                  <h3 className="project-name">{project.name}</h3>
                  {project.description && <p className="project-desc">{project.description}</p>}
                </div>
                <div className="project-header-right">
                  <select
                    className="status-select"
                    value={project.status}
                    onChange={(e) => updateProjectStatus(project.id, e.target.value)}
                  >
                    {PROJECT_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <span className="project-deadline">
                    {project.deadline ? (
                      <span className={isOverdue(project.deadline) && project.status !== "completed" ? "overdue" : ""}>
                        Due {formatDate(project.deadline)}
                      </span>
                    ) : ""}
                  </span>
                </div>
              </div>

              <div className="tasks-section">
                <div className="tasks-header">
                  <span className="tasks-count">{project.tasks.length} task{project.tasks.length !== 1 ? "s" : ""}</span>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setTaskForm({ title: "", description: "", priority: "medium", deadline: "", assignee: "" })
                      setShowAddTask(project.id)
                    }}
                  >
                    + Add Task
                  </button>
                </div>

                {showAddTask === project.id && (
                  <div className="task-form">
                    <input
                      type="text"
                      placeholder="Task title"
                      value={taskForm.title}
                      onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="Description (optional)"
                      value={taskForm.description}
                      onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    />
                    <div className="task-form-row">
                      <select
                        value={taskForm.priority}
                        onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                      >
                        {PRIORITIES.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                      <input
                        type="date"
                        value={taskForm.deadline}
                        onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                      />
                      <input
                        type="text"
                        placeholder="Assignee"
                        value={taskForm.assignee}
                        onChange={(e) => setTaskForm({ ...taskForm, assignee: e.target.value })}
                      />
                    </div>
                    <div className="task-form-actions">
                      <button className="btn btn-primary btn-sm" onClick={() => addTask(project.id)} disabled={saving || !taskForm.title}>
                        {saving ? "Adding..." : "Add Task"}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setShowAddTask(null)}>Cancel</button>
                    </div>
                  </div>
                )}

                <div className="task-list">
                  {project.tasks.map((task) => (
                    <div key={task.id} className={`task-item priority-${task.priority} ${task.status === "done" ? "task-done" : ""} ${isOverdue(task.deadline) && task.status !== "done" ? "task-overdue" : ""}`}>
                      <div className="task-check">
                        <input
                          type="checkbox"
                          checked={task.status === "done"}
                          onChange={() => updateTaskStatus(task.id, task.status === "done" ? "todo" : "done")}
                        />
                      </div>
                      <div className="task-content">
                        <span className="task-title">{task.title}</span>
                        {task.description && <span className="task-desc">{task.description}</span>}
                        <div className="task-meta">
                          <select
                            value={task.priority}
                            onChange={(e) => updateTaskPriority(task.id, e.target.value)}
                            className="priority-select"
                          >
                            {PRIORITIES.map((p) => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                          {task.deadline && (
                            <span className={`task-deadline ${isOverdue(task.deadline) && task.status !== "done" ? "overdue" : ""}`}>
                              {formatDate(task.deadline)}
                            </span>
                          )}
                          {task.assignee && <span className="task-assignee">{task.assignee}</span>}
                          {task.completedAt && <span className="task-completed">Done {formatDate(task.completedAt)}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                  {project.tasks.length === 0 && (
                    <p className="text-secondary tasks-empty">No tasks yet</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddProject && (
        <div className="modal-overlay" onClick={() => setShowAddProject(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>New Project</h2>
            <div className="modal-form">
              <input
                type="text"
                placeholder="Project name *"
                value={projectForm.name}
                onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                autoFocus
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={projectForm.description}
                onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
              />
              <label>Deadline</label>
              <input
                type="date"
                value={projectForm.deadline}
                onChange={(e) => setProjectForm({ ...projectForm, deadline: e.target.value })}
              />
              <div className="modal-actions">
                <button className="btn btn-primary" onClick={addProject} disabled={saving || !projectForm.name}>
                  {saving ? "Creating..." : "Create Project"}
                </button>
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
                <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
                  Download PDF
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowContract(false)}>Close</button>
              </div>
            </div>
            <div className="contract-preview" dangerouslySetInnerHTML={{ __html: client.contractContent }} />
          </div>
        </div>
      )}

      <style>{`
        .page-container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 24px;
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
        .btn:hover { opacity: 0.85; }
        .btn-sm { padding: 4px 12px; font-size: 13px; }
        .btn-primary { background: var(--accent); color: #fff; border-color: var(--accent); }
        .btn-ghost { background: transparent; border-color: var(--border); }
        .btn-back { margin-bottom: 16px; }
        .text-secondary { color: var(--text-secondary); font-size: 14px; }
        .client-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .client-header h1 {
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 4px;
        }
        .client-header-actions {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }
        .stage-select {
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--card);
          color: var(--text);
          font-size: 14px;
          cursor: pointer;
        }
        .client-meta-row {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }
        .meta-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 16px;
        }
        .meta-label {
          font-size: 12px;
          color: var(--text-secondary);
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .meta-value {
          font-size: 14px;
          font-weight: 600;
        }
        .meta-services {
          font-size: 12px;
          font-weight: 400;
          color: var(--text-secondary);
        }
        .section-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 24px;
        }
        .section-card h3 {
          margin: 0 0 12px;
          font-size: 16px;
          font-weight: 600;
        }
        .notes-area textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--bg);
          color: var(--text);
          font-size: 14px;
          resize: vertical;
          margin-bottom: 8px;
          box-sizing: border-box;
        }
        .tasks-overview {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }
        .overview-stat {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 16px;
          text-align: center;
        }
        .overview-stat.accent-warning { border-left: 3px solid #f59e0b; }
        .overview-stat.accent-danger { border-left: 3px solid #ef4444; }
        .overview-number {
          font-size: 24px;
          font-weight: 700;
          display: block;
        }
        .overview-label {
          font-size: 12px;
          color: var(--text-secondary);
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .section-header h2 {
          font-size: 20px;
          font-weight: 600;
          margin: 0;
        }
        .empty-projects {
          text-align: center;
          padding: 40px;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 10px;
        }
        .projects-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
        }
        .project-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 20px;
        }
        .project-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .project-header-left {
          flex: 1;
        }
        .project-name {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 4px;
        }
        .project-desc {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
        }
        .project-header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .status-select {
          padding: 4px 8px;
          border-radius: 6px;
          border: 1px solid var(--border);
          background: var(--bg);
          color: var(--text);
          font-size: 12px;
          cursor: pointer;
        }
        .project-deadline {
          font-size: 12px;
          color: var(--text-secondary);
        }
        .tasks-section {
          border-top: 1px solid var(--border);
          padding-top: 12px;
        }
        .tasks-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .tasks-count {
          font-size: 13px;
          color: var(--text-secondary);
        }
        .task-form {
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 12px;
        }
        .task-form input,
        .task-form select {
          width: 100%;
          padding: 8px;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: var(--card);
          color: var(--text);
          font-size: 13px;
          margin-bottom: 8px;
          box-sizing: border-box;
        }
        .task-form-row {
          display: flex;
          gap: 8px;
        }
        .task-form-row select,
        .task-form-row input {
          flex: 1;
        }
        .task-form-actions {
          display: flex;
          gap: 8px;
        }
        .task-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .task-item {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          padding: 10px;
          border-radius: 8px;
          background: var(--bg);
          border: 1px solid var(--border);
          transition: all 0.2s;
        }
        .task-item.priority-high {
          border-left: 3px solid #ef4444;
        }
        .task-item.priority-medium {
          border-left: 3px solid #f59e0b;
        }
        .task-item.priority-low {
          border-left: 3px solid #22c55e;
        }
        .task-item.task-done {
          opacity: 0.6;
        }
        .task-item.task-done .task-title {
          text-decoration: line-through;
        }
        .task-item.task-overdue {
          background: rgba(239, 68, 68, 0.05);
        }
        .task-check input {
          width: 16px;
          height: 16px;
          cursor: pointer;
          margin-top: 3px;
        }
        .task-content {
          flex: 1;
          min-width: 0;
        }
        .task-title {
          display: block;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 2px;
        }
        .task-desc {
          display: block;
          font-size: 12px;
          color: var(--text-secondary);
          margin-bottom: 4px;
        }
        .task-meta {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }
        .priority-select {
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text);
          font-size: 11px;
          cursor: pointer;
        }
        .task-deadline {
          font-size: 11px;
          color: var(--text-secondary);
        }
        .task-deadline.overdue,
        .project-deadline .overdue {
          color: #ef4444;
          font-weight: 600;
        }
        .task-assignee {
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 4px;
          background: var(--card);
          color: var(--text-secondary);
        }
        .task-completed {
          font-size: 11px;
          color: #22c55e;
        }
        .tasks-empty {
          padding: 20px;
          text-align: center;
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
        }
        .modal {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 24px;
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
        }
        .modal-wide {
          max-width: 800px;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .modal-header h2 {
          margin: 0;
          font-size: 18px;
        }
        .modal-header-actions {
          display: flex;
          gap: 8px;
        }
        .modal-form input,
        .modal-form select,
        .modal-form label {
          width: 100%;
          display: block;
          margin-bottom: 12px;
        }
        .modal-form input,
        .modal-form select {
          padding: 10px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--bg);
          color: var(--text);
          font-size: 14px;
          box-sizing: border-box;
        }
        .modal-form label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          margin-bottom: 4px;
        }
        .modal-actions {
          display: flex;
          gap: 8px;
          margin-top: 16px;
        }
        .contract-preview {
          padding: 20px;
          background: #fff;
          color: #000;
          border-radius: 8px;
          font-size: 14px;
          line-height: 1.6;
        }
        .skeleton-title {
          height: 36px;
          width: 300px;
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
