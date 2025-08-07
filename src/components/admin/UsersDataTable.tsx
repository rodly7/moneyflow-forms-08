
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Shield, Ban, UserCheck, Crown, User, Globe, Edit, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/integrations/supabase/client';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import SimpleUserManagementActions from './SimpleUserManagementActions';

interface UserData {
  id: string;
  full_name: string | null;
  phone: string;
  balance: number;
  country: string | null;
  role: 'user' | 'agent' | 'admin' | 'sub_admin';
  is_banned?: boolean;
  banned_reason?: string | null;
  created_at: string;
}

interface UsersDataTableProps {
  users: UserData[];
  onViewUser: (user: UserData) => void;
  onQuickRoleChange: (userId: string, newRole: 'user' | 'agent' | 'admin' | 'sub_admin') => void;
  onQuickBanToggle: (userId: string, currentBanStatus: boolean) => void;
  onUserUpdated?: () => void;
  isSubAdmin?: boolean;
}

const UsersDataTable = ({ 
  users, 
  onViewUser, 
  onQuickRoleChange, 
  onQuickBanToggle,
  onUserUpdated,
  isSubAdmin = false
}: UsersDataTableProps) => {
  const deviceInfo = useDeviceDetection();

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg';
      case 'sub_admin': return 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg';
      case 'agent': return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg';
      default: return 'bg-gradient-to-r from-slate-500 to-gray-500 text-white shadow-lg';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return '👑 Admin';
      case 'sub_admin': return '🛡️ Sous-Admin';
      case 'agent': return '🔧 Agent';
      default: return '👤 Utilisateur';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-3 h-3" />;
      case 'sub_admin': return <Shield className="w-3 h-3" />;
      case 'agent': return <UserCheck className="w-3 h-3" />;
      default: return <User className="w-3 h-3" />;
    }
  };

  if (deviceInfo.isMobile) {
    return (
      <div className="space-y-4">
        {users.map((user) => (
          <div key={user.id} className="glass p-5 rounded-xl shadow-lg border border-violet-100/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Badge className={`${getRoleColor(user.role)} flex items-center gap-1 px-3 py-1 rounded-full`}>
                  {getRoleIcon(user.role)}
                  {getRoleLabel(user.role)}
                </Badge>
                {user.is_banned && (
                  <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg">🚫 Banni</Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewUser(user)}
                className="glass border-2 border-violet-200 hover:bg-violet-50/80 hover:border-violet-300"
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-violet-600">👤 Nom:</span> 
                <span className="text-slate-700">{user.full_name || 'Non renseigné'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-violet-600">📱 Téléphone:</span> 
                <span className="text-slate-700">{user.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-violet-600">🌍 Pays:</span> 
                <span className="text-slate-700">{user.country || 'Non renseigné'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-violet-600">💰 Solde:</span>
                <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent font-bold">
                  {formatCurrency(user.balance, 'XAF')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-violet-600">📅 Créé:</span> 
                <span className="text-slate-700">{new Date(user.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {!isSubAdmin && (
              <div className="flex gap-3 mt-4 pt-4 border-t border-violet-100">
                <select 
                  value={user.role} 
                  onChange={(e) => onQuickRoleChange(user.id, e.target.value as any)}
                  className="flex-1 h-10 px-3 rounded-md border-2 border-violet-200 bg-white/90 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                >
                  <option value="user">👤 Utilisateur</option>
                  <option value="agent">🔧 Agent</option>
                  <option value="sub_admin">🛡️ Sous-Admin</option>
                  <option value="admin">👑 Admin</option>
                </select>
                
                <Button
                  variant={user.is_banned ? "outline" : "destructive"}
                  size="sm"
                  onClick={() => onQuickBanToggle(user.id, user.is_banned || false)}
                  className="px-4"
                >
                  {user.is_banned ? <UserCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                </Button>

                <SimpleUserManagementActions
                  user={{
                    id: user.id,
                    full_name: user.full_name || '',
                    phone: user.phone,
                    country: user.country || '',
                    address: '',
                    balance: user.balance,
                    role: user.role,
                    is_verified: true,
                    is_banned: user.is_banned || false
                  }}
                  onUserUpdated={onUserUpdated}
                  onUserDeleted={onUserUpdated}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="glass rounded-xl overflow-hidden border border-violet-100/50 shadow-xl">
      <Table>
        <TableHeader>
          <TableRow className="bg-gradient-to-r from-violet-50/80 to-purple-50/80 border-b border-violet-100">
            <TableHead className="font-bold text-violet-700">👤 Utilisateur</TableHead>
            <TableHead className="font-bold text-violet-700">📱 Téléphone</TableHead>
            <TableHead className="font-bold text-violet-700">🎭 Rôle</TableHead>
            <TableHead className="font-bold text-violet-700">🌍 Pays</TableHead>
            <TableHead className="font-bold text-violet-700">💰 Solde</TableHead>
            <TableHead className="font-bold text-violet-700">📊 Statut</TableHead>
            <TableHead className="font-bold text-violet-700">📅 Créé</TableHead>
            <TableHead className="font-bold text-violet-700">⚡ Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className="hover:bg-violet-50/50 transition-all duration-300 border-b border-violet-50">
              <TableCell>
                <div>
                  <p className="font-semibold text-slate-800">{user.full_name || 'Non renseigné'}</p>
                  <p className="text-xs text-violet-500 font-mono bg-violet-50 px-2 py-1 rounded-md inline-block mt-1">{user.id.substring(0, 8)}...</p>
                </div>
              </TableCell>
              <TableCell className="font-medium text-slate-700">{user.phone}</TableCell>
              <TableCell>
                {isSubAdmin ? (
                  <Badge className={`${getRoleColor(user.role)} flex items-center gap-1 w-fit px-3 py-1`}>
                    {getRoleIcon(user.role)}
                    {getRoleLabel(user.role)}
                  </Badge>
                ) : (
                  <select 
                    value={user.role} 
                    onChange={(e) => onQuickRoleChange(user.id, e.target.value as any)}
                    className="w-36 px-3 py-2 rounded-md border-2 border-violet-200 bg-white/90 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  >
                    <option value="user">👤 Utilisateur</option>
                    <option value="agent">🔧 Agent</option>
                    <option value="sub_admin">🛡️ Sous-Admin</option>
                    <option value="admin">👑 Admin</option>
                  </select>
                )}
              </TableCell>
              <TableCell className="text-slate-700">{user.country || 'Non renseigné'}</TableCell>
              <TableCell>
                <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent font-bold text-lg">
                  {formatCurrency(user.balance, 'XAF')}
                </span>
              </TableCell>
              <TableCell>
                {user.is_banned ? (
                  <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg">🚫 Banni</Badge>
                ) : (
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg">✅ Actif</Badge>
                )}
              </TableCell>
              <TableCell className="text-slate-600">{new Date(user.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewUser(user)}
                    className="glass border-2 border-violet-200 hover:bg-violet-50/80 hover:border-violet-300"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  
                  {!isSubAdmin && (
                    <>
                      <Button
                        variant={user.is_banned ? "outline" : "destructive"}
                        size="sm"
                        onClick={() => onQuickBanToggle(user.id, user.is_banned || false)}
                        className={user.is_banned ? "glass border-2 border-green-200 hover:bg-green-50/80 text-green-700" : ""}
                      >
                        {user.is_banned ? <UserCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                      </Button>
                      
                      <SimpleUserManagementActions
                        user={{
                          id: user.id,
                          full_name: user.full_name || '',
                          phone: user.phone,
                          country: user.country || '',
                          address: '',
                          balance: user.balance,
                          role: user.role,
                          is_verified: true,
                          is_banned: user.is_banned || false
                        }}
                        onUserUpdated={onUserUpdated}
                        onUserDeleted={onUserUpdated}
                      />
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default UsersDataTable;
