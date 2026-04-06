'use client';

import { cn } from '@/lib/utils';
import { ThemedLogoGif } from '@/components/themed-logo-gif';

interface InlineBrandLoaderProps {
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function InlineBrandLoader({
  label = 'Loading...',
  size = 'sm',
  className,
}: InlineBrandLoaderProps) {
  const dimension = size === 'sm' ? 28 : 36;
  const frame = size === 'sm' ? 44 : 56;
  const ring = size === 'sm' ? 52 : 66;

  return (
    <div className={cn('flex flex-col items-center justify-center gap-2.5', className)}>
      <div className="relative flex items-center justify-center" style={{ width: ring, height: ring }}>
        <div className="absolute inset-0 rounded-full border border-primary/25 bg-primary/[0.03]" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-primary/20 border-t-primary/75 border-r-primary/55" />
        <div
          className="relative z-10 flex items-center justify-center rounded-full border border-border/80 bg-card/90 shadow-[0_0_20px_rgb(var(--persona-accent-rgb)/0.16)]"
          style={{ width: frame, height: frame }}
        >
          <ThemedLogoGif
            alt="EIPsInsight"
            width={dimension}
            height={dimension}
            unoptimized
            className="object-contain"
          />
        </div>
      </div>
      <span className={cn('text-muted-foreground', size === 'sm' ? 'text-xs' : 'text-sm')}>{label}</span>
    </div>
  );
}
