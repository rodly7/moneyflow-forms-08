
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Send, ArrowLeft, Bell, List, Users, Clock, CheckCircle } from "lucide-react";

interface NotificationData {
  id: string;
  title: string;
  message: string;
  target_role: string | null;
  target_country: string | null;
  priority: string;
  notification_type: string;
  total_recipients: number;
  created_at: string;
  sent_by: string | null;
  target_users: string[] | null;
  updated_at: string;
}

const AdminNotifications = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    target_role: '',
    target_country: '',
    priority: 'normal'
  });

  const predefinedMessages = [
    {
      title: "Mise à jour système",
      message: "Nous avons déployé une nouvelle mise à jour pour améliorer les performances de l'application. Redémarrez l'application pour bénéficier des améliorations."
    },
    {
      title: "Correction de bugs",
      message: "Des corrections importantes ont été apportées pour résoudre les problèmes de connexion et d'affichage. Merci de votre patience."
    },
    {
      title: "Maintenance programmée",
      message: "Une maintenance de routine aura lieu ce soir de 23h à 1h. Certaines fonctionnalités pourraient être temporairement indisponibles."
    },
    {
      title: "Nouvelle fonctionnalité",
      message: "Découvrez notre nouvelle interface utilisateur améliorée ! Plus intuitive et plus rapide que jamais."
    },
    {
      title: "Problème résolu",
      message: "Le problème de synchronisation des données a été résolu. Toutes vos transactions sont maintenant à jour."
    },
    {
      title: "Sécurité renforcée",
      message: "Nous avons renforcé la sécurité de nos serveurs. Votre argent et vos données sont encore mieux protégés."
    }
  ];

  const countries = ["Sénégal", "Mali", "Burkina Faso", "Côte d'Ivoire", "Niger", "Guinée", "Mauritanie", "Togo"];

  const generateRandomMessage = () => {
    const randomMessage = predefinedMessages[Math.floor(Math.random() * predefinedMessages.length)];
    const randomCountry = countries[Math.floor(Math.random() * countries.length)];
    
    setFormData(prev => ({
      ...prev,
      title: randomMessage.title,
      message: randomMessage.message,
      target_country: randomCountry,
      target_role: ''
    }));
  };

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les notifications",
        variant: "destructive"
      });
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    if (profile?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchNotifications();
  }, [profile, navigate]);

  const handleSendNotification = async () => {
    if (!formData.title || !formData.message) {
      toast({
        title: "Erreur",
        description: "Le titre et le message sont obligatoires",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Récupérer tous les utilisateurs selon les critères
      let query = supabase.from('profiles').select('id, role, country');
      
      if (formData.target_role && formData.target_role !== '') {
        query = query.eq('role', formData.target_role as 'user' | 'agent' | 'admin' | 'sub_admin');
      }
      
      if (formData.target_country && formData.target_country !== '') {
        query = query.eq('country', formData.target_country);
      }

      const { data: targetUsers, error: usersError } = await query;

      if (usersError) throw usersError;

      if (!targetUsers || targetUsers.length === 0) {
        toast({
          title: "Aucun destinataire",
          description: "Aucun utilisateur correspondant aux critères sélectionnés",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Déterminer le type de notification
      let notificationType = 'all';
      if (formData.target_role && formData.target_role !== '') {
        notificationType = 'role';
      } else if (formData.target_country && formData.target_country !== '') {
        notificationType = 'country';
      }

      // Créer la notification principale
      const { data: notification, error: notificationError } = await supabase
        .from('notifications')
        .insert({
          title: formData.title,
          message: formData.message,
          target_role: formData.target_role || null,
          target_country: formData.target_country || null,
          priority: formData.priority,
          notification_type: notificationType,
          sent_by: user?.id,
          total_recipients: targetUsers.length
        })
        .select()
        .single();

      if (notificationError) throw notificationError;

      // Créer les entrées individuelles pour chaque utilisateur
      const recipients = targetUsers.map(targetUser => ({
        notification_id: notification.id,
        user_id: targetUser.id,
        status: 'sent'
      }));

      const { error: recipientsError } = await supabase
        .from('notification_recipients')
        .insert(recipients);

      if (recipientsError) throw recipientsError;

      toast({
        title: "Notification envoyée",
        description: `Notification envoyée à ${targetUsers.length} utilisateur(s)`
      });

      setFormData({
        title: '',
        message: '',
        target_role: '',
        target_country: '',
        priority: 'normal'
      });

      // Actualiser la liste des notifications
      fetchNotifications();
    } catch (error) {
      console.error("Erreur lors de l'envoi:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'envoi de la notification",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!profile || profile.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-2 sm:p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-2">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/main-admin')}
              className="hover:bg-white/50 text-xs sm:text-sm"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Retour
            </Button>
            <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent break-words">
              Gestion des Notifications
            </h1>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs defaultValue="send" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur-sm shadow-lg rounded-xl h-14">
            <TabsTrigger value="send" className="flex items-center gap-2 h-10">
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Envoyer</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2 h-10">
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Historique</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="send" className="mt-6">
            {/* Notification Form */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                  Envoyer une Notification
                </CardTitle>
              </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-2">Titre</label>
              <Input
                placeholder="Titre de la notification"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({...prev, title: e.target.value}))}
                className="text-sm"
              />
            </div>

            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2">
                <label className="block text-xs sm:text-sm font-medium">Message</label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateRandomMessage}
                  className="text-xs w-full sm:w-auto"
                >
                  Message aléatoire
                </Button>
              </div>
              <Textarea
                placeholder="Contenu de la notification"
                value={formData.message}
                onChange={(e) => setFormData(prev => ({...prev, message: e.target.value}))}
                rows={4}
                className="text-sm resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-2">Rôle cible (optionnel)</label>
                <select 
                  value={formData.target_role} 
                  onChange={(e) => setFormData(prev => ({...prev, target_role: e.target.value}))}
                  className="h-10 w-full px-3 rounded-md border border-input bg-background text-xs sm:text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">Tous les rôles</option>
                  <option value="user">Utilisateurs</option>
                  <option value="agent">Agents</option>
                  <option value="sub_admin">Sous-Administrateurs</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-2">Pays cible (optionnel)</label>
                <select
                  value={formData.target_country}
                  onChange={(e) => setFormData(prev => ({...prev, target_country: e.target.value}))}
                  className="h-10 w-full px-3 rounded-md border border-input bg-background text-xs sm:text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">Tous les pays</option>
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-xs sm:text-sm font-medium mb-2">Priorité</label>
                <select 
                  value={formData.priority} 
                  onChange={(e) => setFormData(prev => ({...prev, priority: e.target.value}))}
                  className="h-10 w-full px-3 rounded-md border border-input bg-background text-xs sm:text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="low">Faible</option>
                  <option value="normal">Normale</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Élevée</option>
                </select>
              </div>
            </div>

            <Button 
              onClick={handleSendNotification}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-sm sm:text-base h-10 sm:h-12"
            >
              <Send className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              {isLoading ? 'Envoi en cours...' : 'Envoyer la notification'}
            </Button>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="mt-4 sm:mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-blue-800 mb-2 text-sm sm:text-base">Information</h3>
                    <div className="space-y-1 text-xs sm:text-sm text-blue-700">
                      <p>• Les notifications sont envoyées à tous les utilisateurs par défaut</p>
                      <p>• Vous pouvez cibler un rôle spécifique ou un pays</p>
                      <p>• Les notifications avec une priorité élevée apparaissent en premier</p>
                      <p>• Tous les utilisateurs peuvent voir les notifications dans leur tableau de bord</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            {/* Notifications History */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <List className="w-4 h-4 sm:w-5 sm:h-5" />
                  Historique des Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {loadingNotifications ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    <span className="ml-2 text-gray-600">Chargement...</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Aucune notification envoyée</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900 line-clamp-1">
                                {notification.title}
                              </h3>
                              <Badge
                                variant={
                                  notification.priority === 'high' ? 'destructive' :
                                  notification.priority === 'medium' ? 'default' :
                                  'secondary'
                                }
                                className="text-xs"
                              >
                                {notification.priority === 'high' ? 'Élevée' :
                                 notification.priority === 'medium' ? 'Moyenne' :
                                 notification.priority === 'low' ? 'Faible' : 'Normale'}
                              </Badge>
                            </div>
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                <span>{notification.total_recipients} destinataire(s)</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{new Date(notification.created_at).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}</span>
                              </div>
                              {notification.target_role && (
                                <Badge variant="outline" className="text-xs">
                                  Rôle: {notification.target_role === 'user' ? 'Utilisateurs' :
                                         notification.target_role === 'agent' ? 'Agents' :
                                         notification.target_role === 'sub_admin' ? 'Sous-Admin' : notification.target_role}
                                </Badge>
                              )}
                              {notification.target_country && (
                                <Badge variant="outline" className="text-xs">
                                  Pays: {notification.target_country}
                                </Badge>
                              )}
                              {notification.notification_type === 'individual' && (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Auto-générée
                                </Badge>
                              )}
                            </div>
                            {notification.sent_by && (
                              <div className="mt-2 text-xs text-gray-500">
                                Envoyée par l'administrateur
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminNotifications;
