
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useSubAdmin } from '@/hooks/useSubAdmin';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Send, Eye, User } from 'lucide-react';

interface MessageData {
  id: string;
  user_id: string;
  message: string;
  status: string;
  priority: string;
  category: string;
  created_at: string;
  response?: string;
  responded_at?: string;
  user_profile?: {
    full_name: string;
    phone: string;
    country: string;
  } | null;
}

const SubAdminMessagesTab = () => {
  const { toast } = useToast();
  const { canManageMessages, userCountry } = useSubAdmin();
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    if (canManageMessages) {
      fetchMessages();
    }
  }, [canManageMessages]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      // Récupérer d'abord les messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('customer_support_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      // Enrichir avec les profils utilisateur
      const enrichedMessages = await Promise.all(
        (messagesData || []).map(async (message) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, phone, country')
            .eq('id', message.user_id)
            .single();

          return {
            ...message,
            user_profile: profileData
          };
        })
      );

      // Filtrer par territoire si applicable
      let filteredMessages = enrichedMessages;
      if (userCountry) {
        filteredMessages = enrichedMessages.filter(msg => 
          msg.user_profile && msg.user_profile.country === userCountry
        );
      }

      setMessages(filteredMessages);
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
          responded_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', messageId);

      if (error) throw error;

      toast({
        title: "Réponse envoyée",
        description: "Votre réponse a été envoyée avec succès",
      });

      setResponding(null);
      setResponseText('');
      fetchMessages();
    } catch (error) {
      console.error('Erreur lors de la réponse:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la réponse",
        variant: "destructive"
      });
    }
  };

  if (!canManageMessages) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <MessageSquare className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Accès limité</h3>
            <p className="text-muted-foreground">
              Vous n'avez pas les permissions pour gérer les messages.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = {
    total: messages.length,
    unread: messages.filter(m => m.status === 'unread').length,
    responded: messages.filter(m => m.status === 'responded').length,
    urgent: messages.filter(m => m.priority === 'urgent').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unread': return 'bg-red-100 text-red-800';
      case 'read': return 'bg-yellow-100 text-yellow-800';
      case 'responded': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'normal': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Messages Support</h2>
          <p className="text-muted-foreground">
            Gestion des messages de support de votre territoire{userCountry && ` (${userCountry})`}
          </p>
        </div>
        <Button onClick={fetchMessages} disabled={loading} variant="outline">
          <MessageSquare className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Statistiques des messages */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Non lus</CardTitle>
            <Eye className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.unread}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Répondus</CardTitle>
            <Send className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.responded}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgents</CardTitle>
            <MessageSquare className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des messages */}
      <Card>
        <CardHeader>
          <CardTitle>Messages de Support</CardTitle>
          <CardDescription>
            Messages des utilisateurs de votre territoire nécessitant une réponse
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
                <div key={message.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <User className="w-8 h-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {message.user_profile?.full_name || 'Utilisateur inconnu'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {message.user_profile?.phone}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {message.user_profile?.country}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getPriorityColor(message.priority)}>
                        {message.priority}
                      </Badge>
                      <Badge className={getStatusColor(message.status)}>
                        {message.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="pl-11">
                    <p className="text-sm mb-2">{message.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(message.created_at).toLocaleString()}
                    </p>

                    {message.response && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-1">Réponse:</p>
                        <p className="text-sm">{message.response}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {message.responded_at && new Date(message.responded_at).toLocaleString()}
                        </p>
                      </div>
                    )}

                    {message.status !== 'responded' && (
                      <div className="mt-3">
                        {responding === message.id ? (
                          <div className="space-y-2">
                            <Textarea
                              placeholder="Tapez votre réponse..."
                              value={responseText}
                              onChange={(e) => setResponseText(e.target.value)}
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
                            <Send className="w-4 h-4 mr-1" />
                            Répondre
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {messages.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun message trouvé dans votre territoire
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
