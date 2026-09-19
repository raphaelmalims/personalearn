import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ClassDetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading class">
      <div className="flex flex-col items-center gap-3 text-center">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>

      <Card className="flex min-h-0 flex-col">
        <CardHeader className="flex shrink-0 flex-row items-center justify-between gap-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
