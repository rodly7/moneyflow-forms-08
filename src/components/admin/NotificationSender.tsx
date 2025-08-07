
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Send, Users, Bell, AlertCircle, CheckCircle, Loader, Sparkles, Gift, TrendingUp, Trophy } from "lucide-react";
import { NotificationService } from "@/services/notificationService";

interface User {
  id: string;
  full_name: string;
  phone: string;
  role: string;
  country: string;
}

const NotificationSender = () => {
  const [notificationType, setNotificationType] = useState<'all' | 'role' | 'country' | 'individual'>('all');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users-for-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, role, country')
        .order('full_name');

      if (error) throw error;
      return data as User[];
    },
  });

  const { data: countries } = useQuery({
    queryKey: ['countries-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('country')
        .not('country', 'is', null);

      if (error) throw error;
      const uniqueCountries = [...new Set(data.map(item => item.country))];
      return uniqueCountries.filter(Boolean);
    },
  });

  const getFilteredUsers = () => {
    if (!users) return [];

    switch (notificationType) {
      case 'role':
        return users.filter(user => user.role === selectedRole);
      case 'country':
        return users.filter(user => user.country === selectedCountry);
      case 'individual':
        return users.filter(user => selectedUsers.includes(user.id));
      default:
        return users;
    }
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const predefinedNotifications = {
    update: {
      title: "🔄 Mise à jour système disponible",
      message: "Une nouvelle mise à jour de notre application est disponible ! Découvrez de nouvelles fonctionnalités et améliorations de performance. Mettez à jour dès maintenant pour profiter d'une expérience optimisée.",
      priority: "normal" as const
    },
    promotion: {
      title: "🎯 Offre spéciale limitée !",
      message: "Profitez de notre promotion exceptionnelle : 0% de frais sur vos 5 prochains transferts ! Offre valable jusqu'à la fin du mois. Ne manquez pas cette opportunité unique.",
      priority: "high" as const
    },
    gift: {
      title: "🎁 Cadeau spécial pour vous",
      message: "Félicitations ! Vous avez reçu un bonus de 1000 FCFA sur votre compte. Utilisez ce crédit pour vos prochaines transactions. Merci de votre fidélité !",
      priority: "high" as const
    },
    lottery: {
      title: "🏆 Grand tirage au sort en cours !",
      message: "Participez à notre grand concours et tentez de gagner 100,000 FCFA ! Chaque transaction vous donne une chance supplémentaire. Tirage le 31 de ce mois. Bonne chance !",
      priority: "normal" as const
    },
    feature: {
      title: "✨ Nouvelle fonctionnalité disponible",
      message: "Découvrez notre nouvelle fonctionnalité d'épargne automatique ! Programmez vos économies et atteignez vos objectifs financiers plus facilement. Activez-la dès maintenant dans votre profil.",
      priority: "normal" as const
    },
    security: {
      title: "🔐 Mise à jour de sécurité importante",
      message: "Nous avons renforcé la sécurité de nos systèmes pour mieux protéger vos données et transactions. Vos informations sont entre de bonnes mains. Aucune action requise de votre part.",
      priority: "high" as const
    },
    maintenance: {
      title: "⚙️ Maintenance programmée",
      message: "Une maintenance technique aura lieu ce soir de 2h à 4h du matin. Certains services pourraient être temporairement indisponibles. Nous nous excusons pour la gêne occasionnée.",
      priority: "normal" as const
    },
    celebration: {
      title: "🎉 Anniversaire de SendFlow !",
      message: "Nous célébrons 2 ans de service ! Merci de nous faire confiance. Pour l'occasion, profitez de 50% de réduction sur tous les frais de transfert pendant 48h !",
      priority: "high" as const
    }
  };

  const generateNotification = (type: keyof typeof predefinedNotifications) => {
    const notification = predefinedNotifications[type];
    setTitle(notification.title);
    setMessage(notification.message);
    setPriority(notification.priority);
  };

  const handleSendNotification = async () => {
    if (!title || !message) {
      toast({
        title: "Données manquantes",
        description: "Veuillez remplir le titre et le message",
        variant: "destructive"
      });
      return;
    }

    const targetUsers = getFilteredUsers();
    if (targetUsers.length === 0) {
      toast({
        title: "Aucun destinataire",
        description: "Aucun utilisateur sélectionné pour recevoir la notification",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);

    try {
      console.log("🚀 Envoi de notification via NotificationService...");
      
      // Obtenir l'utilisateur actuel
      const { data: { user } } = await supabase.auth.getUser();
      
      // Utiliser le service de notification
      const result = await NotificationService.createNotification(
        title,
        message,
        priority,
        notificationType,
        targetUsers,
        selectedRole,
        selectedCountry,
        notificationType === 'individual' ? selectedUsers : undefined,
        user?.id
      );

      if (result.success) {
        toast({
          title: "Notification envoyée",
          description: result.message,
        });

        // Reset form
        setTitle('');
        setMessage('');
        setPriority('normal');
        setSelectedUsers([]);
        setSelectedRole('');
        setSelectedCountry('');
        setNotificationType('all');
      } else {
        throw new Error(result.message);
      }

    } catch (error: any) {
      console.error('❌ Erreur lors de l\'envoi de la notification:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'envoi de la notification",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const filteredUsers = getFilteredUsers();

  if (isLoading) {
    return (
      <Card className="backdrop-blur-xl bg-white/90 shadow-2xl border border-white/50 rounded-2xl">
        <CardContent className="p-8 text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des utilisateurs...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="backdrop-blur-xl bg-white/90 shadow-2xl border border-white/50 rounded-2xl">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-2xl">
          <CardTitle className="flex items-center gap-3 text-purple-700">
            <Send className="w-6 h-6" />
            Envoyer des Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Templates prédéfinis */}
          <div className="form-container">
            <Label className="text-gray-700 font-medium text-lg">
              Templates de Notifications
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <Button
                variant="outline"
                onClick={() => generateNotification('update')}
                className="h-auto p-3 flex flex-col items-center gap-2 hover:bg-blue-50"
              >
                <Sparkles className="w-5 h-5 text-blue-600" />
                <span className="text-xs font-medium">Mise à jour</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => generateNotification('promotion')}
                className="h-auto p-3 flex flex-col items-center gap-2 hover:bg-green-50"
              >
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-xs font-medium">Promotion</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => generateNotification('gift')}
                className="h-auto p-3 flex flex-col items-center gap-2 hover:bg-pink-50"
              >
                <Gift className="w-5 h-5 text-pink-600" />
                <span className="text-xs font-medium">Cadeau</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => generateNotification('lottery')}
                className="h-auto p-3 flex flex-col items-center gap-2 hover:bg-yellow-50"
              >
                <Trophy className="w-5 h-5 text-yellow-600" />
                <span className="text-xs font-medium">Loterie</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => generateNotification('feature')}
                className="h-auto p-3 flex flex-col items-center gap-2 hover:bg-purple-50"
              >
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span className="text-xs font-medium">Nouveauté</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => generateNotification('security')}
                className="h-auto p-3 flex flex-col items-center gap-2 hover:bg-red-50"
              >
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-xs font-medium">Sécurité</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => generateNotification('maintenance')}
                className="h-auto p-3 flex flex-col items-center gap-2 hover:bg-gray-50"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="text-xs font-medium">Maintenance</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => generateNotification('celebration')}
                className="h-auto p-3 flex flex-col items-center gap-2 hover:bg-orange-50"
              >
                <CheckCircle className="w-5 h-5 text-orange-600" />
                <span className="text-xs font-medium">Célébration</span>
              </Button>
            </div>
          </div>

          {/* Configuration du message */}
          <div className="form-container">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-field-wrapper">
                <Label htmlFor="title" className="text-gray-700 font-medium">
                  Titre de la notification
                </Label>
                <Input
                  id="title"
                  placeholder="Titre de votre notification"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-12 bg-gray-50 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              
              <div className="form-field-wrapper">
                <Label htmlFor="priority" className="text-gray-700 font-medium">
                  Priorité
                </Label>
                <select 
                  id="priority"
                  value={priority} 
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="h-12 w-full px-3 rounded-md border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="low">🟢 Faible</option>
                  <option value="normal">🟡 Normal</option>
                  <option value="high">🔴 Élevée</option>
                </select>
              </div>
            </div>

            <div className="form-field-wrapper">
              <Label htmlFor="message" className="text-gray-700 font-medium">
                Message
              </Label>
              <Textarea
                id="message"
                placeholder="Contenu de votre notification..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="bg-gray-50 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Sélection des destinataires */}
          <div className="form-container">
            <Label className="text-gray-700 font-medium text-lg">
              Destinataires
            </Label>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Button
                variant={notificationType === 'all' ? 'default' : 'outline'}
                onClick={() => setNotificationType('all')}
                className="justify-start rounded-full"
              >
                <Users className="w-4 h-4 mr-2" />
                Tous
              </Button>
              <Button
                variant={notificationType === 'role' ? 'default' : 'outline'}
                onClick={() => setNotificationType('role')}
                className="justify-start rounded-full"
              >
                <Bell className="w-4 h-4 mr-2" />
                Par rôle
              </Button>
              <Button
                variant={notificationType === 'country' ? 'default' : 'outline'}
                onClick={() => setNotificationType('country')}
                className="justify-start rounded-full"
              >
                🌍 Par pays
              </Button>
              <Button
                variant={notificationType === 'individual' ? 'default' : 'outline'}
                onClick={() => setNotificationType('individual')}
                className="justify-start rounded-full"
              >
                👤 Individuel
              </Button>
            </div>

            {/* Filtres conditionnels avec espace réservé fixe */}
            <div className="select-conditional-content">
              {notificationType === 'role' && (
                <div className="animate-fade-in">
                  <select 
                    value={selectedRole} 
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="h-12 w-full px-3 rounded-md border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">Sélectionner un rôle</option>
                    <option value="user">Utilisateurs</option>
                    <option value="agent">Agents</option>
                    <option value="admin">Administrateurs</option>
                    <option value="sub_admin">Sous-Administrateurs</option>
                  </select>
                </div>
              )}

              {notificationType === 'country' && (
                <div className="animate-fade-in">
                  <select 
                    value={selectedCountry} 
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="h-12 w-full px-3 rounded-md border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">Sélectionner un pays</option>
                    {countries?.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {notificationType === 'individual' && (
                <div className="max-h-64 overflow-y-auto space-y-2 bg-gray-50 rounded-xl p-4 animate-fade-in">
                  {users?.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={() => handleUserToggle(user.id)}
                          className="w-5 h-5"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{user.full_name}</p>
                          <p className="text-sm text-gray-600">{user.phone} • {user.role}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Aperçu des destinataires avec espace réservé fixe */}
          <div className="min-h-[120px]">
            {filteredUsers.length > 0 && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 animate-fade-in">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-purple-900 mb-2">
                      Aperçu de l'envoi
                    </h4>
                    <p className="text-sm text-purple-700">
                      Cette notification sera envoyée à <strong>{filteredUsers.length}</strong> utilisateur(s)
                    </p>
                    {notificationType === 'role' && selectedRole && (
                      <p className="text-sm text-purple-600">Rôle: {selectedRole}</p>
                    )}
                    {notificationType === 'country' && selectedCountry && (
                      <p className="text-sm text-purple-600">Pays: {selectedCountry}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setTitle('');
                setMessage('');
                setPriority('normal');
                setSelectedUsers([]);
                setSelectedRole('');
                setSelectedCountry('');
                setNotificationType('all');
              }}
              disabled={isSending}
              className="rounded-full px-6"
            >
              Réinitialiser
            </Button>
            <Button
              onClick={handleSendNotification}
              disabled={isSending || !title || !message || filteredUsers.length === 0}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-full px-8"
            >
              {isSending ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer ({filteredUsers.length})
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationSender;
