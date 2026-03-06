"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Download, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { client } from "@/lib/orpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type FeedbackStatus = "new" | "in-review" | "resolved";
type FeedbackSeverity = "low" | "medium" | "high";
type SortField = "severity" | "category" | "created_at";
type SortDirection = "asc" | "desc";

type FeedbackItem = {
  id: string;
  page_path: string;
  category: string;
  severity: string;
  content: string;
  status: string;
  is_anonymous: boolean;
  user_name: string | null;
  user_email: string | null;
  github_name: string | null;
  created_at: string | Date;
};

const SEVERITY_WEIGHT: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

const STATUS_OPTIONS: FeedbackStatus[] = ["new", "in-review", "resolved"];

function statusBadgeVariant(status: string): "default" | "secondary" | "outline" {
  if (status === "resolved") return "secondary";
  if (status === "in-review") return "outline";
  return "default";
}

function severityBadgeVariant(severity: string): "default" | "secondary" | "destructive" {
  if (severity === "high") return "destructive";
  if (severity === "medium") return "secondary";
  return "default";
}

export function FeedbackDashboard() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | "all">("all");
  const [pagePathFilter, setPagePathFilter] = useState("");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const response = await client.feedback.listFeedbackAdmin({
        limit: 100,
        offset: 0,
        page_path: pagePathFilter.trim() || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      setItems(response.items as FeedbackItem[]);
    } catch {
      setItems([]);
      toast.error("Failed to load feedback");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, pagePathFilter]);

  const sortedItems = useMemo(() => {
    const data = [...items];
    data.sort((a, b) => {
      let result = 0;
      if (sortField === "severity") {
        result = (SEVERITY_WEIGHT[a.severity] ?? 0) - (SEVERITY_WEIGHT[b.severity] ?? 0);
      } else if (sortField === "category") {
        result = a.category.localeCompare(b.category);
      } else {
        result = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return sortDirection === "asc" ? result : -result;
    });
    return data;
  }, [items, sortField, sortDirection]);

  const setSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortField(field);
    setSortDirection(field === "created_at" ? "desc" : "asc");
  };

  const handleUpdateStatus = async (id: string, status: FeedbackStatus) => {
    setUpdatingId(id);
    try {
      await client.feedback.updateFeedbackStatus({ id, status });
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, status } : item))
      );
      toast.success("Feedback status updated");
    } catch {
      toast.error("Failed to update feedback status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this feedback item?")) return;
    setDeletingId(id);
    try {
      await client.feedback.deleteFeedback({ id });
      setItems((current) => current.filter((item) => item.id !== id));
      toast.success("Feedback deleted");
    } catch {
      toast.error("Failed to delete feedback");
    } finally {
      setDeletingId(null);
    }
  };

  const exportCsv = () => {
    const header = ["page_path", "category", "severity", "status", "author", "github_name", "created_at"];
    const rows = sortedItems.map((item) => [
      item.page_path,
      item.category,
      item.severity,
      item.status,
      item.is_anonymous ? "Anonymous" : item.user_name || "Anonymous",
      item.github_name || "",
      new Date(item.created_at).toISOString(),
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `feedback-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Feedback Dashboard</CardTitle>
            <CardDescription>
              Review, update, delete, and export user feedback.
            </CardDescription>
          </div>
          <Button type="button" variant="outline" onClick={exportCsv}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <input
              value={pagePathFilter}
              onChange={(event) => setPagePathFilter(event.target.value)}
              placeholder="Filter by page path"
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            />
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as FeedbackStatus | "all")
              }
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All statuses</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              onClick={fetchFeedback}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Page Path</TableHead>
                <TableHead>Feedback</TableHead>
                <TableHead>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1"
                    onClick={() => setSort("category")}
                  >
                    Category
                    {sortField === "category" &&
                      (sortDirection === "asc" ? (
                        <ArrowUp className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5" />
                      ))}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1"
                    onClick={() => setSort("severity")}
                  >
                    Severity
                    {sortField === "severity" &&
                      (sortDirection === "asc" ? (
                        <ArrowUp className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5" />
                      ))}
                  </button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>GitHub Name</TableHead>
                <TableHead>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1"
                    onClick={() => setSort("created_at")}
                  >
                    Created At
                    {sortField === "created_at" &&
                      (sortDirection === "asc" ? (
                        <ArrowUp className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5" />
                      ))}
                  </button>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10">
                    <div className="inline-flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading feedback...
                    </div>
                  </TableCell>
                </TableRow>
              ) : sortedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                    No feedback found.
                  </TableCell>
                </TableRow>
              ) : (
                sortedItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="max-w-52 truncate">{item.page_path}</TableCell>
                    <TableCell className="max-w-96">
                      <p className="line-clamp-3 whitespace-pre-wrap wrap-break-word text-sm">
                        {item.content}
                      </p>
                    </TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>
                      <Badge variant={severityBadgeVariant(item.severity)}>
                        {item.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={statusBadgeVariant(item.status)}>
                          {item.status}
                        </Badge>
                        <select
                          value={item.status}
                          onChange={(event) =>
                            handleUpdateStatus(item.id, event.target.value as FeedbackStatus)
                          }
                          disabled={updatingId === item.id}
                          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.is_anonymous ? "Anonymous" : item.user_name || "Anonymous"}
                    </TableCell>
                    <TableCell>
                      {item.github_name ? (
                        <a
                          href={`https://github.com/${item.github_name}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-600 hover:underline dark:text-cyan-400"
                        >
                          {item.github_name}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(item.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                      >
                        {deletingId === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
