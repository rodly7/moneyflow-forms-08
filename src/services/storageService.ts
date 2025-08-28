import { supabase } from '@/integrations/supabase/client';

export const storageService = {
  async uploadFile(file: File, bucket: string, userId: string, prefix: string): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${prefix}-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;
      
      console.log(`Tentative d'upload vers ${bucket}/${filePath}`);
      
      // Tentative d'upload direct sans vérification de bucket
      // (la vérification sera faite par Supabase lui-même)
      console.log(`Upload direct vers ${bucket}/${filePath}`);
      
      // Upload du fichier
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Erreur upload:', error);
        
        // Gestion des erreurs spécifiques
        if (error.message?.includes('Bucket not found') || error.message?.includes('bucket does not exist')) {
          throw new Error(`Le stockage ${bucket} n'est pas configuré. Contactez l'administrateur.`);
        }
        
        if (error.message?.includes('row-level security') || 
            error.message?.includes('permission') ||
            error.message?.includes('policy')) {
          throw new Error('Erreur de permissions. Veuillez vous reconnecter.');
        }
        
        if (error.message?.includes('not found')) {
          throw new Error(`Le stockage ${bucket} n'est pas accessible. Contactez l'administrateur.`);
        }
        
        throw error;
      }

      // Obtenir l'URL publique pour les buckets publics, sinon l'URL signée
      if (bucket === 'avatars') {
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);
        return urlData.publicUrl;
      } else {
        // Pour les buckets privés, on retourne juste le path
        return data.path;
      }
    } catch (error) {
      console.error(`Erreur lors de l'upload vers ${bucket}:`, error);
      throw error;
    }
  },

  async getSignedUrl(bucket: string, path: string, expiresIn: number = 3600): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);
      
      if (error) {
        console.error('Erreur lors de la création de l\'URL signée:', error);
        throw error;
      }
      
      return data.signedUrl;
    } catch (error) {
      console.error('Erreur getSignedUrl:', error);
      throw error;
    }
  }
};