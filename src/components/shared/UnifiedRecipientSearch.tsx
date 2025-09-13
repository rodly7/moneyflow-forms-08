import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Loader2, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserSearch } from "@/hooks/useUserSearch";
import { countries } from "@/data/countries";

type UnifiedRecipientSearchProps = {
  phoneInput: string;
  selectedCountry: string;
  onPhoneChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onUserFound?: (user: any) => void;
  label?: string;
  showCountrySelector?: boolean;
  placeholder?: string;
  required?: boolean;
  verifyAgainstProfiles?: boolean;
};

export const UnifiedRecipientSearch = ({
  phoneInput,
  selectedCountry,
  onPhoneChange,
  onCountryChange,
  onUserFound,
  label = "Numéro de téléphone du destinataire",
  showCountrySelector = true,
  placeholder,
  required = false,
  verifyAgainstProfiles = true
}: UnifiedRecipientSearchProps) => {
  const { profile } = useAuth();
  const { searchUserByPhone, isSearching } = useUserSearch();
  const searching = verifyAgainstProfiles ? isSearching : false;
  const [isVerified, setIsVerified] = useState(false);
  const [foundUserName, setFoundUserName] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  
  const userCountry = profile?.country || "Cameroun";
  
  // Set default country on component mount
  useEffect(() => {
    if (!selectedCountry && userCountry) {
      onCountryChange(userCountry);
    }
  }, [userCountry, selectedCountry, onCountryChange]);
  
  // Get country code based on selected country
  const getCountryCode = (countryName: string) => {
    const country = countries.find(c => c.name === countryName);
    return country ? country.code : "+237";
  };

  const selectedCountryCode = getCountryCode(selectedCountry);

  // Handle country selection
  const handleCountryChange = (countryName: string) => {
    onCountryChange(countryName);
    onPhoneChange(""); // Reset phone when country changes
    setIsVerified(false);
    setFoundUserName("");
  };

  // Check if the phone number is complete based on country code
  const isPhoneComplete = () => {
    const digits = phoneInput.replace(/\D/g, '');
    
    // For Congo Brazzaville (+242), we need at least 9 digits
    if (selectedCountryCode.includes('242')) {
      return digits.length >= 9;
    }
    
    // For other countries, default to 8 digits minimum
    return digits.length >= 8;
  };

  // Format the phone number for display (without country code)
  const formatPhoneForDisplay = (phone: string): string => {
    if (!phone) return '';
    
    // Always work with digits only and remove any country code
    let digitsOnly = phone.replace(/\D/g, '');
    const countryCodeWithoutPlus = selectedCountryCode.replace('+', '');
    
    // Remove country code if present
    if (digitsOnly.startsWith(countryCodeWithoutPlus)) {
      digitsOnly = digitsOnly.substring(countryCodeWithoutPlus.length);
    }
    
    // For Congo Brazzaville, format as XX XXX XX XX
    if (selectedCountryCode.includes('242') && digitsOnly.length > 0) {
      let formatted = '';
      for (let i = 0; i < digitsOnly.length; i++) {
        if (i === 2 || i === 5 || i === 7) {
          formatted += ' ';
        }
        formatted += digitsOnly[i];
      }
      return formatted.trim();
    }
    
    // Default format (just return cleaned digits)
    return digitsOnly;
  };

  // Handle phone number search
  const handlePhoneSearch = async () => {
    if (!phoneInput || phoneInput.length < 6) {
      setIsVerified(false);
      setFoundUserName("");
      return;
    }

    // Clean phone input and ensure no country code duplication
    let cleanedPhoneInput = phoneInput.replace(/\D/g, '');
    const countryCodeWithoutPlus = selectedCountryCode.replace('+', '');
    
    // Always remove country code if it exists in the input
    if (cleanedPhoneInput.startsWith(countryCodeWithoutPlus)) {
      cleanedPhoneInput = cleanedPhoneInput.substring(countryCodeWithoutPlus.length);
    }
    
    // Construct full phone number with country code
    const fullPhoneNumber = selectedCountryCode + cleanedPhoneInput;

    // If we are not verifying against profiles (provider numbers), just pass it up
    if (!verifyAgainstProfiles) {
      if (onUserFound) {
        onUserFound({
          fullPhoneNumber,
          full_name: "",
          country: selectedCountry
        });
      }
      return;
    }

    try {
      console.log("🔍 Recherche du destinataire:", fullPhoneNumber);
      const foundUser = await searchUserByPhone(fullPhoneNumber);
      
      if (foundUser) {
        console.log("✅ Utilisateur trouvé:", foundUser);
        setIsVerified(true);
        setFoundUserName(foundUser.full_name || "Utilisateur");
        onUserFound?.({ ...foundUser, fullPhoneNumber });
      } else {
        console.log("ℹ️ Aucun utilisateur trouvé");
        setIsVerified(false);
        setFoundUserName("");
        onUserFound?.({ fullPhoneNumber, full_name: "", country: selectedCountry });
      }
    } catch (error) {
      console.error("❌ Erreur lors de la recherche:", error);
      setIsVerified(false);
      setFoundUserName("");
    }
  };

  // Handle blur event to trigger verification when phone number is complete
  const handleBlur = () => {
    setIsFocused(false);
    if (isPhoneComplete()) {
      handlePhoneSearch();
    }
  };

  // Handle input change to format and validate
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;
    
    // Remove any non-digit characters except spaces (for formatting)
    let cleanValue = inputValue.replace(/[^\d\s]/g, '');
    
    // Remove spaces for processing
    let digitsOnly = cleanValue.replace(/\s/g, '');
    
    // Remove country code if user accidentally types it
    const countryCodeWithoutPlus = selectedCountryCode.replace('+', '');
    if (digitsOnly.startsWith(countryCodeWithoutPlus)) {
      digitsOnly = digitsOnly.substring(countryCodeWithoutPlus.length);
    }
    
    onPhoneChange(digitsOnly);
  };

  // Handle keyup to trigger verification on Enter key
  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && isPhoneComplete()) {
      console.log("Touche Entrée pressée, déclenchement de la vérification");
      handlePhoneSearch();
    }
  };

  // Determine placeholder text based on country code
  const getPlaceholder = (): string => {
    if (placeholder) return placeholder;
    
    if (selectedCountryCode.includes('242')) {
      return "Ex: 06 XXX XX XX";
    }
    return "Ex: XXXXXXXX";
  };

  // Auto-search when phone number is complete
  useEffect(() => {
    if (verifyAgainstProfiles && phoneInput.length >= 8 && selectedCountryCode) {
      const timeoutId = setTimeout(() => {
        handlePhoneSearch();
      }, 1000);
      return () => clearTimeout(timeoutId);
    } else {
      setIsVerified(false);
      setFoundUserName("");
    }
  }, [phoneInput, selectedCountryCode, verifyAgainstProfiles]);

  return (
    <div className="space-y-4">
      {/* Country Selection */}
      {showCountrySelector && (
        <div className="form-field-wrapper">
          <Label htmlFor="recipient-country">Pays de Destination</Label>
          <select
            id="recipient-country"
            value={selectedCountry}
            onChange={(e) => handleCountryChange(e.target.value)}
            required={required}
            className="h-12 w-full px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="">Sélectionnez le pays</option>
            {countries.map((country) => (
              <option key={country.name} value={country.name}>
                {country.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Phone Number Input */}
      {selectedCountry && (
        <div className="form-field-wrapper">
          <Label>{label}</Label>
          <div className="flex items-center space-x-2">
            <div className="w-24 flex-shrink-0">
              <Input
                type="text"
                value={selectedCountryCode}
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
                disabled={searching}
                className={`h-12 ${verifyAgainstProfiles && isVerified ? "border-green-500 focus-visible:ring-green-500 pr-10" : "pr-10"}`}
                autoComplete="tel"
                required={required}
              />
              {verifyAgainstProfiles && searching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
              )}
              {verifyAgainstProfiles && isVerified && !searching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Check className="w-4 h-4 text-green-500" />
                </div>
              )}
            </div>
          </div>
          
          {/* Compact verification status */}
          <div className="min-h-[20px] form-message-zone">
            {verifyAgainstProfiles && isVerified && foundUserName && (
              <div className="flex items-center text-sm text-green-600 animate-fade-in">
                <User className="w-3.5 h-3.5 mr-1" />
                <span>{foundUserName}</span>
              </div>
            )}
            {verifyAgainstProfiles && phoneInput.length >= 8 && !isVerified && !searching && (
              <div className="text-sm text-amber-600">
                ⚠️ Utilisateur non trouvé - Vérifiez le numéro
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};