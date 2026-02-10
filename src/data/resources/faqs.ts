export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: "basics" | "process" | "platform";
  relatedLinks?: Array<{ label: string; href: string }>;
}

export const faqs: FAQ[] = [
  // ── Basics ──
  {
    id: "what-is-eip",
    category: "basics",
    question: "What is an EIP?",
    answer:
      "An EIP (Ethereum Improvement Proposal) is a design document providing information to the Ethereum community, describing a new feature, process, or environment change for Ethereum. EIPs are the primary mechanism for proposing new features, collecting community input, and documenting design decisions.",
    relatedLinks: [
      { label: "View all EIPs", href: "/standards?repo=eips" },
      { label: "EIP-1 Process", href: "https://eips.ethereum.org/EIPS/eip-1" },
    ],
  },
  {
    id: "what-is-erc",
    category: "basics",
    question: "What is an ERC?",
    answer:
      "An ERC (Ethereum Request for Comment) is a type of EIP that proposes application-level standards and conventions, such as token standards (ERC-20, ERC-721), name registries, and wallet formats. ERCs are critical for ecosystem interoperability.",
    relatedLinks: [
      { label: "View all ERCs", href: "/standards?repo=ercs" },
    ],
  },
  {
    id: "what-is-rip",
    category: "basics",
    question: "What is a RIP?",
    answer:
      "A RIP (Rollup Improvement Proposal) is a standards document for Layer 2 rollup solutions. RIPs define improvements and standards for rollup implementations, helping to coordinate development across the L2 ecosystem.",
    relatedLinks: [
      { label: "View all RIPs", href: "/standards?repo=rips" },
    ],
  },

  // ── Process ──
  {
    id: "draft-to-final",
    category: "process",
    question: "How does an EIP move from Draft to Final?",
    answer:
      "An EIP progresses through several stages: Draft → Review → Last Call → Final. During Draft, the proposal is being actively worked on. Review means it's ready for peer review. Last Call is the final review period before acceptance. Final means the EIP has been accepted and implemented. This process can take months to years depending on complexity and community consensus.",
    relatedLinks: [
      { label: "View EIP lifecycle", href: "/analytics/eips" },
    ],
  },
  {
    id: "who-are-editors",
    category: "process",
    question: "Who are EIP Editors?",
    answer:
      "EIP Editors are individuals responsible for managing the EIP process. They review proposals for formatting and process compliance, provide editorial guidance, and help move EIPs through the workflow. Editors do not make technical decisions about EIP acceptance.",
    relatedLinks: [
      { label: "View Editor activity", href: "/analytics/editors" },
      { label: "Explore by role", href: "/explore/roles" },
    ],
  },
  {
    id: "what-is-last-call",
    category: "process",
    question: "What is Last Call?",
    answer:
      "Last Call is the final review stage before an EIP becomes Final. During this period (typically 14 days), the community has a final opportunity to review and comment on the proposal. After Last Call completes without significant objections, the EIP can move to Final status.",
  },

  // ── Platform ──
  {
    id: "what-does-eipsinsight-track",
    category: "platform",
    question: "What does EIPsInsight track?",
    answer:
      "EIPsInsight tracks EIPs, ERCs, and RIPs across their entire lifecycle. We monitor status changes, pull request activity, governance signals, editor workload, contributor activity, and provide analytics on proposal velocity, bottlenecks, and ecosystem health.",
    relatedLinks: [
      { label: "View Analytics", href: "/analytics" },
      { label: "Explore Standards", href: "/standards" },
    ],
  },
  {
    id: "data-update-frequency",
    category: "platform",
    question: "How often is data updated?",
    answer:
      "Our data pipelines run continuously, syncing with GitHub repositories every few minutes. Analytics dashboards are cached for performance but refreshed regularly. Most data you see is near real-time, with some aggregated metrics updated hourly.",
  },
  {
    id: "can-download-data",
    category: "platform",
    question: "Can I download data?",
    answer:
      "Yes! Most pages include CSV or JSON export buttons. You can download standards lists, analytics data, PR information, and more. We believe in open data and encourage researchers to use our platform for analysis.",
    relatedLinks: [
      { label: "Export Standards", href: "/standards" },
      { label: "Export Analytics", href: "/analytics" },
    ],
  },
];
