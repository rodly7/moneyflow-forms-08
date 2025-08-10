
import React from 'react';
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowUpRight, 
  ArrowDownLeft,
  QrCode,
  Smartphone,
  Scan,
  Users,
  CreditCard,
  Zap
} from "lucide-react";

export const ModernAgentQuickActions = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: "Retrait Client",
      description: "Effectuer un retrait",
      icon: ArrowUpRight,
      color: "from-red-500 to-pink-500",
      onClick: () => navigate('/agent-withdrawal-advanced')
    },
    {
      title: "Dépôt Client",
      description: "Effectuer un dépôt",
      icon: ArrowDownLeft,
      color: "from-blue-500 to-cyan-500",
      onClick: () => navigate('/agent-deposit')
    },
    {
      title: "Mon QR Code",
      description: "Afficher mon QR",
      icon: QrCode,
      color: "from-purple-500 to-violet-500",
      onClick: () => navigate('/qr-code')
    },
    {
      title: "Scanner QR",
      description: "Scanner un QR code",
      icon: Scan,
      color: "from-indigo-500 to-blue-500",
      onClick: () => navigate('/qr-payment')
    },
    {
      title: "Services Agent",
      description: "Gestion clientèle",
      icon: Users,
      color: "from-teal-500 to-green-500",
      onClick: () => navigate('/agent-services')
    },
    {
      title: "Recharge Mobile",
      description: "Crédits mobiles",
      icon: Smartphone,
      color: "from-orange-500 to-amber-500",
      onClick: () => navigate('/mobile-recharge')
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-600" />
          Actions Rapides
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2 hover:scale-105 transition-all duration-200 border-0 shadow-md hover:shadow-lg"
              onClick={action.onClick}
            >
              <div className={`p-3 bg-gradient-to-r ${action.color} rounded-full`}>
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-center">
                <div className="font-semibold text-sm">{action.title}</div>
                <div className="text-xs text-gray-500">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
