import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  UserCheck, 
  Users, 
  Search,
  Shield,
  Building2,
  Store,
  UserCog
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface User {
  id: string;
  full_name: string;
  phone: string;
  role: 'user' | 'agent' | 'admin' | 'sub_admin' | 'merchant' | 'provider';
  country: string;
  balance: number;
  created_at: string;
}

const UserRoleManagement = () => {
  const { profile } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [updating, setUpdating] = useState<string | null>(null);

  const roleLabels = {
    user: 'Utilisateur',
    agent: 'Agent',
    admin: 'Administrateur',
    sub_admin: 'Sous-admin',
    merchant: 'Marchand',
    provider: 'Fournisseur'
  };

  const roleIcons = {
    user: Users,
    agent: UserCog,
    admin: Shield,
    sub_admin: UserCheck,
    merchant: Store,
    provider: Building2
  };

  const roleColors = {
    user: 'bg-blue-100 text-blue-800',
    agent: 'bg-green-100 text-green-800',
    admin: 'bg-red-100 text-red-800',
    sub_admin: 'bg-purple-100 text-purple-800',
    merchant: 'bg-orange-100 text-orange-800',
    provider: 'bg-teal-100 text-teal-800'
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, role, country, balance, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        toast.error('Erreur lors du chargement des utilisateurs');
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    if (!profile?.id) return;

    try {
      setUpdating(userId);
      
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) {
        console.error('Erreur lors de la mise à jour du rôle:', error);
        toast.error('Erreur lors de la mise à jour du rôle');
        return;
      }

      // Mettre à jour localement
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, role: newRole as 'user' | 'agent' | 'admin' | 'sub_admin' | 'merchant' | 'provider' }
          : user
      ));

      toast.success(`Rôle mis à jour vers ${roleLabels[newRole as keyof typeof roleLabels]}`);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setUpdating(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm);
    
    const matchesRole = filterRole === '' || user.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Chargement des utilisateurs...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Gestion des rôles utilisateurs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filtres */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher par nom ou téléphone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les rôles</SelectItem>
                <SelectItem value="user">Utilisateur</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="merchant">Marchand</SelectItem>
                <SelectItem value="provider">Fournisseur</SelectItem>
                <SelectItem value="sub_admin">Sous-admin</SelectItem>
                <SelectItem value="admin">Administrateur</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Liste des utilisateurs */}
          <div className="space-y-4">
            {filteredUsers.map((user) => {
              const RoleIcon = roleIcons[user.role];
              
              return (
                <div
                  key={user.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-foreground">
                            {user.full_name || 'Nom non défini'}
                          </h3>
                          <Badge className={roleColors[user.role]}>
                            <RoleIcon className="w-3 h-3 mr-1" />
                            {roleLabels[user.role]}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Téléphone: </span>
                          <span>{user.phone}</span>
                        </div>
                        <div>
                          <span className="font-medium">Pays: </span>
                          <span>{user.country || 'Non défini'}</span>
                        </div>
                        <div>
                          <span className="font-medium">Solde: </span>
                          <span className="text-green-600 font-medium">
                            {user.balance?.toLocaleString() || 0} FCFA
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Inscrit: </span>
                          <span>{new Date(user.created_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <Select
                        value={user.role}
                        onValueChange={(newRole) => updateUserRole(user.id, newRole)}
                        disabled={updating === user.id || user.id === profile?.id}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Utilisateur</SelectItem>
                          <SelectItem value="agent">Agent</SelectItem>
                          <SelectItem value="merchant">Marchand</SelectItem>
                          <SelectItem value="provider">Fournisseur</SelectItem>
                          <SelectItem value="sub_admin">Sous-admin</SelectItem>
                          <SelectItem value="admin">Administrateur</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucun utilisateur trouvé</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserRoleManagement;