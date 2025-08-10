
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface AgentActionButtonProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: "primary" | "secondary" | "outline";
  className?: string;
}

export const AgentActionButton = ({
  title,
  description,
  icon: Icon,
  onClick,
  variant = "primary",
  className = ""
}: AgentActionButtonProps) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl";
      case "secondary":
        return "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl";
      case "outline":
        return "border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 text-blue-700";
      default:
        return "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white";
    }
  };

  return (
    <Button
      onClick={onClick}
      className={`h-24 flex flex-col items-center justify-center gap-2 transform hover:-translate-y-1 transition-all duration-200 ${getVariantStyles()} ${className}`}
    >
      <Icon className="w-6 h-6" />
      <div className="text-center">
        <div className="font-semibold text-sm">{title}</div>
        <div className="text-xs opacity-90">{description}</div>
      </div>
    </Button>
  );
};
