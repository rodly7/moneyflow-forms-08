import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const TransactionDebugger = () => {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  const runDebug = async () => {
    if (!user?.id) {
      setDebugInfo({ error: "Pas d'utilisateur connecté" });
      return;
    }

    setIsLoading(true);
    try {
      const info: any = { userId: user.id };

      // Check profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      info.profile = { data: profile, error: profileError };

      // Check recharges
      const { data: recharges, error: rechargesError } = await supabase
        .from('recharges')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      info.recharges = { count: recharges?.length || 0, data: recharges, error: rechargesError };

      // Check withdrawals
      const { data: withdrawals, error: withdrawalsError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      info.withdrawals = { count: withdrawals?.length || 0, data: withdrawals, error: withdrawalsError };

      // Check transfers sent
      const { data: transfersSent, error: transfersSentError } = await supabase
        .from('transfers')
        .select('*')
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      info.transfersSent = { count: transfersSent?.length || 0, data: transfersSent, error: transfersSentError };

      // Check transfers received
      if (profile?.phone) {
        const { data: transfersReceived, error: transfersReceivedError } = await supabase
          .from('transfers')
          .select('*')
          .eq('recipient_phone', profile.phone)
          .neq('sender_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
        
        info.transfersReceived = { count: transfersReceived?.length || 0, data: transfersReceived, error: transfersReceivedError };
      }

      // Check merchant payments
      const { data: merchantPayments, error: merchantError } = await supabase
        .from('merchant_payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      info.merchantPayments = { count: merchantPayments?.length || 0, data: merchantPayments, error: merchantError };

      setDebugInfo(info);
    } catch (error) {
      setDebugInfo({ error: error });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    runDebug();
  }, [user?.id]);

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔍 Debug Transactions
          <Button onClick={runDebug} disabled={isLoading} size="sm">
            {isLoading ? 'Chargement...' : 'Actualiser'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
};

export default TransactionDebugger;