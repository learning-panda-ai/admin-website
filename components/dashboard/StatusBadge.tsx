const STATUS_STYLES: Record<string, string> = {
  pending:
    "bg-slate-700 text-slate-300",
  queued:
    "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  processing:
    "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  completed:
    "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
  failed:
    "bg-red-500/20 text-red-300 border border-red-500/30",
};

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        STATUS_STYLES[status] ?? STATUS_STYLES.pending
      }`}
    >
      {status === "processing" && (
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
      )}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
