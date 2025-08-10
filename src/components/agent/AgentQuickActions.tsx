
import React from 'react';
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowUpRight, 
  ArrowDownLeft,
  QrCode,
  Smartphone,
  Scan,
  Users
} from "lucide-react";

export const AgentQuickActions = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: "Retrait Client",
      icon: ArrowUpRight,
      color: "from-red-500 to-pink-500",
      onClick: () => navigate('/agent-withdrawal-advanced')
    },
    {
      title: "Dépôt Client",
      icon: ArrowDownLeft,
      color: "from-blue-500 to-cyan-500",
      onClick: () => navigate('/agent-deposit')
    },
    {
      title: "QR Code",
      icon: QrCode,
      color: "from-purple-500 to-violet-500",
      onClick: () => navigate('/qr-code')
    },
    {
      title: "Scanner",
      icon: Scan,
      color: "from-indigo-500 to-blue-500",
      onClick: () => navigate('/qr-payment')
    },
    {
      title: "Services Agent",
      icon: Users,
      color: "from-teal-500 to-green-500",
      onClick: () => navigate('/agent-services')
    },
    {
      title: "Recharge Mobile",
      icon: Smartphone,
      color: "from-orange-500 to-amber-500",
      onClick: () => navigate('/mobile-recharge')
    }
  ];

  return (
    <div className="px-6 mt-6">
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-5">Actions Agent</h2>
          <div className="grid grid-cols-2 gap-5">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="relative h-28 flex-col gap-3 bg-white border-0 hover:bg-gray-50 transition-all duration-300 hover:scale-105 shadow-lg"
                onClick={action.onClick}
              >
                <div className={`p-3 bg-gradient-to-r ${action.color} rounded-full min-w-[40px] min-h-[40px] flex items-center justify-center`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-base font-medium text-center">{action.title}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
