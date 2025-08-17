
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Shield } from "lucide-react";

interface ClientData {
  id: string;
  full_name: string;
  phone: string;
  // Le solde n'est plus exposé aux agents
  country?: string;
}

interface ClientSearchFormProps {
  phoneNumber: string;
  clientData: ClientData | null;
  isSearching: boolean;
  onPhoneChange: (value: string) => void;
  onSearch: () => void;
}

export const ClientSearchForm = ({ 
  phoneNumber, 
  clientData, 
  isSearching, 
  onPhoneChange, 
  onSearch 
}: ClientSearchFormProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="phone">Numéro du client</Label>
      <div className="flex gap-2">
        <Input
          id="phone"
          type="tel"
          placeholder="Entrez le numéro du client"
          value={phoneNumber}
          onChange={(e) => onPhoneChange(e.target.value)}
          required
          className="h-12"
        />
        <Button
          type="button"
          variant="outline"
          onClick={onSearch}
          disabled={isSearching || !phoneNumber}
          className="h-12 px-3"
        >
          {isSearching ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
          ) : (
            <Search className="w-4 h-4" />
          )}
        </Button>
      </div>
      
      {clientData && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800 font-medium">
            ✓ Client: {clientData.full_name || 'Nom non disponible'}
          </p>
          <div className="text-xs text-green-500 flex items-center gap-1 mt-1">
            <Shield className="w-3 h-3" />
            Solde masqué pour la sécurité
          </div>
        </div>
      )}
    </div>
  );
};
