export default function DatasetDetailLoading() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-3 w-24 animate-pulse rounded-full bg-slate-300" />
            <div className="h-7 w-64 animate-pulse rounded-lg bg-slate-200" />
          </div>
          <div className="h-9 w-28 animate-pulse rounded-lg bg-slate-200" />
        </div>
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <div className="h-72 animate-pulse rounded-xl bg-slate-200" />
          <div className="h-72 animate-pulse rounded-xl bg-slate-200" />
        </div>
        <div className="mb-6 h-64 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-96 animate-pulse rounded-xl bg-slate-200" />
      </div>
    </main>
  );
}
