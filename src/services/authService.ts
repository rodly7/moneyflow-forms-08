
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
      // Vérification directe dans la base de données
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, pin_code, phone, full_name, role')
        .eq('phone', normalizedPhone)
        .maybeSingle();

      console.log('🔍 Profil trouvé:', profile);
      console.log('🔍 Erreur profile:', profileError);

      if (profileError) {
        console.error('❌ Erreur lors de la recherche:', profileError);
        throw new Error('Erreur lors de la recherche de l\'utilisateur.');
      }

      if (!profile) {
        console.error('❌ Utilisateur non trouvé avec le numéro:', normalizedPhone);
        throw new Error('Utilisateur non trouvé. Vérifiez votre numéro de téléphone.');
      }

      if (!profile.pin_code) {
        throw new Error('PIN non configuré. Veuillez vous connecter avec votre mot de passe pour créer un PIN.');
      }

      // Vérification simple du PIN (en attendant le chiffrement)
      console.log('🔑 Vérification PIN:', { pin, storedPin: profile.pin_code });
      
      if (profile.pin_code !== pin) {
        throw new Error('PIN incorrect.');
      }

      console.log('✅ PIN correct, création de session simulée...');
      
      // Stocker les informations d'authentification dans localStorage
      const userData = {
        id: profile.id,
        phone: profile.phone,
        full_name: profile.full_name,
        role: profile.role,
        email: `${normalizedPhone}@sendflow.app`
      };
      
      // Stocker la session PIN
      localStorage.setItem('pin_session_user', JSON.stringify(userData));
      localStorage.setItem('pin_authenticated', 'true');
      
      console.log('💾 Session PIN stockée:', userData);
      
      return { 
        user: userData,
        session: {
          access_token: 'pin-session-token',
          user: userData
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
