import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatItem {
  label: string;
  value: string | number;
  icon: LucideIcon;
  gradient: string;
  textColor: string;
}

interface CompactStatsGridProps {
  stats: StatItem[];
}

const CompactStatsGrid = memo(({ stats }: CompactStatsGridProps) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat, index) => (
        <Card key={index} className={`${stat.gradient} text-white border-0`}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className={`${stat.textColor} text-xs font-medium uppercase`}>
                  {stat.label}
                </p>
                <p className="text-lg font-bold mt-1">{stat.value}</p>
              </div>
              <stat.icon className="w-6 h-6 opacity-80" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

CompactStatsGrid.displayName = 'CompactStatsGrid';

export default CompactStatsGrid;