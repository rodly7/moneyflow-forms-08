
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowUpRight, User, Phone, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import useDepositWithdrawalOperations from '@/hooks/useDepositWithdrawalOperations';

const MobileAgentWithdrawalForm: React.FC = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { createOperation, loading } = useDepositWithdrawalOperations();
  
  const [formData, setFormData] = useState({
    clientPhone: '',
    amount: '',
    provider: '',
    clientName: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientPhone || !formData.amount || !formData.provider) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (amount <= 0) {
      toast({
        title: "Montant invalide",
        description: "Le montant doit être supérieur à 0",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await createOperation(
        amount,
        'withdrawal',
        'mobile_money',
        formData.clientPhone,
        profile?.country || 'Unknown',
        formData.provider
      );

      if (result) {
        toast({
          title: "Retrait initié",
          description: `Retrait de ${amount.toLocaleString()} XAF en cours de traitement`,
        });
        
        // Reset form
        setFormData({
          clientPhone: '',
          amount: '',
          provider: '',
          clientName: ''
        });
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ArrowUpRight className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-bold">Retrait Client</CardTitle>
          <p className="text-gray-600 text-sm">Effectuer un retrait pour un client</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clientName" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Nom du client (optionnel)
              </Label>
              <Input
                id="clientName"
                type="text"
                placeholder="Nom complet du client"
                value={formData.clientName}
                onChange={(e) => handleInputChange('clientName', e.target.value)}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientPhone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Téléphone du client *
              </Label>
              <Input
                id="clientPhone"
                type="tel"
                placeholder="+221 XX XXX XX XX"
                value={formData.clientPhone}
                onChange={(e) => handleInputChange('clientPhone', e.target.value)}
                className="h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Montant (XAF) *
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder="50000"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                className="h-12"
                min="1000"
                step="1000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider">Fournisseur de paiement *</Label>
              <Select
                value={formData.provider}
                onValueChange={(value) => handleInputChange('provider', value)}
                required
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Choisir le fournisseur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="orange_money">Orange Money</SelectItem>
                  <SelectItem value="free_money">Free Money</SelectItem>
                  <SelectItem value="wave">Wave</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-red-600 hover:bg-red-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Traitement...
                </>
              ) : (
                <>
                  <ArrowUpRight className="w-4 h-4 mr-2" />
                  Effectuer le retrait
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Assurez-vous que le client a suffisamment de fonds 
              sur son compte avant d'effectuer le retrait.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileAgentWithdrawalForm;
