import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/Card';
import * as Icons from 'lucide-react';

type IconName = keyof typeof Icons;

interface KpiCardProps {
  title: string;
  value: string;
  change?: string;
  icon: string;
  className?: string;
  compact?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({ 
  title, 
  value, 
  change, 
  icon, 
  className = "",
  compact = false 
}) => {
  const Icon = Icons[icon as IconName] as React.ElementType;
  const isPositive = change && change.startsWith('+');

  return (
    <Card className={`h-full hover:shadow-md transition-all duration-200 border-slate-200/60 flex flex-col ${className}`}>
      <CardHeader className={`flex flex-row items-center justify-between ${compact ? 'pb-2' : 'pb-3'} flex-shrink-0`}>
        <CardTitle className={`font-medium text-slate-600 ${compact ? 'text-xs' : 'text-sm'} leading-tight`}>
          {title}
        </CardTitle>
        {Icon && (
          <div className={`bg-slate-100 rounded-lg flex-shrink-0 ${compact ? 'p-1.5' : 'p-2'}`}>
            <Icon className={`text-slate-600 ${compact ? 'h-3 w-3' : 'h-4 w-4'}`} />
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-0 flex-1 flex flex-col justify-between">
        <div className={`font-bold text-slate-800 mb-1 ${compact ? 'text-xl' : 'text-3xl'} leading-tight`}>
          {value}
        </div>
        {change && (
          <div className="flex items-center gap-1 flex-nowrap">
            <div className={`font-medium px-2 py-1 rounded-full flex-shrink-0 ${
              compact ? 'text-xs' : 'text-xs'
            } ${
              isPositive
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {change}
            </div>
            <span className={`text-slate-500 ${compact ? 'text-xs' : 'text-xs'} leading-tight whitespace-nowrap`}>
              fra forrige måned
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};