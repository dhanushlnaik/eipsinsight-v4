"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageSquare, Loader2, Trash2, Send, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { client } from "@/lib/orpc";
import { useSession } from "@/hooks/useSession";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Feedback = {
  id: string;
  page_path: string;
  category: string;
  severity: string;
  content: string;
  status: string;
  is_anonymous: boolean;
  user_name?: string | null;
  created_at: string | Date;
};

type FeedbackSeverity = "low" | "medium" | "high" | "critical";

export function PageFeedback() {
  const pathname = usePathname();
  const { data: session, loading: sessionLoading } = useSession();

  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackContent, setFeedbackContent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("general");
  const [selectedSeverity, setSelectedSeverity] = useState<FeedbackSeverity>("medium");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchFeedbacks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await client.feedback.listFeedbackByPage({
        page_path: pathname,
        limit: 50,
        offset: 0,
      });
      setFeedbacks(response.feedbacks as Feedback[]);
    } catch {
      setFeedbacks([]);
      toast.error("Failed to load feedback");
    } finally {
      setLoading(false);
    }
  }, [pathname]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  useEffect(() => {
    if (!session) {
      setIsAdmin(false);
      return;
    }
    const role = (session as { user?: { role?: string }; role?: string })?.user?.role
      ?? (session as { user?: { role?: string }; role?: string })?.role;
    setIsAdmin(role === "admin");
  }, [session]);

  const handleSubmitFeedback = async () => {
    if (!feedbackContent.trim()) return;

    setIsSubmitting(true);
    try {
      await client.feedback.createFeedback({
        page_path: pathname,
        category: selectedCategory,
        severity: selectedSeverity,
        content: feedbackContent.trim(),
        is_anonymous: isAnonymous,
      });
      setFeedbackContent("");
      setSelectedCategory("general");
      setSelectedSeverity("medium");
      await fetchFeedbacks();
      toast.success("Thank you for your feedback!");
    } catch (error) {
      toast.error("Failed to submit feedback");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    if (!window.confirm("Delete this feedback?")) return;

    setDeletingId(id);
    try {
      await client.feedback.deleteFeedback({ id });
      await fetchFeedbacks();
      toast.success("Feedback deleted");
    } catch (error) {
      toast.error("Failed to delete feedback");
      console.error(error);
    } finally {
      setDeletingId(null);
    }
  };

  const severityColors = {
    low: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
    medium: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300",
    high: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
    critical: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Feedback
        </CardTitle>
        <CardDescription>Help us improve this page by sharing your feedback</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Feedback form */}
        <div className="space-y-3 border-b border-slate-200 dark:border-slate-700 pb-6">
          <div className="space-y-2">
            <label htmlFor="feedback" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Your feedback
            </label>
            <textarea
              id="feedback"
              value={feedbackContent}
              onChange={(e) => setFeedbackContent(e.target.value)}
              placeholder="Let us know what you think. What can we improve?"
              disabled={sessionLoading}
              maxLength={2000}
              rows={3}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm resize-none placeholder:text-slate-500 dark:placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="category" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Category
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                disabled={sessionLoading}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                <option value="general">General</option>
                <option value="bug">Bug Report</option>
                <option value="feature">Feature Request</option>
                <option value="content">Content Issue</option>
                <option value="ui">UI/UX</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="severity" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Severity (optional)
              </label>
              <select
                id="severity"
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value as FeedbackSeverity)}
                disabled={sessionLoading}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                disabled={sessionLoading}
                className="rounded"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Submit anonymously
              </span>
            </label>
            <Button
              type="button"
              onClick={handleSubmitFeedback}
              disabled={!feedbackContent.trim() || isSubmitting || sessionLoading}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Submit Feedback
            </Button>
          </div>
        </div>

        {/* Feedbacks list */}
        {sessionLoading || loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-600 dark:text-cyan-400" />
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="text-center py-10 text-slate-500 dark:text-slate-400">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No feedback yet on this page</p>
          </div>
        ) : (
          <div className="space-y-3">
            {feedbacks.map((feedback) => (
              <div
                key={feedback.id}
                className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 bg-slate-50/30 dark:bg-slate-900/20"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {feedback.is_anonymous ? "Anonymous" : feedback.user_name || "Anonymous"}
                      </span>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        severityColors[feedback.severity as keyof typeof severityColors]
                      )}>
                        {feedback.severity}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {feedback.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(feedback.created_at).toLocaleString()}
                    </p>
                  </div>
                  {isAdmin && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDeleteFeedback(feedback.id)}
                      disabled={deletingId === feedback.id}
                      title="Delete feedback"
                    >
                      {deletingId === feedback.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  )}
                </div>

                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap wrap-break-word">
                  {feedback.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
