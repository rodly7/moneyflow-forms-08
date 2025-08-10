
import React from 'react';
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, BarChart3, FileText, Settings } from "lucide-react";

export const AgentServicesSection = () => {
  const navigate = useNavigate();

  return (
    <div className="px-6 mt-6">
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-5">Gestion & Rapports</h2>
          <div className="grid grid-cols-1 gap-4">
            <Button
              onClick={() => navigate('/transactions')}
              variant="outline"
              className="h-16 flex items-center justify-start gap-4 hover:bg-blue-50 border-blue-200"
            >
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                <History className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Historique des Transactions</div>
                <div className="text-sm text-gray-500">Voir toutes mes opérations</div>
              </div>
            </Button>

            <Button
              onClick={() => navigate('/agent-performance-dashboard')}
              variant="outline"
              className="h-16 flex items-center justify-start gap-4 hover:bg-green-50 border-green-200"
            >
              <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Performances Agent</div>
                <div className="text-sm text-gray-500">Mes statistiques et objectifs</div>
              </div>
            </Button>

            <Button
              onClick={() => navigate('/agent-reports')}
              variant="outline"
              className="h-16 flex items-center justify-start gap-4 hover:bg-purple-50 border-purple-200"
            >
              <div className="p-2 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Mes Rapports</div>
                <div className="text-sm text-gray-500">Rapports détaillés d'activité</div>
              </div>
            </Button>

            <Button
              onClick={() => navigate('/agent-settings')}
              variant="outline"
              className="h-16 flex items-center justify-start gap-4 hover:bg-gray-50 border-gray-200"
            >
              <div className="p-2 bg-gradient-to-r from-gray-500 to-slate-500 rounded-lg">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Paramètres Agent</div>
                <div className="text-sm text-gray-500">Configuration de mon compte</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
