import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface AgentQuota {
  agent_id: string;
  agent_name: string;
  agent_phone: string;
  total_deposits: number;
  quota_achieved: boolean;
  quota_reached_at: string | null;
  reached_before_19h: boolean;
  commission_rate: number;
}

export const AgentQuotaTracker = () => {
  const [quotas, setQuotas] = useState<AgentQuota[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  const fetchQuotas = async (date: Date) => {
    try {
      setLoading(true);
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      // Récupérer tous les agents avec leurs quotas pour la date sélectionnée
      const { data: quotaData, error } = await supabase
        .from('agent_daily_quotas')
        .select(`
          agent_id,
          total_deposits,
          quota_achieved,
          quota_reached_at
        `)
        .eq('date', formattedDate);

      if (error) throw error;

      // Récupérer les informations des agents
      const agentIds = quotaData?.map(q => q.agent_id) || [];
      const { data: agentsData } = await supabase
        .from('agents')
        .select('user_id, full_name, phone')
        .in('user_id', agentIds);

      const quotasWithAgentInfo = quotaData?.map(quota => {
        const agent = agentsData?.find(a => a.user_id === quota.agent_id);
        return {
          agent_id: quota.agent_id,
          agent_name: agent?.full_name || 'Agent inconnu',
          agent_phone: agent?.phone || 'N/A',
          total_deposits: quota.total_deposits,
          quota_achieved: quota.quota_achieved,
          quota_reached_at: quota.quota_reached_at,
          reached_before_19h: quota.quota_reached_at ? 
            new Date(quota.quota_reached_at).getHours() < 19 : false,
          commission_rate: quota.quota_achieved && quota.quota_reached_at && 
            new Date(quota.quota_reached_at).getHours() < 19 ? 0.01 : 0.005
        };
      }) || [];

      setQuotas(quotasWithAgentInfo);
    } catch (error) {
      console.error('Erreur lors du chargement des quotas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotas(selectedDate);
  }, [selectedDate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const quotaAchievedCount = quotas.filter(q => q.quota_achieved).length;
  const quotaBefore19hCount = quotas.filter(q => q.reached_before_19h).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Suivi des Quotas Journaliers</h2>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(selectedDate, "PPP", { locale: fr })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Agents</p>
                <p className="text-2xl font-bold">{quotas.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Quota Atteint</p>
                <p className="text-2xl font-bold text-green-600">{quotaAchievedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avant 19h</p>
                <p className="text-2xl font-bold text-blue-600">{quotaBefore19hCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Taux Réussite</p>
                <p className="text-2xl font-bold text-orange-600">
                  {quotas.length > 0 ? Math.round((quotaAchievedCount / quotas.length) * 100) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des agents */}
      <Card>
        <CardHeader>
          <CardTitle>Détail par Agent</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Chargement...</p>
          ) : quotas.length === 0 ? (
            <p className="text-muted-foreground">Aucun quota trouvé pour cette date.</p>
          ) : (
            <div className="space-y-4">
              {quotas.map((quota) => (
                <div
                  key={quota.agent_id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold">{quota.agent_name}</h4>
                    <p className="text-sm text-muted-foreground">{quota.agent_phone}</p>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(quota.total_deposits)}</p>
                      <p className="text-sm text-muted-foreground">
                        {((quota.total_deposits / 500000) * 100).toFixed(1)}% du quota
                      </p>
                    </div>

                    <div className="flex flex-col items-center space-y-2">
                      {quota.quota_achieved ? (
                        <>
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Quota Atteint
                          </Badge>
                          {quota.reached_before_19h && (
                            <Badge variant="secondary" className="bg-blue-500 text-white">
                              Avant 19h - 1%
                            </Badge>
                          )}
                          {quota.quota_reached_at && (
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(quota.quota_reached_at), "HH:mm", { locale: fr })}
                            </p>
                          )}
                        </>
                      ) : (
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          En cours
                        </Badge>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-medium">
                        Commission: {(quota.commission_rate * 100).toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(quota.total_deposits * quota.commission_rate)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};