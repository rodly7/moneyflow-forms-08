import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Users, 
  Gift, 
  Copy, 
  Share, 
  MessageCircle, 
  Mail, 
  Eye,
  ExternalLink,
  TrendingUp
} from "lucide-react";

interface ReferralData {
  referral_code: string;
  total_referrals: number;
  total_earnings: number;
  pending_referrals: number;
  referrals: Array<{
    id: string;
    referred_user_name: string;
    status: string;
    amount_credited: number;
    created_at: string;
  }>;
}

const ReferralSection = () => {
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReferrals, setShowReferrals] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchReferralData();
    }
  }, [user]);

  const fetchReferralData = async () => {
    try {
      setLoading(true);

      // Récupérer le code de parrainage
      const { data: codeData, error: codeError } = await supabase
        .from('referral_codes')
        .select('referral_code')
        .eq('user_id', user?.id)
        .single();

      if (codeError) {
        console.error('Erreur récupération code:', codeError);
        return;
      }

      // Récupérer les statistiques des parrainages
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select(`
          id,
          status,
          amount_credited,
          created_at,
          referred_user_id
        `)
        .eq('referrer_id', user?.id);

      if (referralsError) {
        console.error('Erreur récupération parrainages:', referralsError);
      }

      // Calculer les statistiques
      const totalReferrals = referralsData?.length || 0;
      const totalEarnings = referralsData?.reduce((sum, ref) => 
        ref.status === 'credit_applique' ? sum + (ref.amount_credited || 0) : sum, 0) || 0;
      const pendingReferrals = referralsData?.filter(ref => ref.status === 'en_attente').length || 0;

      // Enrichir avec les noms des utilisateurs parrainés
      const enrichedReferrals = await Promise.all(
        (referralsData || []).map(async (ref) => {
          const { data: userData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', ref.referred_user_id)
            .single();

          return {
            ...ref,
            referred_user_name: userData?.full_name || 'Utilisateur inconnu'
          };
        })
      );

      setReferralData({
        referral_code: codeData.referral_code,
        total_referrals: totalReferrals,
        total_earnings: totalEarnings,
        pending_referrals: pendingReferrals,
        referrals: enrichedReferrals
      });

    } catch (error) {
      console.error('Erreur lors du chargement des données de parrainage:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de parrainage",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = async () => {
    if (referralData?.referral_code) {
      try {
        await navigator.clipboard.writeText(referralData.referral_code);
        toast({
          title: "Code copié !",
          description: "Le code de parrainage a été copié dans le presse-papiers",
        });
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de copier le code",
          variant: "destructive"
        });
      }
    }
  };

  const shareViaWhatsApp = () => {
    const message = `🎉 Rejoignez Sendflow avec mon code de parrainage ${referralData?.referral_code} et nous gagnerons tous les deux 200 F ! 💸 \n\nSendflow - L'app de transfert d'argent simple et sécurisée.`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const shareViaEmail = () => {
    const subject = "Invitation Sendflow - Gagnez 200 F !";
    const body = `Salut !

Je t'invite à rejoindre Sendflow, l'app de transfert d'argent que j'utilise.

Utilise mon code de parrainage : ${referralData?.referral_code}

✅ Tu recevras 200 F à ton inscription
✅ Je recevrai aussi 200 F quand tu t'inscris
✅ C'est 100% gratuit et sécurisé

Télécharge l'app et inscris-toi avec mon code !

À bientôt sur Sendflow ! 🚀`;

    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url);
  };

  const shareViaSMS = () => {
    const message = `🎉 Rejoignez Sendflow avec mon code ${referralData?.referral_code} et gagnez 200 F ! 💸`;
    const url = `sms:?body=${encodeURIComponent(message)}`;
    window.open(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'credit_applique': return 'bg-green-100 text-green-800';
      case 'en_attente': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'credit_applique': return 'Crédit appliqué';
      case 'en_attente': return 'En attente';
      default: return status;
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-purple-700">Chargement...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl flex items-center gap-3 text-purple-800">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
            <Gift className="w-6 h-6 text-white" />
          </div>
          Parrainage Sendflow – Gagnez 200 F !
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Description */}
        <div className="bg-white/70 rounded-lg p-4">
          <p className="text-gray-700 mb-3">
            Invitez vos amis à rejoindre Sendflow et recevez <strong>200 F</strong> pour chaque ami inscrit avec votre lien de parrainage !
          </p>
          
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <span className="font-bold text-purple-600">1️⃣</span>
              <span>Partagez votre code ou lien de parrainage unique avec vos amis.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-purple-600">2️⃣</span>
              <span>Votre ami s'inscrit sur Sendflow en utilisant votre code/lien.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-purple-600">3️⃣</span>
              <span>Dès que votre ami recharge 1000 XAF dans son compte, 200 XAF sont automatiquement crédités sur votre compte.</span>
            </div>
          </div>
          
          <p className="text-center text-purple-700 font-medium mt-3">
            Plus vous invitez d'amis, plus vous gagnez ! 💸
          </p>
        </div>

        {/* Code de parrainage */}
        <div className="bg-white rounded-lg p-4 border-2 border-dashed border-purple-300">
          <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-600" />
            Votre code de parrainage
          </h3>
          <div className="flex items-center gap-2">
            <Input 
              value={referralData?.referral_code || ''} 
              readOnly 
              className="font-mono text-lg font-bold text-center bg-purple-50 border-purple-200"
            />
            <Button onClick={copyReferralCode} size="sm" variant="outline">
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{referralData?.total_referrals || 0}</div>
            <div className="text-xs text-gray-600">Amis invités</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-600">{referralData?.total_earnings || 0} F</div>
            <div className="text-xs text-gray-600">Gains totaux</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-orange-600">{referralData?.pending_referrals || 0}</div>
            <div className="text-xs text-gray-600">En attente</div>
          </div>
        </div>

        {/* Boutons de partage */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Share className="w-4 h-4 text-purple-600" />
            Partager mon lien
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={shareViaWhatsApp}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
            
            <Button
              onClick={shareViaSMS}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              SMS
            </Button>
            
            <Button
              onClick={shareViaEmail}
              className="bg-gray-600 hover:bg-gray-700 text-white col-span-2"
              size="sm"
            >
              <Mail className="w-4 h-4 mr-2" />
              E-mail
            </Button>
          </div>
          
          {/* Bouton d'inscription directe */}
          <div className="pt-2">
            <Button
              onClick={() => window.open('/auth', '_blank')}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              size="sm"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Inviter un ami via le lien d'inscription
            </Button>
          </div>
        </div>

        {/* Voir mes gains */}
        <div className="border-t pt-4">
          <Button
            onClick={() => setShowReferrals(!showReferrals)}
            variant="outline"
            className="w-full"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            {showReferrals ? 'Masquer' : 'Voir'} mes gains
            <Eye className="w-4 h-4 ml-2" />
          </Button>
          
          {showReferrals && (
            <div className="mt-4 space-y-3">
              <h4 className="font-medium text-gray-800">Historique des parrainages</h4>
              
              {referralData?.referrals && referralData.referrals.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {referralData.referrals.map((referral) => (
                    <div key={referral.id} className="bg-white rounded-lg p-3 border">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-800">
                            {referral.referred_user_name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {new Date(referral.created_at).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            className={`text-xs ${getStatusColor(referral.status)}`}
                          >
                            {getStatusText(referral.status)}
                          </Badge>
                          <div className="text-sm font-medium text-green-600 mt-1">
                            +{referral.amount_credited} F
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  Aucun parrainage pour le moment.
                  <br />
                  Commencez à inviter vos amis !
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferralSection;