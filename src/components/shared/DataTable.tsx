'use client';

import React, { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { Card } from './Card';
import { ColumnDef } from '@/lib/types';

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  searchPlaceholder?: string;
  enableFiltering?: boolean;
  onRowClick?: (item: T) => void;
}

export function DataTable<T extends Record<string, any>>({ 
  columns, 
  data, 
  searchPlaceholder = "Søk...",
  enableFiltering = false,
  onRowClick
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
    <Card>
      {/* Search and filter bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          {enableFiltering && (
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
              <Filter className="h-4 w-4" />
              Filter
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
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
      </div>

      {sortedData.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Ingen data funnet</p>
        </div>
      )}
    </Card>
  );
}