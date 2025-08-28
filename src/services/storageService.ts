import { supabase } from '@/integrations/supabase/client';

export const storageService = {
  async uploadFile(file: File, bucket: string, userId: string, prefix: string): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${prefix}-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;
      
      console.log(`Tentative d'upload vers ${bucket}/${filePath}`);
      
      // Vérifier d'abord si le bucket existe
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('Erreur lors de la vérification des buckets:', bucketsError);
        throw new Error('Impossible de vérifier la configuration du stockage');
      }
      
      const bucketExists = buckets?.some(b => b.id === bucket);
      if (!bucketExists) {
        console.error(`Le bucket ${bucket} n'existe pas. Buckets disponibles:`, buckets?.map(b => b.id));
        throw new Error(`Le stockage ${bucket} n'est pas configuré. Contactez l'administrateur.`);
      }
      
      // Upload du fichier
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Erreur upload:', error);
        
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