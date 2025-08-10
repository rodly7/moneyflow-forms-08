
import React from 'react';
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, BarChart3, FileText, Settings, Users } from "lucide-react";

export const ModernAgentServices = () => {
  const navigate = useNavigate();

  const services = [
    {
      title: "Historique Transactions",
      description: "Voir toutes mes opérations",
      icon: History,
      color: "hover:bg-blue-50 border-blue-200",
      onClick: () => navigate('/transactions')
    },
    {
      title: "Performances Agent",
      description: "Mes statistiques et objectifs",
      icon: BarChart3,
      color: "hover:bg-green-50 border-green-200",
      onClick: () => navigate('/agent-performance-dashboard')
    },
    {
      title: "Rapports Détaillés",
      description: "Rapports d'activité",
      icon: FileText,
      color: "hover:bg-purple-50 border-purple-200",
      onClick: () => navigate('/agent-reports')
    },
    {
      title: "Paramètres Agent",
      description: "Configuration de compte",
      icon: Settings,
      color: "hover:bg-gray-50 border-gray-200",
      onClick: () => navigate('/agent-settings')
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-600" />
          Gestion & Rapports
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((service, index) => (
            <Button
              key={index}
              variant="outline"
              className={`h-16 flex items-center justify-start gap-4 ${service.color} text-left p-4`}
              onClick={service.onClick}
            >
              <div className="p-2 bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg">
                <service.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-semibold">{service.title}</div>
                <div className="text-sm text-gray-500">{service.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
