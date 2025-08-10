
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, User, Wallet, MapPin, Search } from "lucide-react";
import { formatCurrency } from "@/integrations/supabase/client";

interface ClientData {
  id: string;
  full_name: string;
  phone: string;
  balance: number;
  country?: string;
}

interface ClientSearchSectionProps {
  countryCode: string;
  agentCountry: string;
  phoneNumber: string;
  clientData: ClientData | null;
  isSearchingClient: boolean;
  onPhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ClientSearchSection = ({
  countryCode,
  agentCountry,
  phoneNumber,
  clientData,
  isSearchingClient,
  onPhoneChange
}: ClientSearchSectionProps) => {
  return (
    <Card className="bg-gradient-to-br from-orange-50 to-yellow-100 border-orange-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Search className="w-5 h-5 text-orange-600" />
          Recherche Client
        </CardTitle>
        <div className="space-y-2">
          <p className="text-sm text-orange-700">
            Saisissez le numéro du client (avec indicatif {countryCode} - {agentCountry})
          </p>
          <div className="bg-orange-100 border border-orange-200 rounded-md p-2">
            <p className="text-xs text-orange-800 font-medium flex items-center gap-1">
              💼 Commission: 0,5% par retrait
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Affichage de l'indicatif du pays */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center text-blue-800">
            <Phone className="w-4 h-4 mr-2" />
            <span className="font-medium">
              Indicatif du pays: {countryCode} ({agentCountry})
            </span>
          </div>
        </div>

        {/* Saisie du numéro */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-orange-700 font-medium">
            Numéro du client (sans indicatif)
          </Label>
          <div className="flex gap-2">
            <div className="w-20 flex-shrink-0">
              <Input
                type="text"
                value={countryCode}
                readOnly
                className="bg-gray-100 text-center font-medium"
              />
            </div>
            <div className="relative flex-1">
              <Input
                id="phone"
                type="tel"
                placeholder="Ex: 06123456"
                value={phoneNumber}
                onChange={onPhoneChange}
                required
                className="h-12 text-lg pr-10"
              />
              {isSearchingClient && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-orange-600">
            La recherche se fait automatiquement quand vous tapez le numéro
          </p>
        </div>

        {/* Informations du client trouvé */}
        {clientData && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-green-800 flex items-center gap-2">
                <User className="w-4 h-4" />
                Client Trouvé
              </h4>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center text-green-700">
                <User className="w-4 h-4 mr-2" />
                <span className="font-medium">
                  {clientData.full_name || 'Nom non disponible'}
                </span>
              </div>
              
              <div className="flex items-center text-green-700">
                <Wallet className="w-4 h-4 mr-2" />
                <span className="font-bold text-lg">
                  Solde: {formatCurrency(clientData.balance || 0, 'XAF')}
                </span>
              </div>
              
              <div className="flex items-center text-green-600 text-sm">
                <Phone className="w-3 h-3 mr-2" />
                <span>Téléphone: {countryCode} {phoneNumber}</span>
              </div>
              
              <div className="flex items-center text-green-600 text-sm">
                <MapPin className="w-3 h-3 mr-2" />
                <span>Pays: {clientData.country || 'Non spécifié'}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
