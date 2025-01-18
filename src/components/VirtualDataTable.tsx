import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { GoogleSheetRow } from '@/types';

interface VirtualTableProps {
  data: GoogleSheetRow[];
  isLoading?: boolean;
}

export const VirtualTable: React.FC<VirtualTableProps> = ({ data, isLoading = false }) => {
  if (!data.length) return null;

  const headers = data[0];
  const rows = data.slice(1);
  
  const parentRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // Calculate column widths based on content
  const columnWidths = headers.map((header, index) => {
    const maxContentLength = Math.max(
      String(header).length,
      ...rows.map(row => String(row[index]).length)
    );
    return Math.min(Math.max(maxContentLength * 8 + 32, 100), 300);
  });

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
    overscan: 5,
  });

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (headerRef.current) {
      headerRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div 
        ref={headerRef}
        className="w-full overflow-hidden border-b border-gray-200"
      >
        <div className="flex min-w-full">
          {headers.map((header, index) => (
            <div
              key={index}
              className="flex h-9 items-center justify-start border-r border-gray-200 bg-green-100 px-4 py-2 font-medium text-gray-900 last:border-r-0 w-full"
              style={{
                minWidth: columnWidths[index],
              }}
            >
              <span className="truncate">
                {header}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Virtualized Body */}
      <div
        ref={parentRef}
        onScroll={handleScroll}
        className="w-full overflow-auto"
        style={{ height: '500px' }}
      >
        <div
          className="relative w-fit min-w-full"
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => (
            <div
              key={virtualRow.key}
              className="absolute left-0 top-0 flex w-full"
              style={{
                transform: `translateY(${virtualRow.start}px)`,
                height: '35px',
              }}
            >
              {rows[virtualRow.index].map((cell, cellIndex) => (
                <div
                  key={cellIndex}
                  className="flex h-full w-full items-center border-b border-r border-gray-200 bg-white px-4 last:border-r-0 hover:bg-gray-50"
                  style={{
                    minWidth: columnWidths[cellIndex],
                  }}
                >
                  <span className="truncate">
                    {cell}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-b-gray-900"></div>
        </div>
      )}
    </div>
  );
};