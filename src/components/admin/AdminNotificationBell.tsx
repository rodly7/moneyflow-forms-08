import React, { useState, useEffect } from 'react';
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AdminNotificationBellProps {
  className?: string;
}

// Hook pour jouer les sons de notification
const useNotificationSound = () => {
  const playNotificationSound = () => {
    try {
      // Créer un son de notification simple avec Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Notification audio non disponible:', error);
    }
  };

  return { playNotificationSound };
};

const AdminNotificationBell = ({ className = "" }: AdminNotificationBellProps) => {
  const [previousCounts, setPreviousCounts] = useState({ lowBalance: 0, transactions: 0 });
  const { playNotificationSound } = useNotificationSound();

  // Surveiller les agents en manque de fonds
  const { data: lowBalanceAgents } = useQuery({
    queryKey: ['low-balance-agents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, balance')
        .eq('role', 'agent')
        .lt('balance', -100000);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
  });

  // Surveiller les nouvelles transactions
  const { data: recentTransactions } = useQuery({
    queryKey: ['recent-transactions'],
    queryFn: async () => {
      const fiveMinutesAgo = new Date();
      fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

      const [transfersResult, withdrawalsResult] = await Promise.all([
        supabase
          .from('transfers')
          .select('id, created_at')
          .gte('created_at', fiveMinutesAgo.toISOString()),
        supabase
          .from('withdrawals')
          .select('id, created_at')
          .gte('created_at', fiveMinutesAgo.toISOString())
      ]);

      const transfers = transfersResult.data || [];
      const withdrawals = withdrawalsResult.data || [];
      
      return transfers.length + withdrawals.length;
    },
    refetchInterval: 30000,
  });

  // Émettre un son quand de nouveaux événements sont détectés
  useEffect(() => {
    const currentLowBalance = lowBalanceAgents?.length || 0;
    const currentTransactions = recentTransactions || 0;

    // Son pour agents en manque de fonds
    if (currentLowBalance > previousCounts.lowBalance && previousCounts.lowBalance >= 0) {
      playNotificationSound();
    }

    // Son pour nouvelles transactions
    if (currentTransactions > previousCounts.transactions && previousCounts.transactions >= 0) {
      playNotificationSound();
    }

    setPreviousCounts({
      lowBalance: currentLowBalance,
      transactions: currentTransactions
    });
  }, [lowBalanceAgents, recentTransactions, playNotificationSound, previousCounts]);

  const totalNotifications = (lowBalanceAgents?.length || 0) + (recentTransactions || 0);

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`relative p-2 ${className} ${totalNotifications > 0 ? 'animate-pulse' : ''}`}
    >
      <Bell className={`w-6 h-6 ${totalNotifications > 0 ? 'text-orange-600' : 'text-gray-600'}`} />
      {totalNotifications > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-orange-500 border-white border-2"
        >
          {totalNotifications > 9 ? '9+' : totalNotifications}
        </Badge>
      )}
    </Button>
  );
};

export default AdminNotificationBell;