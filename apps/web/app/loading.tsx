export default function Loading() {
  return (
    <div className="min-h-[70vh]" aria-live="polite" aria-busy="true">
      <p className="text-xs font-bold text-accent">Loading workspace</p>
      <div className="mt-3 h-12 max-w-3xl rounded-md bg-muted-soft" />
      <div className="mt-3 h-5 max-w-2xl rounded-md bg-line-soft" />
      <div className="mt-8 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="h-80 rounded-xl border border-line bg-panel" />
        <div className="h-80 rounded-xl border border-line bg-panel" />
      </div>
    </div>
  );
}
