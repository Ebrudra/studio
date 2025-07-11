import * as React from 'react';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import ReportClientPage from '@/components/report/report-client-page';

function ReportLoading() {
  return (
    <div className="p-6 bg-background">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="border-b pb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-40" />
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-9 w-32" />
            </div>
          </div>
        </div>
        <div className="space-y-4 p-6">
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="space-y-4 mt-6">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<ReportLoading />}>
      <ReportClientPage />
    </Suspense>
  );
}
