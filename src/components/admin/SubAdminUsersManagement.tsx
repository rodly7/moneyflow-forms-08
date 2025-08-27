
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Search, Phone, MapPin } from 'lucide-react';

interface User {
  id: string;
  full_name: string;
  phone: string;
  country: string;
  address: string;
  birth_date: string;
  id_card_photo_url: string;
  role: 'user' | 'agent' | 'admin' | 'sub_admin';
  balance: number;
  created_at: string;
  is_banned: boolean;
}

const SubAdminUsersManagement = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['sub-admin-users', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as User[];
    },
    enabled: !!user?.id
  });

  const filteredUsers = users?.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.includes(searchTerm) ||
    user.country?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'sub_admin': return 'bg-orange-100 text-orange-800';
      case 'agent': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'sub_admin': return 'Sous-Admin';
      case 'agent': return 'Agent';
      default: return 'Utilisateur';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Gestion des Utilisateurs</h2>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {filteredUsers.length} utilisateur(s)
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Rechercher des utilisateurs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Rechercher par nom, téléphone ou pays..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredUsers.map((user) => (
          <Card key={user.id} className={`${user.is_banned ? 'border-red-200 bg-red-50' : ''}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{user.full_name || 'Nom non défini'}</h3>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                    {user.is_banned && (
                      <Badge variant="destructive">Banni</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {user.phone}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {user.country || 'Non défini'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mt-2">
                    <div>
                      <strong>Adresse:</strong> {user.address || 'Non définie'}
                    </div>
                    <div>
                      <strong>Date de naissance:</strong> {user.birth_date ? new Date(user.birth_date).toLocaleDateString('fr-FR') : 'Non définie'}
                    </div>
                  </div>

                  {user.id_card_photo_url && (
                    <div className="mt-2">
                      <div className="text-sm text-muted-foreground mb-1">Pièce d'identité:</div>
                      <img 
                        src={user.id_card_photo_url} 
                        alt="Pièce d'identité" 
                        className="w-20 h-16 object-cover rounded border cursor-pointer hover:opacity-80"
                        onClick={() => window.open(user.id_card_photo_url, '_blank')}
                      />
                    </div>
                  )}

                  <div className="text-sm text-muted-foreground mt-2">
                    Membre depuis : {new Date(user.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>

                <div className="text-right space-y-2">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(user.balance)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Solde du compte
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredUsers.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Aucun utilisateur trouvé</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Aucun utilisateur ne correspond à votre recherche.' : 'Il n\'y a pas d\'utilisateurs à afficher.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SubAdminUsersManagement;
