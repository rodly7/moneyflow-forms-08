import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const AgentSettingsPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Paramètres Agent";
  }, []);

  return (
    <div className="min-h-screen bg-background p-4">
      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>Paramètres de l'agent</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full" onClick={() => navigate('/change-password')}>
            Changer le mot de passe
          </Button>
          <Button variant="outline" className="w-full" onClick={() => navigate('/notifications')}>
            Notifications
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentSettingsPage;
