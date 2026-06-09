"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/input";
import { Sparkles, Check, RefreshCw, Loader2, Star, TrendingUp, Target, MessageCircle } from "lucide-react";
import { getPosts, generateDrafts, publishPost, submitPostFeedback, polishPost } from "@/lib/api";

const CONTENT_TOPICS = [
  "Lead response speed and the cost of slow follow-up",
  "Pipeline automation vs. chatbots for business owners",
  "How to reactivate cold leads already in your CRM",
  "The founder time problem and automated follow-up systems",
  "Why most AI hype misses what actually works in business",
  "Real client results from automated pipeline systems",
  "How business owners can implement AI systems without hiring a team",
];

export default function ContentStudio() {
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState<"great" | "average" | "flopped" | null>(null);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [polishing, setPolishing] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["content-posts"],
    queryFn: () => getPosts(),
  });

  const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  const dayPosts = posts.filter((p) => {
    const d = new Date(p.createdAt);
    return d.toLocaleDateString("en", { weekday: "long" }) === selectedDay;
  }).slice(0, 3);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const chosenTopic = topic || CONTENT_TOPICS[Math.floor(Math.random() * CONTENT_TOPICS.length)];
      await generateDrafts(chosenTopic);
      queryClient.invalidateQueries({ queryKey: ["content-posts"] });
      setTopic("");
    } catch (e: any) {
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

  const handleFeedbackSubmit = async () => {
    if (!feedbackText.trim() || !feedbackRating) return;
    setFeedbackSent(true);
    try {
      const latestPost = dayPosts[0];
      if (latestPost) {
        await submitPostFeedback(latestPost.id, feedbackRating, feedbackText);
        queryClient.invalidateQueries({ queryKey: ["content-posts"] });
      }
    } catch (e: any) {
      console.error("Feedback submit failed:", e);
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
    if (score >= 80) return "Strong";
    if (score >= 60) return "Good";
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
            Pick the best draft and publish it
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Topic or leave blank..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="h-9 px-3 rounded-lg text-sm w-full sm:w-48"
            style={{ background: "var(--input-bg)", color: "var(--foreground)", border: "1px solid var(--input-border)" }}
          />
          <Button onClick={handleGenerate} disabled={generating} className="whitespace-nowrap !text-xs !px-3">
            {generating ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
            {generating ? "Generating..." : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => (
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
            <div className="text-[10px] mt-0.5 opacity-70">
              {posts.filter((p) => new Date(p.createdAt).toLocaleDateString("en", { weekday: "long" }) === day).length} drafts
            </div>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--muted)" }} />
            </CardContent>
          </Card>
        ) : dayPosts.length > 0 ? (
          <>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>3 drafts for {selectedDay}</p>
              <Badge variant="info">Pick the best one</Badge>
            </div>
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
                        <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>Score breakdown</span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--foreground)" }}>
                        {post.scoreReason}
                      </p>
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
                      Polish with AI
                    </Button>
                    {post.feedbackRating && (
                      <Badge variant="info" className="text-[10px]">
                        Feedback: {post.feedbackRating}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <MessageCircle className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--muted)" }} />
              <p className="text-sm mb-1 font-medium" style={{ color: "var(--foreground)" }}>No drafts for {selectedDay}</p>
              <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
                Click Refresh Drafts to generate 3 scored options
              </p>
              <Button
                size="sm"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
                Generate Drafts
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
            Rate how the published post performed and the AI will adjust next week
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
          <Button
            className="mt-2"
            size="sm"
            onClick={handleFeedbackSubmit}
            disabled={!feedbackText.trim() || !feedbackRating || feedbackSent}
          >
            {feedbackSent ? "Feedback saved" : "Submit Feedback"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
