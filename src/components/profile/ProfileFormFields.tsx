
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ProfileFormFieldsProps {
  fullName: string;
  setFullName: (value: string) => void;
  phone: string;
  birthDate?: string;
  setBirthDate?: (value: string) => void;
}

const ProfileFormFields = ({ 
  fullName, 
  setFullName, 
  phone,
  birthDate,
  setBirthDate
}: ProfileFormFieldsProps) => {
  return (
    <div className="form-container">
      <div className="form-field-wrapper">
        <Label htmlFor="fullName">Nom complet *</Label>
        <Input 
          id="fullName"
          type="text" 
          value={fullName} 
          onChange={(e) => setFullName(e.target.value)} 
          placeholder="Votre nom complet"
          required
          className="h-12"
        />
        <div className="min-h-[20px] form-message-zone">
          {/* Validation messages will appear here */}
        </div>
      </div>

      {setBirthDate && (
        <div className="form-field-wrapper">
          <Label htmlFor="birthDate">Date de naissance *</Label>
          <Input 
            id="birthDate"
            type="date" 
            value={birthDate || ""} 
            onChange={(e) => setBirthDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            required
            className="h-12"
          />
          <div className="min-h-[20px] form-message-zone">
            <p className="text-xs text-gray-500">Information obligatoire pour votre compte</p>
          </div>
        </div>
      )}
      
      <div className="form-field-wrapper">
        <Label htmlFor="phone">Téléphone</Label>
        <Input 
          id="phone"
          type="text" 
          value={phone || ""} 
          disabled
          className="bg-gray-100 h-12"
        />
        <div className="min-h-[20px] form-message-zone">
          <p className="text-xs text-gray-500">Le numéro de téléphone ne peut pas être modifié</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileFormFields;
