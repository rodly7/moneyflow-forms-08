
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, FileText } from "lucide-react";

interface IdCardUploadSectionProps {
  idCardPreviewUrl: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const IdCardUploadSection = ({ idCardPreviewUrl, onFileChange }: IdCardUploadSectionProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="idCardPhoto">Photo de la pièce d'identité</Label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
        {idCardPreviewUrl ? (
          <div className="space-y-2">
            <img 
              src={idCardPreviewUrl} 
              alt="Pièce d'identité" 
              className="w-full h-32 object-cover rounded-md"
            />
            <div className="flex items-center justify-center">
              <Label htmlFor="idCardPhoto" className="cursor-pointer bg-secondary text-secondary-foreground px-3 py-1 rounded-md text-sm hover:bg-secondary/90 flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Changer la photo
              </Label>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4">
            <FileText className="h-8 w-8 text-gray-400 mb-2" />
            <Label htmlFor="idCardPhoto" className="cursor-pointer bg-secondary text-secondary-foreground px-3 py-1 rounded-md text-sm hover:bg-secondary/90 flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Ajouter une photo
            </Label>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG jusqu'à 5MB</p>
          </div>
        )}
        <Input 
          id="idCardPhoto" 
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={onFileChange}
        />
      </div>
    </div>
  );
};

export default IdCardUploadSection;
