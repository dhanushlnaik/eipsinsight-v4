export interface Grant {
  id: string;
  title: string;
  badge: "significant" | "small" | "medium";
  tags: string[];
  description: string;
  date?: string;
  link?: string;
}

export const grants: Grant[] = [
  {
    id: "ef-esp-q2-2025",
    title: "Ecosystem Support Program (EF ESP Q2 2025)",
    badge: "significant",
    tags: ["Infrastructure"],
    description:
      "Funds help maintain data pipelines, improve charts and analytics, and keep EIPsInsight open-source and community driven.",
    date: "2025 Q2",
  },
  {
    id: "gitcoin-gg23",
    title: "Gitcoin Grants Round 23 (GG23)",
    badge: "small",
    tags: ["Community"],
    description:
      "Community contribution received through Gitcoin Grants Round 23 to support continued open-source development and maintenance.",
  },
  {
    id: "gitcoin-gg21-asia",
    title: "Gitcoin Grants Round 21 (Asia)",
    badge: "small",
    tags: ["Community", "Asia", "Inclusion"],
    description:
      "Focused on ecosystem and community-driven initiatives in Asia.",
  },
  {
    id: "gitcoin-gg18-core",
    title: "Gitcoin Grants Round 18 (Core)",
    badge: "small",
    tags: ["Community", "Network"],
    description:
      "Covers Web3 Open Source Software, Community & Education, and Ethereum infrastructure.",
  },
];
