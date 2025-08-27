import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calculateFee } from "@/lib/utils/currency";
import { useAuth } from "@/contexts/AuthContext";

interface TransferDetailsProps {
  recipientCountry: string;
  amount: number;
  updateFields: (fields: Partial<{
    recipient: { fullName: string; phone: string; country: string };
    transfer: { amount: number; currency: string };
  }>) => void;
  nextStep: () => void;
}

const TransferDetails: React.FC<TransferDetailsProps> = ({ recipientCountry, amount, updateFields, nextStep }) => {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const { profile, userRole } = useAuth();

  useEffect(() => {
    if (recipientCountry) {
      updateFields({ recipient: { country: recipientCountry, fullName: '', phone: '' } });
    }
  }, [recipientCountry, updateFields]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !phone) {
      alert("Veuillez remplir tous les champs.");
      return;
    }

    updateFields({ recipient: { fullName, phone, country: recipientCountry } });
    nextStep();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations Bénéficiaire</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="fullName">Nom Complet</Label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nom complet du bénéficiaire"
            />
          </div>
          <div>
            <Label htmlFor="phone">Numéro de Téléphone</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Numéro de téléphone du bénéficiaire"
            />
          </div>
          <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700">
            Suivant
          </button>
        </form>
      </CardContent>
    </Card>
  );
};

export default TransferDetails;
