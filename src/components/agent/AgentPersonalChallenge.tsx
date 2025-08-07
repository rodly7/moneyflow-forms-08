
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Target, Trophy, Flame, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Challenge {
  id: string;
  target_operations: number;
  current_operations: number;
  date: string;
  completed: boolean;
  reward_points: number;
}

interface TodayStats {
  withdrawals: number;
  deposits: number;
  total: number;
}

const AgentPersonalChallenge = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [todayStats, setTodayStats] = useState<TodayStats>({ withdrawals: 0, deposits: 0, total: 0 });
  const [targetOperations, setTargetOperations] = useState(30);
  const [isLoading, setIsLoading] = useState(true);
  const [averageOperations, setAverageOperations] = useState(0);

  const calculateAverageOperations = async () => {
    if (!user?.id) return;

    try {
      const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const [withdrawalsResult, depositsResult] = await Promise.all([
        supabase
          .from('withdrawals')
          .select('id')
          .eq('user_id', user.id)
          .gte('created_at', last7Days.toISOString())
          .eq('status', 'completed'),
        supabase
          .from('recharges')
          .select('id')
          .eq('provider_transaction_id', user.id)
          .gte('created_at', last7Days.toISOString())
          .eq('status', 'completed')
      ]);

      const totalOperations = (withdrawalsResult.data?.length || 0) + 
                             (depositsResult.data?.length || 0);
      
      setAverageOperations(Math.round(totalOperations / 7));
    } catch (error) {
      console.error('Erreur lors du calcul de la moyenne:', error);
    }
  };

  const fetchTodayChallenge = async () => {
    if (!user?.id) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Query the agent_challenges table directly
      const { data: existingChallenge, error } = await supabase
        .from('agent_challenges')
        .select('*')
        .eq('agent_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (error) {
        console.log('Error fetching challenge:', error);
        return;
      }

      if (existingChallenge) {
        setChallenge(existingChallenge);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du défi:', error);
    }
  };

  const fetchTodayStats = async () => {
    if (!user?.id) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [withdrawalsResult, depositsResult] = await Promise.all([
        supabase
          .from('withdrawals')
          .select('id')
          .eq('user_id', user.id)
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString())
          .eq('status', 'completed'),
        supabase
          .from('recharges')
          .select('id')
          .eq('provider_transaction_id', user.id)
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString())
          .eq('status', 'completed')
      ]);

      const stats = {
        withdrawals: withdrawalsResult.data?.length || 0,
        deposits: depositsResult.data?.length || 0,
        total: (withdrawalsResult.data?.length || 0) + 
               (depositsResult.data?.length || 0)
      };

      setTodayStats(stats);

      // Update challenge if it exists
      if (challenge) {
        const updatedChallenge = { ...challenge, current_operations: stats.total };
        if (stats.total >= challenge.target_operations && !challenge.completed) {
          updatedChallenge.completed = true;
          
          // Update in database
          await supabase
            .from('agent_challenges')
            .update({ 
              current_operations: stats.total,
              completed: true 
            })
            .eq('id', challenge.id);
          
          toast({
            title: "🎉 Défi accompli !",
            description: `Félicitations ! Vous avez atteint votre objectif de ${challenge.target_operations} opérations !`,
          });
        } else if (stats.total !== challenge.current_operations) {
          // Update current operations in database
          await supabase
            .from('agent_challenges')
            .update({ current_operations: stats.total })
            .eq('id', challenge.id);
        }
        
        setChallenge(updatedChallenge);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error);
    }
  };

  const createChallenge = async () => {
    if (!user?.id) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const rewardPoints = Math.round(targetOperations * 10);

      const { data: newChallenge, error } = await supabase
        .from('agent_challenges')
        .insert({
          agent_id: user.id,
          target_operations: targetOperations,
          current_operations: todayStats.total,
          date: today,
          completed: false,
          reward_points: rewardPoints
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setChallenge(newChallenge);
      
      toast({
        title: "Défi créé !",
        description: `Objectif : ${targetOperations} opérations aujourd'hui. Récompense : ${rewardPoints} points !`,
      });
    } catch (error) {
      console.error('Erreur lors de la création du défi:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le défi",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        calculateAverageOperations(),
        fetchTodayChallenge(),
        fetchTodayStats()
      ]);
      setIsLoading(false);
    };

    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  // Actualiser les stats toutes les 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchTodayStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [challenge]);

  if (isLoading) {
    return (
      <div className="w-full max-w-full">
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl w-full">
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressPercentage = challenge ? (todayStats.total / challenge.target_operations) * 100 : 0;

  return (
    <div className="w-full max-w-full space-y-6">
      {/* Stats actuelles */}
      <Card className="bg-gradient-to-r from-orange-600 to-red-600 text-white border-0 shadow-xl w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="w-5 h-5" />
            Votre activité aujourd'hui
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold">{todayStats.total}</div>
              <div className="text-orange-100">Total</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{todayStats.withdrawals}</div>
              <div className="text-orange-100">Retraits</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{todayStats.deposits}</div>
              <div className="text-orange-100">Dépôts</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Défi personnel */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-orange-600" />
            Challenge Personnel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!challenge ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700 mb-2">
                  📊 Votre moyenne des 7 derniers jours : <strong>{averageOperations}</strong> opérations/jour
                </p>
                <p className="text-sm text-blue-600">
                  Recommandation : fixez-vous un objectif entre {Math.round(averageOperations * 1.5)} et {Math.round(averageOperations * 2.5)} opérations
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="target">Objectif d'opérations pour aujourd'hui</Label>
                <Input
                  id="target"
                  type="number"
                  value={targetOperations}
                  onChange={(e) => setTargetOperations(Number(e.target.value))}
                  min="5"
                  max="200"
                  className="h-12"
                />
                <p className="text-sm text-gray-600">
                  Récompense estimée : {targetOperations * 10} points
                </p>
              </div>
              
              <Button 
                onClick={createChallenge}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 h-12"
              >
                <Target className="w-4 h-4 mr-2" />
                Créer mon défi du jour
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Progression */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Progression du défi</span>
                  <span className="text-sm text-gray-600">
                    {todayStats.total} / {challenge.target_operations}
                  </span>
                </div>
                <Progress value={Math.min(progressPercentage, 100)} className="h-3" />
                <p className="text-sm text-gray-600 text-center">
                  {Math.round(progressPercentage)}% de votre objectif atteint
                </p>
              </div>

              {/* Status */}
              {challenge.completed ? (
                <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                  <CardContent className="p-4 text-center">
                    <Trophy className="w-12 h-12 mx-auto mb-2" />
                    <h3 className="text-xl font-bold">Défi accompli !</h3>
                    <p>Félicitations ! Vous avez gagné {challenge.reward_points} points</p>
                  </CardContent>
                </Card>
              ) : todayStats.total >= challenge.target_operations * 0.8 ? (
                <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                  <CardContent className="p-4 text-center">
                    <Star className="w-8 h-8 mx-auto mb-2" />
                    <h3 className="font-bold">Presque là !</h3>
                    <p>Plus que {challenge.target_operations - todayStats.total} opérations !</p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
                  <CardContent className="p-4 text-center">
                    <Target className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <h3 className="font-bold text-blue-800">Continue comme ça !</h3>
                    <p className="text-blue-600">
                      Encore {challenge.target_operations - todayStats.total} opérations pour atteindre votre objectif
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Motivation */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-800 mb-2">💪 Conseils motivation</h4>
                <div className="space-y-1 text-sm text-purple-700">
                  <p>• Chaque opération vous rapproche de votre objectif</p>
                  <p>• Concentrez-vous sur la qualité du service client</p>
                  <p>• Les défis vous aident à progresser régulièrement</p>
                  {todayStats.total > 0 && (
                    <p>• Excellent début ! Maintenez ce rythme</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentPersonalChallenge;
