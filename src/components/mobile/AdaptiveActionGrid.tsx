
import React from 'react';
import { cn } from '@/lib/utils';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { LucideIcon } from 'lucide-react';

interface AdaptiveActionItem {
  icon: LucideIcon;
  label: string;
  color: string;
  route: string;
}

interface AdaptiveActionGridProps {
  items: AdaptiveActionItem[];
  minItemWidth: number;
  gap: number;
  renderItem: (action: AdaptiveActionItem) => React.ReactElement;
  className?: string;
}

export const AdaptiveActionGrid = ({
  items,
  minItemWidth,
  gap,
  renderItem,
  className
}: AdaptiveActionGridProps) => {
  const {
    screenWidth,
    getOptimalColumns
  } = useResponsiveLayout();

  const columns = getOptimalColumns(minItemWidth, gap);

  return (
    <div className={cn(
      'grid',
      `grid-cols-${columns}`,
      className
    )}
    style={{ gap: `${gap}px` }}
    >
      {items.map((item, index) => (
        <div key={index}>
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
};
