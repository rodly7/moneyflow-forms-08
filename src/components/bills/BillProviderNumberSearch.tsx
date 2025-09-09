import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Loader2, Building } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type BillProviderNumberSearchProps = {
  billType: string;
  value: string;
  onChange: (value: string, providerName?: string) => void;
  placeholder?: string;
  required?: boolean;
};

export const BillProviderNumberSearch = ({
  billType,
  value,
  onChange,
  placeholder = "Saisir le numéro du fournisseur",
  required = false
}: BillProviderNumberSearchProps) => {
  const { profile } = useAuth();
  const [isSearching, setIsSearching] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [foundProviderName, setFoundProviderName] = useState("");
  
  const userCountry = profile?.country || "Sénégal";

  // Search for provider by number
  const searchProviderByNumber = async (searchNumber: string) => {
    if (!searchNumber || searchNumber.length < 3) {
      setIsVerified(false);
      setFoundProviderName("");
      return;
    }

    setIsSearching(true);
    
    try {
      const { data, error } = await supabase
        .from('bill_payment_numbers')
        .select('*')
        .eq('bill_type', billType)
        .eq('country', userCountry)
        .eq('is_active', true)
        .ilike('payment_number', `%${searchNumber}%`)
        .limit(5);

      if (error) {
        console.error("Erreur lors de la recherche:", error);
        setIsVerified(false);
        setFoundProviderName("");
        onChange(searchNumber);
        return;
      }

      if (data && data.length > 0) {
        // Find exact match first
        const exactMatch = data.find(provider => provider.payment_number === searchNumber);
        const foundProvider = exactMatch || data[0];
        
        console.log("✅ Fournisseur trouvé:", foundProvider);
        setIsVerified(true);
        setFoundProviderName(foundProvider.provider_name);
        onChange(searchNumber, foundProvider.provider_name);
      } else {
        console.log("Aucun fournisseur trouvé pour ce numéro");
        setIsVerified(false);
        setFoundProviderName("");
        onChange(searchNumber);
      }
    } catch (error) {
      console.error("❌ Erreur lors de la recherche:", error);
      setIsVerified(false);
      setFoundProviderName("");
      onChange(searchNumber);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);
    
    // Reset verification state when user types
    if (inputValue !== value) {
      setIsVerified(false);
      setFoundProviderName("");
    }
  };

  // Handle blur event to trigger verification
  const handleBlur = () => {
    if (value.length >= 3) {
      searchProviderByNumber(value);
    }
  };

  // Handle keyup to trigger verification on Enter key
  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.length >= 3) {
      searchProviderByNumber(value);
    }
  };

  // Auto-search when number is complete enough
  useEffect(() => {
    if (value.length >= 6 && billType) {
      const timeoutId = setTimeout(() => {
        searchProviderByNumber(value);
      }, 1000); // Debounce for 1s
      
      return () => clearTimeout(timeoutId);
    } else {
      setIsVerified(false);
      setFoundProviderName("");
    }
  }, [value, billType, userCountry]);

  return (
    <div className="space-y-2">
      <Label htmlFor="provider_number">Numéro du fournisseur</Label>
      <div className="relative">
        <Input
          id="provider_number"
          value={value}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onKeyUp={handleKeyUp}
          disabled={isSearching}
          className={`h-12 ${isVerified ? "border-green-500 focus-visible:ring-green-500 pr-10" : "pr-10"}`}
          placeholder={placeholder}
          required={required}
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          </div>
        )}
        {isVerified && !isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Check className="w-4 h-4 text-green-500" />
          </div>
        )}
      </div>
      
      {/* Verification status */}
      <div className="min-h-[20px]">
        {isVerified && foundProviderName && (
          <div className="flex items-center text-sm text-green-600 animate-fade-in">
            <Building className="w-3.5 h-3.5 mr-1" />
            <span>{foundProviderName}</span>
          </div>
        )}
        {value.length >= 3 && !isVerified && !isSearching && (
          <div className="text-sm text-amber-600">
            ⚠️ Fournisseur non trouvé - Vérifiez le numéro
          </div>
        )}
      </div>
    </div>
  );
};