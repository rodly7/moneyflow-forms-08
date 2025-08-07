
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Loader2, User } from "lucide-react";

type PhoneInputProps = {
  phoneInput: string;
  countryCode: string;
  onPhoneChange: (value: string) => void;
  isLoading: boolean;
  isVerified: boolean;
  label?: string;
  recipientName?: string;
  onBlurComplete?: () => void;
};

const PhoneInput = ({
  phoneInput,
  countryCode,
  onPhoneChange,
  isLoading,
  isVerified,
  label = "Numéro de téléphone",
  recipientName,
  onBlurComplete
}: PhoneInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  
  // Check if the phone number is complete based on country code
  const isPhoneComplete = () => {
    const digits = phoneInput.replace(/\D/g, '');
    
    // For Congo Brazzaville (+242), we need at least 9 digits
    if (countryCode.includes('242')) {
      return digits.length >= 9;
    }
    
    // For other countries, default to 8 digits minimum
    return digits.length >= 8;
  };
  
  // Format the phone number for display
  const formatPhoneForDisplay = (phone: string): string => {
    // For Congo Brazzaville, format as XX XXX XX XX
    if (countryCode.includes('242') && phone.length > 0) {
      const digitsOnly = phone.replace(/\D/g, '');
      
      // Apply Congo Brazzaville formatting
      let formatted = '';
      for (let i = 0; i < digitsOnly.length; i++) {
        if (i === 2 || i === 5 || i === 7) {
          formatted += ' ';
        }
        formatted += digitsOnly[i];
      }
      return formatted.trim();
    }
    
    // Default format (just return cleaned input)
    return phone;
  };
  
  // Handle blur event to trigger verification when phone number is complete
  const handleBlur = () => {
    setIsFocused(false);
    if (isPhoneComplete() && onBlurComplete) {
      console.log("Numéro complet, déclenchement de la vérification");
      onBlurComplete();
    }
  };

  // Handle input change to format and validate
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits
    const digitsOnly = e.target.value.replace(/\D/g, '');
    onPhoneChange(digitsOnly);
  };
  
  // Handle keyup to trigger verification on Enter key
  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && isPhoneComplete() && onBlurComplete) {
      console.log("Touche Entrée pressée, déclenchement de la vérification");
      onBlurComplete();
    }
  };
  
  // Determine placeholder text based on country code
  const getPlaceholder = (): string => {
    if (countryCode.includes('242')) {
      return "Ex: 06 XXX XX XX";
    }
    return "Ex: XXXXXXXX";
  };
  
  return (
    <div className="form-field-wrapper">
      <Label>{label}</Label>
      <div className="flex items-center space-x-2">
        <div className="w-24 flex-shrink-0">
          <Input
            type="text"
            value={countryCode}
            readOnly
            className="bg-gray-100 h-12"
          />
        </div>
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder={getPlaceholder()}
            value={formatPhoneForDisplay(phoneInput)}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={handleBlur}
            onKeyUp={handleKeyUp}
            disabled={isLoading}
            className={`h-12 ${isVerified ? "border-green-500 focus-visible:ring-green-500 pr-10" : "pr-10"}`}
            autoComplete="tel"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          )}
          {isVerified && !isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Check className="w-4 h-4 text-green-500" />
            </div>
          )}
        </div>
      </div>
      
      {/* Compact verification status */}
      <div className="min-h-[20px] form-message-zone">
        {isVerified && recipientName && (
          <div className="flex items-center text-sm text-green-600 animate-fade-in">
            <User className="w-3.5 h-3.5 mr-1" />
            <span>{recipientName}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhoneInput;
