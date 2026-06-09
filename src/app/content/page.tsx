"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/input";
import { Sparkles, Check, RefreshCw, Loader2 } from "lucide-react";
import { getPosts, generateDrafts, publishPost, submitPostFeedback, polishPost } from "@/lib/api";

export default function ContentStudio() {
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState<"great" | "average" | "flopped" | null>(null);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [polishing, setPolishing] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: posts = [] } = useQuery({
    queryKey: ["content-posts"],
    queryFn: () => getPosts(),
  });

  const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  const dayPosts = posts.filter((p) => {
    const d = new Date(p.createdAt);
    return d.toLocaleDateString("en", { weekday: "long" }) === selectedDay;
  });

  const handleGenerate = async (topic?: string) => {
    setGenerating(true);
    try {
      await generateDrafts(topic || "AI agents for business lead follow-up");
      queryClient.invalidateQueries({ queryKey: ["content-posts"] });
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
        await polishPost(post.content);
      }
      queryClient.invalidateQueries({ queryKey: ["content-posts"] });
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
      }
    } catch (e: any) {
      console.error("Feedback submit failed:", e);
    }
  };

  const handleRating = (rating: "great" | "average" | "flopped") => {
    setFeedbackRating(rating);
  };

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            Content Studio
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Pick the best draft, publish it, and get better every week
          </p>
        </div>
        <Button onClick={() => handleGenerate()} disabled={generating}>
          {generating ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
          {generating ? "Generating..." : "Refresh Drafts"}
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className="p-2 rounded-lg text-xs font-medium transition-all cursor-pointer"
            style={{
              background: selectedDay === day ? "#2563eb" : "var(--badge-bg)",
              color: selectedDay === day ? "white" : "var(--muted)",
              border: selectedDay === day ? "none" : "1px solid var(--card-border)",
            }}
          >
            <span className="hidden md:inline">{day}</span>
            <span className="md:hidden">{day.slice(0,3)}</span>
            <div className="text-[10px] mt-0.5 opacity-70">
              {posts.filter((p) => new Date(p.createdAt).toLocaleDateString("en", { weekday: "long" }) === day).length} posts
            </div>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {dayPosts.length > 0 ? dayPosts.map((post) => (
          <Card key={post.id}>
            <CardHeader>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle>
                  {post.topic || "Untitled"}
                </CardTitle>
                {post.score && <Badge variant="info">{post.score}/100</Badge>}
                <Badge variant={post.status === "PUBLISHED" ? "success" : "default"}>
                  {post.status === "PUBLISHED" ? "Published" : post.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-line mb-3" style={{ color: "var(--foreground)" }}>
                {post.content}
              </p>
              {post.impressions && (
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {[
                    { label: "Impressions", value: post.impressions },
                    { label: "Likes", value: post.likes || 0 },
                    { label: "Comments", value: post.comments || 0 },
                    { label: "Shares", value: post.shares || 0 },
                    { label: "Saves", value: post.saves || 0 },
                  ].map((m) => (
                    <div key={m.label} className="p-2 rounded-lg text-center" style={{ background: "var(--badge-bg)" }}>
                      <p className="text-[10px]" style={{ color: "var(--muted)" }}>{m.label}</p>
                      <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{m.value.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  onClick={() => handlePublish(post.id)}
                  disabled={publishing === post.id || post.status === "PUBLISHED"}
                >
                  {publishing === post.id ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-1" />}
                  {post.status === "PUBLISHED" ? "Published" : "Publish"}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handlePolish(post.id)}
                  disabled={polishing === post.id}
                >
                  {polishing === post.id ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
                  Polish with AI
                </Button>
              </div>
            </CardContent>
          </Card>
        )) : (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-sm" style={{ color: "var(--muted)" }}>No posts for {selectedDay}. Generate some drafts</p>
              <Button
                className="mt-3"
                size="sm"
                onClick={() => handleGenerate("AI agents for business lead follow-up")}
                disabled={generating}
              >
                {generating ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
                Generate Draft
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
            How did the post perform? Rate it and the AI will adjust next week
          </p>
          <div className="flex gap-2 mb-3 flex-wrap">
            <Button
              variant={feedbackRating === "great" ? "primary" : "secondary"}
              size="sm"
              onClick={() => handleRating("great")}
            >
              Great
            </Button>
            <Button
              variant={feedbackRating === "average" ? "primary" : "secondary"}
              size="sm"
              onClick={() => handleRating("average")}
            >
              Average
            </Button>
            <Button
              variant={feedbackRating === "flopped" ? "primary" : "secondary"}
              size="sm"
              onClick={() => handleRating("flopped")}
            >
              Flopped
            </Button>
          </div>
          <Textarea
            placeholder="What worked or what didn't? The more detail you give, the better the AI will get at writing posts that perform."
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
            {feedbackSent ? "Thanks for the feedback" : "Submit Feedback"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
