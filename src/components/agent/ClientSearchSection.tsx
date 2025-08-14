
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Phone, User, MapPin, Search, QrCode } from "lucide-react";
import { AgentQRScanner } from "./AgentQRScanner";
import { useState } from "react";

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
  onClientFound: (clientData: ClientData) => void;
}

export const ClientSearchSection = ({
  countryCode,
  agentCountry,
  phoneNumber,
  clientData,
  isSearchingClient,
  onPhoneChange,
  onClientFound
}: ClientSearchSectionProps) => {
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  const handleQRScanSuccess = (userData: { userId: string; fullName: string; phone: string }) => {
    // Simuler les données client trouvées via QR
    const qrClientData: ClientData = {
      id: userData.userId,
      full_name: userData.fullName,
      phone: userData.phone,
      balance: 0, // Masqué pour l'agent
      country: agentCountry
    };
    onClientFound(qrClientData);
    setIsQRScannerOpen(false);
  };

  return (
    <Card className="bg-gradient-to-br from-orange-50 to-yellow-100 border-orange-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Search className="w-5 h-5 text-orange-600" />
          Identification Client
        </CardTitle>
        <div className="space-y-2">
          <p className="text-sm text-orange-700">
            Saisissez le numéro du client ou scannez son QR code
          </p>
          <div className="bg-orange-100 border border-orange-200 rounded-md p-2">
            <p className="text-xs text-orange-800 font-medium flex items-center gap-1">
              💼 Commission: 0,5% par transaction
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bouton QR Scanner */}
        <Button
          type="button"
          onClick={() => setIsQRScannerOpen(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 h-12"
          variant="default"
        >
          <QrCode className="w-5 h-5 mr-2" />
          Scanner le QR Code du client
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-yellow-50 px-2 text-orange-600">Ou saisir le numéro</span>
          </div>
        </div>

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

        {/* Informations du client trouvé (SANS SOLDE) */}
        {clientData && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-green-800 flex items-center gap-2">
                <User className="w-4 h-4" />
                Client Identifié
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
              
              <div className="flex items-center text-green-600 text-sm">
                <Phone className="w-3 h-3 mr-2" />
                <span>Téléphone: {countryCode} {phoneNumber || clientData.phone}</span>
              </div>
              
              <div className="flex items-center text-green-600 text-sm">
                <MapPin className="w-3 h-3 mr-2" />
                <span>Pays: {clientData.country || 'Non spécifié'}</span>
              </div>
            </div>
          </div>
        )}

        <AgentQRScanner
          isOpen={isQRScannerOpen}
          onClose={() => setIsQRScannerOpen(false)}
          onScanSuccess={handleQRScanSuccess}
        />
      </CardContent>
    </Card>
  );
};
