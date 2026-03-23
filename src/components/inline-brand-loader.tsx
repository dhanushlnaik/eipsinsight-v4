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

  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      <div className="relative">
        <div className={cn(
          'absolute inset-0 rounded-full border border-primary/35',
          size === 'sm' ? 'scale-125' : 'scale-130',
        )} />
        <div className={cn(
          'absolute inset-0 rounded-full border-2 border-transparent border-t-primary/70 animate-spin',
          size === 'sm' ? 'scale-[1.55]' : 'scale-[1.6]',
        )} />
        <ThemedLogoGif
          alt="EIPsInsight"
          width={dimension}
          height={dimension}
          unoptimized
          className="rounded-full shadow-[0_0_14px_rgb(var(--persona-accent-rgb)/0.28)]"
        />
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

