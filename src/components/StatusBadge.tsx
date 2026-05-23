import type { TestStep } from "@/lib/parseReport";

const styles: Record<TestStep["statusText"], string> = {
  Pass: "bg-success/15 text-success border-success/30",
  Fail: "bg-destructive/15 text-destructive border-destructive/40",
  Skipped: "bg-warning/15 text-warning border-warning/30",
  Warning: "bg-orange-500/15 text-orange-400 border-orange-400/30",
  Unknown: "bg-muted text-muted-foreground border-border",
  Running: "bg-blue-500/15 text-blue-400 border-blue-400/30",
};

export function StatusBadge({ status, code }: { status: TestStep["statusText"]; code?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
      {code && <span className="mono opacity-60">·{code}</span>}
    </span>
  );
}
