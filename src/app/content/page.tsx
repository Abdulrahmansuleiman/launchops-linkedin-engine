"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/input";
import { Sparkles, Check, RefreshCw, Loader2, Star, TrendingUp, Target, MessageCircle, Trash2, BarChart3, X } from "lucide-react";
import { getPosts, generateDrafts, publishPost, submitPostFeedback, polishPost, deletePost, updatePostMetrics } from "@/lib/api";

const CONTENT_TOPICS = [
  "Lead response speed and the cost of slow follow-up",
  "Pipeline automation vs. chatbots for business owners",
  "How to reactivate cold leads already in your CRM",
  "The founder time problem and automated follow-up systems",
  "Why most AI hype misses what actually works in business",
  "Real client results from automated pipeline systems",
  "How business owners can implement AI systems without hiring a team",
  "The 5 minute lead response window and why most businesses fail it",
  "What top performing sales people do differently at follow-up",
  "Why slow follow-up destroys more deals than bad pricing",
];

const dayThemes: Record<string, string> = {
  Monday: "Strategy & Vision",
  Tuesday: "Education & How-To",
  Wednesday: "Storytelling & Results",
  Thursday: "Hard Truth & Opinion",
  Friday: "Social Proof & Case Studies",
  Saturday: "Behind the Build",
  Sunday: "Reflection & Mindset",
};

const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

function getWeekLabel(day: string) {
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `W${weekNum}-${day}`;
}

