
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils/currency';
import { Search, UserPlus, Users, Shield, Ban } from 'lucide-react';

interface UserData {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  country: string;
  balance: number;
  role: 'user' | 'agent' | 'admin' | 'sub_admin';
  status: 'active' | 'banned' | 'pending';
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

const SubAdminUsersTab = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, selectedRole]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to match UserData interface
      const transformedData: UserData[] = (data || []).map(profile => ({
        id: profile.id,
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        email: profile.phone || '', // Using phone as email fallback
        country: profile.country || '',
        balance: profile.balance || 0,
        role: profile.role as 'user' | 'agent' | 'admin' | 'sub_admin',
        status: profile.is_banned ? 'banned' : 'active',
        is_verified: profile.is_verified || false,
        created_at: profile.created_at,
        updated_at: profile.updated_at || profile.created_at
      }));

      setUsers(transformedData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone.includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => user.role === selectedRole);
    }

    setFilteredUsers(filtered);
  };

  const handleBanUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_banned: true })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Utilisateur banni avec succès"
      });

      fetchUsers();
    } catch (error) {
      console.error('Error banning user:', error);
      toast({
        title: "Erreur",
        description: "Impossible de bannir l'utilisateur",
        variant: "destructive"
      });
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_banned: false })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Utilisateur débanni avec succès"
      });

      fetchUsers();
    } catch (error) {
      console.error('Error unbanning user:', error);
      toast({
        title: "Erreur",
        description: "Impossible de débannir l'utilisateur",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <p>Chargement des utilisateurs...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Gestion des Utilisateurs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher par nom, téléphone ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="all">Tous les rôles</option>
              <option value="user">Utilisateurs</option>
              <option value="agent">Agents</option>
              <option value="admin">Admins</option>
              <option value="sub_admin">Sub-Admins</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Solde
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.full_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.role}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.phone}</div>
                      <div className="text-sm text-gray-500">{user.country}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(user.balance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                        {user.status === 'active' ? 'Actif' : 'Banni'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {user.status === 'active' ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleBanUser(user.id)}
                        >
                          <Ban className="w-4 h-4 mr-1" />
                          Bannir
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleUnbanUser(user.id)}
                        >
                          <Shield className="w-4 h-4 mr-1" />
                          Débannir
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubAdminUsersTab;
