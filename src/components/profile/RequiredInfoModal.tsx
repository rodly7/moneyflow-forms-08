
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import IdCardUpload from "@/components/auth/IdCardUpload";

interface RequiredInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onComplete: () => void;
}

const RequiredInfoModal = ({ isOpen, onClose, userId, onComplete }: RequiredInfoModalProps) => {
  const [birthDate, setBirthDate] = useState("");
  const [idCardPhotoUrl, setIdCardPhotoUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!birthDate || !idCardPhotoUrl) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          birth_date: birthDate,
          id_card_photo_url: idCardPhotoUrl
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Informations mises à jour",
        description: "Vos informations ont été enregistrées avec succès"
      });

      onComplete();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour vos informations",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Informations obligatoires</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-gray-600">
            Pour continuer à utiliser votre compte, veuillez compléter les informations suivantes :
          </p>
          
          <div className="space-y-2">
            <Label htmlFor="birthDate">Date de naissance *</Label>
            <Input
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              required
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <IdCardUpload
            onFileUploaded={setIdCardPhotoUrl}
            disabled={isSubmitting}
          />

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || !birthDate || !idCardPhotoUrl}
          >
            {isSubmitting ? "Enregistrement..." : "Continuer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RequiredInfoModal;
