import { cn } from "@/lib/utils";

export function Badge({
  className,
  children,
  variant = "default",
}: {
  className?: string;
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}) {
  const styles: Record<string, React.CSSProperties> = {
    default: { background: "var(--badge-bg)", color: "var(--muted)" },
    success: { background: "#052e16", color: "#4ade80" },
    warning: { background: "#451a03", color: "#fbbf24" },
    danger: { background: "#450a0a", color: "#f87171" },
    info: { background: "#1e3a5f", color: "#60a5fa" },
  };

  return (
    <span
      className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium leading-none", className)}
      style={styles[variant]}
    >
      {children}
    </span>
  );
}
