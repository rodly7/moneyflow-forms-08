import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Reply, Eye, Clock, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface SupportMessage {
  id: string;
  user_id: string;
  message: string;
  status: 'unread' | 'read' | 'responded';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: string;
  created_at: string;
  response?: string;
  responded_at?: string;
  profiles?: {
    full_name: string;
    phone: string;
  };
}

const CustomerSupportMessages = () => {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
  const [response, setResponse] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchMessages = useCallback(async () => {
    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('customer_support_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      const userIds = messagesData?.map(msg => msg.user_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .in('id', userIds);

      if (profilesError) {
        console.warn('Could not fetch profiles:', profilesError);
        const typedMessages = messagesData?.map(msg => ({
          ...msg,
          status: msg.status as 'unread' | 'read' | 'responded',
          priority: msg.priority as 'low' | 'normal' | 'high' | 'urgent',
          profiles: null
        })) || [];
        setMessages(typedMessages);
      } else {
        const messagesWithProfiles = messagesData?.map(msg => ({
          ...msg,
          status: msg.status as 'unread' | 'read' | 'responded',
          priority: msg.priority as 'low' | 'normal' | 'high' | 'urgent',
          profiles: profilesData?.find(profile => profile.id === msg.user_id) || null
        })) || [];
        
        setMessages(messagesWithProfiles);
      }
    } catch (error) {
      console.error('Error fetching support messages:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les messages",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const markAsRead = useCallback(async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('customer_support_messages')
        .update({ 
          status: 'read',
          read_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (error) throw error;
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, status: 'read' as const } : msg
      ));
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }, []);

  const sendResponse = useCallback(async () => {
    if (!selectedMessage || !response.trim() || !user) return;

    setIsResponding(true);
    try {
      const { error } = await supabase
        .from('customer_support_messages')
        .update({
          status: 'responded',
          response: response.trim(),
          responded_by: user.id,
          responded_at: new Date().toISOString()
        })
        .eq('id', selectedMessage.id);

      if (error) throw error;

      toast({
        title: "Réponse envoyée",
        description: "Votre réponse a été envoyée à l'utilisateur"
      });

      setResponse('');
      setSelectedMessage(null);
      fetchMessages();
    } catch (error) {
      console.error('Error sending response:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la réponse",
        variant: "destructive"
      });
    } finally {
      setIsResponding(false);
    }
  }, [selectedMessage, response, user, toast, fetchMessages]);

  useEffect(() => {
    fetchMessages();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('support-messages')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'customer_support_messages' 
        }, 
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'normal': return 'bg-blue-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'unread': return 'bg-red-100 text-red-800';
      case 'read': return 'bg-yellow-100 text-yellow-800';
      case 'responded': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const unreadCount = useMemo(() => 
    messages.filter(msg => msg.status === 'unread').length, 
    [messages]
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Messages du Service Client
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Messages du Service Client
          </div>
          {unreadCount > 0 && (
            <Badge variant="destructive">
              {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucun message de support pour le moment</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4" />
                        <span className="font-medium">
                          {message.profiles?.full_name || 'Utilisateur inconnu'}
                        </span>
                        <span className="text-muted-foreground">
                          ({message.profiles?.phone})
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(message.priority)}>
                          {message.priority}
                        </Badge>
                        <Badge variant="outline">{message.category}</Badge>
                        <Badge className={getStatusColor(message.status)}>
                          {message.status === 'unread' ? 'Non lu' : 
                           message.status === 'read' ? 'Lu' : 'Répondu'}
                        </Badge>
                      </div>

                      <p className="text-sm line-clamp-2">
                        {message.message}
                      </p>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {new Date(message.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {message.status === 'unread' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsRead(message.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            onClick={() => setSelectedMessage(message)}
                            disabled={message.status === 'responded'}
                          >
                            <Reply className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                          <DialogHeader>
                            <DialogTitle>Répondre au message</DialogTitle>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            <div className="p-3 bg-muted rounded-lg">
                              <p className="font-medium text-sm mb-2">Message original :</p>
                              <p className="text-sm">{message.message}</p>
                            </div>

                            {message.response && (
                              <div className="p-3 bg-green-50 rounded-lg">
                                <p className="font-medium text-sm mb-2">Réponse envoyée :</p>
                                <p className="text-sm">{message.response}</p>
                              </div>
                            )}

                            {message.status !== 'responded' && (
                              <div className="space-y-2">
                                <Label htmlFor="response">Votre réponse</Label>
                                <Textarea
                                  id="response"
                                  placeholder="Tapez votre réponse..."
                                  value={response}
                                  onChange={(e) => setResponse(e.target.value)}
                                  className="min-h-[100px]"
                                />
                                <div className="flex gap-2 pt-2">
                                  <Button
                                    onClick={sendResponse}
                                    disabled={!response.trim() || isResponding}
                                    className="flex-1"
                                  >
                                    {isResponding ? 'Envoi...' : 'Envoyer la réponse'}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerSupportMessages;