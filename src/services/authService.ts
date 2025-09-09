
import { supabase } from '@/integrations/supabase/client';
import { SignUpMetadata } from '@/types/auth';

export const authService = {
  async signIn(phone: string, password: string) {
    console.log('🔐 Tentative de connexion avec le numéro:', phone);
    
    // Normaliser le numéro de téléphone - enlever tous les espaces et caractères non numériques sauf +
    const normalizedPhone = phone.replace(/[^\d+]/g, '');
    const email = `${normalizedPhone}@sendflow.app`;
    console.log('📧 Email de connexion généré:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password,
    });

    if (error) {
      console.error('❌ Erreur de connexion:', error);
      
      // Messages d'erreur plus spécifiques
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Numéro de téléphone ou mot de passe incorrect. Vérifiez que vous utilisez exactement le même numéro qu\'à l\'inscription.');
      }
      if (error.message.includes('Email not confirmed')) {
        throw new Error('Veuillez confirmer votre email avant de vous connecter.');
      }
      if (error.message.includes('Too many requests')) {
        throw new Error('Trop de tentatives de connexion. Veuillez attendre quelques minutes.');
      }
      
      throw new Error('Erreur de connexion. Vérifiez vos informations.');
    }
    
    console.log('✅ Connexion réussie pour:', data.user?.id);
    return data;
  },


  async signUp(phone: string, password: string, metadata: SignUpMetadata & { id_card_file?: File, referral_code?: string }) {
    console.log('📝 Tentative d\'inscription avec le numéro:', phone);
    console.log('🎯 Rôle demandé:', metadata.role);
    console.log('🎁 Code de parrainage:', metadata.referral_code);
    
    // Même normalisation que pour la connexion
    const normalizedPhone = phone.replace(/[^\d+]/g, '');
    const email = `${normalizedPhone}@sendflow.app`;
    console.log('📧 Email d\'inscription généré:', email);
    
    const userRole = metadata.role === 'agent' ? 'agent' : 'user';
    console.log('👥 Rôle final assigné:', userRole);

    // Vérifier le code de parrainage s'il est fourni
    let referrerId: string | null = null;
    if (metadata.referral_code) {
      const trimmedCode = metadata.referral_code.trim();
      console.log('🔍 Vérification du code de parrainage:', trimmedCode);
      
      const { data: referralData, error: referralError } = await supabase
        .from('referral_codes')
        .select('user_id')
        .eq('referral_code', trimmedCode)
        .maybeSingle();

      if (referralError) {
        console.error('❌ Erreur lors de la vérification du code:', referralError);
        throw new Error('Erreur lors de la vérification du code de parrainage. Réessayez.');
      }

      if (!referralData) {
        console.log('⚠️ Code de parrainage non trouvé:', trimmedCode);
        throw new Error('Code de parrainage invalide. Vérifiez le code et réessayez.');
      }

      referrerId = referralData.user_id;
      console.log('✅ Code de parrainage valide, parrain trouvé:', referrerId);
    }

    // Préparer les métadonnées pour l'inscription
    const signUpMetadata = {
      ...metadata,
      phone: normalizedPhone,
      role: userRole,
    };

    // Supprimer les champs spéciaux des métadonnées car ils ne peuvent pas être sérialisés
    const { id_card_file, referral_code, ...metadataWithoutFile } = signUpMetadata as any;
    
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password,
      options: {
        data: metadataWithoutFile,
      },
    });

    if (error) {
      console.error('❌ Erreur d\'inscription:', error);
      if (error.message.includes('User already registered')) {
        throw new Error('Un compte existe déjà avec ce numéro de téléphone. Veuillez vous connecter avec votre mot de passe.');
      }
      throw error;
    }

    // Si l'inscription réussit et qu'il y a un fichier de pièce d'identité, l'uploader
    if (data.user && metadata.id_card_file) {
      try {
        const fileExt = metadata.id_card_file.name.split('.').pop();
        const fileName = `${data.user.id}-id-card-${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('id-cards')
          .upload(fileName, metadata.id_card_file);

        if (uploadError) {
          console.error('❌ Erreur upload pièce d\'identité:', uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('id-cards')
            .getPublicUrl(uploadData.path);

          // Mettre à jour le profil avec l'URL de la pièce d'identité
          await supabase
            .from('profiles')
            .update({ id_card_url: publicUrl })
            .eq('id', data.user.id);
        }
      } catch (uploadError) {
        console.error('❌ Erreur lors de l\'upload de la pièce d\'identité:', uploadError);
      }
    }

    // Traiter le parrainage après inscription réussie
    if (data.user && referrerId && metadata.referral_code) {
      try {
        console.log('🎁 Création du parrainage...');
        
        // Créer l'enregistrement de parrainage
        const { error: referralInsertError } = await supabase
          .from('referrals')
          .insert({
            referrer_id: referrerId,
            referred_user_id: data.user.id,
            referral_code: metadata.referral_code.trim(),
            status: 'en_attente',
            amount_credited: 200
          });

        if (referralInsertError) {
          console.error('❌ Erreur création parrainage:', referralInsertError);
        } else {
          console.log('✅ Parrainage créé avec succès');
          
          // Optionnel: Créditer immédiatement le parrain (ou attendre la première transaction)
          // Pour le moment, on crédite directement après l'inscription
          try {
            const { data: creditResult, error: creditError } = await supabase.rpc(
              'process_referral_credit',
              { referred_user_id_param: data.user.id }
            );

            if (creditError) {
              console.error('❌ Erreur crédit parrainage:', creditError);
            } else if (creditResult) {
              console.log('✅ Crédit de parrainage appliqué');
            }
          } catch (creditError) {
            console.error('❌ Erreur lors du crédit de parrainage:', creditError);
          }
        }
      } catch (referralError) {
        console.error('❌ Erreur traitement parrainage:', referralError);
        // Ne pas faire échouer l'inscription pour une erreur de parrainage
      }
    }
    
    console.log('✅ Inscription réussie:', data.user?.id);
    return data;
  },

  async signOut() {
    console.log('🚪 Déconnexion en cours...');
    
    // Importer le service de stockage ici pour éviter les dépendances circulaires
    const { authStorageService } = await import('./authStorageService');
    
    // Supprimer le numéro stocké lors de la déconnexion
    authStorageService.clearStoredPhoneNumber();
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('❌ Erreur de déconnexion:', error);
      throw error;
    }
    console.log('✅ Déconnexion réussie');
  },

  async changePassword(newPassword: string) {
    console.log('🔐 Changement de mot de passe en cours...');
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      console.error('❌ Erreur lors du changement de mot de passe:', error);
      throw error;
    }
    
    console.log('✅ Mot de passe modifié avec succès');
  }
};
