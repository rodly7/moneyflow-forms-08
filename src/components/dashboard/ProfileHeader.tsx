
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ProfileEditForm from "@/components/ProfileEditForm";
import QRCodeGenerator from "@/components/QRCodeGenerator";
import { LogOut, Star, Edit3, Camera, User, QrCode, Sparkles, Crown, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface Profile {
  id: string;
  full_name: string | null;
  phone: string;
  avatar_url?: string | null;
}

interface ProfileHeaderProps {
  profile: Profile;
}

const ProfileHeader = ({ profile }: ProfileHeaderProps) => {
  const { signOut, user, userRole } = useAuth();
  const navigate = useNavigate();
  const [showQRDialog, setShowQRDialog] = useState(false);

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const isAgent = userRole === 'agent' || userRole === 'admin';
  const isAdmin = userRole === 'admin';
  const isSubAdmin = userRole === 'sub_admin';

  const getRoleIcon = () => {
    if (isAdmin) return <Crown className="h-5 w-5" />;
    if (isSubAdmin) return <Sparkles className="h-5 w-5" />;
    if (isAgent) return <Star className="h-5 w-5" />;
    return null;
  };

  const getRoleLabel = () => {
    if (isAdmin) return "Administrateur";
    if (isSubAdmin) return "Sous-Administrateur";
    if (isAgent) return "Agent Certifié";
    return "Utilisateur";
  };

  const getRoleGradient = () => {
    if (isAdmin) return "from-red-500 to-pink-600";
    if (isSubAdmin) return "from-purple-500 to-pink-500";
    if (isAgent) return "from-amber-400 to-orange-500";
    return "from-blue-500 to-cyan-500";
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <>
      <Card className="glass shadow-2xl border-0 rounded-3xl overflow-hidden backdrop-blur-lg hover-lift animate-fade-in">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Dialog>
                <DialogTrigger asChild>
                  <div className="cursor-pointer relative group">
                    <Avatar className="h-28 w-28 ring-4 ring-white/30 transition-all duration-500 group-hover:ring-white/50 group-hover:scale-110 shadow-2xl">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || ''} />
                      <AvatarFallback className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-2xl font-bold shadow-inner">
                        {profile?.avatar_url ? (
                          getInitials(profile?.full_name || '')
                        ) : (
                          <User className="h-12 w-12" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full p-3 opacity-0 group-hover:opacity-100 transition-all duration-500 shadow-xl hover:scale-110">
                      {profile?.avatar_url ? (
                        <Edit3 className="h-5 w-5 text-white" />
                      ) : (
                        <Camera className="h-5 w-5 text-white" />
                      )}
                    </div>
                    {!profile?.avatar_url && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 backdrop-blur-sm">
                        <span className="text-white text-sm font-semibold">Ajouter</span>
                      </div>
                    )}
                  </div>
                </DialogTrigger>
                <DialogContent className="rounded-3xl max-w-md glass backdrop-blur-lg border-white/20">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl">
                        <Camera className="h-6 w-6 text-white" />
                      </div>
                      Modifier votre profil
                    </DialogTitle>
                  </DialogHeader>
                  {profile && <ProfileEditForm profile={profile} />}
                </DialogContent>
              </Dialog>
              
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    {profile?.full_name || 'Utilisateur'}
                  </h2>
                  {(isAgent || isAdmin || isSubAdmin) && (
                    <div className={`flex items-center bg-gradient-to-r ${getRoleGradient()} text-white px-4 py-2 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105`}>
                      {getRoleIcon()}
                      <span className="text-sm font-semibold ml-2">{getRoleLabel()}</span>
                    </div>
                  )}
                </div>
                <p className="text-lg text-gray-600 font-semibold mb-2 flex items-center gap-2">
                  📱 {profile?.phone}
                </p>
                <p className="text-sm text-gray-500 mb-3">✨ Membre depuis aujourd'hui</p>
                {!profile?.avatar_url && (
                  <p className="text-sm text-emerald-600 font-semibold flex items-center gap-2 glass p-3 rounded-xl w-fit">
                    <Camera className="h-4 w-4" />
                    Cliquez sur l'avatar pour ajouter une photo
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon"
                className="text-gray-500 hover:text-emerald-600 glass hover:bg-emerald-50/80 rounded-2xl transition-all duration-300 h-14 w-14 shadow-lg hover:shadow-xl hover:scale-110"
                onClick={() => setShowQRDialog(true)}
                title="Mon QR Code"
              >
                <QrCode className="w-7 h-7" />
              </Button>

              <Button 
                variant="ghost" 
                size="icon"
                className="text-gray-500 hover:text-blue-600 glass hover:bg-blue-50/80 rounded-2xl transition-all duration-300 h-14 w-14 shadow-lg hover:shadow-xl hover:scale-110"
                onClick={() => navigate('/change-password')}
                title="Changer le mot de passe"
              >
                <Lock className="w-7 h-7" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon"
                className="text-gray-500 hover:text-red-500 glass hover:bg-red-50/80 rounded-2xl transition-all duration-300 h-14 w-14 shadow-lg hover:shadow-xl hover:scale-110"
                onClick={handleLogout}
              >
                <LogOut className="w-7 h-7" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <QRCodeGenerator 
        isOpen={showQRDialog}
        onClose={() => setShowQRDialog(false)}
      />
    </>
  );
};

export default ProfileHeader;
