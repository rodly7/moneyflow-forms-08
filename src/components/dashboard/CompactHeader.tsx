import { memo } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, LogOut, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import EnhancedNotificationSystem from "@/components/notifications/EnhancedNotificationSystem";

interface CompactHeaderProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onRefresh?: () => void;
  onSignOut: () => void;
  isLoading?: boolean;
  showNotifications?: boolean;
}

const CompactHeader = memo(({ 
  title, 
  subtitle, 
  icon, 
  onRefresh, 
  onSignOut, 
  isLoading = false,
  showNotifications = true 
}: CompactHeaderProps) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h1 className="text-lg font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {showNotifications && <EnhancedNotificationSystem />}
        {onRefresh && (
          <Button 
            variant="outline" 
            size="default" 
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        )}
        <Button 
          variant="outline" 
          size="default" 
          onClick={onSignOut}
        >
          <LogOut className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
});

CompactHeader.displayName = 'CompactHeader';

export default CompactHeader;