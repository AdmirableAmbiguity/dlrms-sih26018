import { cn } from '../../lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function LoadingSkeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-skeleton-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}
