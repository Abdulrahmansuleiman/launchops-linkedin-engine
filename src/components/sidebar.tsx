"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import {
  LayoutDashboard,
  Users,
  FileText,
  Send,
  BarChart3,
  Sun,
  Moon,
  X,
  Search,
  Briefcase,
  CheckSquare,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/content", label: "Content Studio", icon: FileText },
  { href: "/outreach", label: "Outreach", icon: Send },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/ad-intel", label: "Ad Intel", icon: Search },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/clients", label: "Clients", icon: Briefcase },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed left-0 top-0 h-full w-64 flex flex-col z-50 transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
        style={{
          background: "var(--sidebar)",
          borderRight: "1px solid var(--sidebar-border)",
        }}
      >
      <div
        className="p-6 border-b flex items-center justify-between"
        style={{ borderColor: "var(--sidebar-border)" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
            L
          </div>
          <span className="font-bold text-lg" style={{ color: "var(--foreground)" }}>
            LaunchOps
          </span>
        </div>
        <button
          className="md:hidden p-1 rounded hover:opacity-70"
          onClick={onClose}
          aria-label="Close menu"
        >
          <X className="w-5 h-5" style={{ color: "var(--muted)" }} />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: isActive ? "var(--nav-active)" : "transparent",
                color: isActive ? "#3b82f6" : "var(--muted)",
                border: isActive ? "1px solid var(--nav-active-border)" : "1px solid transparent",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "var(--nav-hover)";
                  e.currentTarget.style.color = "var(--foreground)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--muted)";
                }
              }}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div
        className="p-4 border-t space-y-3"
        style={{ borderColor: "var(--sidebar-border)" }}
      >
        <button
          onClick={toggle}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
          style={{ color: "var(--muted)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--nav-hover)";
            e.currentTarget.style.color = "var(--foreground)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--muted)";
          }}
        >
          {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>

        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-medium text-white shrink-0">
            R
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
              Raymon
            </p>
            <p className="text-xs truncate" style={{ color: "var(--muted)" }}>
              launchopsai.click
            </p>
          </div>
        </div>
      </div>
    </aside>
    </>
  );
}
