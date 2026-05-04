import { Skeleton } from "@/components/ui/skeleton";

export const PageSkeleton = () => (
  <div className="min-h-screen bg-slate-50 p-4">
    <div className="max-w-5xl mx-auto space-y-6">
      <Skeleton className="h-16 w-full bg-white" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-32 bg-white rounded-2xl" />
        <Skeleton className="h-32 bg-white rounded-2xl" />
        <Skeleton className="h-32 bg-white rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-24 bg-white rounded-2xl" />
          <Skeleton className="h-24 bg-white rounded-2xl" />
          <Skeleton className="h-24 bg-white rounded-2xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-20 bg-white rounded-2xl" />
          <Skeleton className="h-20 bg-white rounded-2xl" />
          <Skeleton className="h-32 bg-primary/10 rounded-2xl" />
        </div>
      </div>
    </div>
  </div>
);

export const CardSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-10 w-24 rounded-full" />
      </div>
    ))}
  </div>
);

export const StatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="bg-white rounded-2xl p-6 border-none shadow-sm">
        <Skeleton className="h-4 w-32 mb-4" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-2 w-full mt-4 rounded-full" />
      </div>
    ))}
  </div>
);