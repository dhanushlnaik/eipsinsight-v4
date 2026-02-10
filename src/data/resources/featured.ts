export interface FeaturedResource {
  id: string;
  title: string;
  type: "blog" | "video" | "news" | "doc";
  description: string;
  link: string;
  image?: string;
}

export const featuredResources: FeaturedResource[] = [
  {
    id: "eip-governance",
    title: "How EIP Governance Works",
    type: "blog",
    description:
      "A deep dive into the decision-making process behind Ethereum Improvement Proposals.",
    link: "/resources/blogs/eip-governance",
  },
  {
    id: "eip-1559",
    title: "What is EIP-1559?",
    type: "video",
    description:
      "An explainer video covering the fee market changes introduced by EIP-1559.",
    link: "/resources/videos/eip-1559-explained",
  },
  {
    id: "dencun-upgrade",
    title: "Dencun Upgrade Explained",
    type: "blog",
    description:
      "Everything you need to know about the Dencun network upgrade and its impact.",
    link: "/resources/blogs/dencun-upgrade",
  },
  {
    id: "eip-process-doc",
    title: "EIP Process Documentation",
    type: "doc",
    description:
      "Official documentation on how to write and submit an EIP.",
    link: "/resources/docs#eip-process",
  },
];
