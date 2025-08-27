import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalCloseButton,
} from "@/components/ui/modal"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { supabase } from '@/integrations/supabase/client';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onUserUpdate: (user: UserProfile) => void;
}

interface UserProfile {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  country: string;
  role: 'user' | 'agent' | 'admin' | 'sub_admin';
  balance: number;
  status: string;
  is_verified: boolean;
  created_at: string;
}

const UserManagementModal = ({ isOpen, onClose, userId, onUserUpdate }: UserManagementModalProps) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selectedRole, setSelectedRole] = useState<'user' | 'agent' | 'admin' | 'sub_admin'>('user');
  const [newBalance, setNewBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) throw error;

        // Transform data to match UserProfile interface
        const transformedData: UserProfile = {
          id: data.id,
          full_name: data.full_name || '',
          phone: data.phone || '',
          email: data.phone || '', // Using phone as email fallback
          country: data.country || '',
          role: data.role as 'user' | 'agent' | 'admin' | 'sub_admin',
          balance: data.balance || 0,
          status: data.is_banned ? 'banned' : 'active',
          is_verified: data.is_verified || false,
          created_at: data.created_at,
        };

        setProfile(transformedData);
        setSelectedRole(transformedData.role);
        setNewBalance(transformedData.balance);
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger le profil utilisateur",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && userId) {
      fetchProfile();
    }
  }, [isOpen, userId, toast]);

  const handleRoleChange = (newRole: string) => {
    if (['user', 'agent', 'admin', 'sub_admin'].includes(newRole)) {
      setSelectedRole(newRole as 'user' | 'agent' | 'admin' | 'sub_admin');
    }
  };

  const handleSaveChanges = async () => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          role: selectedRole,
          balance: newBalance,
        })
        .eq('id', userId);

      if (error) throw error;

      // Transform the updated profile to match UserProfile interface
      const updatedProfile: UserProfile = {
        ...profile!,
        role: selectedRole,
        balance: newBalance,
        email: profile?.phone || '', // Using phone as email fallback
        status: profile?.is_banned ? 'banned' : 'active'
      };

      onUserUpdate(updatedProfile);
      onClose();
      
      toast({
        title: "Succès",
        description: "Profil utilisateur mis à jour avec succès",
      });
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil utilisateur",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent className="max-w-md">
        <ModalHeader>
          <h2 className="text-lg font-semibold">Modifier l'utilisateur</h2>
        </ModalHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <p>Chargement des informations de l'utilisateur...</p>
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nom
              </Label>
              <Input
                type="text"
                id="name"
                value={profile?.full_name || ''}
                className="col-span-3"
                disabled
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Téléphone
              </Label>
              <Input
                type="text"
                id="phone"
                value={profile?.phone || ''}
                className="col-span-3"
                disabled
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Rôle
              </Label>
              <Select value={selectedRole} onValueChange={handleRoleChange}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Utilisateur</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="sub_admin">Sub Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="balance" className="text-right">
                Solde
              </Label>
              <Input
                type="number"
                id="balance"
                value={newBalance}
                onChange={(e) => setNewBalance(Number(e.target.value))}
                className="col-span-3"
              />
            </div>
          </div>
        )}

        <ModalFooter>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSaveChanges} disabled={isLoading}>
            Enregistrer
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default UserManagementModal;
