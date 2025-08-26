
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';

interface SimpleDepositWithdrawalFormProps {
  type: 'deposit' | 'withdrawal';
  onSubmit: (amount: number, phone: string) => Promise<void>;
  isProcessing: boolean;
  userBalance: number;
}

const SimpleDepositWithdrawalForm: React.FC<SimpleDepositWithdrawalFormProps> = ({
  type,
  onSubmit,
  isProcessing,
  userBalance
}) => {
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [provider, setProvider] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount && phone) {
      await onSubmit(parseFloat(amount), phone);
      setAmount('');
      setPhone('');
      setProvider('');
    }
  };

  const isDeposit = type === 'deposit';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isDeposit ? (
            <>
              <ArrowDownToLine className="w-5 h-5" />
              Dépôt
            </>
          ) : (
            <>
              <ArrowUpFromLine className="w-5 h-5" />
              Retrait
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Montant (XAF)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="50000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1000"
              step="1000"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider">Fournisseur</Label>
            <Select value={provider} onValueChange={setProvider} required>
              <SelectTrigger>
                <SelectValue placeholder="Choisir le fournisseur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="orange_money">Orange Money</SelectItem>
                <SelectItem value="free_money">Free Money</SelectItem>
                <SelectItem value="wave">Wave</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Numéro de téléphone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+221 XX XXX XX XX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            className={`w-full ${isDeposit ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Traitement...
              </>
            ) : (
              <>
                {isDeposit ? (
                  <>
                    <ArrowDownToLine className="w-4 h-4 mr-2" />
                    Effectuer le dépôt
                  </>
                ) : (
                  <>
                    <ArrowUpFromLine className="w-4 h-4 mr-2" />
                    Effectuer le retrait
                  </>
                )}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SimpleDepositWithdrawalForm;
