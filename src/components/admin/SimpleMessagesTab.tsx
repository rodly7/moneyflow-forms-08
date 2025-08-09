
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SimpleMessagesTab = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [response, setResponse] = useState('');
  const [notificationText, setNotificationText] = useState('');
  const [targetAudience, setTargetAudience] = useState('all');

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_support_messages')
        .select(`
          *,
          profiles:user_id (
            full_name,
            phone,
            role
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Erreur chargement messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendResponse = async (messageId) => {
    if (!response.trim()) return;

    try {
      const { error } = await supabase
        .from('customer_support_messages')
        .update({ 
          admin_response: response,
          status: 'responded',
          responded_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (error) throw error;

      alert('Réponse envoyée avec succès');
      setResponse('');
      setSelectedMessage(null);
      fetchMessages();
    } catch (error) {
      console.error('Erreur envoi réponse:', error);
      alert('Erreur lors de l\'envoi de la réponse');
    }
  };

  const sendNotification = async () => {
    if (!notificationText.trim()) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          title: 'Message Administrateur',
          message: notificationText,
          type: 'admin_broadcast',
          target_audience: targetAudience,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      alert('Notification envoyée avec succès');
      setNotificationText('');
    } catch (error) {
      console.error('Erreur envoi notification:', error);
      alert('Erreur lors de l\'envoi de la notification');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Chargement des messages...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: '#1f2937' }}>
        💬 Messages & Notifications
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
        {/* Section Notifications */}
        <div style={{ padding: '20px', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #fbbf24' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#92400e', marginBottom: '15px' }}>
            📢 Envoyer une Notification
          </h3>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '5px', color: '#374151' }}>
              Public cible
            </label>
            <select
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            >
              <option value="all">Tous les utilisateurs</option>
              <option value="users">Utilisateurs seulement</option>
              <option value="agents">Agents seulement</option>
              <option value="admins">Administrateurs seulement</option>
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '5px', color: '#374151' }}>
              Message
            </label>
            <textarea
              value={notificationText}
              onChange={(e) => setNotificationText(e.target.value)}
              rows={4}
              placeholder="Tapez votre message..."
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
          </div>

          <button
            onClick={sendNotification}
            disabled={!notificationText.trim()}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: notificationText.trim() ? '#f59e0b' : '#9ca3af',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: notificationText.trim() ? 'pointer' : 'not-allowed'
            }}
          >
            Envoyer la notification
          </button>
        </div>

        {/* Section Messages Support */}
        <div style={{ padding: '20px', backgroundColor: '#dbeafe', borderRadius: '8px', border: '1px solid #3b82f6' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1d4ed8', marginBottom: '15px' }}>
            📨 Messages Support ({messages.length})
          </h3>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {messages.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#6b7280', fontStyle: 'italic' }}>
                Aucun message pour le moment
              </p>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  style={{
                    padding: '12px',
                    backgroundColor: 'white',
                    borderRadius: '6px',
                    marginBottom: '10px',
                    border: message.status === 'pending' ? '2px solid #f59e0b' : '1px solid #e5e7eb',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedMessage(message)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <strong style={{ color: '#1f2937' }}>
                      {message.profiles?.full_name || 'Utilisateur'}
                    </strong>
                    <span style={{
                      fontSize: '12px',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      backgroundColor: message.status === 'pending' ? '#fef3c7' : '#dcfce7',
                      color: message.status === 'pending' ? '#92400e' : '#16a34a'
                    }}>
                      {message.status === 'pending' ? 'En attente' : 'Traité'}
                    </span>
                  </div>
                  <p style={{ fontSize: '14px', color: '#4b5563', margin: '5px 0' }}>
                    {message.message.length > 100 ? 
                      `${message.message.substring(0, 100)}...` : 
                      message.message
                    }
                  </p>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                    {new Date(message.created_at).toLocaleDateString('fr-FR')} - {message.profiles?.phone}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal de réponse */}
      {selectedMessage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80%',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                Message de {selectedMessage.profiles?.full_name}
              </h3>
              <button
                onClick={() => setSelectedMessage(null)}
                style={{
                  padding: '5px 10px',
                  backgroundColor: '#f3f4f6',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
              <p style={{ color: '#4b5563', lineHeight: '1.5' }}>
                {selectedMessage.message}
              </p>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '10px' }}>
                Envoyé le {new Date(selectedMessage.created_at).toLocaleString('fr-FR')}
              </div>
            </div>

            {selectedMessage.status === 'pending' && (
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '5px', color: '#374151' }}>
                  Votre réponse
                </label>
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  rows={4}
                  placeholder="Tapez votre réponse..."
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    marginBottom: '15px',
                    resize: 'vertical'
                  }}
                />
                <button
                  onClick={() => sendResponse(selectedMessage.id)}
                  disabled={!response.trim()}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: response.trim() ? '#16a34a' : '#9ca3af',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: response.trim() ? 'pointer' : 'not-allowed'
                  }}
                >
                  Envoyer la réponse
                </button>
              </div>
            )}

            {selectedMessage.admin_response && (
              <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0fdf4', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                <strong style={{ color: '#16a34a', display: 'block', marginBottom: '8px' }}>Votre réponse :</strong>
                <p style={{ color: '#15803d' }}>{selectedMessage.admin_response}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleMessagesTab;
