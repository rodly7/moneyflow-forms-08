
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

export interface AgentStatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  className?: string;
}

const AgentStatsCard: React.FC<AgentStatsCardProps> = ({ title, value, icon: Icon, className = "" }) => {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
};

export default AgentStatsCard;
