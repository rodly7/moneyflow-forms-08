import React, { useState } from 'react';
import { MessageSquare, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SimpleCustomerSupportFormProps {
  trigger?: React.ReactNode;
}

export const SimpleCustomerSupportForm = ({ trigger }: SimpleCustomerSupportFormProps) => {
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState('normal');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

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

    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour envoyer un message",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('customer_support_messages')
        .insert({
          user_id: user.id,
          message: message.trim(),
          category,
          priority,
          status: 'unread'
        });

      if (error) throw error;

      const priorityMessage = priority === 'urgent' 
        ? "Votre message urgent a été transmis aux administrateurs pour un traitement prioritaire."
        : "Votre message a été envoyé au service client. Nos sous-administrateurs vous répondront rapidement.";

      toast({
        title: "Message envoyé",
        description: priorityMessage,
      });

      setMessage('');
      setCategory('general');
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

  const [isModalOpen, setIsModalOpen] = useState(false);

  const defaultTrigger = (
    <button
      type="button"
      className="relative w-full h-24 flex flex-col items-center justify-center gap-3 bg-white border-0 hover:bg-gray-50 transition-all duration-300 hover:scale-105 shadow-lg rounded-lg p-4"
      onClick={() => setIsModalOpen(true)}
    >
      <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full min-w-[36px] min-h-[36px] flex items-center justify-center">
        <MessageSquare className="w-5 h-5 text-white" />
      </div>
      <span className="text-sm font-medium text-center">Service Client</span>
    </button>
  );

  return (
    <>
      {trigger || defaultTrigger}
      
      {/* Modal avec éléments HTML natifs */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsModalOpen(false);
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5" />
                   <h2 className="text-lg font-semibold">Contacter le Service Client</h2>
                   <p className="text-sm text-gray-600 mt-1">
                     Votre message sera traité par nos sous-administrateurs et administrateurs. 
                     {priority === 'urgent' && (
                       <span className="text-red-600 font-medium"> Les messages urgents sont prioritaires.</span>
                     )}
                   </p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium mb-2">
                    Catégorie du problème
                  </label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="general">Général</option>
                    <option value="transaction">Transaction</option>
                    <option value="account">Compte</option>
                    <option value="technical">Technique</option>
                    <option value="complaint">Réclamation</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="priority" className="block text-sm font-medium mb-2">
                    Priorité
                  </label>
                   <select
                     id="priority"
                     value={priority}
                     onChange={(e) => setPriority(e.target.value)}
                     className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                       priority === 'urgent' ? 'border-red-300 bg-red-50' : 'border-gray-300'
                     }`}
                   >
                     <option value="low">Faible</option>
                     <option value="normal">Normale</option>
                     <option value="high">Élevée</option>
                     <option value="urgent">🚨 Urgente (Administrateur)</option>
                   </select>
                   {priority === 'urgent' && (
                     <p className="text-sm text-red-600 mt-1">
                       ⚠️ Les messages urgents sont transmis directement aux administrateurs pour un traitement prioritaire.
                     </p>
                   )}
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-2">
                    Votre message
                  </label>
                  <textarea
                    id="message"
                    placeholder="Décrivez votre problème en détail..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px] resize-none"
                    disabled={isLoading}
                    required
                  />
                   <p className="text-sm text-gray-500 mt-1">
                     Décrivez votre problème avec autant de détails que possible. 
                     Nos {priority === 'urgent' ? 'administrateurs' : 'sous-administrateurs'} traiteront votre demande.
                   </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    disabled={isLoading || !message.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Envoi...
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
      )}
    </>
  );
};