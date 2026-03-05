'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import { Check, Copy, Heart, Landmark, QrCode, Wallet } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { partners } from '@/data/resources/partners';
import { grants } from '@/data/resources/grants';

function EthereumIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 256 417" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className={className}>
      <path fill="currentColor" fillOpacity="0.85" d="M127.9 0L124.7 10.9V278.7L127.9 281.9L255.8 206.3L127.9 0Z" />
      <path fill="currentColor" d="M127.9 0L0 206.3L127.9 281.9V151.9V0Z" />
      <path fill="currentColor" fillOpacity="0.85" d="M127.9 306.1L126.1 308.3V403.7L127.9 417L255.9 230.5L127.9 306.1Z" />
      <path fill="currentColor" d="M127.9 417V306.1L0 230.5L127.9 417Z" />
      <path fill="currentColor" fillOpacity="0.35" d="M127.9 281.9L255.8 206.3L127.9 151.9V281.9Z" />
      <path fill="currentColor" fillOpacity="0.5" d="M0 206.3L127.9 281.9V151.9L0 206.3Z" />
    </svg>
  );
}

export default function DonatePage() {
  const [copied, setCopied] = useState(false);
  const walletAddress = '0x68B1C495096710Ab5D3aD137F5024221aAf35B7d';

  const topGrants = useMemo(
    () => [
      grants.find((g) => g.title.toLowerCase().includes('ecosystem')),
      grants.find((g) => g.title.toLowerCase().includes('gitcoin')),
    ].filter(Boolean),
    []
  );

  const partnerLogos: Record<string, string> = {
    EtherWorld: '/brand/partners/ew.png',
    'ECH (Ethereum Cat Herders)': '/brand/partners/ech.png',
  };

  const handleCopyAddress = async () => {
    await navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="w-full py-8 px-3 sm:px-4 lg:px-6">
      <div className="mx-auto max-w-screen-2xl">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <section className="mb-6 rounded-xl border border-slate-700/50 bg-slate-900/50 p-5 shadow-sm sm:p-6 lg:p-8">
            <h1 className="mb-6 text-center text-3xl font-bold text-cyan-400 sm:text-4xl">
              <span className="inline-flex items-center gap-2">
                <Heart className="h-7 w-7 text-pink-400" />
                Donate to Support Our Mission
              </span>
            </h1>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-xl border border-slate-800 bg-linear-to-b from-slate-900/70 to-slate-900/40 p-5">
                <h2 className="mb-2 text-2xl font-semibold text-cyan-400 sm:text-3xl">
                  <span className="inline-flex items-center gap-2">
                    <Heart className="h-7 w-7 text-pink-400" /> Send Crypto
                  </span>
                </h2>
                <p className="mb-5 text-base text-slate-200 sm:text-lg">
                  Your support keeps EIPs Insight free, open-source, and continuously improved. Funds are used for infrastructure, data pipelines, and community features.
                </p>

                <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-300">Select Network</p>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-6 py-2.5 text-lg font-medium text-slate-900 shadow-sm shadow-cyan-200/30">
                    <EthereumIcon className="h-5 w-5 text-slate-900" />
                    Ethereum
                  </div>

                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-300">Wallet Address</p>
                  <div className="flex items-center overflow-hidden rounded-lg border border-slate-700 bg-slate-950/70">
                    <div className="min-w-0 flex-1 px-3 py-3 text-sm font-semibold text-slate-100 sm:text-base">{walletAddress}</div>
                    <button
                      onClick={handleCopyAddress}
                      className="inline-flex items-center gap-1 border-l border-slate-700 bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-cyan-200"
                      type="button"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">All networks use the same address — please confirm network/token compatibility before sending.</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-linear-to-b from-slate-900/70 to-slate-900/40 p-5 text-center">
                <h2 className="mb-3 text-2xl font-semibold text-cyan-400 sm:text-3xl">Scan to Donate</h2>
                <div className="mx-auto inline-flex rounded-xl border border-cyan-400 bg-white p-3">
                  <QRCodeSVG value={walletAddress} size={256} includeMargin={true} bgColor="#ffffff" fgColor="#000000" />
                </div>
                <p className="mt-3 break-all text-sm font-semibold text-slate-100 sm:text-lg">{walletAddress}</p>
                <span className="mt-3 inline-flex items-center rounded-full bg-cyan-400/20 px-4 py-1 text-sm font-semibold text-cyan-300">ETHEREUM</span>
              </div>
            </div>
          </section>

          <section className="mb-6 rounded-xl border border-slate-700/50 bg-slate-900/50 p-5 sm:p-6">
            <div className="mb-4 text-center">
              <h2 className="text-3xl font-bold text-cyan-400">
                <span className="inline-flex items-center gap-2"><Landmark className="h-6 w-6" /> Our Partners</span>
              </h2>
              <p className="mx-auto mt-2 max-w-3xl text-sm text-slate-300">EIPs Insight is supported by organizations and contributors who share our vision for transparent and accessible Ethereum governance.</p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-4">
              <div className="flex flex-wrap items-center justify-center gap-4">
                {partners.map((partner) => (
                  <a key={partner.name} href={partner.website} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-md border border-slate-600 bg-slate-900/60 px-5 py-4 transition hover:border-cyan-400/50">
                    {partnerLogos[partner.name] ? (
                      <Image src={partnerLogos[partner.name]} alt={partner.name} width={120} height={44} className="h-11 w-auto object-contain" />
                    ) : (
                      <span className="text-sm font-medium text-slate-200">{partner.name}</span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          </section>

          <section className="mb-6 rounded-xl border border-slate-700/50 bg-slate-900/50 p-5 sm:p-6">
            <div className="mb-4 text-center">
              <h2 className="text-3xl font-bold text-cyan-400">
                <span className="inline-flex items-center gap-2"><Wallet className="h-6 w-6" /> Funding & Support</span>
              </h2>
              <p className="mx-auto mt-2 max-w-3xl text-sm text-slate-300">We transparently publish where support comes from and how it supports the platform.</p>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-purple-500/20 px-2.5 py-1 text-xs font-semibold text-purple-200">Ethereum</span>
              <span className="rounded-full bg-sky-500/20 px-2.5 py-1 text-xs font-semibold text-sky-200">Gitcoin</span>
              <span className="rounded-full bg-cyan-500/20 px-2.5 py-1 text-xs font-semibold text-cyan-200">EIP</span>
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-200">Infrastructure</span>
              <span className="rounded-full bg-slate-500/20 px-2.5 py-1 text-xs font-semibold text-slate-200">Open Source</span>
            </div>

            <div className="space-y-2">
              {topGrants.map((grant) => (
                <details key={grant!.id} className="group rounded-md border border-slate-700 bg-slate-900/50">
                  <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-100">
                    {grant!.title}
                  </summary>
                  <div className="border-t border-slate-700 px-4 py-3 text-sm text-slate-300">
                    {grant!.description}
                  </div>
                </details>
              ))}
            </div>
          </section>

          <section className="mb-8 rounded-xl border border-slate-700/50 bg-slate-900/50 p-5 text-center">
            <h3 className="text-lg font-semibold text-slate-100">Need help or partnership inquiry?</h3>
            <p className="mt-2 text-sm text-slate-300">Contact us at <a href="mailto:dev@avarch.com" className="text-cyan-300 underline">dev@avarch.com</a></p>
          </section>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200/80 pt-6 dark:border-slate-700/50">
            <Link href="/" className="text-sm text-cyan-700 hover:underline dark:text-cyan-300">
              ← Back to Home
            </Link>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link
                href="/about"
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                About
              </Link>
              <Link href="https://github.com/AvarchLLC/eipsinsight-v4" target="_blank" rel="noreferrer" className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
                GitHub
              </Link>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
