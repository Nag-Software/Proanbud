import React from 'react';
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
}

export const KpiGrid: React.FC<KpiGridProps> = ({ data, className = "" }) => {
  // Defensive check for empty data
  if (!data || data.length === 0) {
    return null;
  }

  const renderKpiCards = () => {
    return data.map((kpi, index) => (
      <KpiCard
        key={`${kpi.title}-${index}`}
        title={kpi.title}
        value={kpi.value}
        change={kpi.change}
        icon={kpi.icon}
        className="min-h-[120px]"
      />
    ));
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Flexbox KPI Grid with responsive wrapping */}
      <div
        className="kpi-grid flex flex-wrap gap-4 w-full"
        style={{
          minHeight: '120px',
        }}
      >
        {data.map((kpi, index) => {
          // Sjekk om det er "Hurtigstatistikk" eller "Tilbud Status"
          const isSpecial = kpi.title === 'Hurtigstatistikk' || kpi.title === 'Tilbud Status';
          return (
            <div
              key={`${kpi.title}-${index}`}
              className="flex-1 min-w-[200px] max-w-full"
              style={{
                minWidth: isSpecial ? '4rem' : '200px',
                minHeight: isSpecial ? '4rem' : '120px',
                flexBasis: '23%', // 4x1
              }}
            >
              <KpiCard
                title={kpi.title}
                value={kpi.value}
                change={kpi.change}
                icon={kpi.icon}
                className="h-full"
              />
            </div>
          );
        })}
      </div>
      <style jsx global>{`
        @media (max-width: 1024px) {
          /* 2x2 layout */
          .kpi-grid > div {
            flex-basis: 50%;
            max-width: 50%;
          }
        }
        @media (max-width: 640px) {
          /* 1x4 layout */
          .kpi-grid > div {
            flex-basis: 100%;
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

// Additional layout variants
export const KpiGridCompact: React.FC<KpiGridProps> = ({ data, className = "" }) => {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="flex flex-wrap gap-3">
        {data.map((kpi, index) => (
          <div key={`${kpi.title}-${index}`} className="flex-1 min-w-[200px] max-w-[300px]">
            <KpiCard
              title={kpi.title}
              value={kpi.value}
              change={kpi.change}
              icon={kpi.icon}
              compact={true}
              className="h-full"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// Layout-specific variants
export const KpiGrid4x1: React.FC<KpiGridProps> = ({ data, className = "" }) => (
  <div className={`w-full ${className}`}>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-fr">
      {data.map((kpi, index) => (
        <KpiCard key={`${kpi.title}-${index}`} {...kpi} className="min-h-[120px]" />
      ))}
    </div>
  </div>
);

export const KpiGrid2x2: React.FC<KpiGridProps> = ({ data, className = "" }) => (
  <div className={`w-full ${className}`}>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-fr max-w-2xl">
      {data.map((kpi, index) => (
        <KpiCard key={`${kpi.title}-${index}`} {...kpi} className="min-h-[140px]" />
      ))}
    </div>
  </div>
);

export const KpiGrid1x4: React.FC<KpiGridProps> = ({ data, className = "" }) => (
  <div className={`w-full ${className}`}>
    <div className="grid grid-cols-1 gap-4 max-w-md">
      {data.map((kpi, index) => (
        <KpiCard key={`${kpi.title}-${index}`} {...kpi} className="min-h-[100px]" />
      ))}
    </div>
  </div>
);