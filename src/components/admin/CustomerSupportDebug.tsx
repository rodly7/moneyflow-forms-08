import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const CustomerSupportDebug = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const { user, profile } = useAuth();

  const runDiagnostic = async () => {
    setIsLoading(true);
    const debug: any = {
      user: user ? { id: user.id, email: user.email } : null,
      profile: profile ? { id: profile.id, role: profile.role, phone: profile.phone } : null,
      messages: [],
      profiles: [],
      errors: []
    };

    try {
      // Test 1: Direct query to customer_support_messages
      console.log('🔍 Test 1: Messages query...');
      const { data: messagesData, error: messagesError } = await supabase
        .from('customer_support_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      if (messagesError) {
        debug.errors.push(`Messages Error: ${messagesError.message}`);
        console.error('Messages Error:', messagesError);
      } else {
        debug.messages = messagesData || [];
        console.log('✅ Messages found:', messagesData?.length || 0);
      }

      // Test 2: Query profiles
      if (messagesData && messagesData.length > 0) {
        console.log('🔍 Test 2: Profiles query...');
        const userIds = messagesData.map(msg => msg.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, phone')
          .in('id', userIds);

        if (profilesError) {
          debug.errors.push(`Profiles Error: ${profilesError.message}`);
          console.error('Profiles Error:', profilesError);
        } else {
          debug.profiles = profilesData || [];
          console.log('✅ Profiles found:', profilesData?.length || 0);
        }
      }

      // Test 3: Check user role functions
      console.log('🔍 Test 3: Role check...');
      const { data: roleCheck, error: roleError } = await supabase
        .rpc('is_admin_or_sub_admin', { user_id_param: user?.id });

      if (roleError) {
        debug.errors.push(`Role Error: ${roleError.message}`);
        console.error('Role Error:', roleError);
      } else {
        debug.roleCheck = roleCheck;
        console.log('✅ Role check result:', roleCheck);
      }

    } catch (error: any) {
      debug.errors.push(`General Error: ${error.message}`);
      console.error('General Error:', error);
    }

    setDebugInfo(debug);
    setIsLoading(false);
  };

  useEffect(() => {
    runDiagnostic();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Debug - Messages Support Client
          <Button onClick={runDiagnostic} disabled={isLoading} size="sm">
            {isLoading ? 'Test...' : 'Re-tester'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-sm mb-2">👤 Utilisateur actuel:</h4>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto">
              {JSON.stringify(debugInfo.user, null, 2)}
            </pre>
          </div>
          
          <div>
            <h4 className="font-semibold text-sm mb-2">🔐 Profil:</h4>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto">
              {JSON.stringify(debugInfo.profile, null, 2)}
            </pre>
          </div>
        </div>

        {debugInfo.roleCheck !== undefined && (
          <div>
            <h4 className="font-semibold text-sm mb-2">✅ Vérification des droits:</h4>
            <p className={`text-sm ${debugInfo.roleCheck ? 'text-green-600' : 'text-red-600'}`}>
              {debugInfo.roleCheck ? '✅ Accès autorisé (Admin/Sub-Admin)' : '❌ Accès refusé'}
            </p>
          </div>
        )}

        <div>
          <h4 className="font-semibold text-sm mb-2">📨 Messages récupérés ({debugInfo.messages?.length || 0}):</h4>
          <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
            {JSON.stringify(debugInfo.messages, null, 2)}
          </pre>
        </div>

        <div>
          <h4 className="font-semibold text-sm mb-2">👥 Profils récupérés ({debugInfo.profiles?.length || 0}):</h4>
          <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
            {JSON.stringify(debugInfo.profiles, null, 2)}
          </pre>
        </div>

        {debugInfo.errors && debugInfo.errors.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2 text-red-600">❌ Erreurs:</h4>
            <div className="space-y-1">
              {debugInfo.errors.map((error: string, index: number) => (
                <p key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                  {error}
                </p>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerSupportDebug;