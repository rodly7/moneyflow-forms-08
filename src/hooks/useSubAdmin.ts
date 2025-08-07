
import { useAuth } from "@/contexts/AuthContext";

export const useSubAdmin = () => {
  const { profile } = useAuth();
  
  const isSubAdmin = () => {
    return profile?.role === 'sub_admin';
  };

  const getUserCountry = () => {
    return profile?.country || null;
  };

  const canManageUsers = () => {
    // Les sous-admins ne peuvent pas supprimer, modifier les infos, bannir ou changer les rôles
    return false;
  };

  const canViewUsers = () => {
    // Les sous-admins peuvent voir tous les utilisateurs de leur pays
    return isSubAdmin();
  };

  const canRecharge = () => {
    // Les sous-admins ne peuvent pas faire de recharge personnelle
    return false;
  };

  const canDepositToAgent = () => {
    // Les sous-admins peuvent faire des dépôts agent en utilisant le solde de l'admin
    return isSubAdmin();
  };

  const canSendNotifications = () => {
    // Les sous-admins peuvent envoyer des notifications
    return isSubAdmin();
  };

  const canViewAllData = () => {
    // Les sous-admins peuvent voir toutes les données de leur territoire
    return isSubAdmin();
  };

  const canManageAgents = () => {
    // Les sous-admins peuvent gérer les agents de leur pays/région
    return isSubAdmin();
  };

  const canValidateAgent = () => {
    // Les sous-admins peuvent valider ou suspendre un agent de leur zone
    return isSubAdmin();
  };

  const canViewTerritorialStats = () => {
    // Les sous-admins peuvent voir les statistiques de leur territoire
    return isSubAdmin();
  };

  const canViewCommissionReports = () => {
    // Les sous-admins peuvent voir les relevés des commissions dans leur zone
    return isSubAdmin();
  };

  const canReportBugsAndNeeds = () => {
    // Les sous-admins peuvent remonter les bugs ou les besoins d'évolution à l'admin principal
    return isSubAdmin();
  };

  const canTrackTransfersInZone = () => {
    // Les sous-admins peuvent suivre les transferts et dépôts/retraits dans leur zone
    return isSubAdmin();
  };

  return {
    isSubAdmin: isSubAdmin(),
    userCountry: getUserCountry(),
    canManageUsers: canManageUsers(),
    canViewUsers: canViewUsers(),
    canRecharge: canRecharge(),
    canDepositToAgent: canDepositToAgent(),
    canViewAllData: canViewAllData(),
    canSendNotifications: canSendNotifications(),
    canManageAgents: canManageAgents(),
    canValidateAgent: canValidateAgent(),
    canViewTerritorialStats: canViewTerritorialStats(),
    canViewCommissionReports: canViewCommissionReports(),
    canReportBugsAndNeeds: canReportBugsAndNeeds(),
    canTrackTransfersInZone: canTrackTransfersInZone()
  };
};
