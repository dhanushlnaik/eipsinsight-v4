import type { LucideIcon } from 'lucide-react';
import { CopyLinkButton } from '@/components/header';
import { cn } from '@/lib/utils';

/**
 * Standard section block for the /upgrade tree, matching the pattern established on
 * /upgrade/archive: a divider, then an icon + linkable heading + sub-description,
 * then the section body.
 *
 * Using one component (rather than repeating the markup per page) is what keeps the
 * upgrade pages visually consistent — this is exactly where they drifted apart before.
 *
 * IMPORTANT: the parent container must NOT use `space-y-*`. This returns a fragment
 * (divider + section), so a parent `space-y` inserts a gap between the divider and its
 * own heading, doubling the spacing around every rule. Spacing lives here (pt/pb).
 */
export function UpgradeSection({
  id,
  icon: Icon,
  title,
  description,
  action,
  separator = true,
  className,
  children,
}: {
  /** Anchor id — also what the copy-link button copies (/path#id). */
  id: string;
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Optional right-aligned control (e.g. a "View all" link or a filter). */
  action?: React.ReactNode;
  /** Set false for the first section when it directly follows the page header. */
  separator?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      {separator && <div className="h-px w-full bg-border/60" aria-hidden />}
      <section id={id} className={cn('scroll-mt-24 pt-5 pb-6', className)}>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          {/* min-w-0 lets long titles/descriptions wrap instead of overflowing the flex row. */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Icon className="h-5 w-5 shrink-0 text-primary" />
              <h2 className="dec-title text-balance text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {title}
              </h2>
              <CopyLinkButton sectionId={id} tooltipLabel="Copy link" />
            </div>
            {description && (
              // Same measure + text-pretty as PageHeader's description, so section
              // sub-descriptions wrap identically to the one under the page title.
              <p className="mt-0.5 max-w-4xl text-pretty text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {action}
        </div>
        {children}
      </section>
    </>
  );
}
