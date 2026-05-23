export default function DatasetDetailLoading() {
  return (
    <main className="min-h-screen bg-[#050B18] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-3 w-24 animate-shimmer rounded-full" />
            <div className="h-7 w-64 animate-shimmer rounded-lg" />
          </div>
          <div className="h-8 w-20 animate-shimmer rounded-full" />
        </div>
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-shimmer rounded-xl" />
          ))}
        </div>
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <div className="h-72 animate-shimmer rounded-xl" />
          <div className="h-72 animate-shimmer rounded-xl" />
        </div>
        <div className="mb-6 h-64 animate-shimmer rounded-xl" />
        <div className="h-96 animate-shimmer rounded-xl" />
      </div>
    </main>
  );
}
