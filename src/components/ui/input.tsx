import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-colors",
        className
      )}
      style={{
        background: "var(--input-bg)",
        border: "1px solid var(--input-border)",
        color: "var(--foreground)",
      }}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none",
        className
      )}
      style={{
        background: "var(--input-bg)",
        border: "1px solid var(--input-border)",
        color: "var(--foreground)",
      }}
      {...props}
    />
  );
}
