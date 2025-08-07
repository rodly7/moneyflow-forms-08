
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface NotificationBellProps {
  notificationCount: number;
  onClick: () => void;
  className?: string;
}

const NotificationBell = ({ notificationCount, onClick, className = "" }: NotificationBellProps) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={`relative p-2 ${className}`}
    >
      <Bell className="w-6 h-6 text-gray-600" />
      {notificationCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
        >
          {notificationCount > 9 ? '9+' : notificationCount}
        </Badge>
      )}
    </Button>
  );
};

export default NotificationBell;
