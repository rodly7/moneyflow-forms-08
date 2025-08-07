import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Bug, Lightbulb, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface BugReport {
  type: 'bug' | 'feature_request';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export const BugReportSystem = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [report, setReport] = useState<BugReport>({
    type: 'bug',
    priority: 'medium',
    description: ''
  });

  const handleSubmit = async () => {
    if (!report.description.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez décrire le problème ou la suggestion",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Créer une notification pour l'admin principal
      const { error } = await supabase
        .from('notifications')
        .insert({
          title: report.type === 'bug' ? '🐛 Nouveau Bug Signalé' : '💡 Nouvelle Demande d\'Évolution',
          message: `
Rapporté par: ${profile?.full_name} (${profile?.country})
Priorité: ${report.priority}
Type: ${report.type === 'bug' ? 'Bug' : 'Demande d\'évolution'}

Description:
${report.description}
          `.trim(),
          notification_type: 'individual',
          priority: report.priority,
          sent_by: user?.id,
          target_users: ['+221773637752'] // Admin principal
        });

      if (error) throw error;

      toast({
        title: "Rapport envoyé",
        description: "Votre rapport a été envoyé à l'administrateur principal",
      });

      // Reset form
      setReport({
        type: 'bug',
        priority: 'medium',
        description: ''
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi du rapport:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le rapport",
        variant: "destructive"
      });
    }
    setIsSubmitting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="w-5 h-5" />
          Signalement & Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Type de rapport</label>
            <Select value={report.type} onValueChange={(value: 'bug' | 'feature_request') => setReport(prev => ({ ...prev, type: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">
                  <div className="flex items-center gap-2">
                    <Bug className="w-4 h-4" />
                    Bug / Problème
                  </div>
                </SelectItem>
                <SelectItem value="feature_request">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Demande d'évolution
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Priorité</label>
            <Select value={report.priority} onValueChange={(value: 'low' | 'medium' | 'high' | 'critical') => setReport(prev => ({ ...prev, priority: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Basse</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="high">Haute</SelectItem>
                <SelectItem value="critical">Critique</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Description détaillée</label>
          <Textarea
            placeholder="Décrivez le problème rencontré ou la fonctionnalité souhaitée..."
            value={report.description}
            onChange={(e) => setReport(prev => ({ ...prev, description: e.target.value }))}
            rows={6}
          />
        </div>

        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting || !report.description.trim()}
          className="w-full"
        >
          <Send className="w-4 h-4 mr-2" />
          {isSubmitting ? "Envoi..." : "Envoyer le rapport"}
        </Button>
      </CardContent>
    </Card>
  );
};