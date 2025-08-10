
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { NotificationService } from '@/services/notificationService';
import CustomerSupportMessages from './CustomerSupportMessages';

interface RandomMessage {
  id: string;
  title: string;
  message: string;
  category: string;
  emoji: string;
  priority: 'low' | 'normal' | 'high';
}

const RANDOM_MESSAGES: RandomMessage[] = [
  {
    id: '1',
    title: '🎉 Félicitations !',
    message: 'Vous êtes un utilisateur exceptionnel ! Continuez à utiliser SendFlow pour tous vos transferts.',
    category: 'motivation',
    emoji: '🎉',
    priority: 'normal'
  },
  {
    id: '2',
    title: '💰 Économisez plus !',
    message: 'Saviez-vous que SendFlow offre les meilleurs taux de change ? Transférez plus, payez moins !',
    category: 'promotion',
    emoji: '💰',
    priority: 'high'
  },
  {
    id: '3',
    title: '🔒 Sécurité renforcée',
    message: 'Vos transactions sont protégées par un cryptage de niveau bancaire. Transférez en toute sécurité.',
    category: 'sécurité',
    emoji: '🔒',
    priority: 'normal'
  },
  {
    id: '4',
    title: '⚡ Service rapide',
    message: 'Transferts instantanés 24h/24, 7j/7. SendFlow ne dort jamais pour vous servir !',
    category: 'service',
    emoji: '⚡',
    priority: 'normal'
  },
  {
    id: '5',
    title: '🌍 Portée mondiale',
    message: 'Envoyez de l\'argent dans plus de 50 pays. Le monde est à portée de main avec SendFlow.',
    category: 'global',
    emoji: '🌍',
    priority: 'normal'
  },
  {
    id: '6',
    title: '📱 Application mobile',
    message: 'Téléchargez notre app mobile pour des transferts encore plus rapides et pratiques !',
    category: 'technologie',
    emoji: '📱',
    priority: 'high'
  },
  {
    id: '7',
    title: '🎁 Bonus surprise',
    message: 'Transférez plus de 100,000 FCFA ce mois-ci et recevez un bonus surprise !',
    category: 'bonus',
    emoji: '🎁',
    priority: 'high'
  },
  {
    id: '8',
    title: '👨‍👩‍👧‍👦 Pour votre famille',
    message: 'Rien n\'est plus précieux que la famille. Envoyez de l\'argent rapidement à vos proches.',
    category: 'famille',
    emoji: '👨‍👩‍👧‍👦',
    priority: 'normal'
  },
  {
    id: '9',
    title: '🏆 Vous êtes un champion',
    message: 'Merci de faire confiance à SendFlow. Vous faites partie de notre famille !',
    category: 'reconnaissance',
    emoji: '🏆',
    priority: 'normal'
  },
  {
    id: '10',
    title: '💎 Service premium',
    message: 'Profitez d\'un service client 24h/24. Notre équipe est toujours là pour vous aider.',
    category: 'service',
    emoji: '💎',
    priority: 'normal'
  },
  {
    id: '11',
    title: '🚀 Innovation continue',
    message: 'SendFlow évolue constamment pour vous offrir la meilleure expérience de transfert.',
    category: 'innovation',
    emoji: '🚀',
    priority: 'normal'
  },
  {
    id: '12',
    title: '💝 Cadeau spécial',
    message: 'Ce mois-ci, tous les nouveaux utilisateurs reçoivent 1000 FCFA de bonus de bienvenue !',
    category: 'promotion',
    emoji: '💝',
    priority: 'high'
  }
];

