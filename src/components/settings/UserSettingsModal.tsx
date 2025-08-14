import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Settings, MessageSquare, Send, AlertTriangle, HelpCircle, Bug, Lock, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UserSettingsModalProps {
  trigger?: React.ReactNode;
}

const RANDOM_MESSAGES = [
  "J'ai un problème avec mon solde qui ne se met pas à jour correctement.",
  "Je n'arrive pas à effectuer un transfert, l'application plante.",
  "Mon historique de transactions est vide alors que j'ai fait des opérations.",
  "Je n'ai pas reçu l'argent d'un transfert qui m'a été envoyé.",
  "L'application est très lente sur mon téléphone.",
  "Je ne comprends pas comment utiliser certaines fonctionnalités.",
  "Il y a des bugs dans l'interface utilisateur.",
  "Je veux signaler un problème de sécurité."
];

export const UserSettingsModal = ({ trigger }: UserSettingsModalProps) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState('normal');
  const [isLoading, setIsLoading] = useState(false);
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const { toast } = useToast();
  const { user } = useAuth();

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les nouveaux mots de passe ne correspondent pas",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Erreur",
        description: "Le nouveau mot de passe doit contenir au moins 6 caractères",
        variant: "destructive"
      });
      return;
    }

    if (currentPassword === newPassword) {
      toast({
        title: "Erreur",
        description: "Le nouveau mot de passe doit être différent de l'ancien",
        variant: "destructive"
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      // Verify current password by attempting to sign in
      if (!user?.email) {
        throw new Error('Email utilisateur non trouvé');
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });

      if (signInError) {
        throw new Error('Mot de passe actuel incorrect');
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Succès",
        description: "Votre mot de passe a été modifié avec succès",
      });

      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

    } catch (error: any) {
      console.error('Erreur lors du changement de mot de passe:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors du changement de mot de passe",
        variant: "destructive"
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

      toast({
        title: "Message envoyé",
        description: "Votre message a été envoyé aux administrateurs. Ils vous répondront rapidement.",
      });

      setMessage('');
      setCategory('general');
      setPriority('normal');
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

  const sendRandomMessage = async () => {
    const randomMsg = RANDOM_MESSAGES[Math.floor(Math.random() * RANDOM_MESSAGES.length)];
    setMessage(randomMsg);
    setCategory('technical');
    setPriority('high');
    
    // Envoyer automatiquement le message aléatoire
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('customer_support_messages')
        .insert({
          user_id: user.id,
          message: randomMsg,
          category: 'technical',
          priority: 'high',
          status: 'unread'
        });

      if (error) throw error;

      toast({
        title: "Problème signalé",
        description: "Un message de signalement de problème a été envoyé aux administrateurs.",
      });

      setMessage('');
      setCategory('general');
      setPriority('normal');
    } catch (error) {
      console.error('Error sending random message:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message de signalement.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const defaultTrigger = (
    <Button
      variant="outline"
      className="relative w-full h-24 flex-col gap-3 bg-white border-0 hover:bg-gray-50 transition-all duration-300 hover:scale-105 shadow-lg"
    >
      <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full min-w-[36px] min-h-[36px] flex items-center justify-center">
        <Settings className="w-5 h-5 text-white" />
      </div>
      <span className="text-sm font-medium text-center">Paramètres</span>
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Paramètres et Support
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Section changement de mot de passe */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600" />
                Changer le Mot de Passe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPasswords.current ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Votre mot de passe actuel"
                      disabled={isChangingPassword}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => togglePasswordVisibility('current')}
                      disabled={isChangingPassword}
                    >
                      {showPasswords.current ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPasswords.new ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Votre nouveau mot de passe"
                      disabled={isChangingPassword}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => togglePasswordVisibility('new')}
                      disabled={isChangingPassword}
                    >
                      {showPasswords.new ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirmez votre nouveau mot de passe"
                      disabled={isChangingPassword}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => togglePasswordVisibility('confirm')}
                      disabled={isChangingPassword}
                    >
                      {showPasswords.confirm ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isChangingPassword}
                  className="w-full"
                >
                  {isChangingPassword ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Modification en cours...
                    </>
                  ) : (
                    "Changer le mot de passe"
                  )}
                </Button>
              </form>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Conseils de sécurité :</strong>
                  <br />• Utilisez au moins 6 caractères
                  <br />• Mélangez lettres, chiffres et symboles
                  <br />• Ne partagez jamais votre mot de passe
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section de signalement rapide */}
          <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-orange-800">
                <AlertTriangle className="w-5 h-5" />
                Signalement Rapide
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-orange-700 mb-4">
                Vous rencontrez un problème ? Utilisez cette fonction pour envoyer rapidement un message de signalement aux administrateurs.
              </p>
              <Button
                onClick={sendRandomMessage}
                disabled={isLoading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Bug className="w-4 h-4 mr-2" />
                {isLoading ? 'Envoi...' : 'Signaler un Problème'}
              </Button>
            </CardContent>
          </Card>

          {/* Section de contact personnalisé */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Contacter les Administrateurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Catégorie</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">Général</SelectItem>
                        <SelectItem value="transaction">Transaction</SelectItem>
                        <SelectItem value="account">Compte</SelectItem>
                        <SelectItem value="technical">Technique</SelectItem>
                        <SelectItem value="complaint">Réclamation</SelectItem>
                        <SelectItem value="suggestion">Suggestion</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priorité</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez la priorité" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Faible</SelectItem>
                        <SelectItem value="normal">Normale</SelectItem>
                        <SelectItem value="high">Élevée</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Votre message</Label>
                  <Textarea
                    id="message"
                    placeholder="Décrivez votre problème, suggestion ou question en détail..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[120px]"
                    disabled={isLoading}
                  />
                  <p className="text-sm text-muted-foreground">
                    Soyez aussi précis que possible pour obtenir une réponse rapide.
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setOpen(false)}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isLoading || !message.trim()}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Envoi...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        Envoyer
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Section d'aide */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <HelpCircle className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Conseils d'utilisation</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>• Pour un problème urgent, utilisez la priorité "Urgente"</p>
                    <p>• Décrivez précisément le problème rencontré</p>
                    <p>• Les administrateurs vous répondront dans les meilleurs délais</p>
                    <p>• Vous pouvez suivre vos messages dans la section notifications</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
