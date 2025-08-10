
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Calendar, Clock, Target } from "lucide-react";

export const ModernAgentStats = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          Statistiques Rapides
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-orange-700">0</div>
            <div className="text-sm text-orange-600">Aujourd'hui</div>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-center mb-2">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-700">0</div>
            <div className="text-sm text-green-600">Cette semaine</div>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-center mb-2">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-700">0</div>
            <div className="text-sm text-blue-600">Ce mois</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
