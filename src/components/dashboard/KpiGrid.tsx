import React, { useEffect, useRef } from 'react';
import { KpiCard } from './KpiCard';

interface KpiData {
  title: string;
  value: string;
  change: string;
  icon: string;
}

interface KpiGridProps {
  data: KpiData[];
  className?: string;
  onHeightChange?: (height: number) => void;
}

export const KpiGrid: React.FC<KpiGridProps> = ({ data, className = "", onHeightChange }) => {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gridRef.current && onHeightChange) {
      // Use ResizeObserver to detect when grid height changes
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const height = entry.target.scrollHeight;
          onHeightChange(height);
        }
      });

      resizeObserver.observe(gridRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [onHeightChange]);

  // Defensive check for empty data - show default cards if no data
  const displayData = (!data || data.length === 0) ? [
    { title: 'Total Omsetning', value: '0 kr', change: '+0%', icon: 'DollarSign' },
    { title: 'Aktive Tilbud', value: '0', change: '+0%', icon: 'FileText' },
    { title: 'Vunnede Tilbud', value: '0', change: '+0%', icon: 'Award' },
    { title: 'Treffprosent', value: '0%', change: '+0%', icon: 'Target' },
    { title: 'Total Profitt', value: '0 kr', change: '+0%', icon: 'TrendingUp' }
  ] : data;

  return (
    <div className={`w-full ${className}`}>
      {/* CSS Grid KPI Grid with responsive columns */}
      <div
        ref={gridRef}
        className="kpi-grid grid gap-4 w-full"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gridAutoRows: 'minmax(130px, auto)',
        }}
      >
        {displayData.map((kpi, index) => {
          return (
            <KpiCard
              key={`${kpi.title}-${index}`}
              title={kpi.title}
              value={kpi.value}
              change={kpi.change}
              icon={kpi.icon}
              className="h-full"
            />
          );
        })}
      </div>
    </div>
  );
};