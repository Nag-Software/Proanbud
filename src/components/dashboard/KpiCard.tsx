import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/Card';
import * as Icons from 'lucide-react';

type IconName = keyof typeof Icons;

interface KpiCardProps {
  title: string;
  value: string;
  change?: string;
  icon: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({ title, value, change, icon }) => {
  const Icon = Icons[icon as IconName] as React.ElementType;
  const isPositive = change && change.startsWith('+');

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-text">{title}</CardTitle>
        {Icon && <Icon className="h-5 w-5 text-muted-text" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-text">{value}</div>
        {change && (
          <p className={`text-xs ${isPositive ? 'text-success' : 'text-danger'}`}>
            {change} fra forrige måned
          </p>
        )}
      </CardContent>
    </Card>
  );
};