
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { formatCurrency } from "@/integrations/supabase/client";

interface AgentStatsCardProps {
  title: string;
  amount: number;
  icon: LucideIcon;
  color: string;
  isLoading?: boolean;
}

export const AgentStatsCard = ({
  title,
  amount,
  icon: Icon,
  color,
  isLoading = false
}: AgentStatsCardProps) => {
  return (
    <Card className={`bg-gradient-to-br ${color} border-opacity-50`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-80">{title}</p>
            {isLoading ? (
              <div className="animate-pulse bg-white/30 h-8 w-32 rounded mt-1"></div>
            ) : (
              <p className="text-2xl font-bold mt-1">
                {formatCurrency(amount, 'XAF')}
              </p>
            )}
          </div>
          <Icon className="w-8 h-8 opacity-70" />
        </div>
      </CardContent>
    </Card>
  );
};
