import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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
  const { toast } = useToast();
  const [identityPhoto, setIdentityPhoto] = useState<File | null>(null);
  const [identityPreviewUrl, setIdentityPreviewUrl] = useState<string | null>(agent.identity_photo);
  const [isUploading, setIsUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setIdentityPreviewUrl(agent.identity_photo);
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
      let identityPhotoUrl = null;
      if (identityPhoto) {
        const identityPath = `agent_identity/${agent.user_id}_${Date.now()}.${identityPhoto.name.split('.').pop()}`;
        identityPhotoUrl = await uploadFile(identityPhoto, 'id-cards', identityPath);
      }

      // Mettre à jour les informations de l'agent
      const { error } = await supabase
        .from('agents')
        .update({
          identity_photo: identityPhotoUrl
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="relative max-w-4xl max-h-[90vh] p-4">
              <img 
                src={identityPreviewUrl} 
                alt="Pièce d'identité - Prévisualisation" 
                className="max-w-full max-h-full object-contain rounded-lg"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(false)}
                className="absolute top-2 right-2 bg-white/90 hover:bg-white"
              >
                ✕
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AgentPhotoManager;