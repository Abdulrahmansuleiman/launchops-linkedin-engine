"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus, FileText, Pencil, CheckCircle, Eye, ArrowRight,
  Loader2, GripVertical, Copy, Bot, Play, Square
} from "lucide-react";
import { getPosts, updatePost } from "@/lib/api";
import type { Post } from "@/lib/api";

const STAGES = [
  { key: "IDEAS", label: "Ideas", icon: FileText, color: "#8b5cf6" },
  { key: "SCRIPTING", label: "Scripting", icon: Pencil, color: "#3b82f6" },
  { key: "EDITING", label: "Editing", icon: Pencil, color: "#f59e0b" },
  { key: "QA", label: "Quality Assurance", icon: Eye, color: "#f97316" },
  { key: "POSTED", label: "Posted", icon: CheckCircle, color: "#22c55e" },
];

export default function ContentPipelinePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedPostId, setDraggedPostId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [editPost, setEditPost] = useState<Post | null>(null);
  const [editContent, setEditContent] = useState("");
  const [addIdeaOpen, setAddIdeaOpen] = useState(false);
  const [newIdeaTopic, setNewIdeaTopic] = useState("");
  const [newIdeaContent, setNewIdeaContent] = useState("");
  const [movingPostId, setMovingPostId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [botRunning, setBotRunning] = useState(false);
  const [botLoading, setBotLoading] = useState(false);

  const checkBotStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/telegram/status");
      const data = await res.json();
      setBotRunning(data.running);
    } catch {}
  }, []);

  useEffect(() => { checkBotStatus(); }, [checkBotStatus]);

  async function startBot() {
    setBotLoading(true);
    try {
      await fetch("/api/telegram/start", { method: "POST" });
      setBotRunning(true);
    } catch {}
    setBotLoading(false);
  }

  async function stopBot() {
    setBotLoading(true);
    try {
      await fetch("/api/telegram/stop", { method: "POST" });
      setBotRunning(false);
    } catch {}
    setBotLoading(false);
  }

  const loadPosts = useCallback(async () => {
    try {
      const all = await Promise.all(
        STAGES.map(s => getPosts({ stage: s.key }))
      );
      setPosts(all.flat());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const postsByStage = STAGES.map(s => ({
    ...s,
    posts: posts.filter(p => p.stage === s.key),
  }));

  async function movePost(postId: string, newStage: string) {
    setMovingPostId(postId);
    try {
      await updatePost(postId, { stage: newStage });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, stage: newStage } : p));
    } catch (e) {
      console.error(e);
    } finally {
      setMovingPostId(null);
    }
  }

  function handleDragStart(e: React.DragEvent, postId: string) {
    setDraggedPostId(postId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", postId);
  }

  function handleDragOver(e: React.DragEvent, stageKey: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(stageKey);
  }

  function handleDragLeave() {
    setDragOverCol(null);
  }

  async function handleDrop(e: React.DragEvent, stageKey: string) {
    e.preventDefault();
    setDragOverCol(null);
    if (draggedPostId) {
      const post = posts.find(p => p.id === draggedPostId);
      if (post && post.stage !== stageKey) {
        await movePost(draggedPostId, stageKey);
      }
    }
    setDraggedPostId(null);
  }

  async function addIdea() {
    if (!newIdeaContent.trim() && !newIdeaTopic.trim()) return;
    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newIdeaContent || newIdeaTopic,
          topic: newIdeaTopic || null,
          status: "DRAFT",
        }),
      });
      const post = await res.json();
      post.stage = "IDEAS";
      setPosts(prev => [post, ...prev]);
      setAddIdeaOpen(false);
      setNewIdeaTopic("");
      setNewIdeaContent("");
    } catch (e) {
      console.error(e);
    }
  }

  function openEdit(post: Post) {
    setEditPost(post);
    setEditContent(post.content);
  }

  async function saveEdit() {
    if (!editPost) return;
    try {
      await updatePost(editPost.id, { content: editContent });
      setPosts(prev => prev.map(p => p.id === editPost.id ? { ...p, content: editContent } : p));
      setEditPost(null);
    } catch (e) {
      console.error(e);
    }
  }

  function copyContent(content: string, postId: string) {
    navigator.clipboard.writeText(content);
    setCopiedId(postId);
    setTimeout(() => setCopiedId(null), 1500);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--text-secondary)" }} />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Content Pipeline</h1>
            <p style={{ color: "var(--text-secondary)", marginTop: 4 }}>Drag posts between stages or use the arrow buttons to advance</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Telegram Bot Control */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "var(--card)", border: "1px solid var(--card-border)",
              borderRadius: 8, padding: "6px 12px",
            }}>
              <Bot style={{ width: 16, height: 16, color: botRunning ? "#22c55e" : "var(--text-secondary)" }} />
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                {botRunning ? "Bot Online" : "Bot Offline"}
              </span>
              {botRunning ? (
                <button
                  onClick={stopBot}
                  disabled={botLoading}
                  style={{
                    display: "flex", alignItems: "center", gap: 4,
                    background: "transparent", border: "1px solid #ef4444",
                    color: "#ef4444", borderRadius: 6, padding: "4px 10px",
                    fontSize: 11, fontWeight: 500, cursor: "pointer",
                  }}
                >
                  <Square style={{ width: 10, height: 10 }} /> Stop
                </button>
              ) : (
                <button
                  onClick={startBot}
                  disabled={botLoading}
                  style={{
                    display: "flex", alignItems: "center", gap: 4,
                    background: "transparent", border: "1px solid #22c55e",
                    color: "#22c55e", borderRadius: 6, padding: "4px 10px",
                    fontSize: 11, fontWeight: 500, cursor: "pointer",
                  }}
                >
                  {botLoading ? <Loader2 style={{ width: 10, height: 10, animation: "spin 1s linear infinite" }} /> : <Play style={{ width: 10, height: 10 }} />} Start
                </button>
              )}
            </div>
            <button className="header-btn-primary" onClick={() => setAddIdeaOpen(true)}>
              <Plus className="h-4 w-4" /> New Idea
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, minHeight: "70vh" }}>
          {postsByStage.map((col) => {
            const Icon = col.icon;
            const isOver = dragOverCol === col.key;
            return (
              <div
                key={col.key}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: 12,
                  border: `1px solid ${isOver ? col.color : "var(--card-border)"}`,
                  background: isOver ? `${col.color}11` : "var(--card)",
                  padding: 12,
                  transition: "all 0.15s",
                }}
                onDragOver={(e) => handleDragOver(e, col.key)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.key)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, padding: "0 4px" }}>
                  <Icon style={{ width: 16, height: 16, color: col.color }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{col.label}</span>
                  <span style={{
                    marginLeft: "auto",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    background: "var(--input-bg)",
                    borderRadius: 999,
                    padding: "2px 8px",
                  }}>{col.posts.length}</span>
                </div>

                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                  {col.posts.map((post) => {
                    const stageIdx = STAGES.findIndex(s => s.key === post.stage);
                    const nextStage = STAGES[stageIdx + 1];
                    const isMoving = movingPostId === post.id;
                    return (
                      <div
                        key={post.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, post.id)}
                        style={{
                          background: "var(--input-bg)",
                          border: `1px solid var(--input-border)`,
                          borderRadius: 8,
                          padding: 12,
                          cursor: "grab",
                          transition: "border-color 0.15s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = col.color)}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--input-border)")}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                          <GripVertical style={{ width: 14, height: 14, color: "var(--text-secondary)", marginTop: 2, opacity: 0.4, flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {post.topic && (
                              <p style={{ fontSize: 11, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.topic}</p>
                            )}
                            <p style={{ fontSize: 13, color: "var(--foreground)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{post.content}</p>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                          {post.score != null && (
                            <span style={{ fontSize: 10, color: "var(--text-secondary)", background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: 4, padding: "2px 6px" }}>
                              {post.score}/100
                            </span>
                          )}
                          {post.impressionPrediction && (
                            <span style={{ fontSize: 10, color: "var(--text-secondary)", background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: 4, padding: "2px 6px" }}>
                              {post.impressionPrediction}
                            </span>
                          )}
                          <span style={{ fontSize: 10, color: col.color, background: `${col.color}22`, borderRadius: 4, padding: "2px 6px" }}>
                            {post.status}
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}>
                          <button
                            className="icon-btn"
                            title="Edit"
                            onClick={() => openEdit(post)}
                            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: "none", background: "transparent", color: "var(--text-secondary)", cursor: "pointer" }}
                          >
                            <Pencil style={{ width: 12, height: 12 }} />
                          </button>
                          <button
                            className="icon-btn"
                            title={copiedId === post.id ? "Copied!" : "Copy"}
                            onClick={() => copyContent(post.content, post.id)}
                            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: "none", background: "transparent", color: copiedId === post.id ? col.color : "var(--text-secondary)", cursor: "pointer" }}
                          >
                            <Copy style={{ width: 12, height: 12 }} />
                          </button>
                          {nextStage && (
                            <button
                              onClick={() => movePost(post.id, nextStage.key)}
                              disabled={isMoving}
                              style={{
                                marginLeft: "auto",
                                fontSize: 10,
                                fontWeight: 500,
                                color: col.color,
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                padding: "4px 8px",
                                borderRadius: 6,
                                opacity: isMoving ? 0.5 : 1,
                              }}
                            >
                              {isMoving ? (
                                <Loader2 style={{ width: 10, height: 10, animation: "spin 1s linear infinite" }} />
                              ) : (
                                <>
                                  <ArrowRight style={{ width: 10, height: 10 }} />
                                  {nextStage.label}
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {col.posts.length === 0 && (
                    <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-secondary)", fontSize: 12 }}>
                      {isOver ? "Drop here" : "No posts"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Idea Modal */}
      {addIdeaOpen && (
        <div className="modal-overlay" onClick={() => setAddIdeaOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-bar" style={{ background: "linear-gradient(90deg, #8b5cf6, #6366f1)" }} />
            <div className="modal-body">
              <h2 className="modal-title">New Idea</h2>
              <label className="modal-label">Topic (optional)</label>
              <input
                className="modal-input"
                placeholder="e.g. Client onboarding automation"
                value={newIdeaTopic}
                onChange={(e) => setNewIdeaTopic(e.target.value)}
              />
              <label className="modal-label">Content / Notes</label>
              <textarea
                placeholder="Write your idea or draft..."
                value={newIdeaContent}
                onChange={(e) => setNewIdeaContent(e.target.value)}
                rows={5}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--input-border)",
                  background: "var(--input-bg)",
                  color: "var(--foreground)",
                  fontSize: 14,
                  fontFamily: "inherit",
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
              <div className="modal-actions">
                <button className="btn btn-ghost" onClick={() => setAddIdeaOpen(false)}>Cancel</button>
                <button className="btn-primary" onClick={addIdea}>Add Idea</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editPost && (
        <div className="modal-overlay" onClick={() => setEditPost(null)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-bar" style={{ background: "linear-gradient(90deg, #3b82f6, #06b6d4)" }} />
            <div className="modal-body">
              <div className="modal-title-row">
                <h2 className="modal-title">Edit Post</h2>
                <button className="modal-close" onClick={() => setEditPost(null)}>&times;</button>
              </div>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={12}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 8,
                  border: "1px solid var(--input-border)",
                  background: "var(--input-bg)",
                  color: "var(--foreground)",
                  fontSize: 13,
                  fontFamily: "monospace",
                  resize: "vertical",
                  boxSizing: "border-box",
                  lineHeight: 1.6,
                }}
              />
              <div className="modal-actions">
                <button className="btn btn-ghost" onClick={() => setEditPost(null)}>Cancel</button>
                <button className="btn-primary" onClick={saveEdit}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
