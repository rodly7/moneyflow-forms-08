
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Users, TrendingUp, AlertTriangle, FileText, Send } from 'lucide-react';

interface TerritorialAgent {
  id: string;
  full_name: string;
  phone: string;
  status: string;
  balance: number;
  country: string;
  created_at: string;
}

interface TerritorialStats {
  totalAgents: number;
  activeAgents: number;
  pendingAgents: number;
  totalTransactions: number;
  totalVolume: number;
  averagePerformance: number;
}

interface SubAdminReport {
  id: string;
  type: 'bug' | 'improvement' | 'issue';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: string;
  created_at: string;
}

const SubAdminAdvancedTools: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [territorialAgents, setTerritorialAgents] = useState<TerritorialAgent[]>([]);
  const [territorialStats, setTerritorialStats] = useState<TerritorialStats>({
    totalAgents: 0,
    activeAgents: 0,
    pendingAgents: 0,
    totalTransactions: 0,
    totalVolume: 0,
    averagePerformance: 0
  });

  // États pour le rapport
  const [reportType, setReportType] = useState<'bug' | 'improvement' | 'issue'>('bug');
  const [reportTitle, setReportTitle] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportPriority, setReportPriority] = useState<'low' | 'medium' | 'high'>('medium');

  useEffect(() => {
    loadTerritorialData();
  }, []);

  const loadTerritorialData = async () => {
    setLoading(true);
    try {
      // Récupérer les agents du territoire (simulation basée sur les profils)
      const { data: agents, error: agentsError } = await supabase
        .from('profiles')
        .select('id, full_name, phone, balance, country, created_at')
        .eq('role', 'agent')
        .limit(20);

      if (agentsError) throw agentsError;

      // Traiter les données des agents
      const processedAgents: TerritorialAgent[] = (agents || []).map(agent => ({
        id: agent.id,
        full_name: agent.full_name || 'N/A',
        phone: agent.phone,
        status: 'active', // Simulation
        balance: agent.balance,
        country: agent.country || 'N/A',
        created_at: agent.created_at
      }));

      setTerritorialAgents(processedAgents);

      // Calculer les statistiques territoriales
      const activeAgentsCount = processedAgents.filter(a => a.status === 'active').length;
      const pendingAgentsCount = processedAgents.filter(a => a.status === 'pending').length;

      // Récupérer les statistiques de transactions
      const { data: transfers } = await supabase
        .from('transfers')
        .select('amount')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const totalVolume = transfers?.reduce((sum, t) => sum + t.amount, 0) || 0;
      const totalTransactions = transfers?.length || 0;

      setTerritorialStats({
        totalAgents: processedAgents.length,
        activeAgents: activeAgentsCount,
        pendingAgents: pendingAgentsCount,
        totalTransactions,
        totalVolume,
        averagePerformance: totalTransactions > 0 ? Math.round(totalVolume / totalTransactions) : 0
      });

    } catch (error) {
      console.error('Erreur chargement données territoriales:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données territoriales",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleValidateAgent = async (agentId: string, action: 'approve' | 'reject') => {
    setLoading(true);
    try {
      const updateData = action === 'approve' 
        ? { is_verified: true, verified_at: new Date().toISOString() }
        : { is_banned: true, banned_reason: 'Rejeté par sous-admin', banned_at: new Date().toISOString() };
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', agentId);

      if (error) throw error;

      toast({
        title: "Agent mis à jour",
        description: `Agent ${action === 'approve' ? 'approuvé' : 'rejeté'} avec succès`,
      });

      loadTerritorialData();
    } catch (error) {
      console.error('Erreur validation agent:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la validation de l'agent",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!reportTitle.trim() || !reportDescription.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Utiliser la table notifications pour simuler les rapports
      const { error } = await supabase
        .from('notifications')
        .insert({
          title: `[${reportType.toUpperCase()}] ${reportTitle}`,
          message: reportDescription,
          notification_type: 'sub_admin_report',
          priority: reportPriority,
          sent_by: user?.id,
          target_role: 'admin',
          total_recipients: 1
        });

      if (error) throw error;

      toast({
        title: "Rapport envoyé",
        description: "Votre rapport a été transmis à l'administration principale",
      });

      // Réinitialiser le formulaire
      setReportTitle('');
      setReportDescription('');
      setReportType('bug');
      setReportPriority('medium');

    } catch (error) {
      console.error('Erreur envoi rapport:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'envoi du rapport",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Outils Avancés Sous-Admin</h2>
          <p className="text-muted-foreground">Gestion territoriale et outils de reporting</p>
        </div>
      </div>

      <Tabs defaultValue="territorial" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="territorial">Gestion Territoriale</TabsTrigger>
          <TabsTrigger value="reporting">Système de Rapport</TabsTrigger>
          <TabsTrigger value="analytics">Analytiques Locales</TabsTrigger>
        </TabsList>

        <TabsContent value="territorial" className="space-y-4">
          {/* Statistiques territoriales */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{territorialStats.totalAgents}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Agents Actifs</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{territorialStats.activeAgents}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En Attente</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{territorialStats.pendingAgents}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Volume Total</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{territorialStats.totalVolume.toLocaleString()} FCFA</div>
              </CardContent>
            </Card>
          </div>

          {/* Liste des agents territoriaux */}
          <Card>
            <CardHeader>
              <CardTitle>Agents du Territoire</CardTitle>
              <CardDescription>Gestion et validation des agents dans votre zone</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {territorialAgents.map((agent) => (
                  <div key={agent.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">{agent.full_name}</p>
                        <p className="text-sm text-muted-foreground">{agent.phone}</p>
                        <p className="text-sm text-muted-foreground">{agent.country}</p>
                      </div>
                      <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                        {agent.status}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium">{agent.balance.toLocaleString()} FCFA</p>
                      {agent.status === 'pending' && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleValidateAgent(agent.id, 'approve')}
                            disabled={loading}
                          >
                            Approuver
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleValidateAgent(agent.id, 'reject')}
                            disabled={loading}
                          >
                            Rejeter
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reporting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Système de Rapport
              </CardTitle>
              <CardDescription>
                Signaler des bugs, proposer des améliorations ou rapporter des problèmes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="report-type">Type de rapport</Label>
                  <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bug">🐛 Bug Report</SelectItem>
                      <SelectItem value="improvement">💡 Amélioration</SelectItem>
                      <SelectItem value="issue">⚠️ Problème</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="report-priority">Priorité</Label>
                  <Select value={reportPriority} onValueChange={(value: any) => setReportPriority(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">🟢 Faible</SelectItem>
                      <SelectItem value="medium">🟡 Moyenne</SelectItem>
                      <SelectItem value="high">🔴 Élevée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="report-title">Titre du rapport</Label>
                <Input
                  id="report-title"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="Décrivez brièvement le problème ou la suggestion"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="report-description">Description détaillée</Label>
                <Textarea
                  id="report-description"
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Fournissez tous les détails nécessaires, étapes de reproduction, etc."
                  rows={5}
                />
              </div>

              <Button 
                onClick={handleSubmitReport}
                disabled={loading || !reportTitle.trim() || !reportDescription.trim()}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                Envoyer le Rapport
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance du Territoire</CardTitle>
                <CardDescription>Indicateurs de performance locaux</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Transactions totales (30j)</span>
                  <span className="font-bold">{territorialStats.totalTransactions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Volume moyen par transaction</span>
                  <span className="font-bold">{territorialStats.averagePerformance.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Taux d'agents actifs</span>
                  <span className="font-bold">
                    {territorialStats.totalAgents > 0 
                      ? Math.round((territorialStats.activeAgents / territorialStats.totalAgents) * 100)
                      : 0}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alertes du Territoire</CardTitle>
                <CardDescription>Notifications et alertes importantes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {territorialStats.pendingAgents > 0 && (
                    <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm">{territorialStats.pendingAgents} agent(s) en attente de validation</span>
                    </div>
                  )}
                  {territorialStats.activeAgents === 0 && (
                    <div className="flex items-center gap-2 p-2 bg-red-50 rounded">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="text-sm">Aucun agent actif dans le territoire</span>
                    </div>
                  )}
                  {territorialStats.pendingAgents === 0 && territorialStats.activeAgents > 0 && (
                    <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Territoire fonctionnel - Tous les agents sont validés</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SubAdminAdvancedTools;
