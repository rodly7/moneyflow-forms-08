
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, Download, Calendar, TrendingUp, 
  BarChart3, PieChart, DollarSign, Users,
  Clock, AlertCircle, CheckCircle
} from 'lucide-react';
import { useAdvancedAdmin } from '@/hooks/useAdvancedAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ReportData {
  id: string;
  report_type: string;
  report_data: any;
  generated_at: string;
  generated_by: string;
  status: 'pending' | 'completed' | 'failed';
}

const AdvancedReporting = () => {
  const { generateReport, isProcessing } = useAdvancedAdmin();
  const { toast } = useToast();
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportForm, setReportForm] = useState({
    type: 'daily' as 'daily' | 'weekly' | 'monthly',
    dateFrom: '',
    dateTo: '',
    country: 'all',
    agentStatus: 'all'
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_reports')
        .select('*')
        .order('generated_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setReports(data || []);
    } catch (error: any) {
      console.error('Erreur chargement rapports:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des rapports",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    const filters = {
      dateFrom: reportForm.dateFrom,
      dateTo: reportForm.dateTo,
      country: reportForm.country !== 'all' ? reportForm.country : undefined,
      agentStatus: reportForm.agentStatus !== 'all' ? reportForm.agentStatus : undefined
    };

    const result = await generateReport(reportForm.type, filters);
    
    if (result.success) {
      fetchReports(); // Recharger la liste des rapports
    }
  };

  const downloadReport = async (reportId: string, reportData: any) => {
    try {
      // Créer un fichier JSON avec les données du rapport
      const dataStr = JSON.stringify(reportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      // Créer un lien de téléchargement
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rapport-${reportId}-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Rapport téléchargé",
        description: "Le rapport a été téléchargé avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors du téléchargement",
        variant: "destructive"
      });
    }
  };

  const getReportTypeLabel = (type: string) => {
    const types = {
      daily: 'Quotidien',
      weekly: 'Hebdomadaire',
      monthly: 'Mensuel'
    };
    return types[type as keyof typeof types] || type;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-500', label: 'En cours', icon: Clock },
      completed: { color: 'bg-green-500', label: 'Terminé', icon: CheckCircle },
      failed: { color: 'bg-red-500', label: 'Échec', icon: AlertCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Rapports Avancés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="generate" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="generate">Générer</TabsTrigger>
              <TabsTrigger value="history">Historique</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Nouveau Rapport</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Type de rapport</Label>
                      <Select
                        value={reportForm.type}
                        onValueChange={(value: 'daily' | 'weekly' | 'monthly') => 
                          setReportForm(prev => ({ ...prev, type: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Quotidien</SelectItem>
                          <SelectItem value="weekly">Hebdomadaire</SelectItem>
                          <SelectItem value="monthly">Mensuel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Date de début</Label>
                      <Input
                        type="date"
                        value={reportForm.dateFrom}
                        onChange={(e) => setReportForm(prev => ({ ...prev, dateFrom: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Date de fin</Label>
                      <Input
                        type="date"
                        value={reportForm.dateTo}
                        onChange={(e) => setReportForm(prev => ({ ...prev, dateTo: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Pays</Label>
                      <Select
                        value={reportForm.country}
                        onValueChange={(value) => setReportForm(prev => ({ ...prev, country: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les pays</SelectItem>
                          <SelectItem value="Congo Brazzaville">Congo Brazzaville</SelectItem>
                          <SelectItem value="Cameroun">Cameroun</SelectItem>
                          <SelectItem value="France">France</SelectItem>
                          <SelectItem value="Canada">Canada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Statut des agents</Label>
                    <Select
                      value={reportForm.agentStatus}
                      onValueChange={(value) => setReportForm(prev => ({ ...prev, agentStatus: value }))}
                    >
                      <SelectTrigger className="w-full md:w-64">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="active">Actifs seulement</SelectItem>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="suspended">Suspendus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleGenerateReport}
                    disabled={isProcessing}
                    className="w-full md:w-auto bg-blue-600 hover:bg-blue-700"
                  >
                    {isProcessing ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Génération en cours...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Générer le Rapport
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Aperçu rapide des métriques */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Rapports ce mois</p>
                        <p className="text-2xl font-bold">{reports.filter(r => 
                          new Date(r.generated_at).getMonth() === new Date().getMonth()
                        ).length}</p>
                      </div>
                      <FileText className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Terminés</p>
                        <p className="text-2xl font-bold text-green-600">
                          {reports.filter(r => r.status === 'completed').length}
                        </p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">En cours</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          {reports.filter(r => r.status === 'pending').length}
                        </p>
                      </div>
                      <Clock className="w-8 h-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Échecs</p>
                        <p className="text-2xl font-bold text-red-600">
                          {reports.filter(r => r.status === 'failed').length}
                        </p>
                      </div>
                      <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Historique des Rapports</h3>
                <Button onClick={fetchReports} variant="outline" size="sm">
                  <Clock className="w-4 h-4 mr-2" />
                  Actualiser
                </Button>
              </div>

              {loading ? (
                <div className="animate-pulse space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {reports.map((report) => (
                    <Card key={report.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-medium">
                                Rapport {getReportTypeLabel(report.report_type)}
                              </h4>
                              {getStatusBadge(report.status)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(report.generated_at).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                              {report.report_data && (
                                <div className="flex items-center gap-1">
                                  <TrendingUp className="w-4 h-4" />
                                  {report.report_data.totalTransfers || 0} transactions
                                </div>
                              )}
                              {report.report_data && (
                                <div className="flex items-center gap-1">
                                  <DollarSign className="w-4 h-4" />
                                  {(report.report_data.totalVolume || 0).toLocaleString()} FCFA
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {report.status === 'completed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadReport(report.id, report.report_data)}
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Télécharger
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {reports.length === 0 && (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">Aucun rapport généré pour le moment</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Utilisez l'onglet "Générer" pour créer votre premier rapport
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="w-5 h-5" />
                      Types de Rapports
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {['daily', 'weekly', 'monthly'].map((type) => {
                        const count = reports.filter(r => r.report_type === type).length;
                        const percentage = reports.length > 0 ? (count / reports.length * 100).toFixed(1) : '0';
                        return (
                          <div key={type} className="flex items-center justify-between">
                            <span className="capitalize">{getReportTypeLabel(type)}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600 w-12 text-right">
                                {count} ({percentage}%)
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                          <p className="text-sm text-green-700">Taux de réussite</p>
                          <p className="text-2xl font-bold text-green-800">
                            {reports.length > 0 
                              ? ((reports.filter(r => r.status === 'completed').length / reports.length) * 100).toFixed(1)
                              : '0'
                            }%
                          </p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-500" />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div>
                          <p className="text-sm text-blue-700">Temps moyen</p>
                          <p className="text-2xl font-bold text-blue-800">~2min</p>
                        </div>
                        <Clock className="w-8 h-8 text-blue-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Activité Récente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {reports.slice(0, 5).map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            report.status === 'completed' ? 'bg-green-500' : 
                            report.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                          <span className="text-sm">
                            Rapport {getReportTypeLabel(report.report_type)}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(report.generated_at).toLocaleTimeString('fr-FR')}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedReporting;
