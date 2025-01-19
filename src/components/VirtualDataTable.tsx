// VirtualTable.tsx
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

// Column configuration with responsive widths
const COLUMN_CONFIG = {
  Domain: { minWidth: { mobile: 180, desktop: 200 }, type: 'string' },
  Niche1: { minWidth: { mobile: 130, desktop: 150 }, type: 'string' },
  Niche2: { minWidth: { mobile: 130, desktop: 150 }, type: 'string' },
  Traffic: { minWidth: { mobile: 100, desktop: 120 }, type: 'number' },
  DR: { minWidth: { mobile: 80, desktop: 100 }, type: 'number' },
  DA: { minWidth: { mobile: 80, desktop: 100 }, type: 'number' },
  Language: { minWidth: { mobile: 100, desktop: 120 }, type: 'string' },
  Price: { minWidth: { mobile: 100, desktop: 120 }, type: 'number' },
  "Spam Score": { minWidth: { mobile: 110, desktop: 130 }, type: 'number' }
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  
  const parentRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef(0);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (!parentRef.current) return;
      touchStart.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!parentRef.current) return;
      const touchY = e.touches[0].clientY;
      const distance = touchY - touchStart.current;
      
      if (distance > 0 && parentRef.current.scrollTop === 0) {
        setIsPulling(true);
        setPullDistance(distance);
        e.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      if (pullDistance > 80) {
        // Trigger refresh
        window.location.reload();
      }
      setIsPulling(false);
      setPullDistance(0);
    };

    const element = parentRef.current;
    if (element) {
      element.addEventListener('touchstart', handleTouchStart);
      element.addEventListener('touchmove', handleTouchMove, { passive: false });
      element.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      if (element) {
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchmove', handleTouchMove);
        element.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [pullDistance]);

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
      return config ? (isMobile ? config.minWidth.mobile : config.minWidth.desktop) : (isMobile ? 130 : 150);
    }),
    [headers, isMobile]
  );

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => isMobile ? 40 : 48,
    overscan: 10,
  });

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (headerRef.current) {
      headerRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  }, []);

  const getSortIcon = useCallback((columnIndex: number) => {
    if (sortConfig?.column !== columnIndex) {
      return <ArrowUpDown className="ml-2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="ml-2 h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
    ) : (
      <ArrowDown className="ml-2 h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
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
    <div className="p-2 sm:p-4 mx-auto w-full bg-gray-50">
      <div className="mb-4 sm:mb-6 w-full relative sm:max-w-2xl mx-auto px-2 sm:px-0">
        <Input
          type="text"
          placeholder="Search by domain name..."
          aria-label="Search domains"
          className="pl-12 h-10 sm:h-12 text-sm sm:text-base rounded-lg sm:rounded-xl bg-white border border-gray-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-400 placeholder-gray-400 transition-all duration-200 hover:border-gray-300 shadow-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
      </div>

      <div className="relative overflow-hidden rounded-lg sm:rounded-xl border border-gray-200 bg-white shadow-lg mx-2 sm:mx-4">
        {/* Mobile scroll indicator */}
        {isMobile && (
          <div className="block sm:hidden text-xs text-gray-500 px-4 py-2 bg-gray-50 border-b border-gray-200 text-center">
            ← Scroll horizontally to see more →
          </div>
        )}
        
        {/* Pull to refresh indicator */}
        {isMobile && isPulling && (
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 transform origin-left transition-transform duration-300"
            style={{ transform: `scaleX(${Math.min(pullDistance / 80, 1)})` }}
          />
        )}

        <div ref={headerRef} className="w-full overflow-hidden border-b border-gray-200 bg-gray-50">
          <div className="flex min-w-fit">
            {headers.map((header, index) => (
              <div
                key={index}
                className={`group flex h-10 sm:h-12 items-center justify-between 
                  border-r border-gray-200 px-3 sm:px-4 py-2 text-sm sm:text-base 
                  font-semibold text-gray-700 last:border-r-0 cursor-pointer
                  hover:bg-gray-100 transition-colors duration-150 select-none
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
          className="w-full overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent overscroll-y-contain"
          style={{ 
            height: isMobile ? "calc(100vh - 280px)" : "calc(100vh - 220px)",
            maxHeight: "600px" 
          }}
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
                  height: isMobile ? "40px" : "48px",
                }}
              >
                {rows[virtualRow.index].map((cell, cellIndex) => {
                  const columnName = headers[cellIndex];
                  const columnType = COLUMN_CONFIG[columnName as keyof typeof COLUMN_CONFIG]?.type || 'string';
                  
                  return (
                    <div
                      key={cellIndex}
                      className="flex h-full items-center border-b border-r border-gray-200 
                        px-3 sm:px-4 py-2 text-sm sm:text-base last:border-r-0"
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
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
            <div className="h-10 w-10 sm:h-12 sm:w-12 animate-spin rounded-full 
              border-4 border-blue-400 border-t-transparent shadow-md" />
          </div>
        )}
      </div>
    </div>
  );
}