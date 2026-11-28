import React from "react";

const STAKEHOLDER_LABELS: Record<string, string> = {
  developers: "App & Contract Developers",
  node_operators: "Node Operators & Clients",
  wallets: "Wallets & Signers",
  users: "End Users",
  validators: "Validators & Stakers",
  bridges: "Bridges & Rollups",
  auditors: "Security & Auditors",
};

export function Stakeholders({
  impacts,
}: {
  impacts: Record<string, { description?: string }>;
}) {
  const entries = Object.entries(impacts).filter(
    ([, val]) => Boolean(val?.description?.trim())
  );
  if (entries.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {entries.map(([key, val]) => {
        const label =
          STAKEHOLDER_LABELS[key] ||
          key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        return (
          <div key={key} className="card p-5">
            <p className="font-serif text-[1.05rem] text-[var(--ink)]">{label}</p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
              {val.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}
