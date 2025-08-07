import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface InfoItem {
  icon: string;
  text: string;
}

interface CompactInfoCardProps {
  title: string;
  titleIcon: LucideIcon;
  items: InfoItem[];
}

const CompactInfoCard = memo(({ title, titleIcon: TitleIcon, items }: CompactInfoCardProps) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TitleIcon className="w-4 h-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-start gap-2 p-2 bg-muted/30 rounded-lg">
            <span className="text-sm">{item.icon}</span>
            <p className="text-xs text-muted-foreground">{item.text}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
});

CompactInfoCard.displayName = 'CompactInfoCard';

export default CompactInfoCard;