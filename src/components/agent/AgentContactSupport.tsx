
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageCircle, AlertTriangle, Send } from "lucide-react";

const AgentContactSupport = () => {
  const { user, profile } = useAuth();
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !category) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('customer_support_messages')
        .insert({
          user_id: user?.id,
          message: message.trim(),
          category,
          status: 'pending',
          priority: 'medium'
        });

      if (error) throw error;

      toast.success("Votre message a été envoyé aux administrateurs");
      setMessage("");
      setCategory("");
    } catch (error) {
      console.error('Erreur envoi message:', error);
      toast.error("Erreur lors de l'envoi du message");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-600" />
          Contacter les Administrateurs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Catégorie du problème
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez une catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technical">Problème technique</SelectItem>
                <SelectItem value="transaction">Problème de transaction</SelectItem>
                <SelectItem value="commission">Question sur les commissions</SelectItem>
                <SelectItem value="account">Problème de compte</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Décrivez votre problème
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Décrivez votre problème en détail..."
              className="min-h-[120px]"
              maxLength={1000}
            />
            <div className="text-xs text-gray-500 mt-1">
              {message.length}/1000 caractères
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting || !message.trim() || !category}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Envoyer le message
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800">Signaler un Problème</h4>
              <p className="text-sm text-amber-700 mt-1">
                En cas de problème urgent, utilisez ce formulaire. 
                Un administrateur vous contactera dans les plus brefs délais.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentContactSupport;
