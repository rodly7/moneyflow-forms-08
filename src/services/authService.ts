
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

  async signInWithPin(phone: string, pin: string) {
    console.log('🔐 Tentative de connexion avec PIN pour:', phone);
    
    const normalizedPhone = phone.replace(/[^\d+]/g, '');
    console.log('📱 Numéro normalisé pour recherche PIN:', normalizedPhone);
    
    try {
      // D'abord vérifier le PIN via la fonction edge
      const { data, error } = await supabase.functions.invoke('pin-auth', {
        body: {
          phone: normalizedPhone,
          pin: pin
        }
      });

      if (error) {
        console.error('❌ Erreur fonction PIN:', error);
        throw new Error('Erreur lors de la vérification du PIN');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'PIN incorrect');
      }

      console.log('✅ PIN vérifié, création de session...');
      
      // Après vérification du PIN, créer une vraie session d'authentification
      // Utiliser l'email généré et essayer de se connecter avec un mot de passe factice
      const email = `${normalizedPhone}@sendflow.app`;
      
      // Stocker temporairement que le PIN a été vérifié
      localStorage.setItem('pin_verified_user', JSON.stringify(data.user));
      
      // Essayer de récupérer les informations d'authentification depuis le stockage local
      // ou rediriger vers le tableau de bord directement
      console.log('🔄 Redirection vers le tableau de bord après vérification PIN');
      
      // Simuler une session d'authentification réussie
      return { 
        user: {
          id: data.user.id,
          phone: data.user.phone,
          email: email
        },
        session: {
          access_token: 'pin-verified-session',
          user: data.user
        }
      };
    } catch (error: any) {
      console.error('❌ Erreur de connexion PIN:', error);
      throw error;
    }
  },

  async signUp(phone: string, password: string, metadata: SignUpMetadata & { id_card_file?: File }) {
    console.log('📝 Tentative d\'inscription avec le numéro:', phone);
    console.log('🎯 Rôle demandé:', metadata.role);
    
    // Même normalisation que pour la connexion
    const normalizedPhone = phone.replace(/[^\d+]/g, '');
    const email = `${normalizedPhone}@sendflow.app`;
    console.log('📧 Email d\'inscription généré:', email);
    
    const userRole = metadata.role === 'agent' ? 'agent' : 'user';
    console.log('👥 Rôle final assigné:', userRole);

    // Préparer les métadonnées pour l'inscription
    const signUpMetadata = {
      ...metadata,
      phone: normalizedPhone,
      role: userRole,
    };

    // Supprimer le fichier des métadonnées car il ne peut pas être sérialisé
    const { id_card_file, ...metadataWithoutFile } = signUpMetadata as any;
    
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
