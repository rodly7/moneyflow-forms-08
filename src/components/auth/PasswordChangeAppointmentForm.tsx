
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Phone, User, ArrowLeft, MessageSquare } from 'lucide-react';

interface PasswordChangeAppointmentFormProps {
  onBack: () => void;
}

export const PasswordChangeAppointmentForm = ({ onBack }: PasswordChangeAppointmentFormProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: profile?.full_name || '',
    phoneNumber: profile?.phone || '',
    reason: '',
    contactMethod: 'phone',
    additionalNotes: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour demander un rendez-vous",
        variant: "destructive"
      });
      return;
    }

    if (!formData.fullName || !formData.phoneNumber || !formData.reason) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('customer_support_messages')
        .insert({
          user_id: user.id,
          message: `🗓️ DEMANDE DE RENDEZ-VOUS - Changement de mot de passe
          
👤 Nom complet: ${formData.fullName}
📞 Numéro de téléphone: ${formData.phoneNumber}
📞 Méthode de contact: ${formData.contactMethod}
💬 Raison: ${formData.reason}

${formData.additionalNotes ? `Notes supplémentaires: ${formData.additionalNotes}` : ''}

Merci de me contacter pour fixer un rendez-vous au plus tôt.`,
          category: 'account',
          priority: 'high',
          status: 'unread'
        });

      if (error) throw error;

      toast({
        title: "Demande de rendez-vous envoyée",
        description: "Votre demande a été envoyée aux administrateurs. Vous serez contacté rapidement.",
      });

      setFormData({
        fullName: profile?.full_name || '',
        phoneNumber: profile?.phone || '',
        reason: '',
        contactMethod: 'phone',
        additionalNotes: ''
      });

      onBack();
    } catch (error) {
      console.error('Error sending appointment request:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la demande. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10"></div>
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full filter blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full filter blur-3xl animate-pulse delay-1000"></div>

      <Card className="w-full max-w-lg shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center space-y-2">
          <Button
            variant="ghost"
            onClick={onBack}
            className="absolute top-4 left-4 p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Demande de Rendez-vous
          </CardTitle>
          <CardDescription className="text-base">
            Remplissez vos informations pour demander un rendez-vous
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Nom complet *
              </Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleInputChange}
                required
                disabled={loading}
                placeholder="Votre nom complet"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Numéro de téléphone *
              </Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                required
                disabled={loading}
                placeholder="Ex: +242XXXXXXXX"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Raison du changement *</Label>
              <select
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                required
                disabled={loading}
                className="h-10 w-full px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">Sélectionnez une raison</option>
                <option value="mot_de_passe_oublie">Mot de passe oublié</option>
                <option value="securite_compromise">Sécurité compromise</option>
                <option value="changement_preventif">Changement préventif</option>
                <option value="autre">Autre raison</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactMethod" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Méthode de contact préférée
              </Label>
              <select
                id="contactMethod"
                name="contactMethod"
                value={formData.contactMethod}
                onChange={handleInputChange}
                disabled={loading}
                className="h-10 w-full px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="phone">Téléphone</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalNotes">Notes supplémentaires</Label>
              <Textarea
                id="additionalNotes"
                name="additionalNotes"
                placeholder="Informations complémentaires..."
                value={formData.additionalNotes}
                onChange={handleInputChange}
                disabled={loading}
                className="min-h-[80px]"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onBack}
                disabled={loading}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {loading ? 'Envoi...' : 'Envoyer la demande'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
