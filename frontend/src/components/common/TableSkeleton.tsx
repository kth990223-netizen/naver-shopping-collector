import Skeleton from "./Skeleton";

interface Props {
  rows?: number;
}

export default function TableSkeleton({ rows = 8 }: Props) {
  return (
    <div>
      <Skeleton className="mb-6 h-8 w-40" />
      <Skeleton className="mb-6 h-4 w-32" />
      <Skeleton className="mb-5 h-10 w-72" />

      <div className="overflow-hidden rounded-xl bg-white shadow">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-slate-100 px-4 py-3 last:border-0"
          >
            <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-24 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
