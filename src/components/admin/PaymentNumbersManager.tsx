
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Phone, CreditCard } from 'lucide-react';

interface PaymentNumber {
  id?: string;
  phone_number: string;
  provider: string;
  country: string;
  is_active: boolean;
  is_default: boolean;
  service_type: 'recharge' | 'withdrawal' | 'both';
  description?: string;
  admin_type: 'main_admin' | 'sub_admin';
  admin_name?: string;
  created_at?: string;
  updated_at?: string;
}

const PaymentNumbersManager = () => {
  const { toast } = useToast();
  const [paymentNumbers, setPaymentNumbers] = useState<PaymentNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newNumber, setNewNumber] = useState<PaymentNumber>({
    phone_number: '',
    provider: 'Airtel Money',
    country: 'Congo Brazzaville',
    is_active: true,
    is_default: false,
    service_type: 'both' as const,
    description: '',
    admin_type: 'main_admin' as const,
    admin_name: ''
  });

  useEffect(() => {
    fetchPaymentNumbers();
  }, []);

  const fetchPaymentNumbers = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_numbers')
        .select('*')
        .order('is_default', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      // Cast the data to proper types
      const typedData = (data || []).map(item => ({
        ...item,
        service_type: item.service_type as 'recharge' | 'withdrawal' | 'both',
        admin_type: item.admin_type as 'main_admin' | 'sub_admin'
      }));
      
      setPaymentNumbers(typedData);
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les numéros de paiement",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      if (!newNumber.phone_number) {
        toast({
          title: "Erreur",
          description: "Le numéro de téléphone est requis",
          variant: "destructive"
        });
        return;
      }

      // Si c'est le nouveau numéro par défaut, désactiver les autres
      if (newNumber.is_default) {
        const { error: updateError } = await supabase
          .from('payment_numbers')
          .update({ is_default: false })
          .neq('id', '');

        if (updateError) {
          console.error('Error updating default flags:', updateError);
        }
      }

      // Préparer les données sans l'ID
      const { id, created_at, updated_at, ...insertData } = newNumber;
      
      const { error } = await supabase
        .from('payment_numbers')
        .insert([insertData]);

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }

      await fetchPaymentNumbers();
      setNewNumber({
        phone_number: '',
        provider: 'Airtel Money',
        country: 'Congo Brazzaville',
        is_active: true,
        is_default: false,
        service_type: 'both' as const,
        description: '',
        admin_type: 'main_admin' as const,
        admin_name: ''
      });
      setIsAdding(false);

      toast({
        title: "Succès",
        description: "Numéro de paiement ajouté avec succès",
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'ajout du numéro",
        variant: "destructive"
      });
    }
  };

  const handleUpdate = async (id: string, updates: Partial<PaymentNumber>) => {
    try {
      // Si on définit comme défaut, désactiver les autres
      if (updates.is_default) {
        const { error: updateError } = await supabase
          .from('payment_numbers')
          .update({ is_default: false })
          .neq('id', id);

        if (updateError) {
          console.error('Error updating default flags:', updateError);
        }
      }

      const { error } = await supabase
        .from('payment_numbers')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Update error:', error);
        throw error;
      }

      await fetchPaymentNumbers();
      setEditingId(null);

      toast({
        title: "Succès",
        description: "Numéro mis à jour avec succès",
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce numéro ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('payment_numbers')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }

      await fetchPaymentNumbers();

      toast({
        title: "Succès",
        description: "Numéro supprimé avec succès",
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Numéros de Paiement</h2>
          <p className="text-gray-600">Gérez les numéros Mobile Money disponibles</p>
        </div>
        <Button 
          onClick={() => setIsAdding(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un numéro
        </Button>
      </div>

      {/* Formulaire d'ajout */}
      {isAdding && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-600">Nouveau Numéro de Paiement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Numéro de téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+242066164686"
                  value={newNumber.phone_number}
                  onChange={(e) => setNewNumber(prev => ({ ...prev, phone_number: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="provider">Opérateur</Label>
                <Select 
                  value={newNumber.provider}
                  onValueChange={(value) => setNewNumber(prev => ({ ...prev, provider: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Airtel Money">Airtel Money</SelectItem>
                    <SelectItem value="MTN Mobile Money">MTN Mobile Money</SelectItem>
                    <SelectItem value="Orange Money">Orange Money</SelectItem>
                    <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                    <SelectItem value="Wave">Wave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="country">Pays</Label>
                <Select 
                  value={newNumber.country}
                  onValueChange={(value) => setNewNumber(prev => ({ ...prev, country: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Congo Brazzaville">Congo Brazzaville</SelectItem>
                    <SelectItem value="Congo Kinshasa">Congo Kinshasa</SelectItem>
                    <SelectItem value="Cameroun">Cameroun</SelectItem>
                    <SelectItem value="Sénégal">Sénégal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="service">Type de service</Label>
                <Select 
                  value={newNumber.service_type}
                  onValueChange={(value: 'recharge' | 'withdrawal' | 'both') => 
                    setNewNumber(prev => ({ ...prev, service_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Recharge et Retrait</SelectItem>
                    <SelectItem value="recharge">Recharge uniquement</SelectItem>
                    <SelectItem value="withdrawal">Retrait uniquement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="admin-type">Type d'administrateur</Label>
                <Select 
                  value={newNumber.admin_type}
                  onValueChange={(value: 'main_admin' | 'sub_admin') => 
                    setNewNumber(prev => ({ ...prev, admin_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main_admin">Administrateur Principal</SelectItem>
                    <SelectItem value="sub_admin">Sous Administrateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newNumber.admin_type === 'sub_admin' && (
                <div>
                  <Label htmlFor="admin-name">Nom du sous-admin</Label>
                  <Input
                    id="admin-name"
                    placeholder="Nom du sous-administrateur"
                    value={newNumber.admin_name || ''}
                    onChange={(e) => setNewNumber(prev => ({ ...prev, admin_name: e.target.value }))}
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description (optionnel)</Label>
              <Input
                id="description"
                placeholder="Ex: Numéro principal pour les recharges"
                value={newNumber.description || ''}
                onChange={(e) => setNewNumber(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={newNumber.is_active}
                    onCheckedChange={(checked) => setNewNumber(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="active">Actif</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="default"
                    checked={newNumber.is_default}
                    onCheckedChange={(checked) => setNewNumber(prev => ({ ...prev, is_default: checked }))}
                  />
                  <Label htmlFor="default">Par défaut</Label>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setIsAdding(false)}>
                  Annuler
                </Button>
                <Button onClick={handleAdd}>
                  Ajouter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des numéros */}
      <div className="grid gap-4">
        {paymentNumbers.map((number) => (
          <Card key={number.id} className={`${number.is_default ? 'border-green-300 bg-green-50' : ''}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-full ${number.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <Phone className={`w-5 h-5 ${number.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{number.phone_number}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>{number.provider}</span>
                      <span>•</span>
                      <span>{number.country}</span>
                      <span>•</span>
                      <span className="capitalize">{number.service_type.replace('_', ' ')}</span>
                      {number.admin_type === 'sub_admin' && (
                        <>
                          <span>•</span>
                          <span>Sous-Admin: {number.admin_name}</span>
                        </>
                      )}
                    </div>
                    {number.description && (
                      <p className="text-sm text-gray-500 mt-1">{number.description}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {number.is_default && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Par défaut
                    </span>
                  )}
                  <Switch
                    checked={number.is_active}
                    onCheckedChange={(checked) => handleUpdate(number.id!, { is_active: checked })}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUpdate(number.id!, { is_default: !number.is_default })}
                    disabled={number.is_default}
                  >
                    <CreditCard className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingId(number.id!)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(number.id!)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {paymentNumbers.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Phone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun numéro de paiement
            </h3>
            <p className="text-gray-500">
              Ajoutez des numéros Mobile Money pour permettre aux utilisateurs de faire des recharges et retraits.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PaymentNumbersManager;