export const SimpleMessagesTab = () => {
  const { toast } = useToast();
  const [selectedMessage, setSelectedMessage] = useState<RandomMessage | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sentMessages, setSentMessages] = useState<string[]>([]);

  const sendRandomMessage = async (message: RandomMessage) => {
    setIsSending(true);
    setSelectedMessage(message);

    try {
      // Obtenir l'utilisateur actuel
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      // Récupérer tous les utilisateurs actifs
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .eq('is_banned', false);

      if (error) throw error;

      // Utiliser le service de notification pour envoyer le message
      const result = await NotificationService.createNotification(
        message.title,
        message.message,
        message.priority,
        'all',
        users || [],
        undefined,
        undefined,
        undefined,
        user.id
      );

      if (result.success) {
        toast({
          title: "Message envoyé",
          description: `Message "${message.title}" envoyé à ${users?.length || 0} utilisateurs`,
        });

        // Ajouter à la liste des messages envoyés
        setSentMessages(prev => [...prev, message.id]);
      } else {
        throw new Error(result.message);
      }

    } catch (error: any) {
      console.error('Erreur lors de l\'envoi du message:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'envoi du message",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
      setSelectedMessage(null);
    }
  };

  const sendRandomToAll = async () => {
    const randomMessage = RANDOM_MESSAGES[Math.floor(Math.random() * RANDOM_MESSAGES.length)];
    await sendRandomMessage(randomMessage);
  };

  // Grouper les messages par catégorie
  const messagesByCategory = RANDOM_MESSAGES.reduce((acc, message) => {
    if (!acc[message.category]) {
      acc[message.category] = [];
    }
    acc[message.category].push(message);
    return acc;
  }, {} as Record<string, RandomMessage[]>);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Gestion des Messages
      </h2>

      <Tabs defaultValue="automated" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="automated" className="flex items-center gap-2">
            <span>🚀</span>
            Messages Automatiques
          </TabsTrigger>
          <TabsTrigger value="support" className="flex items-center gap-2">
            <span>💬</span>
            Support Client & Rendez-vous
          </TabsTrigger>
        </TabsList>

        <TabsContent value="automated" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-800">
              Envoi de messages automatiques
            </h3>
            <Button
              onClick={sendRandomToAll}
              disabled={isSending}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isSending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Envoi...
                </>
              ) : (
                <>
                  🎲 Envoyer message aléatoire
                </>
              )}
            </Button>
          </div>

          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="text-2xl">📨</div>
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Messages automatiques</h4>
                  <p className="text-sm text-blue-800">
                    Envoyez des messages motivants et informatifs à tous vos utilisateurs. 
                    Ces messages sont conçus pour améliorer l'engagement et la satisfaction client.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {Object.entries(messagesByCategory).map(([category, messages]) => (
            <Card key={category} className="bg-white shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-800 capitalize flex items-center gap-2">
                  <span className="text-2xl">{messages[0].emoji}</span>
                  {category}
                  <Badge variant="secondary" className="ml-2">
                    {messages.length} messages
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 rounded-lg border transition-all duration-200 ${
                      sentMessages.includes(message.id)
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-gray-900">
                            {message.title}
                          </h4>
                          <Badge 
                            variant={message.priority === 'high' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {message.priority === 'high' ? 'Priorité élevée' : 
                             message.priority === 'low' ? 'Priorité basse' : 'Priorité normale'}
                          </Badge>
                          {sentMessages.includes(message.id) && (
                            <Badge variant="default" className="bg-green-600">
                              ✓ Envoyé
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {message.message}
                        </p>
                      </div>
                      <Button
                        onClick={() => sendRandomMessage(message)}
                        disabled={isSending}
                        size="sm"
                        className="ml-4 bg-blue-600 hover:bg-blue-700"
                      >
                        {isSending && selectedMessage?.id === message.id ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                            Envoi...
                          </>
                        ) : (
                          'Envoyer'
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="text-xl">⚠️</div>
                <div>
                  <h4 className="font-medium text-yellow-900 mb-1">Conseils d'utilisation</h4>
                  <div className="text-sm text-yellow-800 space-y-1">
                    <p>• Utilisez les messages avec modération pour éviter de surcharger vos utilisateurs</p>
                    <p>• Les messages de priorité élevée sont plus visibles mais à utiliser avec parcimonie</p>
                    <p>• Variez les catégories pour maintenir l'intérêt de vos utilisateurs</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support">
          <CustomerSupportMessages />
        </TabsContent>
      </Tabs>
    </div>
  );
};
