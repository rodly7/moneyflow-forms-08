
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Users, Wallet, UserPlus, AlertTriangle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import UsersDataTable from "@/components/admin/UsersDataTable";
import AdminSelfRecharge from "@/components/admin/AdminSelfRecharge";
import BatchAgentDeposit from "@/components/admin/BatchAgentDeposit";
import UserManagementModal from "@/components/admin/UserManagementModal";
import { AdminUserService, AdminUserData } from "@/services/adminUserService";

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

const AdminUsers = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState<AdminUserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBatchDeposit, setShowBatchDeposit] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserData | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (profile?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchUsers();
  }, [profile, navigate]);

  const fetchUsers = async (showToast = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await AdminUserService.fetchAllUsers();
      
      if (result.success) {
        setUsers(result.data || []);
        if (showToast) {
          toast({
            title: "✅ Données actualisées",
            description: `${result.data?.length || 0} utilisateurs chargés`,
          });
        }
      } else {
        setError(result.message);
        toast({
          title: "Erreur",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      const errorMessage = error.message || "Erreur système lors du chargement";
      console.error('Erreur critique:', error);
      setError(errorMessage);
      toast({
        title: "Erreur critique",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleQuickRoleChange = async (userId: string, newRole: 'user' | 'agent' | 'admin' | 'sub_admin') => {
    try {
      const result = await AdminUserService.changeUserRole(userId, newRole, profile?.id);
      
      if (result.success) {
        // Mettre à jour la liste locale
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        ));

        toast({
          title: "✅ Rôle mis à jour",
          description: result.message,
        });
      } else {
        toast({
          title: "Erreur",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Erreur lors du changement de rôle:", error);
      toast({
        title: "Erreur critique",
        description: error.message || "Impossible de changer le rôle",
        variant: "destructive"
      });
    }
  };

  const handleQuickBanToggle = async (userId: string, currentBanStatus: boolean) => {
    try {
      const result = await AdminUserService.toggleUserBan(
        userId, 
        currentBanStatus, 
        'Action administrative',
        profile?.id
      );
      
      if (result.success) {
        const newBanStatus = !currentBanStatus;
        
        // Mettre à jour la liste locale
        setUsers(prev => prev.map(user => 
          user.id === userId ? { 
            ...user, 
            is_banned: newBanStatus,
            banned_reason: newBanStatus ? 'Action administrative' : null
          } : user
        ));

        toast({
          title: newBanStatus ? "🚫 Utilisateur banni" : "✅ Utilisateur débanni",
          description: result.message,
        });
      } else {
        toast({
          title: "Erreur",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Erreur lors du bannissement:", error);
      toast({
        title: "Erreur critique",
        description: error.message || "Impossible de modifier le statut de bannissement",
        variant: "destructive"
      });
    }
  };

  const handleViewUser = (user: AdminUserData) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchUsers(true);
  };

  const handleAutoBatchDeposit = async () => {
    if (!profile?.id) {
      toast({
        title: "Erreur",
        description: "Profil administrateur non trouvé",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await AdminUserService.performAutoBatchDeposit(
        profile.id,
        profile.balance || 0,
        50000,
        50000
      );

      if (result.success) {
        toast({
          title: "✅ Dépôts automatiques effectués",
          description: result.message,
        });
        
        // Actualiser la liste des utilisateurs
        await fetchUsers();
      } else {
        toast({
          title: "Information",
          description: result.message,
          variant: result.message.includes("Solde insuffisant") ? "destructive" : "default"
        });
      }
    } catch (error: any) {
      console.error('Erreur lors du dépôt automatique:', error);
      toast({
        title: "Erreur critique",
        description: error.message || "Erreur lors du dépôt automatique",
        variant: "destructive"
      });
    }
  };

  if (!profile || profile.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4">
      <div className="w-full max-w-none">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 w-full">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/main-admin')}
              className="hover:bg-white/50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Gestion Administrative
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              className="hover:bg-white/50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Actualisation...' : 'Actualiser'}
            </Button>
            
            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1 rounded-full text-sm">
                <AlertTriangle className="w-4 h-4" />
                Problème de connexion
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm shadow-lg rounded-xl h-14">
            <TabsTrigger value="users" className="flex items-center gap-2 h-10">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Utilisateurs</span>
            </TabsTrigger>
            <TabsTrigger value="batch-deposit" className="flex items-center gap-2 h-10">
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Dépôts Agents</span>
            </TabsTrigger>
            <TabsTrigger value="self-recharge" className="flex items-center gap-2 h-10">
              <Wallet className="w-4 h-4" />
              <span className="hidden sm:inline">Mon Solde</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6 w-full">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Gestion des Utilisateurs
                </CardTitle>
              </CardHeader>
              <CardContent className="w-full overflow-x-auto">
                {loading ? (
                  <div className="flex flex-col items-center justify-center p-8 space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    <p className="text-gray-600">Chargement des utilisateurs...</p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center p-8 space-y-4">
                    <AlertTriangle className="w-12 h-12 text-red-500" />
                    <div className="text-center">
                      <p className="text-red-600 font-medium">Erreur de connexion</p>
                      <p className="text-gray-600 text-sm mt-1">{error}</p>
                      <Button 
                        onClick={() => fetchUsers()} 
                        variant="outline" 
                        className="mt-4"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Réessayer
                      </Button>
                    </div>
                  </div>
                ) : users.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 space-y-4">
                    <Users className="w-12 h-12 text-gray-400" />
                    <div className="text-center">
                      <p className="text-gray-600 font-medium">Aucun utilisateur</p>
                      <p className="text-gray-500 text-sm mt-1">Aucun utilisateur trouvé dans le système</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        {users.length} utilisateur(s) • {users.filter(u => u.role === 'agent').length} agent(s) • {users.filter(u => u.is_banned).length} banni(s)
                      </p>
                      <p className="text-xs text-gray-500">
                        Dernière actualisation: {new Date().toLocaleTimeString()}
                      </p>
                    </div>
                     <UsersDataTable 
                       users={users}
                       onViewUser={handleViewUser}
                       onQuickRoleChange={handleQuickRoleChange}
                       onQuickBanToggle={handleQuickBanToggle}
                       onUserUpdated={fetchUsers}
                     />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="batch-deposit" className="space-y-6 w-full">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Dépôts en Lot pour Agents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={handleAutoBatchDeposit}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Dépôt Auto (Agents &lt; 50k)
                  </Button>
                  <Button
                    onClick={() => setShowBatchDeposit(true)}
                    variant="outline"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Dépôt Manuel Personnalisé
                  </Button>
                </div>
                
                {showBatchDeposit && (
                  <BatchAgentDeposit onBack={() => setShowBatchDeposit(false)} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="self-recharge" className="space-y-6 w-full">
            <div className="w-full">
              <AdminSelfRecharge />
            </div>
          </TabsContent>
        </Tabs>

        {/* Modal de gestion des utilisateurs */}
        <UserManagementModal
          isOpen={showUserModal}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          onUserUpdated={fetchUsers}
        />
      </div>
    </div>
  );
};

export default AdminUsers;
