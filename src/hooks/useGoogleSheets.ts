import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

const CHUNK_SIZE = 2000;

interface SheetMetadata {
  sheets: Array<{
    properties: {
      gridProperties: {
        rowCount: number;
      };
    };
  }>;
}

interface SheetData {
  values: string[][];
}

export const useGoogleSheets = (sheetId: string) => {
  const [totalRows, setTotalRows] = useState<number>(0);

  const fetchMetadata = async (): Promise<number> => {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?key=${apiKey}`;
    const response = await fetch(url);
    const data: SheetMetadata = await response.json();
    setTotalRows(data.sheets[0].properties.gridProperties.rowCount);
    return data.sheets[0].properties.gridProperties.rowCount;
  };

  const fetchChunk = async (startRow: number, endRow: number): Promise<SheetData> => {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    const range = `Sheet1!A${startRow}:Z${endRow}`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;
    const response = await fetch(url);
    return response.json();
  };

  const metadataQuery = useQuery({
    queryKey: ['sheetMetadata', sheetId],
    queryFn: fetchMetadata,
  });

  const dataQuery = useQuery({
    queryKey: ['sheetData', sheetId],
    queryFn: async () => {
      if (!totalRows) return [];
      
      const chunks: string[][] = [];
      let currentRow = 1;
      
      while (currentRow <= totalRows) {
        const chunk = await fetchChunk(currentRow, currentRow + CHUNK_SIZE - 1);
        if (chunk.values) {
          chunks.push(...chunk.values);
        }
        currentRow += CHUNK_SIZE;
      }
      
      return chunks;
    },
    enabled: totalRows > 0,
  });

  return {
    data: dataQuery.data || [],
    isLoading: metadataQuery.isLoading || dataQuery.isLoading,
    error: metadataQuery.error || dataQuery.error,
  };
};