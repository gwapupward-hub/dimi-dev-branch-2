import { Card, CardContent } from './ui/card';
import { Skeleton } from './ui/skeleton';

interface LibraryCardSkeletonProps {
  variant?: 'producer' | 'artist';
}

export default function LibraryCardSkeleton({ variant = 'producer' }: LibraryCardSkeletonProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Media Preview Skeleton (Producer only) */}
        {variant === 'producer' && (
          <Skeleton className="w-full aspect-video" />
        )}

        {/* Content */}
        <div className="p-3 sm:p-4">
          {variant === 'artist' && (
            <div className="flex items-center space-x-3 mb-3">
              <Skeleton className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 sm:h-5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          )}

          {variant === 'producer' && (
            <div className="mb-2">
              <Skeleton className="h-4 sm:h-5 w-3/4 mb-2" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3 mt-1" />
            </div>
          )}

          {/* Timeline Skeleton (Artist only) */}
          {variant === 'artist' && (
            <div className="space-y-1 mb-2">
              <Skeleton className="h-5 sm:h-6 w-full rounded-lg" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-3 w-10" />
              </div>
            </div>
          )}

          {/* Action Buttons Skeleton */}
          <div className="flex items-center justify-end space-x-1 mt-3">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
