export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-3 w-24 animate-pulse rounded-full bg-slate-300" />
            <div className="h-7 w-48 animate-pulse rounded-lg bg-slate-200" />
          </div>
          <div className="h-9 w-20 animate-pulse rounded-lg bg-slate-200" />
        </div>
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
        <div className="mb-5 h-20 animate-pulse rounded-xl bg-slate-200" />
        <div className="rounded-xl bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
          </div>
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
