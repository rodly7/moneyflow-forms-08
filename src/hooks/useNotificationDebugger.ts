
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface DebugEvent {
  id: string;
  timestamp: string;
  type: 'connection' | 'data' | 'error';
  message: string;
  data?: any;
}

export const useNotificationDebugger = () => {
  const { user } = useAuth();
  const [debugEvents, setDebugEvents] = useState<DebugEvent[]>([]);
  const [isDebugging, setIsDebugging] = useState(false);

  const addDebugEvent = (type: DebugEvent['type'], message: string, data?: any) => {
    const event: DebugEvent = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString('fr-FR'),
      type,
      message,
      data
    };

    setDebugEvents(prev => [event, ...prev.slice(0, 49)]); // Garder 50 événements max
    console.log(`🔍 [${event.timestamp}] ${message}`, data || '');
  };

  // Test de connexion Supabase
  const testSupabaseConnection = async () => {
    if (!user?.id) return;

    addDebugEvent('connection', '🔍 Test de connexion Supabase...');

    try {
      // Test 1: Connexion de base
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) {
        addDebugEvent('error', '❌ Erreur auth:', authError);
        return;
      }
      addDebugEvent('connection', '✅ Connexion auth OK', { userId: authData.user?.id });

      // Test 2: Lecture des profils
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .eq('id', user.id)
        .single();

      if (profileError) {
        addDebugEvent('error', '❌ Erreur lecture profil:', profileError);
        return;
      }
      addDebugEvent('data', '✅ Profil trouvé', profileData);

      // Test 3: Lecture des transferts
      const { data: transfersData, error: transfersError } = await supabase
        .from('transfers')
        .select('*')
        .or(`recipient_phone.eq.${user.phone},recipient_email.eq.${user.email}`)
        .order('created_at', { ascending: false })
        .limit(5);

      if (transfersError) {
        addDebugEvent('error', '❌ Erreur lecture transferts:', transfersError);
      } else {
        addDebugEvent('data', `✅ ${transfersData?.length || 0} transferts trouvés`, transfersData);
      }

      // Test 4: Lecture des notifications
      const { data: notifData, error: notifError } = await supabase
        .from('notification_recipients')
        .select(`
          *,
          notifications (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (notifError) {
        addDebugEvent('error', '❌ Erreur lecture notifications:', notifError);
      } else {
        addDebugEvent('data', `✅ ${notifData?.length || 0} notifications trouvées`, notifData);
      }

    } catch (error) {
      addDebugEvent('error', '❌ Erreur critique test connexion:', error);
    }
  };

  // Test d'écoute temps réel
  const testRealtimeConnection = () => {
    if (!user?.id) return;

    addDebugEvent('connection', '🎧 Test écoute temps réel...');

    const channel = supabase
      .channel(`debug_test_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transfers'
        },
        (payload) => {
          addDebugEvent('data', '🎯 Transfert détecté en temps réel:', payload);
        }
      )
      .subscribe((status) => {
        addDebugEvent('connection', `📡 Statut écoute: ${status}`);
      });

    // Nettoyer après 30 secondes
    setTimeout(() => {
      supabase.removeChannel(channel);
      addDebugEvent('connection', '🧹 Test temps réel terminé');
    }, 30000);
  };

  const clearDebugEvents = () => {
    setDebugEvents([]);
  };

  return {
    debugEvents,
    isDebugging,
    setIsDebugging,
    addDebugEvent,
    testSupabaseConnection,
    testRealtimeConnection,
    clearDebugEvents
  };
};
