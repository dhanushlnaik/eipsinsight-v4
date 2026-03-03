"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, Loader2, Trash2, Send, User, RefreshCw, ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "sonner";
import { client } from "@/lib/orpc";
import { useSession } from "@/hooks/useSession";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const MAX_NESTING_DEPTH = 3;

type CommentThread = {
  id: string;
  content: string;
  is_anonymous: boolean;
  user_name: string | null;
  user_image?: string | null;
  created_at: string | Date;
  replies?: CommentThread[];
  user_id?: string;
  upvotes?: number;
  downvotes?: number;
  userVote?: "upvote" | "downvote" | null;
};

type ReplyState = {
  commentId: string | null;
  content: string;
  isSubmitting: boolean;
};

function CommentItem({
  comment,
  depth = 0,
  currentUserId,
  isAdmin,
  onReplyClick,
  onDeleteClick,
  deletingId,
  replyingTo,
  onReplySubmit,
  onVote,
}: {
  comment: CommentThread;
  depth?: number;
  currentUserId?: string;
  isAdmin?: boolean;
  onReplyClick: (commentId: string | null) => void;
  onDeleteClick: (commentId: string) => void;
  deletingId: string | null;
  replyingTo: string | null;
  onReplySubmit: (parentId: string, content: string) => Promise<void>;
  onVote?: (commentId: string, voteType: "upvote" | "downvote") => Promise<void>;
}) {
  const [replyContent, setReplyContent] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [votingId, setVotingId] = useState<string | null>(null);

  const canDelete =
    isAdmin || (currentUserId && comment.user_id === currentUserId);

  const replyCount = comment.replies?.length || 0;
  const showReplyCount = depth < MAX_NESTING_DEPTH && replyCount > 0;

  const handleReplySubmit = async () => {
    if (!replyContent.trim()) return;
    setIsSubmittingReply(true);
    try {
      await onReplySubmit(comment.id, replyContent);
      setReplyContent("");
      onReplyClick(null);
      setShowReplies(true); // Auto-show replies after posting
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleVote = async (voteType: "upvote" | "downvote") => {
    if (!onVote) return;
    setVotingId(voteType);
    try {
      await onVote(comment.id, voteType);
    } finally {
      setVotingId(null);
    }
  };

  const shouldRenderReplies =
    depth < MAX_NESTING_DEPTH && comment.replies && comment.replies.length > 0;

  return (
    <div className="space-y-3">
      <div className={cn("rounded-lg border p-4", depth === 0 ? "border-slate-200 dark:border-slate-700" : "border-slate-200/50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20")}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-start gap-2.5 min-w-0">
            <Avatar className="h-8 w-8 shrink-0">
              {comment.is_anonymous ? (
                <AvatarFallback className="bg-slate-200 dark:bg-slate-700">
                  <User className="h-4 w-4 text-slate-500" />
                </AvatarFallback>
              ) : (
                <>
                  <AvatarImage src={comment.user_image || undefined} alt={comment.user_name || "User"} />
                  <AvatarFallback className="bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 text-xs font-medium">
                    {(comment.user_name || "A").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </>
              )}
            </Avatar>
            <div className="flex flex-col gap-0.5 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {comment.is_anonymous ? "Anonymous" : comment.user_name || "Anonymous"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {new Date(comment.created_at).toLocaleString()}
              </p>
            </div>
          </div>
          {canDelete && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onDeleteClick(comment.id)}
              disabled={deletingId === comment.id}
              title="Delete comment"
            >
              {deletingId === comment.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
        </div>

        {/* Content */}
        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap wrap-break-word">
          {comment.content}
        </p>

        {/* Actions */}
        <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-700/50 space-y-3">
          {/* Vote and Reply buttons */}
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "text-xs gap-1",
                comment.userVote === "upvote" && "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300"
              )}
              onClick={() => handleVote("upvote")}
              disabled={votingId !== null}
            >
              {votingId === "upvote" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <ThumbsUp className="h-3 w-3" />
              )}
              {comment.upvotes || 0}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "text-xs gap-1",
                comment.userVote === "downvote" && "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
              )}
              onClick={() => handleVote("downvote")}
              disabled={votingId !== null}
            >
              {votingId === "downvote" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <ThumbsDown className="h-3 w-3" />
              )}
              {comment.downvotes || 0}
            </Button>

            {depth < MAX_NESTING_DEPTH && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => {
                  if (replyingTo === comment.id) {
                    onReplyClick(null);
                  } else {
                    onReplyClick(comment.id);
                  }
                }}
              >
                <MessageCircle className="mr-1 h-3 w-3" />
                Reply
              </Button>
            )}
          </div>

          {/* Show replies button */}
          {showReplyCount && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-slate-600 dark:text-slate-400 hover:text-cyan-700 dark:hover:text-cyan-300"
              onClick={() => setShowReplies(!showReplies)}
            >
              {showReplies ? "Hide" : "Show"} {replyCount} {replyCount === 1 ? "reply" : "replies"}
            </Button>
          )}
        </div>
      </div>

      {/* Reply form */}
      {replyingTo === comment.id && (
        <div className="pl-4 space-y-2">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write a reply..."
            maxLength={3000}
            rows={2}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm resize-none placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onReplyClick(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleReplySubmit}
              disabled={!replyContent.trim() || isSubmittingReply}
            >
              {isSubmittingReply ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Reply
            </Button>
          </div>
        </div>
      )}

      {/* Nested replies */}
      {showReplies && showReplyCount && (
        <div className="pl-4 space-y-3 border-l-2 border-slate-200 dark:border-slate-700">
          {comment.replies!.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onReplyClick={onReplyClick}
              onDeleteClick={onDeleteClick}
              deletingId={deletingId}
              replyingTo={replyingTo}
              onReplySubmit={onReplySubmit}
              onVote={onVote}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function PageComments() {
  const pathname = usePathname();
  const { data: session, loading: sessionLoading } = useSession();

  const [comments, setComments] = useState<CommentThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [votes, setVotes] = useState<Record<string, { upvotes: number; downvotes: number; userVote: "upvote" | "downvote" | null }>>({});

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await client.pageComment.listCommentsByPage({
        page_path: pathname,
        limit: 100,
        offset: 0,
      });
      const commentList = response.comments as CommentThread[];
      setComments(commentList);
      
      // Fetch votes for all comments
      const allCommentIds = getAllCommentIds(commentList);
      await fetchVotesForComments(allCommentIds);
    } catch {
      setComments([]);
      toast.error("Failed to load comments");
    } finally {
      setLoading(false);
    }
  }, [pathname]);

  const getAllCommentIds = (comments: CommentThread[]): string[] => {
    let ids: string[] = [];
    for (const comment of comments) {
      ids.push(comment.id);
      if (comment.replies) {
        ids.push(...getAllCommentIds(comment.replies));
      }
    }
    return ids;
  };

  const fetchVotesForComments = async (commentIds: string[]) => {
    try {
      const votesData: typeof votes = {};
      for (const commentId of commentIds) {
        const [votesRes, userVoteRes] = await Promise.all([
          client.commentVote.getVotes({ comment_id: commentId }),
          client.commentVote.getUserVote({ comment_id: commentId }),
        ]);
        votesData[commentId] = {
          upvotes: votesRes.upvotes,
          downvotes: votesRes.downvotes,
          userVote: (userVoteRes.vote_type as "upvote" | "downvote" | null) || null,
        };
      }
      setVotes(votesData);
    } catch (e) {
      console.error("Failed to fetch votes:", e);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Auto-refresh when tab becomes visible (catches profile updates in other tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchComments();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchComments]);

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) {
      setIsAdmin(false);
      return;
    }
    const role = (session as { user?: { role?: string }; role?: string })?.user?.role
      ?? (session as { user?: { role?: string }; role?: string })?.role;
    setIsAdmin(role === "admin");
  }, [session, sessionLoading]);

  const handleSubmitComment = async () => {
    if (!commentContent.trim()) return;

    setIsSubmitting(true);
    try {
      await client.pageComment.createComment({
        page_path: pathname,
        content: commentContent.trim(),
        is_anonymous: isAnonymous,
        parent_id: null,
      });
      setCommentContent("");
      await fetchComments();
      toast.success("Comment posted");
    } catch (error) {
      toast.error("Failed to post comment");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string, content: string) => {
    try {
      await client.pageComment.createComment({
        page_path: pathname,
        content: content.trim(),
        is_anonymous: isAnonymous,
        parent_id: parentId,
      });
      await fetchComments();
      toast.success("Reply posted");
    } catch (error) {
      toast.error("Failed to post reply");
      console.error(error);
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (!window.confirm("Delete this comment?")) return;

    setDeletingId(id);
    try {
      await client.pageComment.deleteComment({ id });
      await fetchComments();
      toast.success("Comment deleted");
    } catch (error) {
      toast.error("Failed to delete comment");
      console.error(error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleVote = async (commentId: string, voteType: "upvote" | "downvote") => {
    try {
      await client.commentVote.vote({ comment_id: commentId, vote_type: voteType });
      // Refresh vote counts after voting
      const votesRes = await client.commentVote.getVotes({ comment_id: commentId });
      const userVoteRes = await client.commentVote.getUserVote({ comment_id: commentId });
      setVotes((prev) => ({
        ...prev,
        [commentId]: {
          upvotes: votesRes.upvotes,
          downvotes: votesRes.downvotes,
          userVote: (userVoteRes.vote_type as "upvote" | "downvote" | null) || null,
        },
      }));
    } catch (error) {
      toast.error("Failed to vote");
      console.error(error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Comments
            </CardTitle>
            <CardDescription>Share your thoughts about this page</CardDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => fetchComments()}
            disabled={loading}
            title="Refresh comments"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comment form */}
        <div className="space-y-3 border-b border-slate-200 dark:border-slate-700 pb-6">
          <div className="space-y-2">
            <label htmlFor="comment" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Your comment
            </label>
            <textarea
              id="comment"
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder={
                sessionLoading
                  ? "Loading..."
                  : "Share your thoughts..."
              }
              disabled={sessionLoading}
              maxLength={3000}
              rows={3}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm resize-none placeholder:text-slate-500 dark:placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
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
                {session ? "Post as anonymous" : "Post anonymously (no account needed)"}
              </span>
            </label>
            <Button
              type="button"
              onClick={handleSubmitComment}
              disabled={
                !commentContent.trim() ||
                isSubmitting ||
                sessionLoading
              }
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Post Comment
            </Button>
          </div>
        </div>

        {/* Comments list */}
        {sessionLoading || loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-600 dark:text-cyan-400" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-10 text-slate-500 dark:text-slate-400">
            <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => {
              const enrichedComment = {
                ...comment,
                upvotes: votes[comment.id]?.upvotes || 0,
                downvotes: votes[comment.id]?.downvotes || 0,
                userVote: votes[comment.id]?.userVote || null,
                replies: comment.replies?.map((reply) => ({
                  ...reply,
                  upvotes: votes[reply.id]?.upvotes || 0,
                  downvotes: votes[reply.id]?.downvotes || 0,
                  userVote: votes[reply.id]?.userVote || null,
                })) || [],
              };
              return (
                <CommentItem
                  key={comment.id}
                  comment={enrichedComment}
                  currentUserId={session?.user?.id}
                  isAdmin={isAdmin}
                  onReplyClick={setReplyingTo}
                  onDeleteClick={handleDeleteComment}
                  deletingId={deletingId}
                  replyingTo={replyingTo}
                  onReplySubmit={handleSubmitReply}
                  onVote={handleVote}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