export default function ContentStudio() {
  const [selectedDay, setSelectedDay] = useState(days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1] || "Monday");
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<"great" | "average" | "flopped" | null>(null);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [polishing, setPolishing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [metricsModal, setMetricsModal] = useState<{ id: string; impressions: string; likes: string; comments: string } | null>(null);
  const [savingMetrics, setSavingMetrics] = useState(false);
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["content-posts"],
    queryFn: () => getPosts(),
  });

  const dayPosts = posts.filter((p) => p.weekLabel === getWeekLabel(selectedDay)).slice(0, 3);
  const draftCounts = days.reduce((acc, day) => {
    acc[day] = posts.filter((p) => p.weekLabel === getWeekLabel(day) && p.status === "DRAFT").length;
    return acc;
  }, {} as Record<string, number>);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const chosenTopic = topic || CONTENT_TOPICS[Math.floor(Math.random() * CONTENT_TOPICS.length)];
      await generateDrafts(chosenTopic, getWeekLabel(selectedDay), selectedDay);
      queryClient.invalidateQueries({ queryKey: ["content-posts"] });
      setTopic("");
    } catch (e: any) {
      const msg = e.message || "Unknown error";
      setError(msg);
      console.error("Generate failed:", e);
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async (postId: string) => {
    setPublishing(postId);
    try {
      await publishPost(postId);
      queryClient.invalidateQueries({ queryKey: ["content-posts"] });
    } catch (e: any) {
      console.error("Publish failed:", e);
    } finally {
      setPublishing(null);
    }
  };

  const handlePolish = async (postId: string) => {
    setPolishing(postId);
    try {
      const post = posts.find((p) => p.id === postId);
      if (post) {
        const result = await polishPost(post.content);
        const improved = result.improvedContent || result.content || post.content;
        const patchRes = await fetch("/api/content", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: postId, content: improved, score: result.score || post.score }),
        });
        if (patchRes.ok) {
          queryClient.invalidateQueries({ queryKey: ["content-posts"] });
        }
      }
    } catch (e: any) {
      console.error("Polish failed:", e);
    } finally {
      setPolishing(null);
    }
  };

  const handleDelete = async (postId: string) => {
    setDeleting(postId);
    try {
      await deletePost(postId);
      queryClient.invalidateQueries({ queryKey: ["content-posts"] });
    } catch (e: any) {
      console.error("Delete failed:", e);
    } finally {
      setDeleting(null);
    }
  };

  const handleClearDay = async () => {
    const toDelete = dayPosts;
    for (const post of toDelete) {
      try {
        await deletePost(post.id);
      } catch {}
    }
    queryClient.invalidateQueries({ queryKey: ["content-posts"] });
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackText.trim() || !feedbackRating) return;
    setFeedbackSent(true);
    setFeedbackMsg(null);
    try {
      const latestPost = dayPosts[0];
      if (latestPost) {
        await submitPostFeedback(latestPost.id, feedbackRating, feedbackText);
        queryClient.invalidateQueries({ queryKey: ["content-posts"] });
        setFeedbackMsg("Feedback saved — AI will use this to improve next week's posts");
      } else {
        setFeedbackMsg("No post to attach feedback to");
      }
    } catch (e: any) {
      setFeedbackMsg("Feedback failed: " + (e.message || "Error"));
    }
  };

  const handleRating = (rating: "great" | "average" | "flopped") => {
    setFeedbackRating(rating);
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return "var(--muted)";
    if (score >= 80) return "#4ade80";
    if (score >= 60) return "#fbbf24";
    return "#f87171";
  };

  const getScoreLabel = (score: number | null) => {
    if (!score) return "Not scored";
    if (score >= 85) return "Viral potential";
    if (score >= 70) return "Strong";
    if (score >= 50) return "Good";
    return "Needs work";
  };

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            Content Studio
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Generate 5K-10K impression posts for each day. Every post AI-scored, intentionally written.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <input
            type="text"
            placeholder="Topic or random..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="h-9 px-3 rounded-lg text-sm w-full sm:w-48"
            style={{ background: "var(--input-bg)", color: "var(--foreground)", border: "1px solid var(--input-border)" }}
          />
          <Button onClick={handleGenerate} disabled={generating} className="whitespace-nowrap !text-xs !px-3">
            {generating ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
            {generating ? "Generating..." : `Generate for ${selectedDay}`}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const count = draftCounts[day] || 0;
          return (
            <button
              key={day}
              onClick={() => { setSelectedDay(day); setSelectedPost(null); }}
              className="p-1.5 md:p-2 rounded-lg text-[11px] md:text-xs font-medium transition-all cursor-pointer"
              style={{
                background: selectedDay === day ? "#2563eb" : "var(--badge-bg)",
                color: selectedDay === day ? "white" : "var(--muted)",
                border: selectedDay === day ? "none" : "1px solid var(--card-border)",
              }}
            >
              <span className="hidden md:inline">{day}</span>
              <span className="md:hidden">{day.slice(0,3)}</span>
              <div className="text-[10px] mt-0.5 opacity-70">{count} draft{count !== 1 ? "s" : ""}</div>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="p-3 rounded-lg text-sm" style={{ background: "#3b1212", color: "#fca5a5", border: "1px solid #7f1d1d" }}>
          {error}
        </div>
      )}

      {selectedDay && (
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
              {selectedDay} &mdash; {dayThemes[selectedDay]}
            </span>
            <Badge variant="info" className="text-[10px]">
              {getWeekLabel(selectedDay)}
            </Badge>
          </div>
          <div className="flex gap-2">
            {dayPosts.length > 0 && (
              <Button variant="ghost" size="sm" className="!text-xs !px-2" onClick={handleClearDay} title="Clear all drafts for this day">
                <Trash2 className="w-3.5 h-3.5 mr-1" style={{ color: "#f87171" }} />
                Clear day
              </Button>
            )}
            <Button onClick={handleGenerate} disabled={generating} size="sm" className="!text-xs !px-3">
              {generating ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
              {generating ? "Generating..." : dayPosts.length > 0 ? "Refresh" : "Generate"}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--muted)" }} />
            </CardContent>
          </Card>
        ) : dayPosts.length > 0 ? (
          <>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Target: 5,000 - 10,000 impressions &bull; 50 - 100+ likes per post
            </p>
            {dayPosts.map((post, index) => (
              <Card
                key={post.id}
                className={`cursor-pointer transition-all ${selectedPost === post.id ? "ring-2 ring-blue-500" : ""}`}
                style={{ border: selectedPost === post.id ? "2px solid #3b82f6" : "1px solid var(--card-border)" }}
                onClick={() => setSelectedPost(post.id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                        {index + 1}
                      </span>
                      <CardTitle className="text-sm">
                        {post.topic || "Untitled"}
                      </CardTitle>
                      <Badge className="text-[10px]" variant={post.topic ? "info" : "default"}>
                        {post.topic ? "Educational" : "Opinion"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {post.score && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5" style={{ color: getScoreColor(post.score) }} />
                          <span className="text-sm font-bold" style={{ color: getScoreColor(post.score) }}>
                            {post.score}/100
                          </span>
                          <Badge
                            variant={post.score >= 80 ? "success" : post.score >= 60 ? "warning" : "danger"}
                            className="text-[10px]"
                          >
                            {getScoreLabel(post.score)}
                          </Badge>
                        </div>
                      )}
                      <Badge variant={post.status === "PUBLISHED" ? "success" : "default"}>
                        {post.status === "PUBLISHED" ? "Published" : "Draft"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-line mb-3 leading-relaxed" style={{ color: "var(--foreground)" }}>
                    {post.content}
                  </p>

                  {post.impressionPrediction && (
                    <div
                      className="p-3 rounded-lg mb-3 flex items-center gap-2"
                      style={{ background: "var(--badge-bg)" }}
                    >
                      <TrendingUp className="w-4 h-4" style={{ color: "#60a5fa" }} />
                      <div>
                        <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>Predicted impressions: </span>
                        <span className="text-sm font-bold" style={{ color: "#60a5fa" }}>{post.impressionPrediction}</span>
                      </div>
                    </div>
                  )}

                  {post.scoreReason && (
                    <div
                      className="p-3 rounded-lg mb-3"
                      style={{ background: "var(--badge-bg)" }}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Target className="w-3.5 h-3.5" style={{ color: "#c084fc" }} />
                        <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>Score analysis</span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--foreground)" }}>
                        {post.scoreReason}
                      </p>
                    </div>
                  )}

                  {(post.impressions || post.likes || post.comments) && (
                    <div className="flex gap-3 mb-3 text-xs" style={{ color: "var(--muted)" }}>
                      {post.impressions != null && <span>👁 {post.impressions.toLocaleString()} impressions</span>}
                      {post.likes != null && <span>❤️ {post.likes} likes</span>}
                      {post.comments != null && <span>💬 {post.comments} comments</span>}
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handlePublish(post.id); }}
                      disabled={publishing === post.id || post.status === "PUBLISHED"}
                    >
                      {publishing === post.id ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-1" />}
                      {post.status === "PUBLISHED" ? "Published" : "Publish"}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handlePolish(post.id); }}
                      disabled={polishing === post.id}
                    >
                      {polishing === post.id ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
                      Polish
                    </Button>
                    {post.status === "PUBLISHED" && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMetricsModal({
                            id: post.id,
                            impressions: post.impressions?.toString() || "",
                            likes: post.likes?.toString() || "",
                            comments: post.comments?.toString() || "",
                          });
                        }}
                      >
                        <BarChart3 className="w-3.5 h-3.5 mr-1" />
                        Metrics
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="!p-1.5"
                      onClick={(e) => { e.stopPropagation(); handleDelete(post.id); }}
                      disabled={deleting === post.id}
                      title="Delete draft"
                    >
                      {deleting === post.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" style={{ color: "#f87171" }} />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <MessageCircle className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--muted)" }} />
              <p className="text-sm mb-1 font-medium" style={{ color: "var(--foreground)" }}>
                No drafts for {selectedDay}
              </p>
              <p className="text-xs mb-1" style={{ color: "var(--muted)" }}>
                Click Generate below to create 3 AI-scored posts targeting 5K-10K impressions
              </p>
              <p className="text-xs mb-4" style={{ color: dayThemes[selectedDay] ? "#93c5fd" : "var(--muted)" }}>
                {selectedDay}'s theme: {dayThemes[selectedDay]}
              </p>
              <Button
                size="sm"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
                Generate 3 Posts for {selectedDay}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Post Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>
            Rate how a published post performed. The AI adjusts next week's content based on feedback.
          </p>
          <div className="flex gap-2 mb-3 flex-wrap">
            {(["great", "average", "flopped"] as const).map((rating) => (
              <Button
                key={rating}
                variant={feedbackRating === rating ? "primary" : "secondary"}
                size="sm"
                onClick={() => handleRating(rating)}
              >
                {rating.charAt(0).toUpperCase() + rating.slice(1)}
              </Button>
            ))}
          </div>
          <Textarea
            placeholder="What worked or what didn't? The more detail you give, the better the AI will get."
            rows={2}
            value={feedbackText}
            onChange={(e) => {
              setFeedbackText(e.target.value);
              setFeedbackSent(false);
            }}
          />
          {feedbackMsg && (
            <p className="text-xs mt-2" style={{ color: feedbackMsg.includes("failed") ? "#f87171" : "#4ade80" }}>
              {feedbackMsg}
            </p>
          )}
          <Button
            className="mt-2"
            size="sm"
            onClick={handleFeedbackSubmit}
            disabled={!feedbackText.trim() || !feedbackRating || feedbackSent}
          >
            {feedbackSent ? "Submitted" : "Submit Feedback"}
          </Button>
        </CardContent>
      </Card>

      {metricsModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
        }} onClick={() => setMetricsModal(null)}>
          <div style={{
            width: "100%", maxWidth: "380px",
            background: "var(--card)", borderRadius: "12px",
            border: "1px solid var(--card-border)",
            padding: "24px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>Post Metrics</h2>
              <button onClick={() => setMetricsModal(null)} className="p-1 rounded hover:opacity-70">
                <X className="w-5 h-5" style={{ color: "var(--muted)" }} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted)" }}>Impressions</label>
                <input
                  type="number"
                  className="w-full h-9 px-3 rounded-lg text-sm"
                  style={{ background: "var(--input-bg)", color: "var(--foreground)", border: "1px solid var(--input-border)" }}
                  value={metricsModal.impressions}
                  onChange={(e) => setMetricsModal({ ...metricsModal, impressions: e.target.value })}
                  placeholder="e.g. 7500"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted)" }}>Likes</label>
                <input
                  type="number"
                  className="w-full h-9 px-3 rounded-lg text-sm"
                  style={{ background: "var(--input-bg)", color: "var(--foreground)", border: "1px solid var(--input-border)" }}
                  value={metricsModal.likes}
                  onChange={(e) => setMetricsModal({ ...metricsModal, likes: e.target.value })}
                  placeholder="e.g. 85"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted)" }}>Comments</label>
                <input
                  type="number"
                  className="w-full h-9 px-3 rounded-lg text-sm"
                  style={{ background: "var(--input-bg)", color: "var(--foreground)", border: "1px solid var(--input-border)" }}
                  value={metricsModal.comments}
                  onChange={(e) => setMetricsModal({ ...metricsModal, comments: e.target.value })}
                  placeholder="e.g. 12"
                />
              </div>
              <Button
                className="w-full mt-2"
                onClick={async () => {
                  setSavingMetrics(true);
                  try {
                    await updatePostMetrics(metricsModal.id, {
                      impressions: metricsModal.impressions ? parseInt(metricsModal.impressions) : undefined,
                      likes: metricsModal.likes ? parseInt(metricsModal.likes) : undefined,
                      comments: metricsModal.comments ? parseInt(metricsModal.comments) : undefined,
                    });
                    queryClient.invalidateQueries({ queryKey: ["content-posts"] });
                    setMetricsModal(null);
                  } catch (e: any) {
                    console.error("Save metrics failed:", e);
                  } finally {
                    setSavingMetrics(false);
                  }
                }}
                disabled={savingMetrics}
              >
                {savingMetrics ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <TrendingUp className="w-4 h-4 mr-1.5" />}
                Save Metrics
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
