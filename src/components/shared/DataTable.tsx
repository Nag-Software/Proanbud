'use client';

import React, { useState } from 'react';
import { Search, Filter, MoreHorizontal } from 'lucide-react';
import { Card } from './Card';
import { ColumnDef } from '@/lib/types';

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  searchPlaceholder?: string;
  enableFiltering?: boolean;
  onRowClick?: (item: T) => void;
  responsive?: boolean;
  compactOnMobile?: boolean;
  maxHeight?: string;
}

export function DataTable<T extends Record<string, any>>({ 
  columns, 
  data, 
  searchPlaceholder = "Søk...",
  enableFiltering = false,
  onRowClick,
  responsive = true,
  compactOnMobile = true,
  maxHeight = "none"
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  // Filter data based on search term
  const filteredData = data.filter(item =>
    Object.values(item).some(value => 
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Sort data if sort config is set
  const sortedData = React.useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { key, direction: 'asc' };
    });
  };

  return (
    <Card className="flex flex-col h-full">
      {/* Search and filter bar */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
            />
          </div>
          {enableFiltering && (
            <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm whitespace-nowrap">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filter</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div 
        className="flex-1 overflow-auto"
        style={{ maxHeight: maxHeight !== "none" ? maxHeight : undefined }}
      >
        {/* Desktop Table */}
        {responsive ? (
          <>
            <div className="hidden sm:block">
              <table className="w-full">
                <thead className="sticky top-0 bg-gray-50 z-10">
                  <tr className="border-b border-gray-200">
                    {columns.map((column) => (
                      <th
                        key={column.accessorKey}
                        className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort(column.accessorKey)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="truncate">{column.header}</span>
                          {sortConfig?.key === column.accessorKey && (
                            <span className="text-primary flex-shrink-0">
                              {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedData.map((item, index) => (
                    <tr 
                      key={index} 
                      className={`hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                      onClick={() => onRowClick?.(item)}
                    >
                      {columns.map((column) => (
                        <td key={column.accessorKey} className="px-4 lg:px-6 py-4 text-sm text-gray-900">
                          <div className="max-w-xs truncate">
                            {column.cell 
                              ? column.cell({ getValue: () => item[column.accessorKey], row: { original: item } })
                              : item[column.accessorKey]
                            }
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout */}
            <div className="sm:hidden">
              <div className="divide-y divide-gray-200">
                {sortedData.map((item, index) => (
                  <div
                    key={index}
                    className={`p-4 ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''} transition-colors`}
                    onClick={() => onRowClick?.(item)}
                  >
                    <div className="space-y-2">
                      {columns.slice(0, compactOnMobile ? 3 : columns.length).map((column) => (
                        <div key={column.accessorKey} className="flex justify-between items-start">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider flex-shrink-0 mr-2">
                            {column.header}
                          </span>
                          <span className="text-sm text-gray-900 text-right flex-1 truncate">
                            {column.cell 
                              ? column.cell({ getValue: () => item[column.accessorKey], row: { original: item } })
                              : item[column.accessorKey]
                            }
                          </span>
                        </div>
                      ))}
                      {compactOnMobile && columns.length > 3 && (
                        <div className="pt-1 border-t border-gray-100">
                          <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
                            <MoreHorizontal className="h-3 w-3" />
                            Vis mer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          // Non-responsive traditional table
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {columns.map((column) => (
                  <th
                    key={column.accessorKey}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort(column.accessorKey)}
                  >
                    <div className="flex items-center gap-2">
                      {column.header}
                      {sortConfig?.key === column.accessorKey && (
                        <span className="text-primary">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedData.map((item, index) => (
                <tr 
                  key={index} 
                  className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((column) => (
                    <td key={column.accessorKey} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {column.cell 
                        ? column.cell({ getValue: () => item[column.accessorKey], row: { original: item } })
                        : item[column.accessorKey]
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Empty State */}
      {sortedData.length === 0 && (
        <div className="flex-1 flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-gray-500 text-sm">Ingen data funnet</p>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="mt-2 text-xs text-primary hover:text-primary/80"
              >
                Fjern søkefilter
              </button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}