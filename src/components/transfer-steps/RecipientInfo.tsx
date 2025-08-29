import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TransferData } from "@/types/transfer";
import { UnifiedRecipientSearch } from "@/components/shared/UnifiedRecipientSearch";
import { useState } from "react";

type RecipientInfoProps = TransferData & {
  updateFields: (fields: Partial<TransferData>) => void;
};

const RecipientInfo = ({ recipient, updateFields }: RecipientInfoProps) => {
  const [phoneInput, setPhoneInput] = useState("");

  // Handle user found from unified search
  const handleUserFound = (userData: any) => {
    if (userData.full_name) {
      // User found - auto-fill recipient information
      updateFields({
        recipient: {
          ...recipient,
          fullName: userData.full_name,
          phone: userData.fullPhoneNumber,
          country: userData.country || recipient.country
        }
      });
    } else {
      // User not found - update phone but keep other fields for manual entry
      updateFields({
        recipient: {
          ...recipient,
          phone: userData.fullPhoneNumber
        }
      });
    }
  };

  // Handle country change
  const handleCountryChange = (countryName: string) => {
    updateFields({
      recipient: { 
        ...recipient, 
        country: countryName,
        phone: "" // Reset phone when country changes
      }
    });
    setPhoneInput("");
  };

  return (
    <div className="space-y-2">
      {/* Unified Recipient Search */}
      <UnifiedRecipientSearch
        phoneInput={phoneInput}
        selectedCountry={recipient.country}
        onPhoneChange={setPhoneInput}
        onCountryChange={handleCountryChange}
        onUserFound={handleUserFound}
        label="Numéro de téléphone du destinataire"
        showCountrySelector={true}
        required={true}
      />

      {/* Manual Name Entry if user not found */}
      {phoneInput.length >= 8 && !recipient.fullName && (
        <div className="space-y-1 animate-fade-in">
          <Label htmlFor="fullName">Nom Complet du Bénéficiaire</Label>
          <Input
            id="fullName"
            required
            placeholder="Entrez le nom complet"
            value={recipient.fullName}
            onChange={(e) =>
              updateFields({
                recipient: { ...recipient, fullName: e.target.value },
              })
            }
            className="h-10"
          />
          <p className="text-xs text-amber-600">
            ⚠️ Destinataire non trouvé - Veuillez saisir le nom manuellement
          </p>
        </div>
      )}
    </div>
  );
};

export default RecipientInfo;
