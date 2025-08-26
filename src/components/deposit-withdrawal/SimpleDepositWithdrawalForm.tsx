
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Smartphone, AlertCircle, Clock } from 'lucide-react';

interface SimpleDepositWithdrawalFormProps {
  type: 'deposit' | 'withdrawal';
  onSubmit: (amount: number, phone: string) => void;
  isProcessing?: boolean;
  userBalance?: number;
}

const SimpleDepositWithdrawalForm = ({ 
  type, 
  onSubmit, 
  isProcessing = false, 
  userBalance = 0 
}: SimpleDepositWithdrawalFormProps) => {
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mobile_money');
  const [isWaiting, setIsWaiting] = useState(false);
  const [waitTimeLeft, setWaitTimeLeft] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !phoneNumber) return;
    
    // Commencer la période d'attente de 3 minutes
    setIsWaiting(true);
    setWaitTimeLeft(180); // 3 minutes = 180 secondes
    
    // Décompte
    const interval = setInterval(() => {
      setWaitTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsWaiting(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    onSubmit(Number(amount), phoneNumber);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const isDeposit = type === 'deposit';

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isDeposit ? 'Dépôt d\'argent' : 'Retrait d\'argent'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">
              Montant ({isDeposit ? 'à déposer' : 'à retirer'}) (FCFA)
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="Entrez le montant"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="100"
              required
              disabled={isWaiting}
            />
          </div>

          <div>
            <Label htmlFor="phone">Numéro de téléphone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Ex: +242066123456"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              disabled={isWaiting}
            />
          </div>

          <div>
            <Label htmlFor="payment-method">Méthode de paiement</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled={isWaiting}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mobile_money">Mobile Money</SelectItem>
                <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Informations Mobile Money */}
          <div className={`${isDeposit ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'} border rounded-lg p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className={`w-5 h-5 ${isDeposit ? 'text-blue-600' : 'text-green-600'}`} />
              <span className={`font-medium ${isDeposit ? 'text-blue-800' : 'text-green-800'}`}>
                Numéro Mobile Money
              </span>
            </div>
            <div className={`text-lg font-bold ${isDeposit ? 'text-blue-900' : 'text-green-900'}`}>
              066164686
            </div>
            <p className={`text-sm ${isDeposit ? 'text-blue-700' : 'text-green-700'} mt-1`}>
              {isDeposit 
                ? 'Envoyez votre dépôt à ce numéro'
                : 'Votre retrait sera envoyé depuis ce numéro'
              }
            </p>
          </div>

          {!isDeposit && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  Solde disponible: {userBalance.toLocaleString()} FCFA
                </span>
              </div>
            </div>
          )}

          {/* Message d'attente */}
          {isWaiting && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="text-sm text-orange-800">
                  Veuillez patienter {formatTime(waitTimeLeft)} avant de pouvoir effectuer une nouvelle demande
                </span>
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={isProcessing || !amount || !phoneNumber || isWaiting}
            className="w-full"
          >
            {isProcessing 
              ? "Traitement en cours..." 
              : isWaiting
              ? `Patientez ${formatTime(waitTimeLeft)}`
              : `Confirmer le ${isDeposit ? 'dépôt' : 'retrait'}`
            }
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SimpleDepositWithdrawalForm;
