const statusClass: Record<string, string> = {
  healthy: "bg-ok-soft text-ok-ink",
  pass: "bg-ok-soft text-ok-ink",
  approved: "bg-ok-soft text-ok-ink",
  contained: "bg-ok-soft text-ok-ink",
  warning: "bg-amber-soft text-amber-ink",
  pending: "bg-amber-soft text-amber-ink",
  acknowledged: "bg-amber-soft text-amber-ink",
  investigating: "bg-amber-soft text-amber-ink",
  blocked: "bg-danger-soft text-danger-ink",
  critical: "bg-danger-soft text-danger-ink",
  rejected: "bg-danger-soft text-danger-ink",
  "rolled-back": "bg-danger-soft text-danger-ink",
  unknown: "bg-muted-soft text-muted",
};

const dotClass: Record<string, string> = {
  healthy: "bg-ok",
  pass: "bg-ok",
  approved: "bg-ok",
  contained: "bg-ok",
  warning: "bg-amber",
  pending: "bg-amber",
  acknowledged: "bg-amber",
  investigating: "bg-amber",
  blocked: "bg-danger",
  critical: "bg-danger",
  rejected: "bg-danger",
  "rolled-back": "bg-danger",
  unknown: "bg-muted",
};

export function StatusMark({ status, label }: { status: string; label?: string }) {
  const normalizedStatus = status.toLowerCase();
  const className = statusClass[normalizedStatus] ?? statusClass.unknown;
  const dot = dotClass[normalizedStatus] ?? dotClass.unknown;

  return (
    <span className={`inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs font-bold ${className}`}>
      <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} aria-hidden="true" />
      {label ?? status}
    </span>
  );
}
