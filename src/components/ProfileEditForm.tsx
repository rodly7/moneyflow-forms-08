
import { Button } from "@/components/ui/button";
import { useProfileForm } from "@/hooks/useProfileForm";
import AvatarUploadSection from "@/components/profile/AvatarUploadSection";
import IdCardUploadSection from "@/components/profile/IdCardUploadSection";
import ProfileFormFields from "@/components/profile/ProfileFormFields";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { MobileResponsiveWrapper } from "@/components/mobile/MobileResponsiveWrapper";

interface ProfileEditFormProps {
  profile: {
    id: string;
    full_name: string;
    phone: string;
    avatar_url?: string;
    id_card_photo_url?: string;
  };
}

const ProfileEditForm = ({ profile }: ProfileEditFormProps) => {
  const { isMobile } = useDeviceDetection();
  const {
    fullName,
    setFullName,
    isUploading,
    previewUrl,
    setPreviewUrl,
    idCardPreviewUrl,
    setIdCardPreviewUrl,
    setAvatarFile,
    setIdCardFile,
    handleSubmit,
    toast
  } = useProfileForm(profile);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🔄 handleFileChange déclenché');
    const file = e.target.files?.[0];
    if (!file) {
      console.log('❌ Aucun fichier sélectionné');
      return;
    }

    console.log('📁 Fichier sélectionné:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    if (file.size > 2 * 1024 * 1024) {
      console.log('❌ Fichier trop volumineux:', file.size);
      toast({
        title: "Fichier trop volumineux",
        description: "L'image ne doit pas dépasser 2 Mo",
        variant: "destructive"
      });
      return;
    }

    console.log('✅ Validation du fichier réussie, mise à jour de l\'état...');
    setAvatarFile(file);
    const objectUrl = URL.createObjectURL(file);
    console.log('🖼️ URL de prévisualisation créée:', objectUrl);
    setPreviewUrl(objectUrl);
  };

  const handleIdCardFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Fichier trop volumineux",
        description: "La photo de la pièce d'identité ne doit pas dépasser 5 Mo",
        variant: "destructive"
      });
      return;
    }

    setIdCardFile(file);
    const objectUrl = URL.createObjectURL(file);
    setIdCardPreviewUrl(objectUrl);
  };

  const FormContent = () => (
    <form onSubmit={handleSubmit} className={`form-container ${isMobile ? 'mobile-form' : ''}`}>
      <div className="form-field-wrapper">
        <AvatarUploadSection 
          previewUrl={previewUrl}
          fullName={fullName}
          onFileChange={handleFileChange}
        />
      </div>
      
      <div className="form-field-wrapper">
        <ProfileFormFields 
          fullName={fullName}
          setFullName={setFullName}
          phone={profile?.phone}
        />
      </div>

      <div className="form-field-wrapper">
        <IdCardUploadSection 
          idCardPreviewUrl={idCardPreviewUrl}
          onFileChange={handleIdCardFileChange}
        />
      </div>
      
      {/* Fixed space for form messages */}
      <div className="min-h-[18px] form-message-zone">
        {/* Toast messages will appear here without shifting the form */}
      </div>
      
      <Button 
        type="submit" 
        className={`w-full mobile-touch-target ${isMobile ? 'h-12' : ''}`} 
        disabled={isUploading}
      >
        {isUploading ? "Mise à jour..." : "Enregistrer les modifications"}
      </Button>
    </form>
  );

  if (isMobile) {
    return (
      <MobileResponsiveWrapper>
        <FormContent />
      </MobileResponsiveWrapper>
    );
  }

  return <FormContent />;
};

export default ProfileEditForm;
