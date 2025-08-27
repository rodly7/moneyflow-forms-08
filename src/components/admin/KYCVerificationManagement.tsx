
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  User, 
  FileText,
  Calendar
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { KYCVerificationRecord } from '@/types/kyc';

const KYCVerificationManagement = () => {
  const { toast } = useToast();
  const [selectedVerification, setSelectedVerification] = useState<KYCVerificationRecord | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch pending KYC verifications
  const { data: pendingVerifications, refetch: refetchPending } = useQuery({
    queryKey: ['kyc-verifications', 'pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kyc_verifications')
        .select(`
          *,
          profiles!kyc_verifications_user_id_fkey (
            full_name,
            phone,
            country
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as (KYCVerificationRecord & { profiles: any })[];
    }
  });

  // Fetch all KYC verifications for history
  const { data: allVerifications, refetch: refetchAll } = useQuery({
    queryKey: ['kyc-verifications', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kyc_verifications')
        .select(`
          *,
          profiles!kyc_verifications_user_id_fkey (
            full_name,
            phone,
            country
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as (KYCVerificationRecord & { profiles: any })[];
    }
  });

  const handleApproval = async (verificationId: string, status: 'approved' | 'rejected', notes?: string) => {
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Update KYC verification
      const { error: kycError } = await supabase
        .from('kyc_verifications')
        .update({
          status,
          verification_notes: notes,
          verified_by: user.id,
          verified_at: new Date().toISOString()
        })
        .eq('id', verificationId);

      if (kycError) throw kycError;

      // Update user profile
      const verification = pendingVerifications?.find(v => v.id === verificationId);
      if (verification) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            kyc_status: status,
            is_verified: status === 'approved',
            verified_at: status === 'approved' ? new Date().toISOString() : null
          })
          .eq('id', verification.user_id);

        if (profileError) throw profileError;
      }

      toast({
        title: status === 'approved' ? "Vérification approuvée" : "Vérification rejetée",
        description: `La vérification d'identité a été ${status === 'approved' ? 'approuvée' : 'rejetée'} avec succès.`,
      });

      refetchPending();
      refetchAll();
      setSelectedVerification(null);
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour de la vérification",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600"><CheckCircle className="w-3 h-3 mr-1" />Approuvée</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600"><XCircle className="w-3 h-3 mr-1" />Rejetée</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Gestion des Vérifications KYC</h1>
        <p className="opacity-90">
          Approuvez ou rejetez les vérifications d'identité soumises par les utilisateurs.
        </p>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            En attente ({pendingVerifications?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Historique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <div className="grid gap-4">
            {pendingVerifications?.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune vérification en attente</h3>
                  <p className="text-gray-600">Toutes les vérifications ont été traitées.</p>
                </CardContent>
              </Card>
            ) : (
              pendingVerifications?.map((verification) => (
                <Card key={verification.id} className="border-l-4 border-l-yellow-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-gray-500" />
                        <div>
                          <CardTitle className="text-lg">{verification.profiles?.full_name}</CardTitle>
                          <p className="text-sm text-gray-600">{verification.profiles?.phone}</p>
                        </div>
                      </div>
                      {getStatusBadge(verification.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Type de document</p>
                        <p className="text-sm text-gray-900">{verification.id_document_type}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Nom sur le document</p>
                        <p className="text-sm text-gray-900">{verification.document_name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Numéro de document</p>
                        <p className="text-sm text-gray-900">{verification.document_number}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Date de soumission</p>
                        <p className="text-sm text-gray-900">{formatDate(verification.created_at)}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {verification.id_document_url && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(verification.id_document_url!, '_blank')}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Document ID
                        </Button>
                      )}
                      {verification.selfie_url && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(verification.selfie_url!, '_blank')}
                        >
                          <User className="w-4 h-4 mr-1" />
                          Selfie
                        </Button>
                      )}
                      {verification.video_url && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(verification.video_url!, '_blank')}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Vidéo
                        </Button>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApproval(verification.id, 'approved')}
                        disabled={isProcessing}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approuver
                      </Button>
                      <Button
                        onClick={() => handleApproval(verification.id, 'rejected', 'Rejeté par l\'administrateur')}
                        disabled={isProcessing}
                        variant="destructive"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Rejeter
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="grid gap-4">
            {allVerifications?.map((verification) => (
              <Card key={verification.id} className={`border-l-4 ${
                verification.status === 'approved' ? 'border-l-green-500' : 
                verification.status === 'rejected' ? 'border-l-red-500' : 'border-l-yellow-500'
              }`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-gray-500" />
                      <div>
                        <CardTitle className="text-lg">{verification.profiles?.full_name}</CardTitle>
                        <p className="text-sm text-gray-600">{verification.profiles?.phone}</p>
                      </div>
                    </div>
                    {getStatusBadge(verification.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-700">Soumis le</p>
                      <p className="text-gray-900">{formatDate(verification.created_at)}</p>
                    </div>
                    {verification.verified_at && (
                      <div>
                        <p className="font-medium text-gray-700">Traité le</p>
                        <p className="text-gray-900">{formatDate(verification.verified_at)}</p>
                      </div>
                    )}
                    {verification.verification_notes && (
                      <div>
                        <p className="font-medium text-gray-700">Notes</p>
                        <p className="text-gray-900">{verification.verification_notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default KYCVerificationManagement;
