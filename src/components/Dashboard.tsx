import { Suspense } from 'react';
import { useGoogleSheets } from '../hooks/useGoogleSheets';
import { VirtualTable } from '@/components/VirtualDataTable';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const LoadingTableSkeleton = () => (
  <div className="space-y-3 sm:space-y-4 mt-4">
    <div className="flex items-center space-x-3 sm:space-x-4 px-3 sm:px-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-6 sm:h-8 bg-gray-200 rounded animate-pulse"
          style={{ width: `${Math.random() * (200 - 100) + 100}px` }}
        />
      ))}
    </div>
    {[1, 2, 3, 4, 5].map((row) => (
      <div key={row} className="flex items-center space-x-3 sm:space-x-4 px-3 sm:px-4">
        {[1, 2, 3, 4].map((col) => (
          <div
            key={col}
            className="h-5 sm:h-6 bg-gray-100 rounded animate-pulse"
            style={{ width: `${Math.random() * (150 - 80) + 80}px` }}
          />
        ))}
      </div>
    ))}
  </div>
);

const LoadingOverlay = () => (
  <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex flex-col items-center justify-center">
    <div className="flex flex-col items-center space-y-3 sm:space-y-4">
      <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-blue-500" />
      <div className="text-sm text-gray-600">Loading data... Chunking data...</div>
    </div>
  </div>
);

export const Dashboard = () => {
  const { logout } = useAuth();
  const sheetId = '1vwc803C8MwWBMc7ntCre3zJ5xZtG881HKkxlIrwwxNs';
  const { data, isLoading } = useGoogleSheets(sheetId);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <h1 className="text-2xl sm:text-3xl font-bold">React Data Table View</h1>
            {isLoading && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm whitespace-nowrap self-start sm:self-auto">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Loading data...</span>
              </div>
            )}
          </div>
          <Button variant="outline" onClick={logout} className="w-full sm:w-auto">
            Logout
          </Button>
        </div>

        <Card className="relative overflow-hidden">
          
          <CardContent className="relative min-h-[400px] p-0">
            <Suspense fallback={<LoadingTableSkeleton />}>
              {isLoading ? (
                <>
                  <LoadingOverlay />
                  <LoadingTableSkeleton />
                </>
              ) : (
                <VirtualTable data={data} isLoading={isLoading} />
              )}
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;