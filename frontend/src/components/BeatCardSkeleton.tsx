import { Card, CardContent } from './ui/card';
import { Skeleton } from './ui/skeleton';

export default function BeatCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/50">
      {/* Media Preview Skeleton */}
      <Skeleton className="w-full aspect-video" />

      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
          {/* Play Button Skeleton */}
          <Skeleton className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full" />

          {/* Beat Info Skeleton */}
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-4 sm:h-5 w-3/4" />
            <Skeleton className="h-3 sm:h-4 w-full" />
            <Skeleton className="h-3 w-1/3" />
          </div>

          {/* Record Button Skeleton */}
          <Skeleton className="flex-shrink-0 h-7 sm:h-8 w-16 sm:w-20" />
        </div>

        {/* Timeline Skeleton */}
        <div className="space-y-1">
          <Skeleton className="h-5 sm:h-6 w-full rounded-lg" />
          <div className="flex justify-between">
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-5 sm:h-6 w-8" />
            <Skeleton className="h-3 w-10" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
