
import { Card } from "@/components/ui/card";
import { TransferData } from "@/types/transfer";
import { useAuth } from "@/contexts/AuthContext";
import { calculateFee } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type TransferSummaryProps = TransferData & {
  updateFields: (fields: Partial<TransferData>) => void;
};

const TransferSummary = ({ recipient, transfer }: TransferSummaryProps) => {
  const { user, userRole } = useAuth();
  
  // Récupérer le profil de l'utilisateur pour connaître son pays
  const { data: userProfile } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('country')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const userCountry = userProfile?.country || "Cameroun";
  
  // Calculer les frais en utilisant le pays de l'utilisateur
  const { fee: fees, rate: feeRate } = calculateFee(
    transfer.amount, 
    userCountry,
    recipient.country, 
    userRole || 'user'
  );
  const total = transfer.amount + fees;

  // Déterminer si c'est un transfert national ou international
  const isNational = userCountry === recipient.country;
  const transferType = isNational ? "national" : "international";
  const feePercentageDisplay = `${feeRate}% (${transferType})`;

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-primary">Résumé du Transfert</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Veuillez vérifier les détails de votre transfert
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="p-6 space-y-4 bg-white/50">
          <h4 className="font-medium text-lg text-primary">Informations du Bénéficiaire</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <span className="text-muted-foreground">Nom :</span>
            <span className="font-medium">{recipient.fullName}</span>
            <span className="text-muted-foreground">Téléphone :</span>
            <span className="font-medium">{recipient.phone}</span>
            <span className="text-muted-foreground">Pays :</span>
            <span className="font-medium">{recipient.country}</span>
          </div>
        </Card>

        <Card className="p-6 space-y-4 bg-primary/5 border-primary/10">
          <h4 className="font-medium text-lg text-primary">Détails du Transfert</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <span className="text-muted-foreground">Montant :</span>
            <span className="font-medium">
              {transfer.amount.toLocaleString('fr-FR')} {transfer.currency}
            </span>
            <span className="text-muted-foreground">
              Frais ({feePercentageDisplay}) :
            </span>
            <span className="font-medium">
              {fees.toLocaleString('fr-FR')} {transfer.currency}
            </span>
            <span className="text-muted-foreground">Total :</span>
            <span className="font-medium text-lg">
              {total.toLocaleString('fr-FR')} {transfer.currency}
            </span>
          </div>
          {isNational && (
            <div className="text-sm text-emerald-600 bg-emerald-50 p-3 rounded-lg mt-4">
              💰 Commission agent sur transfert: 1%
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TransferSummary;
