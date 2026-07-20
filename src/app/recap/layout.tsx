import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Weekly Standards Recap & Audit Feed | EIPsInsight',
  description:
    'A transparent, verifiable audit log tracking all new EIP/ERC/RIP proposals, status transitions, merged PRs, devnets, and core dev call decisions across Ethereum standards.',
  openGraph: {
    title: 'Weekly Standards Recap & Audit Feed | EIPsInsight',
    description:
      'A transparent, verifiable audit log tracking all new EIP/ERC/RIP proposals, status transitions, merged PRs, devnets, and core dev call decisions across Ethereum standards.',
  },
};

export default function RecapLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background">{children}</div>;
}
