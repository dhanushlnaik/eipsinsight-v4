'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageSquare, Send, Loader2, Globe } from 'lucide-react'
import { toast } from 'sonner'
import { client } from '@/lib/orpc'
import { Button } from '@/components/ui/button'

type FeedbackSeverity = 'low' | 'medium' | 'high' | 'critical'

export default function FeedbackPage() {
  const pathname = usePathname()
  const [relatedPath, setRelatedPath] = useState(pathname === '/feedback' ? '/' : pathname)
  const [isWholeWebsite, setIsWholeWebsite] = useState(false)
  const [category, setCategory] = useState('general')
  const [severity, setSeverity] = useState<FeedbackSeverity>('medium')
  const [content, setContent] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [githubName, setGithubName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submitFeedback = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!content.trim()) {
      toast.error('Please enter your feedback before submitting')
      return
    }

    setIsSubmitting(true)
    try {
      const finalPath = isWholeWebsite ? '/whole-website' : relatedPath.trim() || '/'
      
      await client.feedback.createFeedback({
        page_path: finalPath,
        category,
        severity,
        content: content.trim(),
        is_anonymous: isAnonymous,
        github_name: githubName.trim() || null,
      })

      toast.success('Feedback submitted successfully')
      setContent('')
      setCategory('general')
      setSeverity('medium')
      setIsAnonymous(false)
      setGithubName('')
      setIsWholeWebsite(false)
      setRelatedPath(pathname === '/feedback' ? '/' : pathname)
    } catch {
      toast.error('Failed to submit feedback. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full px-3 py-8 sm:px-4 lg:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-cyan-500/10 px-3 py-1.5 ring-1 ring-cyan-400/30">
            <MessageSquare className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-700 dark:text-cyan-300">
              Feedback
            </span>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-slate-900 dark:text-slate-100">Website Feedback</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Share bugs, suggestions, and improvement ideas for any page. Your submission appears in the admin feedback dashboard.
          </p>
        </div>

        <form onSubmit={submitFeedback} className="rounded-xl border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/55">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="relatedPath" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Related page path
              </label>
              <input
                id="relatedPath"
                value={isWholeWebsite ? '/whole-website' : relatedPath}
                onChange={(e) => setRelatedPath(e.target.value)}
                placeholder="/about"
                disabled={isWholeWebsite}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:bg-slate-100 dark:disabled:bg-slate-800"
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={isWholeWebsite}
                  onChange={(e) => setIsWholeWebsite(e.target.checked)}
                  className="rounded border-input"
                />
                <Globe className="h-4 w-4" />
                Whole website
              </label>
            </div>

            <div>
              <label htmlFor="category" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="general">General</option>
                <option value="bug">Bug Report</option>
                <option value="feature">Feature Request</option>
                <option value="content">Content Issue</option>
                <option value="ui">UI/UX</option>
              </select>
            </div>

            <div>
              <label htmlFor="githubName" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                GitHub username
              </label>
              <input
                id="githubName"
                type="text"
                value={githubName}
                onChange={(e) => setGithubName(e.target.value)}
                placeholder="your-github-username"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="severity" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Severity
              </label>
              <select
                id="severity"
                value={severity}
                onChange={(e) => setSeverity(e.target.value as FeedbackSeverity)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="content" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Your feedback
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                maxLength={3000}
                placeholder="Describe the issue or suggestion..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded border-input"
              />
              Submit anonymously
            </label>

            <Button type="submit" disabled={isSubmitting || !content.trim()} className="inline-flex items-center gap-2">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Submit Feedback
            </Button>
          </div>
        </form>

        <div className="mt-6 flex items-center justify-between border-t border-slate-200/80 pt-4 text-sm dark:border-slate-700/50">
          <Link href="/" className="text-cyan-700 hover:underline dark:text-cyan-300">← Back to Home</Link>
          <Link href="/admin/feedback" className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">Admin Feedback</Link>
        </div>
      </div>
    </div>
  )
}
