
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { MessageSquare, Calendar, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const CustomerServiceButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [requestType, setRequestType] = useState('general');
  const [priority, setPriority] = useState('normal');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir votre message",
        variant: "destructive"
      });
      return;
    }

    if (!user || !profile) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour envoyer un message",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      let finalMessage = message.trim();
      
      // Si c'est une demande de rendez-vous pour mot de passe, ajouter des détails
      if (requestType === 'password_appointment') {
        finalMessage = `🗓️ DEMANDE DE RENDEZ-VOUS - Changement de mot de passe

${finalMessage}

--- Informations utilisateur ---
Nom: ${profile.full_name}
Rôle: ${profile.role}
Téléphone: ${profile.phone}
Email: ${user.email}
Pays: ${profile.country}

Merci de me contacter pour fixer un rendez-vous.`;
      } else {
        // Ajouter les informations de l'expéditeur pour tous les messages
        finalMessage = `${finalMessage}

--- Informations expéditeur ---
Nom: ${profile.full_name}
Rôle: ${profile.role}
Téléphone: ${profile.phone}
Email: ${user.email}
Pays: ${profile.country}`;
      }

      const { error } = await supabase
        .from('customer_support_messages')
        .insert({
          user_id: user.id,
          message: finalMessage,
          category: requestType === 'password_appointment' ? 'account' : requestType,
          priority: requestType === 'password_appointment' ? 'high' : priority,
          status: 'unread'
        });

      if (error) throw error;

      const successMessage = requestType === 'password_appointment'
        ? "Votre demande de rendez-vous a été envoyée aux administrateurs."
        : priority === 'urgent' 
          ? "Votre message urgent a été transmis aux administrateurs pour un traitement prioritaire."
          : "Votre message a été envoyé au service client. Nos administrateurs vous répondront rapidement.";

      toast({
        title: "Message envoyé",
        description: successMessage,
      });

      setMessage('');
      setRequestType('general');
      setPriority('normal');
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error sending support message:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const quickMessages = [
    { id: 'problem', text: 'J\'ai un problème technique' },
    { id: 'transaction', text: 'Question sur une transaction' },
    { id: 'account', text: 'Problème avec mon compte' },
    { id: 'password', text: 'Je veux changer mon mot de passe' },
    { id: 'agent_help', text: 'J\'ai besoin d\'aide en tant qu\'agent' },
    { id: 'client_issue', text: 'Problème avec un client' },
  ];

  const handleQuickMessage = (messageText: string) => {
    setMessage(messageText);
    if (messageText.includes('mot de passe')) {
      setRequestType('password_appointment');
      setPriority('high');
    }
  };

  // Adapter l'apparence selon le rôle
  const isAgent = profile?.role === 'agent';
  const buttonClass = isAgent 
    ? "relative p-2 text-white hover:bg-blue-600 transition-all duration-200 bg-blue-500 rounded-md"
    : "relative p-2 text-foreground hover:bg-muted/20 transition-all duration-200";

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsModalOpen(true)}
        className={buttonClass}
      >
        <MessageSquare className="w-5 h-5" />
        <span className="sr-only">Service client</span>
        {isAgent && <span className="ml-2 text-sm hidden md:inline text-white">Contacter Admin</span>}
      </Button>

      {/* Modal avec scroll optimisé */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in-0"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsModalOpen(false);
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="overflow-y-auto max-h-[90vh]">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      {isAgent ? 'Contacter les Administrateurs' : 'Service Client'}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {isAgent ? 'Support pour les agents' : 'Contactez nos administrateurs'}
                    </p>
                  </div>
                </div>

                {/* Messages rapides */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-800 mb-2">Messages rapides :</p>
                  <div className="grid grid-cols-1 gap-2">
                    {quickMessages.map((msg) => (
                      <button
                        key={msg.id}
                        type="button"
                        onClick={() => handleQuickMessage(msg.text)}
                        className="text-left p-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-md transition-colors duration-200 text-gray-800"
                      >
                        {msg.text}
                      </button>
                    ))}
                  </div>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="requestType" className="block text-sm font-medium mb-2 text-gray-800">
                      Type de demande
                    </label>
                    <select
                      id="requestType"
                      value={requestType}
                      onChange={(e) => setRequestType(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-800 bg-white"
                    >
                      <option value="general">Général</option>
                      <option value="transaction">Transaction</option>
                      <option value="account">Compte</option>
                      <option value="technical">Technique</option>
                      <option value="complaint">Réclamation</option>
                      <option value="password_appointment">🗓️ Rendez-vous changement mot de passe</option>
                      {isAgent && (
                        <>
                          <option value="agent_support">Support Agent</option>
                          <option value="client_issue">Problème Client</option>
                        </>
                      )}
                    </select>
                  </div>

                  {requestType !== 'password_appointment' && (
                    <div>
                      <label htmlFor="priority" className="block text-sm font-medium mb-2 text-gray-800">
                        Priorité
                      </label>
                      <select
                        id="priority"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-800 bg-white ${
                          priority === 'urgent' ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                      >
                        <option value="low">Faible</option>
                        <option value="normal">Normale</option>
                        <option value="high">Élevée</option>
                        <option value="urgent">🚨 Urgente</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-2 text-gray-800">
                      Votre message
                    </label>
                    <textarea
                      id="message"
                      placeholder={requestType === 'password_appointment' 
                        ? "Expliquez pourquoi vous souhaitez changer votre mot de passe..."
                        : isAgent 
                          ? "Décrivez votre problème ou votre demande..."
                          : "Décrivez votre problème en détail..."}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px] resize-none transition-all duration-200 text-gray-800 bg-white"
                      disabled={isLoading}
                      required
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      {requestType === 'password_appointment' 
                        ? "Un administrateur vous contactera pour fixer un rendez-vous."
                        : "Nos administrateurs traiteront votre demande rapidement."}
                    </p>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button 
                      type="button" 
                      onClick={() => setIsModalOpen(false)}
                      disabled={isLoading}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-all duration-200 text-gray-800 bg-white"
                    >
                      Annuler
                    </button>
                    <button 
                      type="submit" 
                      disabled={isLoading || !message.trim()}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-md hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-[1.02]"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Envoi...
                        </>
                      ) : requestType === 'password_appointment' ? (
                        <>
                          <Calendar className="w-4 h-4" />
                          Demander rendez-vous
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Envoyer
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
