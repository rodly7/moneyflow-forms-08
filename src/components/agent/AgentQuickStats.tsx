
import React from 'react';
import { Card } from "@/components/ui/card";

export const AgentQuickStats = () => {
  return (
    <div className="px-6 mt-6 mb-8">
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
          <div className="text-xl font-bold text-orange-700">0</div>
          <div className="text-xs text-orange-600">Aujourd'hui</div>
        </Card>
        <Card className="p-4 text-center bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="text-xl font-bold text-green-700">0</div>
          <div className="text-xs text-green-600">Cette semaine</div>
        </Card>
        <Card className="p-4 text-center bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <div className="text-xl font-bold text-blue-700">0</div>
          <div className="text-xs text-blue-600">Ce mois</div>
        </Card>
      </div>
    </div>
  );
};
