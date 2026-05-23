export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-[#050B18] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-3 w-24 animate-shimmer rounded-full" />
            <div className="h-7 w-48 animate-shimmer rounded-lg" />
          </div>
          <div className="h-9 w-20 animate-shimmer rounded-lg" />
        </div>
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-shimmer rounded-xl" />
          ))}
        </div>
        <div className="mb-5 h-20 animate-shimmer rounded-xl" />
        <div className="rounded-xl border border-white/5 bg-zinc-900">
          <div className="border-b border-white/5 px-5 py-4">
            <div className="h-5 w-32 animate-shimmer rounded-lg" />
          </div>
          <div className="space-y-3 p-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 animate-shimmer rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
