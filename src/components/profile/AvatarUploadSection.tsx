
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Camera, User } from "lucide-react";

interface AvatarUploadSectionProps {
  previewUrl: string | null;
  fullName: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const AvatarUploadSection = ({ previewUrl, fullName, onFileChange }: AvatarUploadSectionProps) => {
  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative group">
        <Avatar className="h-32 w-32 ring-4 ring-emerald-100 transition-all duration-300 group-hover:ring-emerald-200">
          <AvatarImage src={previewUrl || ""} alt={fullName} />
          <AvatarFallback className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-2xl font-bold">
            {previewUrl ? getInitials(fullName) : <User className="h-12 w-12" />}
          </AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full p-3 shadow-lg">
          <Camera className="h-5 w-5 text-white" />
        </div>
      </div>
      
      <div className="flex items-center justify-center">
        <Label htmlFor="avatar" className="cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-xl text-sm font-medium hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2">
          <Camera className="h-4 w-4" />
          {previewUrl ? 'Changer la photo' : 'Ajouter une photo'}
        </Label>
        <Input 
          id="avatar" 
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={onFileChange}
        />
      </div>
      
      <p className="text-xs text-gray-500 text-center max-w-xs">
        Formats acceptés : JPG, PNG, GIF (max 2 Mo)
      </p>
    </div>
  );
};

export default AvatarUploadSection;
