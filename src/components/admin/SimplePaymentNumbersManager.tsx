
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Phone, CreditCard } from 'lucide-react';

interface PaymentNumber {
  id: string;
  phone_number: string;
  provider: string;
  country: string;
  is_active: boolean;
  is_default: boolean;
  service_type: 'recharge' | 'withdrawal' | 'both';
  description?: string;
  admin_type: 'main_admin' | 'sub_admin';
  admin_name?: string;
}

const COUNTRIES_CONFIG = {
  'Congo Brazzaville': ['Mobile Money', 'Airtel Money'],
  'Sénégal': ['Wave', 'Orange Money']
};

const SimplePaymentNumbersManager = () => {
  const { toast } = useToast();
  const [paymentNumbers, setPaymentNumbers] = useState<PaymentNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newNumber, setNewNumber] = useState<PaymentNumber>({
    id: '',
    phone_number: '',
    provider: 'Mobile Money',
    country: 'Congo Brazzaville',
    is_active: true,
    is_default: false,
    service_type: 'both',
    description: '',
    admin_type: 'main_admin',
    admin_name: ''
  });

  useEffect(() => {
    loadPaymentNumbers();
  }, []);

  const loadPaymentNumbers = () => {
    try {
      const stored = localStorage.getItem('payment_numbers');
      if (stored) {
        setPaymentNumbers(JSON.parse(stored));
      } else {
        // Numéros par défaut
        const defaultNumbers: PaymentNumber[] = [
          {
            id: '1',
            phone_number: '+242066164686',
            provider: 'Mobile Money',
            country: 'Congo Brazzaville',
            is_active: true,
            is_default: true,
            service_type: 'both',
            description: 'Numéro principal Congo',
            admin_type: 'main_admin'
          },
          {
            id: '2',
            phone_number: '780192989',
            provider: 'Wave',
            country: 'Sénégal',
            is_active: true,
            is_default: true,
            service_type: 'both',
            description: 'Numéro principal Sénégal',
            admin_type: 'main_admin'
          }
        ];
        setPaymentNumbers(defaultNumbers);
        localStorage.setItem('payment_numbers', JSON.stringify(defaultNumbers));
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePaymentNumbers = (numbers: PaymentNumber[]) => {
    localStorage.setItem('payment_numbers', JSON.stringify(numbers));
    setPaymentNumbers(numbers);
  };

  const handleAdd = () => {
    if (!newNumber.phone_number) {
      toast({
        title: "Erreur",
        description: "Le numéro de téléphone est requis",
        variant: "destructive"
      });
      return;
    }

    const newId = Date.now().toString();
    const numberToAdd = { ...newNumber, id: newId };

    let updatedNumbers = [...paymentNumbers, numberToAdd];

    // Si c'est le nouveau numéro par défaut, désactiver les autres pour ce pays/provider
    if (newNumber.is_default) {
      updatedNumbers = updatedNumbers.map(num => 
        num.country === newNumber.country && num.provider === newNumber.provider && num.id !== newId
          ? { ...num, is_default: false }
          : num
      );
    }

    savePaymentNumbers(updatedNumbers);
    setNewNumber({
      id: '',
      phone_number: '',
      provider: 'Mobile Money',
      country: 'Congo Brazzaville',
      is_active: true,
      is_default: false,
      service_type: 'both',
      description: '',
      admin_type: 'main_admin',
      admin_name: ''
    });
    setIsAdding(false);

    toast({
      title: "Succès",
      description: "Numéro de paiement ajouté avec succès",
    });
  };

  const handleUpdate = (id: string, updates: Partial<PaymentNumber>) => {
    let updatedNumbers = paymentNumbers.map(num => 
      num.id === id ? { ...num, ...updates } : num
    );

    // Si on définit comme défaut, désactiver les autres pour ce pays/provider
    if (updates.is_default) {
      const targetNumber = updatedNumbers.find(num => num.id === id);
      if (targetNumber) {
        updatedNumbers = updatedNumbers.map(num => 
          num.country === targetNumber.country && 
          num.provider === targetNumber.provider && 
          num.id !== id
            ? { ...num, is_default: false }
            : num
        );
      }
    }

    savePaymentNumbers(updatedNumbers);
    setEditingId(null);

    toast({
      title: "Succès",
      description: "Numéro mis à jour avec succès",
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce numéro ?')) {
      return;
    }

    const updatedNumbers = paymentNumbers.filter(num => num.id !== id);
    savePaymentNumbers(updatedNumbers);

    toast({
      title: "Succès",
      description: "Numéro supprimé avec succès",
    });
  };

  const getAvailableProviders = (country: string) => {
    return COUNTRIES_CONFIG[country as keyof typeof COUNTRIES_CONFIG] || [];
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
          <p className="text-gray-600">Gérez les numéros Mobile Money disponibles par pays et opérateur</p>
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
                <Label htmlFor="country">Pays</Label>
                <Select 
                  value={newNumber.country}
                  onValueChange={(value) => {
                    const providers = getAvailableProviders(value);
                    setNewNumber(prev => ({ 
                      ...prev, 
                      country: value,
                      provider: providers[0] || ''
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(COUNTRIES_CONFIG).map((country) => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    {getAvailableProviders(newNumber.country).map((provider) => (
                      <SelectItem key={provider} value={provider}>{provider}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Numéro de téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder={newNumber.country === 'Congo Brazzaville' ? '+242066164686' : '780192989'}
                  value={newNumber.phone_number}
                  onChange={(e) => setNewNumber(prev => ({ ...prev, phone_number: e.target.value }))}
                />
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
                    value={newNumber.admin_name}
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
                value={newNumber.description}
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

      {/* Liste des numéros groupés par pays */}
      {Object.keys(COUNTRIES_CONFIG).map((country) => {
        const countryNumbers = paymentNumbers.filter(num => num.country === country);
        if (countryNumbers.length === 0) return null;

        return (
          <div key={country} className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">
              {country}
            </h3>
            <div className="grid gap-4">
              {countryNumbers.map((number) => (
                <Card key={number.id} className={`${number.is_default ? 'border-green-300 bg-green-50' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-full ${number.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
                          <Phone className={`w-5 h-5 ${number.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg">{number.phone_number}</h4>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Badge variant="outline">{number.provider}</Badge>
                            <Badge variant={number.admin_type === 'main_admin' ? 'default' : 'secondary'}>
                              {number.admin_type === 'main_admin' ? 'Admin Principal' : 'Sous-Admin'}
                            </Badge>
                            <span className="capitalize">{number.service_type.replace('_', ' ')}</span>
                          </div>
                          {number.admin_name && (
                            <p className="text-sm text-blue-600">Géré par: {number.admin_name}</p>
                          )}
                          {number.description && (
                            <p className="text-sm text-gray-500">{number.description}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {number.is_default && (
                          <Badge className="bg-green-100 text-green-800">
                            Par défaut
                          </Badge>
                        )}
                        <Switch
                          checked={number.is_active}
                          onCheckedChange={(checked) => handleUpdate(number.id, { is_active: checked })}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUpdate(number.id, { is_default: !number.is_default })}
                          disabled={number.is_default}
                        >
                          <CreditCard className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(number.id)}
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
          </div>
        );
      })}

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

      {/* Info sur la migration */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-800 mb-1">Information</h4>
              <p className="text-sm text-blue-700">
                Les numéros sont actuellement stockés localement. Pour une solution permanente, 
                créez la table 'payment_numbers' dans Supabase avec les colonnes appropriées.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimplePaymentNumbersManager;
