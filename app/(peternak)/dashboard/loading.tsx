export default function DashboardLoading() {
  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-neutral-100" />
        <div className="h-9 w-44 animate-pulse rounded-full bg-neutral-100" />
      </div>
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="h-28 animate-pulse rounded-lg bg-neutral-100" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-lg bg-neutral-100" />
        <div className="h-72 animate-pulse rounded-lg bg-neutral-100" />
      </div>
    </div>
  );
}
