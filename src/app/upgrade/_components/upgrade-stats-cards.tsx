'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Rocket, Code, Layers, Network } from 'lucide-react';
import { cn } from '@/lib/utils';

export function UpgradeStatsCards() {
  const cardVariants = {
    hover: {
      y: -4,
      scale: 1.02,
    },
  };

  return (
    <div className="flex flex-col gap-3 w-full h-full justify-between">
      {/* Main Total Upgrades Card */}
      <motion.div
        variants={cardVariants}
        whileHover="hover"
        transition={{ duration: 0.2 }}
        className={cn(
          "relative p-5 rounded-xl border border-border bg-card/60 backdrop-blur-sm",
          "shadow-sm",
          "hover:border-primary/40 hover:shadow-lg hover:shadow-primary/15",
          "transition-all duration-200"
        )}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <Rocket className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total Network Upgrades
          </h3>
        </div>
        <p className="text-4xl font-bold text-foreground mb-1">21</p>
        <p className="text-sm text-muted-foreground">
          Since Frontier Thawing (2015)
        </p>
      </motion.div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Execution Layer */}
        <motion.div
          variants={cardVariants}
          whileHover="hover"
          transition={{ duration: 0.2 }}
          className={cn(
            "relative p-4 rounded-xl border border-border bg-card/60 backdrop-blur-sm",
            "shadow-sm",
            "hover:border-primary/40 hover:shadow-lg hover:shadow-primary/15",
            "transition-all duration-200"
          )}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <div className="p-1 rounded-lg bg-primary/10 border border-primary/20">
              <Code className="h-3.5 w-3.5 text-primary" />
            </div>
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Execution Layer
            </h3>
          </div>
          <p className="text-3xl font-bold text-foreground mb-1">19</p>
          <p className="text-xs text-muted-foreground">Protocol & EVM</p>
        </motion.div>

        {/* Consensus Layer */}
        <motion.div
          variants={cardVariants}
          whileHover="hover"
          transition={{ duration: 0.2 }}
          className={cn(
            "relative p-4 rounded-xl border border-border bg-card/60 backdrop-blur-sm",
            "shadow-sm",
            "hover:border-primary/40 hover:shadow-lg hover:shadow-primary/15",
            "transition-all duration-200"
          )}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <div className="p-1 rounded-lg bg-primary/10 border border-primary/20">
              <Layers className="h-3.5 w-3.5 text-primary" />
            </div>
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Consensus Layer
            </h3>
          </div>
          <p className="text-3xl font-bold text-foreground mb-1">6</p>
          <p className="text-xs text-muted-foreground">Beacon Chain</p>
        </motion.div>
      </div>

      {/* Total Core EIPs */}
      <motion.div
        variants={cardVariants}
        whileHover="hover"
        transition={{ duration: 0.2 }}
        className={cn(
          "relative p-4 rounded-xl border border-border bg-card/60 backdrop-blur-sm",
          "shadow-sm",
          "hover:border-primary/40 hover:shadow-lg hover:shadow-primary/15",
          "transition-all duration-200"
        )}
      >
        <div className="flex items-center gap-1.5 mb-2">
          <div className="p-1 rounded-lg bg-primary/10 border border-primary/20">
            <Network className="h-3.5 w-3.5 text-primary" />
          </div>
          <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Total Core EIPs
          </h3>
        </div>
        <p className="text-3xl font-bold text-foreground mb-1">62</p>
        <p className="text-xs text-muted-foreground">Implemented in upgrades</p>
      </motion.div>
    </div>
  );
}
