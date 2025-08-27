
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/integrations/supabase/client';
import { Shield, User, UserCheck } from 'lucide-react';

interface UserData {
  id: string;
  full_name: string | null;
  phone: string;
  balance: number;
  country: string | null;
  role: 'user' | 'agent' | 'admin' | 'sub_admin';
  created_at: string;
}

interface SubAdminUsersTableProps {
  users: UserData[];
}

const SubAdminUsersTable = ({ users }: SubAdminUsersTableProps) => {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'sub_admin': return 'bg-orange-100 text-orange-800';
      case 'agent': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'sub_admin': return 'Sous-Admin';
      case 'agent': return 'Agent';
      default: return 'Utilisateur';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-3 h-3" />;
      case 'sub_admin': return <UserCheck className="w-3 h-3" />;
      case 'agent': return <UserCheck className="w-3 h-3" />;
      default: return <User className="w-3 h-3" />;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Utilisateur</TableHead>
            <TableHead>Téléphone</TableHead>
            <TableHead>Rôle</TableHead>
            <TableHead>Solde</TableHead>
            <TableHead>Date de création</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{user.full_name || 'Sans nom'}</p>
                  <p className="text-xs text-gray-500">{user.country || 'Pays non renseigné'}</p>
                </div>
              </TableCell>
              <TableCell>{user.phone}</TableCell>
              <TableCell>
                <Badge className={`${getRoleColor(user.role)} flex items-center gap-1 w-fit`}>
                  {getRoleIcon(user.role)}
                  {getRoleLabel(user.role)}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="font-medium text-green-600">
                  {formatCurrency(user.balance, 'XAF')}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-gray-600">
                  {new Date(user.created_at).toLocaleDateString()}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default SubAdminUsersTable;
