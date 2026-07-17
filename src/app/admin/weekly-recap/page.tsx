"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { client } from "@/lib/orpc";
import { toast } from "sonner";
import {
  BookOpen,
  Calendar,
  Check,
  CheckSquare,
  Clock,
  Copy,
  FileText,
  Flame,
  GitMerge,
  GitPullRequest,
  Layers,
  Loader2,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Square,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type WeeklyData = Awaited<ReturnType<typeof client.dashboard.getWeeklyRecap>>;

const labelClass = "mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground";
const inputClass = "w-full rounded-md border border-border bg-muted/40 px-3 py-1.5 text-sm text-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all outline-none";

export default function WeeklyRecapPage() {
  const router = useRouter();
  
  // App States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<WeeklyData | null>(null);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  
  // Blog Post Fields
  const [title, setTitle] = useState(`Ethereum Standards Weekly - ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`);
  const [slug, setSlug] = useState(`ethereum-standards-weekly-${new Date().toISOString().slice(0, 10)}`);
  const [selectedCategory, setSelectedCategory] = useState("");
  
  // Selection States (IDs of items to include in report)
  const [selectedProposals, setSelectedProposals] = useState<Record<number, boolean>>({});
  const [selectedChanges, setSelectedChanges] = useState<Record<string, boolean>>({});
  const [selectedPRs, setSelectedPRs] = useState<Record<number, boolean>>({});
  const [selectedDevnets, setSelectedDevnets] = useState<Record<string, boolean>>({});
  const [selectedCalls, setSelectedCalls] = useState<Record<string, boolean>>({});
  const [selectedUpcoming, setSelectedUpcoming] = useState<Record<string, boolean>>({});
  const [selectedLastCalls, setSelectedLastCalls] = useState<Record<number, boolean>>({});
  
  // Featured Proposal Field
  const [featuredEipNumber, setFeaturedEipNumber] = useState("");
  const [loadingCuration, setLoadingCuration] = useState(false);
  const [featuredDetails, setFeaturedDetails] = useState<{
    number: number;
    title: string;
    summary: string;
    benefits: string[];
    tradeoffs: string[];
  } | null>(null);

  // Manual Inputs / Rotating sections
  const [manualAcdHighlights, setManualAcdHighlights] = useState("");
  const [enterpriseBrief, setEnterpriseBrief] = useState("");
  const [ecosystemAdoption, setEcosystemAdoption] = useState("");
  const [watchNextWeek, setWatchNextWeek] = useState("");
  const [spotlightInfo, setSpotlightInfo] = useState("");
  
  // Live Compiled Markdown
  const [markdown, setMarkdown] = useState("");

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      const [recapData, blogCats] = await Promise.all([
        client.dashboard.getWeeklyRecap({}),
        client.blog.listCategories(),
      ]);
      setData(recapData);
      setCategories(blogCats);
      if (blogCats.length > 0) {
        // Pre-select Newsletter or News if present
        const newsCat = blogCats.find(c => c.name.toLowerCase().includes("newsletter") || c.name.toLowerCase().includes("news"));
        setSelectedCategory(newsCat?.id || blogCats[0].id);
      }

      // Pre-fill selection objects to true
      const proposalsSel: Record<number, boolean> = {};
      recapData.newProposals.forEach(p => proposalsSel[p.number] = true);
      setSelectedProposals(proposalsSel);

      const changesSel: Record<string, boolean> = {};
      recapData.statusChanges.forEach(sc => changesSel[`${sc.number}-${sc.to}`] = true);
      setSelectedChanges(changesSel);

      const prsSel: Record<number, boolean> = {};
      recapData.mergedPRs.forEach(pr => prsSel[pr.number] = true);
      setSelectedPRs(prsSel);

      const devnetsSel: Record<string, boolean> = {};
      recapData.devnets.forEach(d => devnetsSel[d.id] = true);
      setSelectedDevnets(devnetsSel);

      const callsSel: Record<string, boolean> = {};
      recapData.recentCalls.forEach(c => callsSel[`${c.series}-${c.number}`] = true);
      setSelectedCalls(callsSel);

      const upcomingSel: Record<string, boolean> = {};
      recapData.upcomingCalls.forEach(c => upcomingSel[`${c.series}-${c.callNumber || c.issueNumber}`] = true);
      setSelectedUpcoming(upcomingSel);

      const lastCallSel: Record<number, boolean> = {};
      recapData.lastCallEIPs.forEach(lc => lastCallSel[lc.number] = true);
      setSelectedLastCalls(lastCallSel);

    } catch (error) {
      toast.error("Failed to load recap data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Pre-fetch Curation details for Featured Proposal
  const handleLoadCuration = async () => {
    const num = parseInt(featuredEipNumber, 10);
    if (isNaN(num)) {
      toast.error("Please enter a valid EIP/ERC number");
      return;
    }
    setLoadingCuration(true);
    try {
      const curations = await client.curations.getEipCurations({ eipNumbers: [num] });
      if (curations.length > 0) {
        const cur = curations[0];
        setFeaturedDetails({
          number: num,
          title: cur.layman_title || `EIP-${num}`,
          summary: cur.layman_summary || "",
          benefits: cur.benefits || [],
          tradeoffs: cur.tradeoffs || [],
        });
        toast.success("Layman curation loaded successfully!");
      } else {
        // Fallback info from generic EIP meta
        setFeaturedDetails({
          number: num,
          title: `EIP-${num}`,
          summary: "No layman summary curated yet.",
          benefits: [],
          tradeoffs: [],
        });
        toast.info("No customized layman curation found; using default placeholders.");
      }
    } catch {
      toast.error("Failed to query EIP curation details");
    } finally {
      setLoadingCuration(false);
    }
  };

  // Compile Live Markdown whenever fields or selections change
  useEffect(() => {
    if (!data) return;

    let md = `# ${title}\n\n`;
    md += `Ethereum protocol upgrades, governance decisions, and EIP analysis — delivered to your inbox every week.\n\n---\n\n`;

    // 1. STANDARDS IN MOTION
    md += `## 1. Standards in Motion\n\n`;
    
    // New EIPs/ERCs
    const selectedNew = data.newProposals.filter(p => selectedProposals[p.number]);
    if (selectedNew.length > 0) {
      md += `### 🆕 New Proposals Introduced\n`;
      selectedNew.forEach(p => {
        const typeStr = p.category ? `${p.category} ` : "";
        md += `- **[${p.status}] [${typeStr}EIP-${p.number}](https://eipsinsight.com/${p.category?.toLowerCase() === "erc" ? "erc" : "eip"}s/${p.number})**: ${p.title}\n`;
      });
      md += `\n`;
    }

    // Status Transitions
    const selectedTransition = data.statusChanges.filter(sc => selectedChanges[`${sc.number}-${sc.to}`]);
    if (selectedTransition.length > 0) {
      md += `### 🔄 Lifecycle & Status Changes\n`;
      selectedTransition.forEach(sc => {
        const typeStr = sc.category ? `${sc.category} ` : "";
        md += `- **[${typeStr}EIP-${sc.number}](https://eipsinsight.com/${sc.category?.toLowerCase() === "erc" ? "erc" : "eip"}s/${sc.number})**: Transitioned from \`${sc.from}\` ➔ \`${sc.to}\`\n`;
      });
      md += `\n`;
    }

    // Merged PRs
    const selectedMerged = data.mergedPRs.filter(pr => selectedPRs[pr.number]);
    if (selectedMerged.length > 0) {
      md += `### 🪵 Recently Merged Pull Requests\n`;
      selectedMerged.forEach(pr => {
        md += `- **PR #${pr.number}**: ${pr.title} (Merged by @${pr.author})\n`;
      });
      md += `\n`;
    }

    if (selectedNew.length === 0 && selectedTransition.length === 0 && selectedMerged.length === 0) {
      md += `*No standards activity selected for this week.*\n\n`;
    }

    // 2. GOVERNANCE & UPGRADE WATCH
    md += `## 2. Governance & Upgrade Watch\n\n`;
    
    // Call Decisions
    const selectedCallData = data.recentCalls.filter(c => selectedCalls[`${c.series}-${c.number}`]);
    if (selectedCallData.length > 0) {
      md += `### 🗣️ Core Dev Calls Highlights\n`;
      selectedCallData.forEach(c => {
        md += `#### ${c.displayName || `${c.series} #${c.number}`}\n`;
        if (c.tldr) {
          md += `* **Summary:** ${c.tldr}\n`;
        }
        if (c.keyDecisions && Array.isArray(c.keyDecisions)) {
          md += `* **Key Decisions:**\n`;
          (c.keyDecisions as string[]).forEach(dec => {
            md += `  - ${dec}\n`;
          });
        }
        md += `\n`;
      });
    }

    if (manualAcdHighlights.trim()) {
      md += `### 💡 Governance Notes\n${manualAcdHighlights}\n\n`;
    }

    // Devnets
    const selectedDevnetData = data.devnets.filter(d => selectedDevnets[d.id]);
    if (selectedDevnetData.length > 0) {
      md += `### 🧪 Devnets & Testnet Progression\n`;
      selectedDevnetData.forEach(d => {
        md += `- **[${d.active ? "Active" : "Closed"}] [${d.series.toUpperCase()} Devnet ${d.number}](https://eipsinsight.com/upgrade/devnets/${d.id})**: ${d.title}\n`;
      });
      md += `\n`;
    }

    // 3. FEATURED PROPOSAL
    if (featuredDetails) {
      md += `## 3. Featured Proposal: EIP-${featuredDetails.number}\n\n`;
      md += `### 🔍 ${featuredDetails.title}\n\n`;
      if (featuredDetails.summary) {
        md += `**Problem and Technical Approach:**\n${featuredDetails.summary}\n\n`;
      }
      if (featuredDetails.benefits.length > 0) {
        md += `**Ecosystem Benefits:**\n`;
        featuredDetails.benefits.forEach(b => md += `- ${b}\n`);
        md += `\n`;
      }
      if (featuredDetails.tradeoffs.length > 0) {
        md += `**Design Tradeoffs:**\n`;
        featuredDetails.tradeoffs.forEach(t => md += `- ${t}\n`);
        md += `\n`;
      }
      md += `*Learn more on the detail page: [Read EIP-${featuredDetails.number} Observability Details](https://eipsinsight.com/eips/${featuredDetails.number})*\n\n`;
    }

    // 4. CONTRIBUTOR CORNER
    md += `## 4. Contributor Corner\n\n`;
    
    // Last Calls seeking review
    const selectedLast = data.lastCallEIPs.filter(lc => selectedLastCalls[lc.number]);
    if (selectedLast.length > 0) {
      md += `### 📢 EIPs in Last Call (Seeking final community review)\n`;
      selectedLast.forEach(lc => {
        md += `- **[EIP-${lc.number}](https://eipsinsight.com/eips/${lc.number})**: ${lc.title} (Review Deadline: \`${lc.deadline || "Immediate"}\`)\n`;
      });
      md += `\n`;
    }

    md += `* Check editor activities and contributions on the [Editors Leaderboard](https://eipsinsight.com/analytics/editors).\n\n`;

    // 5. WHAT TO WATCH NEXT WEEK
    md += `## 5. What to Watch Next Week\n\n`;
    const selectedUpcomingData = data.upcomingCalls.filter(c => selectedUpcoming[`${c.series}-${c.callNumber || c.issueNumber}`]);
    if (selectedUpcomingData.length > 0) {
      md += `### 🗓️ Scheduled Core Meetings & Office Hours\n`;
      selectedUpcomingData.forEach(c => {
        const timeStr = c.occursOn ? ` on \`${c.occursOn}\`` : "";
        md += `- **${c.title}**${timeStr} (Agenda issue: [#${c.issueNumber}](${c.issueUrl}))\n`;
      });
      md += `\n`;
    }

    if (watchNextWeek.trim()) {
      md += `${watchNextWeek}\n\n`;
    }

    // ROTATING SECTIONS
    if (spotlightInfo.trim()) {
      md += `## 🎙️ Standards Spotlight\n\n${spotlightInfo}\n\n`;
    }
    if (enterpriseBrief.trim()) {
      md += `## 🏢 Enterprise Brief: Why This Matters to Businesses\n\n${enterpriseBrief}\n\n`;
    }
    if (ecosystemAdoption.trim()) {
      md += `## 🚀 Ecosystem Adoption & Implementations\n\n${ecosystemAdoption}\n\n`;
    }

    setMarkdown(md);
  }, [
    title, data, selectedProposals, selectedChanges, selectedPRs, selectedDevnets,
    selectedCalls, selectedUpcoming, selectedLastCalls, featuredDetails,
    manualAcdHighlights, enterpriseBrief, ecosystemAdoption, watchNextWeek, spotlightInfo
  ]);

  // Actions
  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
    toast.success("Markdown copied to clipboard!");
  };

  const handleCreateDraft = async () => {
    if (!title.trim() || !slug.trim()) {
      toast.error("Please provide a Title and Slug for the draft");
      return;
    }
    setSaving(true);
    try {
      await client.blog.create({
        title,
        slug,
        content: markdown,
        published: false,
        categoryId: selectedCategory || null,
        excerpt: `Weekly Ethereum Standards & Governance updates for ${new Date().toLocaleDateString("en", { month: "short", day: "numeric" })}.`,
      });
      toast.success("Blog draft created successfully!");
      router.push("/admin/blogs");
    } catch (err: any) {
      toast.error(err.message || "Failed to create blog draft");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100 font-sans">
      <div className="mx-auto max-w-[1600px] space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
              <Sparkles className="h-4 w-4" /> Admin Tools
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mt-1">Weekly Recap Generator</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={loadData} className="border-slate-800 hover:bg-slate-900 text-slate-300">
              <RefreshCw className="mr-2 h-4 w-4" /> Reload Data
            </Button>
            <Button onClick={handleCopy} className="bg-slate-800 hover:bg-slate-700 text-white">
              <Copy className="mr-2 h-4 w-4" /> Copy Markdown
            </Button>
            <Button onClick={handleCreateDraft} disabled={saving} className="bg-primary hover:bg-primary/95 text-black font-semibold">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Publish Blog Draft
            </Button>
          </div>
        </div>

        {/* Two-Column Workspace */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          
          {/* LEFT: Controls, Toggles, & Inputs */}
          <div className="space-y-6 max-h-[85vh] overflow-y-auto pr-2 custom-scrollbar">
            
            {/* Metadata Card */}
            <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-md">
              <CardHeader className="py-4">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-300">Post Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Post Title</label>
                    <input value={title} onChange={e => setTitle(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>URL Slug</label>
                    <input value={slug} onChange={e => setSlug(e.target.value)} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Blog Category</label>
                  <select 
                    value={selectedCategory} 
                    onChange={e => setSelectedCategory(e.target.value)} 
                    className="w-full rounded-md border border-border bg-slate-900 px-3 py-1.5 text-sm text-foreground focus:border-primary/50 outline-none"
                  >
                    <option value="">No Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Standards in Motion Toggles */}
            <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-md">
              <CardHeader className="py-4 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" /> 1. Standards in Motion
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* New proposals */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 mb-2">New Proposals (Last 7 Days)</h4>
                  {data?.newProposals.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No new proposals found.</p>
                  ) : (
                    <div className="space-y-2">
                      {data?.newProposals.map(p => (
                        <div key={p.number} className="flex items-start gap-2.5 text-sm">
                          <button onClick={() => setSelectedProposals(prev => ({ ...prev, [p.number]: !prev[p.number] }))} className="text-slate-400 hover:text-white mt-0.5">
                            {selectedProposals[p.number] ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                          </button>
                          <span className="text-slate-300">
                            <Badge variant="outline" className="mr-1 bg-slate-950 text-[10px] py-0">{p.status}</Badge>
                            EIP-{p.number}: {p.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status Transitions */}
                <div className="border-t border-slate-800 pt-4">
                  <h4 className="text-xs font-bold text-slate-400 mb-2">Status Transitions (Last 7 Days)</h4>
                  {data?.statusChanges.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No status transitions found.</p>
                  ) : (
                    <div className="space-y-2">
                      {data?.statusChanges.map(sc => {
                        const key = `${sc.number}-${sc.to}`;
                        return (
                          <div key={key} className="flex items-start gap-2.5 text-sm">
                            <button onClick={() => setSelectedChanges(prev => ({ ...prev, [key]: !prev[key] }))} className="text-slate-400 hover:text-white mt-0.5">
                              {selectedChanges[key] ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                            </button>
                            <span className="text-slate-300">
                              EIP-{sc.number} ➔ <span className="text-primary font-semibold">{sc.to}</span> ({sc.title})
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Merged PRs */}
                <div className="border-t border-slate-800 pt-4">
                  <h4 className="text-xs font-bold text-slate-400 mb-2">Merged Pull Requests</h4>
                  {data?.mergedPRs.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No merged PRs found.</p>
                  ) : (
                    <div className="space-y-2">
                      {data?.mergedPRs.map(pr => (
                        <div key={pr.number} className="flex items-start gap-2.5 text-sm">
                          <button onClick={() => setSelectedPRs(prev => ({ ...prev, [pr.number]: !prev[pr.number] }))} className="text-slate-400 hover:text-white mt-0.5">
                            {selectedPRs[pr.number] ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                          </button>
                          <span className="text-slate-300">
                            PR #{pr.number}: {pr.title} (by @{pr.author})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Governance & Upgrade watch Toggles */}
            <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-md">
              <CardHeader className="py-4">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-indigo-500" /> 2. Governance & Upgrade Watch
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Recent calls decisions */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 mb-2">Recent ACD Calls & Decisions</h4>
                  {data?.recentCalls.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No recent calls found.</p>
                  ) : (
                    <div className="space-y-3">
                      {data?.recentCalls.map(c => {
                        const key = `${c.series}-${c.number}`;
                        return (
                          <div key={key} className="flex items-start gap-2.5 text-sm">
                            <button onClick={() => setSelectedCalls(prev => ({ ...prev, [key]: !prev[key] }))} className="text-slate-400 hover:text-white mt-0.5">
                              {selectedCalls[key] ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                            </button>
                            <div className="text-slate-300 flex-1">
                              <p className="font-semibold text-white">{c.displayName || `${c.series} #${c.number}`}</p>
                              {c.tldr && <p className="text-xs text-slate-400 mt-0.5">{String(c.tldr)}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Manual governance notes */}
                <div className="border-t border-slate-800 pt-4">
                  <label className={labelClass}>Manual Call Highlights & Governance Notes</label>
                  <textarea 
                    value={manualAcdHighlights} 
                    onChange={e => setManualAcdHighlights(e.target.value)} 
                    placeholder="Enter manual bullet points or decisions from Core Dev calls..." 
                    className="w-full h-20 rounded-md border border-border bg-slate-900 px-3 py-1.5 text-sm text-foreground outline-none resize-y"
                  />
                </div>

                {/* Active Devnets */}
                <div className="border-t border-slate-800 pt-4">
                  <h4 className="text-xs font-bold text-slate-400 mb-2">Devnets Progression</h4>
                  {data?.devnets.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No devnets specs found.</p>
                  ) : (
                    <div className="space-y-2">
                      {data?.devnets.map(d => (
                        <div key={d.id} className="flex items-start gap-2.5 text-sm">
                          <button onClick={() => setSelectedDevnets(prev => ({ ...prev, [d.id]: !prev[d.id] }))} className="text-slate-400 hover:text-white mt-0.5">
                            {selectedDevnets[d.id] ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                          </button>
                          <span className="text-slate-300">
                            {d.series.toUpperCase()} Devnet {d.number}: {d.title} ({d.active ? "Active" : "Closed"})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Featured Proposal Selector */}
            <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-md">
              <CardHeader className="py-4">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-emerald-500" /> 3. Featured Proposal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input 
                      placeholder="EIP or ERC Number (e.g. 7702)" 
                      value={featuredEipNumber} 
                      onChange={e => setFeaturedEipNumber(e.target.value)} 
                      className="w-full rounded-md border border-border bg-muted/40 pl-8 pr-3 py-1.5 text-sm outline-none"
                    />
                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  </div>
                  <Button onClick={handleLoadCuration} disabled={loadingCuration} className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium">
                    {loadingCuration ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load Curation"}
                  </Button>
                </div>

                {featuredDetails && (
                  <div className="rounded-lg border border-emerald-950 bg-emerald-950/20 p-4 space-y-2">
                    <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Loaded Proposal</p>
                    <p className="text-sm font-bold text-white">EIP-{featuredDetails.number}: {featuredDetails.title}</p>
                    {featuredDetails.summary ? (
                      <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">{featuredDetails.summary}</p>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No summary found in database.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contributor corner & upcoming schedules */}
            <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-md">
              <CardHeader className="py-4">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-yellow-500" /> 4 & 5. Corner & Next Week
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Last Calls */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 mb-2">EIPs in Last Call</h4>
                  {data?.lastCallEIPs.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No EIPs currently in Last Call.</p>
                  ) : (
                    <div className="space-y-2">
                      {data?.lastCallEIPs.map(lc => (
                        <div key={lc.number} className="flex items-start gap-2.5 text-sm">
                          <button onClick={() => setSelectedLastCalls(prev => ({ ...prev, [lc.number]: !prev[lc.number] }))} className="text-slate-400 hover:text-white mt-0.5">
                            {selectedLastCalls[lc.number] ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                          </button>
                          <span className="text-slate-300">
                            EIP-{lc.number}: {lc.title} (Deadline: {lc.deadline || "None"})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Upcoming meetings */}
                <div className="border-t border-slate-800 pt-4">
                  <h4 className="text-xs font-bold text-slate-400 mb-2">Upcoming ACD & Coordination Calls</h4>
                  {data?.upcomingCalls.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No upcoming calls found.</p>
                  ) : (
                    <div className="space-y-2">
                      {data?.upcomingCalls.map(c => {
                        const key = `${c.series}-${c.callNumber || c.issueNumber}`;
                        return (
                          <div key={key} className="flex items-start gap-2.5 text-sm">
                            <button onClick={() => setSelectedUpcoming(prev => ({ ...prev, [key]: !prev[key] }))} className="text-slate-400 hover:text-white mt-0.5">
                              {selectedUpcoming[key] ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                            </button>
                            <span className="text-slate-300">
                              {c.title} {c.occursOn ? `(${c.occursOn})` : ""}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Manual watchlist/schedules */}
                <div className="border-t border-slate-800 pt-4">
                  <label className={labelClass}>Manual Schedule / What to Watch Next Week</label>
                  <textarea 
                    value={watchNextWeek} 
                    onChange={e => setWatchNextWeek(e.target.value)} 
                    placeholder="Enter deadlines, office hours details, or specific PRs to watch next week..." 
                    className="w-full h-20 rounded-md border border-border bg-slate-900 px-3 py-1.5 text-sm text-foreground outline-none resize-y"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Optional rotating sections */}
            <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-md">
              <CardHeader className="py-4">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-300">Rotating Editorial Sections</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className={labelClass}>Standards Spotlight (Author/Editor Feature)</label>
                  <textarea 
                    value={spotlightInfo} 
                    onChange={e => setSpotlightInfo(e.target.value)} 
                    placeholder="Feature a contributor, editor, or project this week..." 
                    className="w-full h-20 rounded-md border border-border bg-slate-900 px-3 py-1.5 text-sm text-foreground outline-none resize-y"
                  />
                </div>
                <div>
                  <label className={labelClass}>Enterprise Brief</label>
                  <textarea 
                    value={enterpriseBrief} 
                    onChange={e => setEnterpriseBrief(e.target.value)} 
                    placeholder="Translate protocol changes into enterprise or business impacts..." 
                    className="w-full h-20 rounded-md border border-border bg-slate-900 px-3 py-1.5 text-sm text-foreground outline-none resize-y"
                  />
                </div>
                <div>
                  <label className={labelClass}>Ecosystem Adoption</label>
                  <textarea 
                    value={ecosystemAdoption} 
                    onChange={e => setEcosystemAdoption(e.target.value)} 
                    placeholder="Highlight projects implementing recently finalized EIPs/ERCs..." 
                    className="w-full h-20 rounded-md border border-border bg-slate-900 px-3 py-1.5 text-sm text-foreground outline-none resize-y"
                  />
                </div>
              </CardContent>
            </Card>

          </div>

          {/* RIGHT: Live Compiled Preview */}
          <div className="space-y-6">
            <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-md h-full flex flex-col">
              <CardHeader className="py-4 flex flex-row items-center justify-between border-b border-slate-800">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Live Markdown Output
                </CardTitle>
                <div className="text-[10px] text-slate-500 font-mono">Real-time compilation</div>
              </CardHeader>
              <CardContent className="p-0 flex-1 flex flex-col min-h-[60vh]">
                <textarea 
                  value={markdown} 
                  onChange={e => setMarkdown(e.target.value)} 
                  className="w-full flex-1 bg-slate-950/60 p-6 text-sm text-slate-300 font-mono focus:outline-none resize-none leading-relaxed border-0"
                />
              </CardContent>
            </Card>
          </div>

        </div>

      </div>
    </div>
  );
}
