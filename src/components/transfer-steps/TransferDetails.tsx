
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TransferData } from "@/types/transfer";
import { useAuth } from "@/contexts/AuthContext";
import { calculateFee } from "@/lib/utils/currency";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type TransferDetailsProps = TransferData & {
  updateFields: (fields: Partial<TransferData>) => void;
};

const TransferDetails = ({ transfer, recipient, updateFields }: TransferDetailsProps) => {
  const { user, userRole, profile } = useAuth();
  
  // Utiliser le pays du profil directement
  const userCountry = profile?.country || "Cameroun";
  
  // Calculer les frais automatiquement
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
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="amount">Montant à Envoyer ({transfer.currency})</Label>
        <Input
          id="amount"
          type="number"
          required
          min="0"
          step="100"
          placeholder={`Entrez le montant en ${transfer.currency}`}
          value={transfer.amount || ""}
          onChange={(e) =>
            updateFields({
              transfer: { ...transfer, amount: parseFloat(e.target.value) },
            })
          }
          className="text-lg h-12"
        />
      </div>

      {transfer.amount > 0 && recipient.country && (
        <div className="mt-4 p-4 bg-primary/5 rounded-xl space-y-2 border border-primary/10">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Montant du transfert :</span>
            <span className="font-medium">
              {transfer.amount.toLocaleString('fr-FR')} {transfer.currency}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              Frais ({feePercentageDisplay}) :
            </span>
            <span className="font-medium">
              {fees.toLocaleString('fr-FR')} {transfer.currency}
            </span>
          </div>
          <div className="flex justify-between font-semibold pt-2 border-t border-primary/10 text-lg">
            <span>Total :</span>
            <span>
              {total.toLocaleString('fr-FR')} {transfer.currency}
            </span>
          </div>
          
          {/* Informations contextuelles */}
          <div className="space-y-1 pt-2">
            {isNational && (
              <div className="text-sm text-emerald-600 bg-emerald-50 p-2 rounded">
                💰 Transfert national - Taux préférentiel de {feeRate}%
              </div>
            )}
            {!isNational && (
              <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                🌍 Transfert international - Taux de {feeRate}%
              </div>
            )}
            {userRole === 'agent' && (
              <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                🏢 Mode Agent - Depuis {userCountry} vers {recipient.country}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferDetails;
