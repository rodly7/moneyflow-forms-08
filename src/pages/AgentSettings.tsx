
import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AgentContactSupport from "@/components/agent/AgentContactSupport";
import AgentPasswordChange from "@/components/agent/AgentPasswordChange";

const AgentSettingsPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Paramètres Agent";
  }, []);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/agent-dashboard')}
                className="hover:bg-gray-100"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <CardTitle>Paramètres de l'agent</CardTitle>
            </div>
          </CardHeader>
        </Card>

        {/* Navigation rapide */}
        <Card>
          <CardHeader>
            <CardTitle>Navigation rapide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full" onClick={() => navigate('/notifications')}>
              Notifications
            </Button>
          </CardContent>
        </Card>

        {/* Changement de mot de passe */}
        <AgentPasswordChange />

        {/* Contact administrateurs */}
        <AgentContactSupport />
      </div>
    </div>
  );
};

export default AgentSettingsPage;
