
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface ActionItem {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
}

interface CompactActionGridProps {
  title: string;
  titleIcon: LucideIcon;
  actions: ActionItem[];
}

const CompactActionGrid = ({ title, titleIcon: TitleIcon, actions }: CompactActionGridProps) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TitleIcon className="w-4 h-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {actions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <Button
                key={index}
                variant={action.variant || "default"}
                onClick={action.onClick}
                className="h-20 flex flex-col gap-2 p-4 bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                size="sm"
              >
                <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                  <IconComponent className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-medium text-center leading-tight text-white">
                  {action.label}
                </span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default memo(CompactActionGrid);
