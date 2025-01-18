import { useGoogleSheets } from '../hooks/useGoogleSheets';
import { VirtualTable } from '@/components/VirtualDataTable';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';

export const Dashboard: React.FC = () => {
  const { logout } = useAuth();
  const sheetId = '1vwc803C8MwWBMc7ntCre3zJ5xZtG881HKkxlIrwwxNs';
  const { data, isLoading } = useGoogleSheets(sheetId);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">React Data Table View</h1>
          <Button variant="outline" onClick={logout}>Logout</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Data Table
              {isLoading && (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm font-normal">Loading data...</span>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div>Loading...</div>}>
              <VirtualTable data={data} isLoading={isLoading} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};