
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface WithdrawalNotificationBellProps {
  notificationCount: number;
  onClick: () => void;
  className?: string;
  isAnimated?: boolean;
}

const WithdrawalNotificationBell = ({ 
  notificationCount, 
  onClick, 
  className = "",
  isAnimated = true
}: WithdrawalNotificationBellProps) => {
  return (
    <div className="flex flex-col items-center">
      <Button
        variant="outline"
        size="sm"
        onClick={onClick}
        className={`relative p-3 h-16 w-full bg-white border-gray-200 hover:bg-gray-50 ${className} ${
          isAnimated && notificationCount > 0 ? 'animate-pulse border-orange-300 bg-orange-50' : ''
        }`}
      >
        <div className="flex flex-col items-center space-y-1">
          <Bell className={`w-5 h-5 ${notificationCount > 0 ? 'text-orange-600' : 'text-gray-600'}`} />
          <span className="text-xs font-medium">
            {notificationCount > 0 ? 'Retrait' : 'Notifications'}
          </span>
        </div>
        {notificationCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-orange-500 hover:bg-orange-600 border-white border-2"
          >
            {notificationCount > 9 ? '9+' : notificationCount}
          </Badge>
        )}
      </Button>
    </div>
  );
};

export default WithdrawalNotificationBell;
