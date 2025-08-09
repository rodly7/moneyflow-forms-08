import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  user_id: string;
  message: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  profiles: {
    full_name: string;
    phone: string;
  } | null;
}

export const SimpleMessagesTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  // États pour le formulaire de notification
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [notificationType, setNotificationType] = useState('general');
  const [priority, setPriority] = useState('normal');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      // First get the messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('customer_support_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (messagesError) throw messagesError;

      // Then get profiles separately
      const userIds = messagesData?.map(msg => msg.user_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const formattedMessages: Message[] = (messagesData || []).map(msg => {
        const profile = profilesData?.find(p => p.id === msg.user_id);
        return {
          id: msg.id,
          user_id: msg.user_id,
          message: msg.message,
          category: msg.category || 'general',
          status: msg.status,
          priority: msg.priority,
          created_at: msg.created_at,
          profiles: profile ? {
            full_name: profile.full_name || 'Utilisateur inconnu',
            phone: profile.phone || 'N/A'
          } : null
        };
      });
      
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          title: title,
          message: message,
          notification_type: notificationType,
          priority: priority,
          sent_by: user?.id,
          target_users: [], // Notification globale
          total_recipients: 0
        });

      if (error) throw error;

      toast({
        title: "Notification envoyée",
        description: "La notification a été envoyée avec succès",
      });

      // Reset form
      setTitle('');
      setMessage('');
      setNotificationType('general');
      setPriority('normal');

    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la notification",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('customer_support_messages')
        .update({ 
          status: 'read',
          read_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (error) throw error;
      
      // Refresh messages
      fetchMessages();
      
      toast({
        title: "Message marqué comme lu",
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de marquer le message comme lu",
        variant: "destructive"
      });
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '30px', fontSize: '24px', fontWeight: 'bold' }}>
        Messages & Notifications
      </h2>

      {/* Formulaire d'envoi de notification */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '30px' 
      }}>
        <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold' }}>
          Envoyer une notification globale
        </h3>
        
        <form onSubmit={handleSendNotification}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Titre:
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Message:
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                resize: 'vertical'
              }}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Type:
              </label>
              <select
                value={notificationType}
                onChange={(e) => setNotificationType(e.target.value)}
                style={{
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <option value="general">Général</option>
                <option value="maintenance">Maintenance</option>
                <option value="promotion">Promotion</option>
                <option value="alert">Alerte</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Priorité:
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                style={{
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <option value="low">Faible</option>
                <option value="normal">Normale</option>
                <option value="high">Élevée</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={sending || !title || !message}
            style={{
              backgroundColor: sending ? '#ccc' : '#007bff',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              cursor: sending ? 'not-allowed' : 'pointer'
            }}
          >
            {sending ? 'Envoi...' : 'Envoyer la notification'}
          </button>
        </form>
      </div>

      {/* Liste des messages de support */}
      <div>
        <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold' }}>
          Messages de support client
        </h3>

        {loading ? (
          <p>Chargement des messages...</p>
        ) : messages.length === 0 ? (
          <p>Aucun message de support</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  backgroundColor: msg.status === 'unread' ? '#fff3cd' : '#f8f9fa',
                  padding: '15px',
                  borderRadius: '8px',
                  border: '1px solid #ddd'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                  <div>
                    <strong>{msg.profiles?.full_name || 'Utilisateur inconnu'}</strong>
                    <br />
                    <small style={{ color: '#666' }}>
                      {msg.profiles?.phone || 'N/A'} • {new Date(msg.created_at).toLocaleString('fr-FR')}
                    </small>
                  </div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      backgroundColor: msg.status === 'unread' ? '#ffc107' : '#28a745',
                      color: 'white'
                    }}>
                      {msg.status === 'unread' ? 'Non lu' : 'Lu'}
                    </span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      backgroundColor: msg.priority === 'high' ? '#dc3545' : msg.priority === 'normal' ? '#17a2b8' : '#6c757d',
                      color: 'white'
                    }}>
                      {msg.priority === 'high' ? 'Urgent' : msg.priority === 'normal' ? 'Normal' : 'Faible'}
                    </span>
                  </div>
                </div>
                
                <p style={{ marginBottom: '10px', lineHeight: '1.5' }}>
                  {msg.message}
                </p>
                
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                  Catégorie: {msg.category}
                </div>

                {msg.status === 'unread' && (
                  <button
                    onClick={() => markAsRead(msg.id)}
                    style={{
                      backgroundColor: '#28a745',
                      color: 'white',
                      padding: '5px 15px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Marquer comme lu
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
