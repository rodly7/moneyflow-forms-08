
import { useState, useEffect } from "react";
import { ArrowLeft, Zap, Wifi, Tv, Droplets, Settings, QrCode } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { AutomaticBillsManager } from "@/components/bills/AutomaticBillsManager";
import ManualBillPayment from "@/components/bills/ManualBillPayment";
import { BillQRScanner } from "@/components/bills/BillQRScanner";

import { PWAOptimizedLayout } from "@/components/pwa/PWAOptimizedLayout";

const BillPayments = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [provider, setProvider] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [savedMeterNumbers, setSavedMeterNumbers] = useState<{[key: string]: string}>({});
  const [activeTab, setActiveTab] = useState<'manual' | 'automatic'>('automatic');
  const [showQRScanner, setShowQRScanner] = useState(false);

  // États pour le type de facture sélectionné
  const [selectedBillType, setSelectedBillType] = useState('');

  // Phone input states for recipient
  const [recipientPhone, setRecipientPhone] = useState('');
  const [foundUser, setFoundUser] = useState<any>(null);

  const feeRate = 0.015; // 1.5% frais

  // Remplir automatiquement le pays de l'utilisateur (seulement les 3 pays autorisés)
  useEffect(() => {
    if (profile?.country && ['Sénégal', 'Congo Brazzaville', 'Gabon'].includes(profile.country)) {
      console.log('User country from profile:', profile.country);
      setSelectedCountry(profile.country);
    }
  }, [profile?.country]);

  // Charger les numéros de compteur sauvegardés depuis le localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedMeterNumbers');
    if (saved) {
      setSavedMeterNumbers(JSON.parse(saved));
    }
  }, []);

  const saveMeterNumber = () => {
    if (accountNumber && provider && selectedBillType) {
      const key = `${selectedCountry}-${selectedBillType}-${provider}`;
      const newSaved = { ...savedMeterNumbers, [key]: accountNumber };
      setSavedMeterNumbers(newSaved);
      localStorage.setItem('savedMeterNumbers', JSON.stringify(newSaved));
      alert('Numéro de compteur sauvegardé!');
    }
  };

  const loadSavedMeterNumber = () => {
    if (provider && selectedBillType) {
      const key = `${selectedCountry}-${selectedBillType}-${provider}`;
      const saved = savedMeterNumbers[key];
      if (saved) {
        setAccountNumber(saved);
      }
    }
  };

  // Types de factures principaux
  const billTypes = [
    { value: 'rent', label: 'Loyer' },
    { value: 'electricity', label: 'Électricité' },
    { value: 'wifi', label: 'Wifi/Internet' },
    { value: 'water', label: 'Eau' }
  ];

  // Entreprises disponibles selon le pays et type de facture (seulement 3 pays)
  const getCompaniesForType = (type: string, country: string) => {
    const companies: any = {
      electricity: {
        'Sénégal': [{ value: 'SENELEC', label: 'SENELEC' }],
        'Congo Brazzaville': [{ value: 'SNE', label: 'SNE' }],
        'Gabon': [{ value: 'SEEG', label: 'SEEG' }]
      },
      water: {
        'Sénégal': [{ value: 'SDE', label: 'SDE' }],
        'Congo Brazzaville': [{ value: 'LCDE', label: 'LCDE' }],
        'Gabon': [{ value: 'SEEG', label: 'SEEG' }]
      },
      wifi: {
        'Sénégal': [
          { value: 'Orange', label: 'Orange' },
          { value: 'Free', label: 'Free' }
        ],
        'Congo Brazzaville': [
          { value: 'Canalbox', label: 'Canalbox' },
          { value: 'Congo Telecom', label: 'Congo Telecom' }
        ],
        'Gabon': [
          { value: 'Gabon Telecom', label: 'Gabon Telecom' },
          { value: 'Airtel', label: 'Airtel' }
        ]
      },
      rent: {
        'Sénégal': [{ value: 'Loyer', label: 'Loyer' }],
        'Congo Brazzaville': [{ value: 'Loyer', label: 'Loyer' }],
        'Gabon': [{ value: 'Loyer', label: 'Loyer' }]
      }
    };
    
    return companies[type]?.[country] || [];
  };

  // Fonction pour obtenir automatiquement le fournisseur par défaut
  const getDefaultProvider = (type: string, country: string) => {
    const companies = getCompaniesForType(type, country);
    return companies.length > 0 ? companies[0].value : '';
  };

  // Mettre à jour automatiquement le fournisseur quand le type de facture change
  useEffect(() => {
    if (selectedBillType && selectedCountry) {
      const defaultProvider = getDefaultProvider(selectedBillType, selectedCountry);
      setProvider(defaultProvider);
      // Charger automatiquement le numéro sauvegardé si disponible
      setTimeout(loadSavedMeterNumber, 100);
    }
  }, [selectedBillType, selectedCountry]);

  const calculateTotal = () => {
    const baseAmount = parseFloat(amount) || 0;
    const fees = baseAmount * feeRate;
    return baseAmount + fees;
  };

  const handleQRScanSuccess = (billData: any) => {
    // Remplir automatiquement les champs avec les données du QR code
    setSelectedBillType(billData.serviceType);
    setProvider(billData.provider);
    setAccountNumber(billData.accountNumber);
    if (billData.amount) {
      setAmount(billData.amount);
    }
    setShowQRScanner(false);
    alert(`QR code scanné avec succès!\nFournisseur: ${billData.provider}\nCompte: ${billData.accountNumber}`);
  };

  const handleVerifyDetails = () => {
    if (!accountNumber || !amount || !provider) {
      alert("Veuillez remplir tous les champs");
      return;
    }
    alert(`Détails vérifiés pour ${provider}\nNuméro: ${accountNumber}\nMontant: ${amount} FCFA`);
  };

  return (
    <PWAOptimizedLayout>
      <div className="h-full w-full">
        {/* Header compact et fixe */}
        <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="h-10 w-10 p-0 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold text-gray-800">Paiement de Factures</h1>
            </div>
          </div>
        </div>

        {/* Contenu scrollable */}
        <div className="h-[calc(100%-80px)] overflow-y-auto">
          <div className="p-3">
            <AutomaticBillsManager />
          </div>

        {/* QR Scanner Modal */}
        {showQRScanner && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Scanner QR Code</h3>
                <Button
                  variant="ghost"
                  onClick={() => setShowQRScanner(false)}
                  className="h-8 w-8 p-0"
                >
                  ✕
                </Button>
              </div>
              <BillQRScanner
                onScanSuccess={(data) => {
                  setSelectedBillType(data.serviceType);
                  setProvider(data.provider);
                  setAccountNumber(data.accountNumber);
                  if (data.amount) setAmount(data.amount);
                  setShowQRScanner(false);
                }}
                onClose={() => setShowQRScanner(false)}
              />
            </div>
          </div>
        )}
        </div>
      </div>
    </PWAOptimizedLayout>
  );
};

export default BillPayments;
