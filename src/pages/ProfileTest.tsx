import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProfileAvatarUpload from "@/components/profile/ProfileAvatarUpload";
import { useAuth } from "@/contexts/AuthContext";

const ProfileTestPage = () => {
  const { profile, user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p>Vous devez être connecté pour voir cette page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Test d'Upload de Photo de Profil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">
                Bonjour {profile?.full_name || 'Utilisateur'} !
              </h3>
              <p className="text-muted-foreground mb-6">
                Cliquez sur l'avatar ou le bouton pour ajouter/modifier votre photo de profil
              </p>
              
              <ProfileAvatarUpload size="lg" showUploadButton={true} />
            </div>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Formats acceptés : JPG, PNG, GIF (max 2 Mo)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Aperçu compact */}
        <Card>
          <CardHeader>
            <CardTitle>Aperçu dans l'interface</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg">
              <ProfileAvatarUpload size="sm" showUploadButton={false} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileTestPage;