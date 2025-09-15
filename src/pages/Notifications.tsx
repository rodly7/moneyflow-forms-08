
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Bell, MessageSquare, AlertCircle, Info, CheckCircle, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useUnifiedNotifications } from "@/hooks/useUnifiedNotifications";
interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  priority: string;
  created_at: string;
  read_at: string | null;
}

interface WithdrawalItem {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  role: 'client' | 'agent';
}

const Notifications = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recentWithdrawals, setRecentWithdrawals] = useState<WithdrawalItem[]>([]);
  const { 
    notifications: unifiedNotifications, 
    markAsRead: markUnifiedAsRead,
    markAllAsRead: markAllUnifiedAsRead
  } = useUnifiedNotifications();

  const fetchNotifications = async () => {
    if (!user?.id || !profile) return;

    try {
      setIsLoading(true);
      
      const { data: recipients, error } = await supabase
        .from('notification_recipients')
        .select(`
          notification_id,
          read_at,
          notifications (
            id,
            title,
            message,
            notification_type,
            priority,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('sent_at', { ascending: false });

      if (error) throw error;

      const formattedNotifications = recipients?.map(recipient => {
        if (!recipient.notifications || Array.isArray(recipient.notifications)) return null;
        const notification = recipient.notifications as any;
        return {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          notification_type: notification.notification_type,
          priority: notification.priority,
          created_at: notification.created_at,
          read_at: recipient.read_at
        };
      }).filter(Boolean) || [];

      setNotifications(formattedNotifications);
    } catch (error) {
      console.error("Erreur lors du chargement des notifications:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les notifications",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentWithdrawals = async () => {
    if (!user?.id) return;
    try {
      const since = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(); // 6 mois
      const { data: clientWithdrawals, error: clientError } = await supabase
        .from('withdrawals')
        .select('id, amount, status, created_at')
        .eq('user_id', user.id)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(10);

      let agentWithdrawals: any[] = [];
      let agentError: any = null;
      if (profile?.role === 'agent') {
        const { data, error } = await supabase
          .from('withdrawals')
          .select('id, amount, status, created_at')
          .eq('agent_id', user.id)
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(10);
        agentWithdrawals = data || [];
        agentError = error;
      }

      if (clientError) {
        console.error('Erreur chargement retraits client:', clientError);
      }
      if (agentError) {
        console.error('Erreur chargement retraits agent:', agentError);
      }

      const mapped: WithdrawalItem[] = [
        ...(clientWithdrawals || []).map((w: any) => ({
          id: `withdrawal_${w.id}`,
          amount: Number(w.amount) || 0,
          status: w.status,
          created_at: w.created_at,
          role: 'client' as const,
        })),
        ...agentWithdrawals.map((w: any) => ({
          id: `agent_withdrawal_${w.id}`,
          amount: Number(w.amount) || 0,
          status: w.status,
          created_at: w.created_at,
          role: 'agent' as const,
        })),
      ]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

      setRecentWithdrawals(mapped);
    } catch (e) {
      console.error('Erreur chargement retraits récents:', e);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notification_recipients')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('notification_id', notificationId);

      if (error) throw error;

      // Marquer aussi dans localStorage pour cohérence avec le système unifié
      const readNotificationsKey = `readNotifications_${user.id}`;
      const stored = localStorage.getItem(readNotificationsKey);
      const readIds = new Set(stored ? JSON.parse(stored) : []);
      readIds.add(`admin_${notificationId}`);
      localStorage.setItem(readNotificationsKey, JSON.stringify([...readIds]));

      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, read_at: new Date().toISOString() }
            : n
        )
      );
    } catch (error) {
      console.error('Erreur lors du marquage de la notification:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      // Marquer toutes les notifications non lues dans la base de données
      const unreadNotifications = notifications.filter(n => !n.read_at);
      if (unreadNotifications.length === 0) return;

      const { error } = await supabase
        .from('notification_recipients')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .in('notification_id', unreadNotifications.map(n => n.id));

      if (error) throw error;

      // Marquer aussi dans localStorage
      const readNotificationsKey = `readNotifications_${user.id}`;
      const stored = localStorage.getItem(readNotificationsKey);
      const readIds = new Set(stored ? JSON.parse(stored) : []);
      unreadNotifications.forEach(n => readIds.add(`admin_${n.id}`));
      localStorage.setItem(readNotificationsKey, JSON.stringify([...readIds]));

      // Mettre à jour l'état local
      setNotifications(prev => 
        prev.map(n => ({ ...n, read_at: new Date().toISOString() }))
      );

      toast({
        title: "Succès",
        description: "Toutes les notifications ont été marquées comme lues",
      });
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications:', error);
      toast({
        title: "Erreur",
        description: "Impossible de marquer toutes les notifications comme lues",
        variant: "destructive"
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchRecentWithdrawals();
  }, [user, profile]);

  const handleBack = () => {
    if (profile?.role === 'agent') {
      navigate('/agent-dashboard');
    } else if (profile?.role === 'admin') {
      navigate('/admin-dashboard');
    } else if (profile?.role === 'sub_admin') {
      navigate('/sub-admin-dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-2 sm:p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-2">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="hover:bg-white/50 text-xs sm:text-sm"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Retour
            </Button>
            <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent break-words">
              Mes Notifications
            </h1>
          </div>
          {notifications.some(n => !n.read_at) && (
            <Button
              onClick={markAllAsRead}
              size="sm"
              className="text-xs sm:text-sm"
            >
              Tout marquer comme lu
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              Messages de l'administration
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : notifications.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {notifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`cursor-pointer border-l-4 transition-all hover:shadow-md ${getPriorityColor(notification.priority)} ${
                      !notification.read_at ? 'ring-2 ring-blue-200' : ''
                    }`}
                    onClick={() => !notification.read_at && markAsRead(notification.id)}
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start gap-2 sm:gap-3">
                        {getNotificationIcon(notification.notification_type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-sm sm:text-base text-gray-800 break-words">
                              {notification.title}
                            </h4>
                            {!notification.read_at && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2 break-words">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2 sm:mt-3">
                            {new Date(notification.created_at).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-base sm:text-lg font-medium text-gray-500 mb-2">Aucune notification</h3>
                <p className="text-xs sm:text-sm text-gray-400">
                  Vous n'avez reçu aucun message de l'administration
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activité du compte */}
        <Card className="mt-4 sm:mt-6 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              Activité du compte
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {unifiedNotifications.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {unifiedNotifications.map((n) => (
                  <Card key={n.id} className="border-l-4 border-purple-300">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start gap-3">
                        <div className="text-lg">
                          {n.type === 'withdrawal_completed' ? '💸' : n.type === 'transfer_received' ? '💰' : n.type === 'recharge_completed' ? '💳' : '📩'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-sm sm:text-base text-gray-800 break-words">{n.title}</h4>
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => markUnifiedAsRead(n.id)}>Lu</Button>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2 break-words">{n.message}</p>
                          <p className="text-xs text-gray-400 mt-2 sm:mt-3">
                            {new Date(n.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-base sm:text-lg font-medium text-gray-500 mb-2">Aucune activité récente</h3>
                <p className="text-xs sm:text-sm text-gray-400">Vos retraits, recharges et transferts apparaîtront ici</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Retraits récents */}
        <Card className="mt-4 sm:mt-6 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              Retraits récents (6 mois)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {recentWithdrawals.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {recentWithdrawals.map((w) => (
                  <div key={w.id} className="flex items-start gap-3 p-3 rounded-md border border-purple-100">
                    <div className="text-lg">💸</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm sm:text-base text-gray-800 break-words">
                          {w.amount.toLocaleString('fr-FR')} XAF • {w.status === 'completed' ? 'Confirmé' : w.status === 'pending' ? 'En attente' : w.status}
                        </h4>
                        <span className="text-[10px] sm:text-xs text-gray-500 px-2 py-0.5 rounded-full border">
                          {w.role === 'agent' ? 'Agent' : 'Client'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(w.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-base sm:text-lg font-medium text-gray-500 mb-2">Aucun retrait récent</h3>
                <p className="text-xs sm:text-sm text-gray-400">Vos retraits des 6 derniers mois s'afficheront ici</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-4 sm:mt-6 bg-gradient-to-r from-indigo-50 to-blue-50 border-l-4 border-indigo-500">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <Info className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-indigo-800 mb-2 text-sm sm:text-base">À propos des notifications</h3>
                <div className="space-y-1 text-xs sm:text-sm text-indigo-700">
                  <p>• Recevez les informations importantes de l'administration</p>
                  <p>• Les notifications non lues sont marquées d'un point bleu</p>
                  <p>• Cliquez sur une notification pour la marquer comme lue</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Notifications;
