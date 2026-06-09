"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Menu } from "lucide-react";

export function Shell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 overflow-y-auto p-3 md:p-6 ml-0 md:ml-64 pt-12 md:pt-6">
        <button
          className="md:hidden fixed top-3 left-3 z-30 p-2 rounded-lg"
          style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" style={{ color: "var(--foreground)" }} />
        </button>
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
