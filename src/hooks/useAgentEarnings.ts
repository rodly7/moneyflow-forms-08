import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AgentEarnings {
  totalVolume: number;
  totalTransactions: number;
  complaintsCount: number;
  commissionRate: number;
  baseCommission: number;
  volumeBonus: number;
  transactionBonus: number;
  noComplaintBonus: number;
  totalEarnings: number;
  tierName: string;
}

interface CommissionTier {
  minVolume: number;
  maxVolume: number | null;
  commissionRate: number;
  tierName: string;
}

interface MonthlyBonus {
  bonusType: string;
  requirementValue: number;
  bonusAmount: number;
  description: string;
}

export const useAgentEarnings = () => {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<AgentEarnings | null>(null);
  const [commissionTiers, setCommissionTiers] = useState<CommissionTier[]>([]);
  const [monthlyBonuses, setMonthlyBonuses] = useState<MonthlyBonus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEarnings = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Récupérer les performances de l'agent pour le mois actuel
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      const { data: performanceData, error: performanceError } = await supabase
        .from('agent_monthly_performance')
        .select('*')
        .eq('agent_id', user.id)
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .maybeSingle();

      if (performanceError) {
        throw performanceError;
      }

      if (performanceData) {
        setEarnings({
          totalVolume: Number(performanceData.total_volume) || 0,
          totalTransactions: performanceData.total_transactions || 0,
          complaintsCount: performanceData.complaints_count || 0,
          commissionRate: Number(performanceData.commission_rate) || 0,
          baseCommission: Number(performanceData.base_commission) || 0,
          volumeBonus: Number(performanceData.volume_bonus) || 0,
          transactionBonus: Number(performanceData.transaction_bonus) || 0,
          noComplaintBonus: Number(performanceData.no_complaint_bonus) || 0,
          totalEarnings: Number(performanceData.total_earnings) || 0,
          tierName: 'Bronze'
        });
      } else {
        // Si aucune donnée n'existe, créer un enregistrement vide
        setEarnings({
          totalVolume: 0,
          totalTransactions: 0,
          complaintsCount: 0,
          commissionRate: 0.005,
          baseCommission: 0,
          volumeBonus: 0,
          transactionBonus: 0,
          noComplaintBonus: 0,
          totalEarnings: 0,
          tierName: 'Bronze'
        });
      }

      // Récupérer les paliers de commission
      const { data: tiersData, error: tiersError } = await supabase
        .from('commission_tiers')
        .select('*')
        .order('min_volume', { ascending: true });

      if (tiersError) {
        throw tiersError;
      }

      setCommissionTiers(tiersData.map(tier => ({
        minVolume: Number(tier.min_volume),
        maxVolume: tier.max_volume ? Number(tier.max_volume) : null,
        commissionRate: Number(tier.commission_rate),
        tierName: tier.tier_name
      })));

      // Récupérer les bonus mensuels
      const { data: bonusData, error: bonusError } = await supabase
        .from('monthly_bonuses')
        .select('*')
        .order('requirement_value', { ascending: true });

      if (bonusError) {
        throw bonusError;
      }

      setMonthlyBonuses(bonusData.map(bonus => ({
        bonusType: bonus.bonus_type,
        requirementValue: Number(bonus.requirement_value),
        bonusAmount: Number(bonus.bonus_amount),
        description: bonus.description || ''
      })));

    } catch (error) {
      console.error('Erreur lors du chargement des gains:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getNextTierInfo = () => {
    if (!earnings || commissionTiers.length === 0) return null;

    const nextTier = commissionTiers.find(tier => earnings.totalVolume < tier.minVolume);
    if (!nextTier) return null;

    return {
      tierName: nextTier.tierName,
      requiredVolume: nextTier.minVolume,
      remainingVolume: nextTier.minVolume - earnings.totalVolume,
      commissionRate: nextTier.commissionRate
    };
  };

  const getBonusProgress = () => {
    if (!earnings) return [];

    return monthlyBonuses.map(bonus => {
      let current = 0;
      let achieved = false;

      switch (bonus.bonusType) {
        case 'volume':
          current = earnings.totalVolume;
          achieved = current >= bonus.requirementValue;
          break;
        case 'transactions':
          current = earnings.totalTransactions;
          achieved = current >= bonus.requirementValue;
          break;
        case 'no_complaints':
          current = earnings.complaintsCount;
          achieved = current <= bonus.requirementValue;
          break;
      }

      const progress = bonus.bonusType === 'no_complaints' 
        ? (current === 0 ? 100 : 0)
        : Math.min((current / bonus.requirementValue) * 100, 100);

      return {
        ...bonus,
        current,
        achieved,
        progress
      };
    });
  };

  useEffect(() => {
    if (user) {
      fetchEarnings();
    }
  }, [user]);

  return {
    earnings,
    commissionTiers,
    monthlyBonuses,
    isLoading,
    getNextTierInfo,
    getBonusProgress,
    refreshEarnings: fetchEarnings
  };
};