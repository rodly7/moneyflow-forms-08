
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ProfileFormFieldsProps {
  fullName: string;
  setFullName: (value: string) => void;
  phone: string;
}

const ProfileFormFields = ({ 
  fullName, 
  setFullName, 
  phone 
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
        {/* Fixed space for validation messages */}
        <div className="min-h-[20px] form-message-zone">
          {/* Validation messages will appear here */}
        </div>
      </div>
      
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
