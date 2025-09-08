import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Phone, Globe, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { countries } from "@/data/countries";

interface PaymentNumber {
  id: string;
  phone_number: string;
  country: string;
  provider: string;
  service_type: 'deposit' | 'withdrawal' | 'both';
  is_active: boolean;
  is_default: boolean;
  admin_name?: string;
  admin_type: 'main_admin' | 'sub_admin' | 'agent';
  description?: string;
}

const PaymentNumbersManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingNumber, setEditingNumber] = useState<PaymentNumber | null>(null);
  const [formData, setFormData] = useState<{
    phone_number: string;
    country: string;
    provider: string;
    service_type: 'deposit' | 'withdrawal' | 'both';
    is_active: boolean;
    is_default: boolean;
    admin_name: string;
    admin_type: 'main_admin' | 'sub_admin' | 'agent';
    description: string;
  }>({
    phone_number: '',
    country: '',
    provider: '',
    service_type: 'both',
    is_active: true,
    is_default: false,
    admin_name: '',
    admin_type: 'main_admin',
    description: ''
  });

  // Fetch payment numbers
  const { data: paymentNumbers, isLoading } = useQuery({
    queryKey: ['payment-numbers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_numbers')
        .select('*')
        .order('country', { ascending: true });
      
      if (error) throw error;
      return data as PaymentNumber[];
    }
  });

  // Use static countries data from countries.ts

  // Add payment number mutation
  const addMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('payment_numbers')
        .insert([data]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-numbers'] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: "Numéro ajouté",
        description: "Le numéro de paiement a été ajouté avec succès"
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le numéro de paiement",
        variant: "destructive"
      });
    }
  });

  // Update payment number mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PaymentNumber> }) => {
      const { error } = await supabase
        .from('payment_numbers')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-numbers'] });
      setEditingNumber(null);
      resetForm();
      toast({
        title: "Numéro mis à jour",
        description: "Le numéro de paiement a été mis à jour avec succès"
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le numéro de paiement",
        variant: "destructive"
      });
    }
  });

  // Delete payment number mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('payment_numbers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-numbers'] });
      toast({
        title: "Numéro supprimé",
        description: "Le numéro de paiement a été supprimé avec succès"
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le numéro de paiement",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      phone_number: '',
      country: '',
      provider: '',
      service_type: 'both' as const,
      is_active: true,
      is_default: false,
      admin_name: '',
      admin_type: 'main_admin' as const,
      description: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingNumber) {
      updateMutation.mutate({ id: editingNumber.id, data: formData });
    } else {
      addMutation.mutate(formData);
    }
  };

  const handleEdit = (number: PaymentNumber) => {
    setEditingNumber(number);
    setFormData({
      phone_number: number.phone_number,
      country: number.country,
      provider: number.provider,
      service_type: number.service_type,
      is_active: number.is_active,
      is_default: number.is_default,
      admin_name: number.admin_name || '',
      admin_type: number.admin_type,
      description: number.description || ''
    });
    setIsAddDialogOpen(true);
  };

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    updateMutation.mutate({ 
      id, 
      data: { is_active: !currentStatus } 
    });
  };

  const handleSetDefault = (id: string, country: string) => {
    // First, remove default status from all numbers in this country
    const numbersInCountry = paymentNumbers?.filter(n => n.country === country) || [];
    
    Promise.all(
      numbersInCountry.map(number => 
        supabase
          .from('payment_numbers')
          .update({ is_default: false })
          .eq('id', number.id)
      )
    ).then(() => {
      // Then set the selected number as default
      updateMutation.mutate({ 
        id, 
        data: { is_default: true } 
      });
    });
  };

  const getServiceTypeBadge = (type: string) => {
    const colors = {
      deposit: 'bg-green-100 text-green-800',
      withdrawal: 'bg-blue-100 text-blue-800',
      both: 'bg-purple-100 text-purple-800'
    };
    
    const labels = {
      deposit: 'Dépôt',
      withdrawal: 'Retrait',
      both: 'Les deux'
    };
    
    return (
      <Badge className={colors[type as keyof typeof colors]}>
        {labels[type as keyof typeof labels]}
      </Badge>
    );
  };

  const getAdminTypeBadge = (type: string) => {
    const colors = {
      main_admin: 'bg-red-100 text-red-800',
      sub_admin: 'bg-orange-100 text-orange-800',
      agent: 'bg-yellow-100 text-yellow-800'
    };
    
    const labels = {
      main_admin: 'Admin Principal',
      sub_admin: 'Sous-Admin',
      agent: 'Agent'
    };
    
    return (
      <Badge className={colors[type as keyof typeof colors]}>
        {labels[type as keyof typeof labels]}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Numéros de Paiement</h1>
          <p className="text-muted-foreground">
            Gérez les numéros de paiement par pays et opérateurs
          </p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingNumber(null);
              resetForm();
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un numéro
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingNumber ? 'Modifier le numéro' : 'Ajouter un numéro'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="phone_number">Numéro de téléphone</Label>
                <Input
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                  placeholder="+237..."
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="country">Pays</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un pays" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.name}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="provider">Opérateur</Label>
                <Select
                  value={formData.provider}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, provider: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un opérateur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Orange Money">Orange Money</SelectItem>
                    <SelectItem value="MTN Mobile Money">MTN Mobile Money</SelectItem>
                    <SelectItem value="Wave">Wave</SelectItem>
                    <SelectItem value="Moov Money">Moov Money</SelectItem>
                    <SelectItem value="Airtel Money">Airtel Money</SelectItem>
                    <SelectItem value="Free Money">Free Money</SelectItem>
                    <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="service_type">Type de service</Label>
                <Select
                  value={formData.service_type}
                  onValueChange={(value: 'deposit' | 'withdrawal' | 'both') => 
                    setFormData(prev => ({ ...prev, service_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Dépôt et Retrait</SelectItem>
                    <SelectItem value="deposit">Dépôt uniquement</SelectItem>
                    <SelectItem value="withdrawal">Retrait uniquement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="admin_name">Nom de l'administrateur</Label>
                <Input
                  id="admin_name"
                  value={formData.admin_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, admin_name: e.target.value }))}
                  placeholder="Nom de l'admin responsable"
                />
              </div>
              
              <div>
                <Label htmlFor="admin_type">Type d'administrateur</Label>
                <Select
                  value={formData.admin_type}
                  onValueChange={(value: 'main_admin' | 'sub_admin' | 'agent') => 
                    setFormData(prev => ({ ...prev, admin_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main_admin">Admin Principal</SelectItem>
                    <SelectItem value="sub_admin">Sous-Admin</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="description">Description (optionnel)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description du numéro"
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">Actif</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_default"
                    checked={formData.is_default}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked }))}
                  />
                  <Label htmlFor="is_default">Par défaut</Label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={addMutation.isPending || updateMutation.isPending}
                >
                  {editingNumber ? 'Modifier' : 'Ajouter'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Numéros de Paiement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Pays</TableHead>
                <TableHead>Opérateur</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentNumbers?.map((number) => (
                <TableRow key={number.id}>
                  <TableCell className="font-mono">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      {number.phone_number}
                      {number.is_default && (
                        <Badge variant="secondary">Défaut</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      {number.country}
                    </div>
                  </TableCell>
                  <TableCell>{number.provider}</TableCell>
                  <TableCell>{getServiceTypeBadge(number.service_type)}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {getAdminTypeBadge(number.admin_type)}
                      {number.admin_name && (
                        <div className="text-sm text-muted-foreground">
                          {number.admin_name}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={number.is_active}
                        onCheckedChange={() => handleToggleStatus(number.id, number.is_active)}
                      />
                      <span className="text-sm">
                        {number.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(number)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {!number.is_default && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefault(number.id, number.country)}
                        >
                          Défaut
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMutation.mutate(number.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {!paymentNumbers?.length && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun numéro de paiement configuré
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentNumbersManagement;