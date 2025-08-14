
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSubAdmin } from '@/hooks/useSubAdmin';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Send, AlertCircle, Clock } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SupportMessage {
  id: string;
  user_id: string;
  message: string;
  status: string;
  priority: string;
  category: string;
  created_at: string;
  response?: string;
  responded_at?: string;
  user_name?: string;
  user_phone?: string;
}

const SubAdminMessagesTab = () => {
  const { toast } = useToast();
  const { canSendNotifications, userCountry } = useSubAdmin();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');

  // États pour envoyer une notification
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationPriority, setNotificationPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      // Récupérer les messages de support avec les informations utilisateur
      const { data, error } = await supabase
        .from('customer_support_messages')
        .select(`
          *,
          profiles!customer_support_messages_user_id_fkey (
            full_name,
            phone,
            country
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Filtrer par pays si nécessaire
      const filteredData = userCountry 
        ? data?.filter(msg => msg.profiles?.country === userCountry)
        : data;

      const processedMessages = filteredData?.map(msg => ({
        ...msg,
        user_name: msg.profiles?.full_name || 'Utilisateur inconnu',
        user_phone: msg.profiles?.phone || '',
      })) || [];

      setMessages(processedMessages);
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les messages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (messageId: string) => {
    if (!responseText.trim()) return;

    try {
      const { error } = await supabase
        .from('customer_support_messages')
        .update({
          response: responseText,
          status: 'responded',
          responded_at: new Date().toISOString(),
        })
        .eq('id', messageId);

      if (error) throw error;

      toast({
        title: "Réponse envoyée",
        description: "Votre réponse a été envoyée à l'utilisateur",
      });

      setResponding(null);
      setResponseText('');
      fetchMessages();
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la réponse:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'envoi de la réponse",
        variant: "destructive"
      });
    }
  };

  const handleSendNotification = async () => {
    if (!canSendNotifications) {
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas les permissions pour envoyer des notifications",
        variant: "destructive"
      });
      return;
    }

    if (!notificationTitle.trim() || !notificationMessage.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          title: notificationTitle,
          message: notificationMessage,
          notification_type: 'territorial',
          priority: notificationPriority,
          target_country: userCountry,
          total_recipients: 1 // Sera calculé automatiquement
        });

      if (error) throw error;

      toast({
        title: "Notification envoyée",
        description: "La notification a été envoyée aux utilisateurs de votre territoire",
      });

      setNotificationTitle('');
      setNotificationMessage('');
      setNotificationPriority('medium');
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'envoi de la notification",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'responded': return 'bg-green-100 text-green-800';
      case 'read': return 'bg-blue-100 text-blue-800';
      case 'unread': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Messages et Notifications</h2>
          <p className="text-muted-foreground">
            Gestion des messages de support et envoi de notifications
          </p>
        </div>
        <Button onClick={fetchMessages} disabled={loading} variant="outline">
          <MessageSquare className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Envoi de notifications */}
      {canSendNotifications && (
        <Card>
          <CardHeader>
            <CardTitle>Envoyer une Notification</CardTitle>
            <CardDescription>
              Envoyer une notification aux utilisateurs de votre territoire
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="notification-title">Titre</Label>
                <Input
                  id="notification-title"
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                  placeholder="Titre de la notification"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notification-priority">Priorité</Label>
                <Select value={notificationPriority} onValueChange={(value: any) => setNotificationPriority(value)}>
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
              <Label htmlFor="notification-message">Message</Label>
              <Textarea
                id="notification-message"
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                placeholder="Contenu de la notification"
                rows={3}
              />
            </div>
            <Button 
              onClick={handleSendNotification}
              disabled={sending || !notificationTitle.trim() || !notificationMessage.trim()}
            >
              <Send className="w-4 h-4 mr-2" />
              {sending ? 'Envoi...' : 'Envoyer la Notification'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Messages de support */}
      <Card>
        <CardHeader>
          <CardTitle>Messages de Support</CardTitle>
          <CardDescription>
            Messages de support des utilisateurs de votre territoire
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{message.user_name}</span>
                      <Badge className={getPriorityColor(message.priority)}>
                        {message.priority}
                      </Badge>
                      <Badge className={getStatusColor(message.status)}>
                        {message.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 inline mr-1" />
                      {new Date(message.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-sm text-muted-foreground mb-1">
                      {message.user_phone} • {message.category}
                    </p>
                    <p className="text-sm">{message.message}</p>
                  </div>

                  {message.response && (
                    <div className="bg-green-50 p-3 rounded-lg mb-3">
                      <p className="text-sm font-medium text-green-800 mb-1">Votre réponse:</p>
                      <p className="text-sm text-green-700">{message.response}</p>
                      <p className="text-xs text-green-600 mt-1">
                        Répondu le {new Date(message.responded_at!).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {!message.response && (
                    <div className="mt-3">
                      {responding === message.id ? (
                        <div className="space-y-3">
                          <Textarea
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                            placeholder="Tapez votre réponse..."
                            rows={3}
                          />
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleRespond(message.id)}
                              disabled={!responseText.trim()}
                            >
                              <Send className="w-4 h-4 mr-1" />
                              Envoyer
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setResponding(null);
                                setResponseText('');
                              }}
                            >
                              Annuler
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setResponding(message.id)}
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Répondre
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {messages.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun message de support trouvé
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubAdminMessagesTab;
