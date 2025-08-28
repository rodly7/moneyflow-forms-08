import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, Camera } from "lucide-react";

interface SelfieUploadSectionProps {
  selfiePreviewUrl: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const SelfieUploadSection = ({ selfiePreviewUrl, onFileChange }: SelfieUploadSectionProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="selfiePhoto">Photo selfie</Label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
        {selfiePreviewUrl ? (
          <div className="space-y-2">
            <img 
              src={selfiePreviewUrl} 
              alt="Photo selfie" 
              className="w-full h-32 object-cover rounded-md"
            />
            <div className="flex items-center justify-center">
              <Label htmlFor="selfiePhoto" className="cursor-pointer bg-secondary text-secondary-foreground px-3 py-1 rounded-md text-sm hover:bg-secondary/90 flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Changer la photo
              </Label>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4">
            <Camera className="h-8 w-8 text-gray-400 mb-2" />
            <Label htmlFor="selfiePhoto" className="cursor-pointer bg-secondary text-secondary-foreground px-3 py-1 rounded-md text-sm hover:bg-secondary/90 flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Ajouter une photo selfie
            </Label>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG jusqu'à 5MB</p>
          </div>
        )}
        <Input 
          id="selfiePhoto" 
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={onFileChange}
        />
      </div>
    </div>
  );
};

export default SelfieUploadSection;