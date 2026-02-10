export interface TeamMember {
  name: string;
  role: string;
  status: "active" | "inactive";
  avatar?: string;
  bio?: string;
  github?: string;
  twitter?: string;
}

export const team: TeamMember[] = [
  {
    name: "Pooja Ranjan",
    role: "Founder",
    status: "active",
    github: "poojaranjan",
  },
  {
    name: "Yash Kamal Chaturvedi",
    role: "Operations Lead",
    status: "active",
  },
  {
    name: "Dhanush Naik",
    role: "Full Stack Engineer",
    status: "active",
    github: "dhanushlnaik",
  },
  {
    name: "Ayush Shetty",
    role: "Product Engineer",
    status: "active",
  },
];
