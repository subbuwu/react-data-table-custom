import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Input } from "./ui/input";
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { debounce } from "lodash";

interface VirtualTableProps {
  data: string[][];
  isLoading?: boolean;
}

type SortDirection = "asc" | "desc";
type SortConfig = { column: number; direction: SortDirection } | null;

// Column configuration
const COLUMN_CONFIG = {
  Domain: { minWidth: 200, type: 'string' },
  Niche1: { minWidth: 150, type: 'string' },
  Niche2: { minWidth: 150, type: 'string' },
  Traffic: { minWidth: 120, type: 'number' },
  DR: { minWidth: 100, type: 'number' },
  DA: { minWidth: 100, type: 'number' },
  Language: { minWidth: 120, type: 'string' },
  Price: { minWidth: 120, type: 'number' },
  "Spam Score": { minWidth: 130, type: 'number' }
};

const isEmptyValue = (value: string): boolean => {
  return !value || 
    value === 'undefined' || 
    value === 'null' || 
    value === 'Not Provided' || 
    value.trim() === '' ||
    value === '-';
};

const parseNumericValue = (value: string): number => {
  const cleanValue = value.replace(/[^0-9.-]+/g, '');
  return parseFloat(cleanValue);
};

export const VirtualTable: React.FC<VirtualTableProps> = ({ data, isLoading = false }) => {
  if (!data.length) return null;

  const headers = data[0];
  const originalRows = useMemo(() => data.slice(1), [data]);
  const [rows, setRows] = useState(originalRows);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [hoveredHeader, setHoveredHeader] = useState<number | null>(null);

  const parentRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      if (!query.trim()) {
        setRows(originalRows);
      } else {
        const searchLower = query.toLowerCase();
        setRows(
          originalRows.filter((row) => {
            const domainValue = row[0]?.toLowerCase() || '';
            return domainValue.includes(searchLower);
          })
        );
      }
    }, 300),
    [originalRows]
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => debouncedSearch.cancel();
  }, [searchQuery, debouncedSearch]);

  const compareValues = useCallback((aValue: string, bValue: string, columnType: string, direction: SortDirection): number => {
    const aEmpty = isEmptyValue(aValue);
    const bEmpty = isEmptyValue(bValue);
    
    if (aEmpty && bEmpty) return 0;
    if (aEmpty) return 1; 
    if (bEmpty) return -1;

    if (columnType === 'number') {
      const aNum = parseNumericValue(aValue);
      const bNum = parseNumericValue(bValue);

      if (isNaN(aNum) && isNaN(bNum)) return 0;
      if (isNaN(aNum)) return 1; 
      if (isNaN(bNum)) return -1;

      const comparison = aNum - bNum;
      return direction === 'asc' ? comparison : -comparison;
    }

    const comparison = aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: 'base' });
    return direction === 'asc' ? comparison : -comparison;
  }, []);

  const sortRows = useCallback((rowsToSort: string[][], columnIndex: number, direction: SortDirection) => {
    const columnName = headers[columnIndex];
    const columnType = COLUMN_CONFIG[columnName as keyof typeof COLUMN_CONFIG]?.type || 'string';
    
    return [...rowsToSort].sort((a, b) => 
      compareValues(a[columnIndex], b[columnIndex], columnType, direction)
    );
  }, [headers, compareValues]);

  const handleSort = useCallback((columnIndex: number) => {
    setSortConfig((prevSort): SortConfig => {
      const newDirection: SortDirection =
        prevSort?.column === columnIndex && prevSort.direction === "asc"
          ? "desc"
          : "asc";

      const sortedRows = sortRows(rows, columnIndex, newDirection);
      setRows(sortedRows);

      return { column: columnIndex, direction: newDirection };
    });
  }, [rows, sortRows]);

  const columnWidths = useMemo(() =>
    headers.map((header) => {
      const config = COLUMN_CONFIG[header as keyof typeof COLUMN_CONFIG];
      return config?.minWidth || 150;
    }),
    [headers]
  );

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 10,
  });

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (headerRef.current) {
      headerRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  }, []);

  const getSortIcon = useCallback((columnIndex: number) => {
    if (sortConfig?.column !== columnIndex) {
      return <ArrowUpDown className="ml-2 h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4 text-blue-500" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4 text-blue-500" />
    );
  }, [sortConfig]);

  const formatCellValue = useCallback((value: string, columnType: string): string => {
    if (isEmptyValue(value)) return '-';
    
    if (columnType === 'number') {
      const num = parseNumericValue(value);
      return isNaN(num) ? '-' : num.toLocaleString();
    }
    
    return value;
  }, []);

  return (
    <div className="p-4 mx-auto min-h-screen bg-gray-50">
      <div className="mb-6 max-w-2xl mx-auto relative">
        <Input
          type="text"
          placeholder="Search by domain name..."
          aria-label="Search domains"
          className="pl-10 h-12 rounded-xl bg-white border border-gray-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-400 placeholder-gray-400 transition-all duration-200 hover:border-gray-300 shadow-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
      </div>

      <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg mx-4">
        <div ref={headerRef} className="w-full overflow-hidden border-b border-gray-200 bg-gray-50">
          <div className="flex min-w-full">
            {headers.map((header, index) => (
              <div
                key={index}
                className={`group flex h-12 items-center justify-between border-r border-gray-200 px-4 py-2 font-semibold text-gray-700 last:border-r-0 cursor-pointer transition-colors duration-150 select-none
                  ${hoveredHeader === index ? 'bg-gray-100' : ''}
                  ${sortConfig?.column === index ? 'bg-blue-50 text-blue-700' : ''}`}
                style={{
                  minWidth: columnWidths[index],
                  maxWidth: columnWidths[index],
                }}
                onClick={() => handleSort(index)}
                onMouseEnter={() => setHoveredHeader(index)}
                onMouseLeave={() => setHoveredHeader(null)}
              >
                <span className="truncate">{header}</span>
                {getSortIcon(index)}
              </div>
            ))}
          </div>
        </div>

        <div
          ref={parentRef}
          onScroll={handleScroll}
          className="w-full overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
          style={{ height: "calc(100vh - 220px)" }}
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
                className="absolute left-0 top-0 flex w-full hover:bg-gray-50 transition-colors duration-150"
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                  height: "48px",
                }}
              >
                {rows[virtualRow.index].map((cell, cellIndex) => {
                  const columnName = headers[cellIndex];
                  const columnType = COLUMN_CONFIG[columnName as keyof typeof COLUMN_CONFIG]?.type || 'string';
                  
                  return (
                    <div
                      key={cellIndex}
                      className="flex h-full items-center border-b border-r border-gray-200 px-4 last:border-r-0"
                      style={{
                        minWidth: columnWidths[cellIndex],
                        maxWidth: columnWidths[cellIndex],
                      }}
                    >
                      <span className="truncate">
                        {formatCellValue(cell, columnType)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-400 border-t-transparent shadow-md"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VirtualTable;