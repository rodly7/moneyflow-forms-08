import React, { useState, useEffect } from 'react';
// Removed Dialog import - using native HTML instead
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/integrations/supabase/client';
import { User, Shield, Ban, UserCheck, UserX, Edit3, Trash2, Crown, Eye, Camera } from 'lucide-react';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import AgentPhotoManager from './AgentPhotoManager';

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

interface Agent {
  id: string;
  user_id: string;
  agent_id: string;
  full_name: string;
  phone: string;
  country: string;
  identity_photo: string | null;
  status: string;
}

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserData | null;
  onUserUpdated: () => void;
  isSubAdmin?: boolean;
}

const UserManagementModal = ({ isOpen, onClose, user, onUserUpdated, isSubAdmin = false }: UserManagementModalProps) => {
  const { toast } = useToast();
  const deviceInfo = useDeviceDetection();
  const [isProcessing, setIsProcessing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showPhotoManager, setShowPhotoManager] = useState(false);
  const [agentData, setAgentData] = useState<Agent | null>(null);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    country: user?.country || '',
    balance: user?.balance || 0,
    role: user?.role || 'user'
  });
  const [banData, setBanData] = useState({
    reason: user?.banned_reason || ''
  });

  const fetchAgentData = async () => {
    if (user?.role === 'agent') {
      try {
        const { data, error } = await supabase
          .from('agents')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (error) throw error;
        setAgentData(data);
      } catch (error) {
        console.error('Erreur lors du chargement des données agent:', error);
      }
    }
  };

  React.useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        country: user.country || '',
        balance: user.balance || 0,
        role: user.role || 'user'
      });
      setBanData({
        reason: user.banned_reason || ''
      });
      
      // Charger les données agent si nécessaire
      fetchAgentData();
    }
  }, [user]);

  const handleUpdateUser = async () => {
    if (!user) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          country: formData.country,
          role: formData.role
        })
        .eq('id', user.id);

      if (error) throw error;

      if (formData.balance !== user.balance) {
        const balanceDiff = formData.balance - user.balance;
        await supabase.rpc('increment_balance', {
          user_id: user.id,
          amount: balanceDiff
        });
      }

      toast({
        title: "Utilisateur mis à jour",
        description: "Les informations ont été mises à jour avec succès"
      });

      setEditMode(false);
      onUserUpdated();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour de l'utilisateur",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBanUser = async () => {
    if (!user) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_banned: true,
          banned_at: new Date().toISOString(),
          banned_reason: banData.reason
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Utilisateur banni",
        description: "L'utilisateur a été banni avec succès"
      });

      onUserUpdated();
    } catch (error) {
      console.error('Erreur lors du bannissement:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du bannissement de l'utilisateur",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnbanUser = async () => {
    if (!user) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_banned: false,
          banned_at: null,
          banned_reason: null
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Utilisateur débanni",
        description: "L'accès a été rétabli avec succès"
      });

      onUserUpdated();
    } catch (error) {
      console.error('Erreur lors du débannissement:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du débannissement de l'utilisateur",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!user || !confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) {
      return;
    }

    setIsProcessing(true);
    try {
      // Supprimer toutes les données liées dans le bon ordre
      console.log('🗑️ Début de la suppression de l\'utilisateur:', user.id);
      
      // 1. Supprimer les tables dépendantes qui référencent user_id
      await supabase.from('user_sessions').delete().eq('user_id', user.id);
      await supabase.from('savings_accounts').delete().eq('user_id', user.id);
      await supabase.from('flutterwave_transactions').delete().eq('user_id', user.id);
      await supabase.from('customer_support_messages').delete().eq('user_id', user.id);
      await supabase.from('notification_recipients').delete().eq('user_id', user.id);
      await supabase.from('password_reset_requests').delete().eq('user_id', user.id);
      
      // 2. Supprimer les transactions
      await supabase.from('transfers').delete().eq('sender_id', user.id);
      await supabase.from('pending_transfers').delete().eq('sender_id', user.id);
      await supabase.from('withdrawals').delete().eq('user_id', user.id);
      await supabase.from('withdrawal_requests').delete().eq('user_id', user.id);
      await supabase.from('recharges').delete().eq('user_id', user.id);
      
      // 3. Supprimer les données agent si c'est un agent
      if (user.role === 'agent') {
        await supabase.from('agent_challenges').delete().eq('agent_id', user.id);
        await supabase.from('agent_complaints').delete().eq('agent_id', user.id);
        await supabase.from('agent_location_history').delete().eq('agent_id', user.id);
        await supabase.from('agent_locations').delete().eq('agent_id', user.id);
        await supabase.from('agent_monthly_performance').delete().eq('agent_id', user.id);
        await supabase.from('agent_reports').delete().eq('agent_id', user.id);
        await supabase.from('agents').delete().eq('user_id', user.id);
        await supabase.from('withdrawal_requests').delete().eq('agent_id', user.id);
      }
      
      // 4. Supprimer les données admin si c'est un admin
      if (user.role === 'admin' || user.role === 'sub_admin') {
        await supabase.from('admin_deposits').delete().eq('admin_id', user.id);
      }
      
      // 5. Supprimer les logs d'audit (ne pas bloquer si erreur)
      try {
        await supabase.from('audit_logs').delete().eq('user_id', user.id);
      } catch (auditError) {
        console.warn('⚠️ Erreur lors de la suppression des logs d\'audit:', auditError);
      }
      
      // 6. Finalement, supprimer le profil utilisateur
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (error) throw error;

      console.log('✅ Utilisateur supprimé avec succès:', user.id);
      toast({
        title: "Utilisateur supprimé",
        description: "L'utilisateur et toutes ses données ont été supprimés avec succès"
      });

      onClose();
      onUserUpdated();
    } catch (error) {
      console.error('❌ Erreur suppression utilisateur:', error);
      toast({
        title: "Erreur de suppression",
        description: `Erreur lors de la suppression: ${error.message || error}`,
        variant: "destructive"
      });
    }
    setIsProcessing(false);
  };

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
      case 'admin': return '👑 Administrateur';
      case 'sub_admin': return '🛡️ Sous-Administrateur';
      case 'agent': return '🔧 Agent';
      default: return '👤 Utilisateur';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-5 h-5" />;
      case 'sub_admin': return <Shield className="w-5 h-5" />;
      case 'agent': return <UserCheck className="w-5 h-5" />;
      default: return <User className="w-5 h-5" />;
    }
  };

  if (!user || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Native HTML overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      ></div>
      
      {/* Native HTML modal content */}
      <div className={`relative ${deviceInfo.isMobile ? 'w-full max-w-sm mx-2' : 'w-full max-w-3xl mx-4'} max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-2xl border-0`}>
        {/* Native HTML header */}
        <div className="bg-gradient-to-r from-violet-50/80 to-purple-50/80 p-6 rounded-t-lg border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg text-white">
                {isSubAdmin ? <Eye className="w-6 h-6" /> : <User className="w-6 h-6" />}
              </div>
              <span className={`${deviceInfo.isMobile ? 'text-lg' : 'text-xl'} bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent font-bold`}>
                {isSubAdmin ? '👀 Consultation utilisateur' : '⚙️ Gestion utilisateur'} - {user.full_name || user.phone}
              </span>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              type="button"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Native HTML content */}
        <div className="p-6 space-y-6">
          {/* Informations de base */}
          <Card className="glass border border-violet-100/50">
            <CardHeader className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 pb-4">
              <CardTitle className={`${deviceInfo.isMobile ? 'text-lg' : 'text-xl'} flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg text-white">
                    <User className="w-5 h-5" />
                  </div>
                  📋 Informations générales
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={`${getRoleColor(user.role)} flex items-center gap-2 px-3 py-1`}>
                    {getRoleIcon(user.role)}
                    {getRoleLabel(user.role)}
                  </Badge>
                  {user.is_banned && (
                    <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg">🚫 Banni</Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className={`grid ${deviceInfo.isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-6`}>
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-4 rounded-xl border border-slate-200">
                  <p className="text-sm font-semibold text-violet-600 mb-1">👤 Nom:</p>
                  <p className="font-bold text-slate-800 text-lg">{user.full_name || 'Non renseigné'}</p>
                </div>
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-4 rounded-xl border border-slate-200">
                  <p className="text-sm font-semibold text-violet-600 mb-1">📱 Téléphone:</p>
                  <p className="font-bold text-slate-800 text-lg">{user.phone}</p>
                </div>
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-4 rounded-xl border border-slate-200">
                  <p className="text-sm font-semibold text-violet-600 mb-1">🌍 Pays:</p>
                  <p className="font-bold text-slate-800 text-lg">{user.country || 'Non renseigné'}</p>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                  <p className="text-sm font-semibold text-green-600 mb-1">💰 Solde:</p>
                  <p className="font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent text-xl">{formatCurrency(user.balance, 'XAF')}</p>
                </div>
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-4 rounded-xl border border-slate-200">
                  <p className="text-sm font-semibold text-violet-600 mb-1">📅 Créé le:</p>
                  <p className="font-bold text-slate-800">{new Date(user.created_at).toLocaleDateString()}</p>
                </div>
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-4 rounded-xl border border-slate-200">
                  <p className="text-sm font-semibold text-violet-600 mb-1">🆔 ID Utilisateur:</p>
                  <p className="font-mono text-xs bg-violet-100 px-2 py-1 rounded border text-violet-700">{user.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informations de bannissement */}
          {user.is_banned && user.banned_reason && (
            <Card className="glass border border-red-200">
              <CardHeader className="bg-gradient-to-r from-red-50/50 to-pink-50/50 pb-4">
                <CardTitle className={`${deviceInfo.isMobile ? 'text-lg' : 'text-xl'} flex items-center gap-3`}>
                  <div className="p-2 bg-red-500 rounded-lg text-white">
                    <Ban className="w-5 h-5" />
                  </div>
                  <span className="bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">🚫 Raison du bannissement</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-red-800 font-medium">{user.banned_reason}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions administrateur */}
          {!isSubAdmin && (
            <Card className="glass border-2 border-orange-300 bg-gradient-to-r from-orange-50/80 to-amber-50/80">
              <CardHeader className="bg-gradient-to-r from-orange-50/50 to-amber-50/50 pb-4">
                <CardTitle className={`${deviceInfo.isMobile ? 'text-lg' : 'text-xl'} flex items-center gap-3`}>
                  <div className="p-2 bg-orange-500 rounded-lg text-white">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">⚙️ Actions administrateur</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {!editMode ? (
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => setEditMode(true)}
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
                      disabled={isProcessing}
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Modifier
                    </Button>
                    
                    {user.role === 'agent' && agentData && (
                      <Button
                        onClick={() => setShowPhotoManager(true)}
                        className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white"
                        disabled={isProcessing}
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Photos Agent
                      </Button>
                    )}
                    
                    {user.is_banned ? (
                      <Button
                        onClick={handleUnbanUser}
                        disabled={isProcessing}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                      >
                        <UserCheck className="w-4 h-4 mr-2" />
                        Débannir
                      </Button>
                    ) : (
                      <Button
                        onClick={handleBanUser}
                        disabled={isProcessing}
                        variant="destructive"
                      >
                        <Ban className="w-4 h-4 mr-2" />
                        Bannir
                      </Button>
                    )}
                    
                    <Button
                      onClick={handleDeleteUser}
                      disabled={isProcessing}
                      variant="destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-name">Nom complet</Label>
                        <Input
                          id="edit-name"
                          value={formData.full_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                          placeholder="Nom complet"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="edit-phone">Téléphone</Label>
                        <Input
                          id="edit-phone"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="Téléphone"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="edit-country">Pays</Label>
                        <Input
                          id="edit-country"
                          value={formData.country}
                          onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                          placeholder="Pays"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="edit-role">Rôle</Label>
                        <select
                          id="edit-role"
                          value={formData.role}
                          onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="user">👤 Utilisateur</option>
                          <option value="agent">🔧 Agent</option>
                          <option value="sub_admin">🛡️ Sous-Admin</option>
                          <option value="admin">👑 Admin</option>
                        </select>
                      </div>
                      
                      <div>
                        <Label htmlFor="edit-balance">Solde (XAF)</Label>
                        <Input
                          id="edit-balance"
                          type="number"
                          value={formData.balance}
                          onChange={(e) => setFormData(prev => ({ ...prev, balance: parseFloat(e.target.value) || 0 }))}
                          placeholder="Solde"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-3 pt-4 border-t">
                      <Button
                        onClick={handleUpdateUser}
                        disabled={isProcessing}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                      >
                        {isProcessing ? 'Sauvegarde...' : 'Sauvegarder'}
                      </Button>
                      
                      <Button
                        onClick={() => {
                          setEditMode(false);
                          setFormData({
                            full_name: user.full_name || '',
                            phone: user.phone || '',
                            country: user.country || '',
                            balance: user.balance || 0,
                            role: user.role || 'user'
                          });
                        }}
                        variant="outline"
                        disabled={isProcessing}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Section bannissement */}
                {!editMode && !user.is_banned && (
                  <div className="border-t pt-4 mt-4">
                    <Label htmlFor="ban-reason">Raison du bannissement (optionnel)</Label>
                    <Textarea
                      id="ban-reason"
                      value={banData.reason}
                      onChange={(e) => setBanData(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="Indiquez la raison du bannissement..."
                      rows={3}
                      className="mt-2"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Gestionnaire de photos pour agents */}
          {showPhotoManager && agentData && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center">
              <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
                onClick={() => setShowPhotoManager(false)}
              ></div>
              <div className="relative w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-2xl">
                <div className="p-4 border-b flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-800">Gestion des Photos - {agentData.full_name}</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPhotoManager(false)}
                  >
                    ✕
                  </Button>
                </div>
                <div className="p-6">
                  <AgentPhotoManager 
                    agent={agentData} 
                    onPhotoUpdated={() => {
                      fetchAgentData();
                      onUserUpdated();
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Message d'information pour sous-admins */}
          {isSubAdmin && (
            <Card className="glass border-2 border-blue-300 bg-gradient-to-r from-blue-50/80 to-indigo-50/80">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-500 rounded-xl text-white">
                    <Eye className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-blue-800 mb-3 text-lg">👀 Mode Consultation</h3>
                    <p className="text-blue-700 bg-blue-100/50 p-3 rounded-lg">
                      🔒 En tant que sous-administrateur, vous pouvez consulter les informations des utilisateurs mais ne pouvez pas les modifier.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagementModal;
