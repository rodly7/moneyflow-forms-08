import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { storageService } from '@/services/storageService';
import { Camera, Upload, Trash2, Eye, User, FileImage } from 'lucide-react';

interface Agent {
  id: string;
  user_id: string;
  agent_id: string;
  full_name: string;
  phone: string;
  country: string;
  identity_photo: string | null;
  status: string;
}

interface AgentPhotoManagerProps {
  agent: Agent;
  onPhotoUpdated?: () => void;
}

const AgentPhotoManager = ({ agent, onPhotoUpdated }: AgentPhotoManagerProps) => {
  const [identityPhoto, setIdentityPhoto] = useState<File | null>(null);
  const [identityPreviewUrl, setIdentityPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  // Charger l'URL signée pour l'image d'identité au montage
  useEffect(() => {
    const loadSignedUrl = async () => {
      if (agent.identity_photo) {
        console.log('🔍 Chargement de l\'URL signée pour:', agent.identity_photo);
        try {
          // Essayer d'abord l'URL signée
          const signedUrl = await storageService.getSignedUrl('id-cards', agent.identity_photo);
          console.log('✅ URL signée générée:', signedUrl);
          setIdentityPreviewUrl(signedUrl);
        } catch (error) {
          console.error('❌ Erreur lors du chargement de l\'URL signée:', error);
          try {
            // Fallback vers l'URL publique directe
            const { data: publicUrl } = supabase.storage
              .from('id-cards')
              .getPublicUrl(agent.identity_photo);
            console.log('🔄 Utilisation fallback public URL:', publicUrl.publicUrl);
            setIdentityPreviewUrl(publicUrl.publicUrl);
          } catch (fallbackError) {
            console.error('❌ Erreur fallback:', fallbackError);
            // Si c'est déjà une URL complète, l'utiliser directement
            if (agent.identity_photo.startsWith('http')) {
              console.log('🔄 Utilisation URL directe:', agent.identity_photo);
              setIdentityPreviewUrl(agent.identity_photo);
            } else {
              setIdentityPreviewUrl(null);
            }
          }
        }
      } else {
        console.log('ℹ️ Aucune photo d\'identité pour cet agent');
        setIdentityPreviewUrl(null);
      }
    };

    loadSignedUrl();
  }, [agent.identity_photo]);

  const ensureBucketsExist = async () => {
    try {
      // Vérifier et créer le bucket id-cards s'il n'existe pas
      const { data: buckets } = await supabase.storage.listBuckets();
      const idCardsBucket = buckets?.find(b => b.name === 'id-cards');
      
      if (!idCardsBucket) {
        await supabase.storage.createBucket('id-cards', {
          public: false,
          allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
          fileSizeLimit: 5242880 // 5MB
        });
      }
    } catch (error) {
      console.error('Erreur lors de la création des buckets:', error);
    }
  };

  const uploadFile = async (file: File, bucket: string, path: string): Promise<string> => {
    await ensureBucketsExist();
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  };

  const handleIdentityPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validation de la taille (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "La photo ne doit pas dépasser 5MB",
          variant: "destructive"
        });
        return;
      }

      // Validation du type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Type de fichier invalide",
          description: "Veuillez sélectionner une image",
          variant: "destructive"
        });
        return;
      }

      setIdentityPhoto(file);
      
      // Créer une URL de prévisualisation
      const previewUrl = URL.createObjectURL(file);
      setIdentityPreviewUrl(previewUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!identityPhoto) {
      toast({
        title: "Aucune photo sélectionnée",
        description: "Veuillez sélectionner une photo d'identité",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    
    try {
      // Upload de la photo d'identité
      let identityPhotoPath = null;
      if (identityPhoto) {
        const identityPath = `agent_identity/${agent.user_id}_${Date.now()}.${identityPhoto.name.split('.').pop()}`;
        const { data, error: uploadError } = await supabase.storage
          .from('id-cards')
          .upload(identityPath, identityPhoto, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) throw uploadError;
        identityPhotoPath = data.path; // Stocker seulement le chemin, pas l'URL publique
      }

      // Mettre à jour les informations de l'agent
      const { error } = await supabase
        .from('agents')
        .update({
          identity_photo: identityPhotoPath
        })
        .eq('id', agent.id);

      if (error) throw error;

      toast({
        title: "Photo mise à jour",
        description: "La photo d'identité de l'agent a été mise à jour avec succès",
      });

      // Réinitialiser le formulaire
      setIdentityPhoto(null);
      
      // Notifier le parent
      onPhotoUpdated?.();
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la photo:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour de la photo",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!agent.identity_photo) return;
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette photo ?')) return;

    setIsUploading(true);
    
    try {
      // Supprimer la photo de l'agent
      const { error } = await supabase
        .from('agents')
        .update({
          identity_photo: null
        })
        .eq('id', agent.id);

      if (error) throw error;

      setIdentityPreviewUrl(null);
      
      toast({
        title: "Photo supprimée",
        description: "La photo d'identité a été supprimée avec succès",
      });

      onPhotoUpdated?.();
      
    } catch (error) {
      console.error('Erreur lors de la suppression de la photo:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression de la photo",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-blue-500 rounded-lg text-white">
            <Camera className="w-5 h-5" />
          </div>
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            📸 Gestion des Photos - {agent.full_name}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Informations de l'agent */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <Label className="text-sm font-medium text-gray-600">Agent ID</Label>
            <p className="font-mono text-sm bg-white px-2 py-1 rounded border">{agent.agent_id}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-600">Téléphone</Label>
            <p className="font-medium">{agent.phone}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-600">Pays</Label>
            <p className="font-medium">{agent.country}</p>
          </div>
        </div>

        {/* Gestion de la photo d'identité */}
        <div className="space-y-4">
          <Label className="text-lg font-semibold text-gray-800">Photo de la pièce d'identité</Label>
          
          {/* Prévisualisation actuelle */}
          {identityPreviewUrl && (
            <div className="space-y-3">
              <div className="relative">
                <img 
                  src={identityPreviewUrl} 
                  alt="Pièce d'identité" 
                  className="w-full max-w-md h-48 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
                  onError={(e) => {
                    console.error('Erreur de chargement de l\'image:', e);
                    e.currentTarget.style.display = 'none';
                    // Essayer de recharger avec une URL différente si possible
                    if (agent.identity_photo && !agent.identity_photo.startsWith('http')) {
                      const { data: publicUrl } = supabase.storage
                        .from('id-cards')
                        .getPublicUrl(agent.identity_photo);
                      e.currentTarget.src = publicUrl.publicUrl;
                      e.currentTarget.style.display = 'block';
                    }
                  }}
                  onLoad={() => {
                    console.log('✅ Image chargée avec succès');
                  }}
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(true)}
                    className="bg-white/90 hover:bg-white"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeletePhoto}
                    disabled={isUploading}
                    className="bg-red-500/90 hover:bg-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Upload de nouvelle photo */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center space-y-4">
                <FileImage className="w-12 h-12 text-gray-400 mx-auto" />
                <div>
                  <Label htmlFor="identity_photo" className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    {identityPreviewUrl ? 'Changer la photo' : 'Ajouter une photo'}
                  </Label>
                  <Input 
                    id="identity_photo" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleIdentityPhotoChange}
                  />
                </div>
                <p className="text-sm text-gray-500">PNG, JPG, WEBP jusqu'à 5MB</p>
              </div>
            </div>

            {identityPhoto && (
              <div className="flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setIdentityPhoto(null);
                    setIdentityPreviewUrl(agent.identity_photo);
                  }}
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  disabled={isUploading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isUploading ? 'Upload...' : 'Sauvegarder'}
                </Button>
              </div>
            )}
          </form>
        </div>

        {/* Modal de prévisualisation */}
        {showPreview && identityPreviewUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
            <div className="relative max-w-5xl max-h-[95vh] p-6">
              <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Pièce d'identité - {agent.full_name}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(false)}
                    className="text-white hover:bg-white/20"
                  >
                    ✕ Fermer
                  </Button>
                </div>
                <div className="p-6 bg-gray-50">
                  <img 
                    src={identityPreviewUrl} 
                    alt={`Pièce d'identité de ${agent.full_name}`}
                    className="w-full max-h-[70vh] object-contain rounded-lg border shadow-sm bg-white"
                    onError={(e) => {
                      console.error('Erreur de chargement de l\'image:', e);
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                </div>
                <div className="bg-white px-6 py-4 border-t">
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span><strong>Agent:</strong> {agent.agent_id}</span>
                    <span><strong>Téléphone:</strong> {agent.phone}</span>
                    <span><strong>Pays:</strong> {agent.country}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AgentPhotoManager;