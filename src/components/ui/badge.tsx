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
    default: { background: "var(--badge-default-bg)", color: "var(--badge-default-text)" },
    success: { background: "var(--badge-success-bg)", color: "var(--badge-success-text)" },
    warning: { background: "var(--badge-warning-bg)", color: "var(--badge-warning-text)" },
    danger: { background: "var(--badge-danger-bg)", color: "var(--badge-danger-text)" },
    info: { background: "var(--badge-info-bg)", color: "var(--badge-info-text)" },
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
