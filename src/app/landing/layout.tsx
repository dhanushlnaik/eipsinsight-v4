import { ReactNode } from "react";

export default function LayoutPublic({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8f6f2] dark:bg-[#093a3e] text-[#093a3e] dark:text-[#f8f6f2]">
      <main>{children}</main>
    </div>
  );
}