
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Upload, FileText, X } from "lucide-react";

interface IDDocumentUploadProps {
  onDocumentUpload: (file: File) => void;
  isUploading?: boolean;
}

const IDDocumentUpload = ({ onDocumentUpload, isUploading }: IDDocumentUploadProps) => {
  const [documentImage, setDocumentImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Le fichier ne doit pas dépasser 5 Mo');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setDocumentImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      onDocumentUpload(file);
    }
  };

  const removeDocument = () => {
    setDocumentImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <Label className="text-lg font-semibold">Pièce d'identité</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Téléchargez une photo claire de votre carte d'identité ou passeport
            </p>
          </div>
          
          <div className="border-2 border-dashed border-border rounded-lg p-6">
            {documentImage ? (
              <div className="relative">
                <img
                  src={documentImage}
                  alt="Pièce d'identité"
                  className="w-full max-h-64 object-contain rounded-md"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removeDocument}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  Cliquez pour télécharger votre pièce d'identité
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Télécharger document
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Formats acceptés: JPG, PNG (max 5 Mo)
                </p>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
          
          <div className="bg-muted/50 p-3 rounded-md">
            <p className="text-xs text-muted-foreground">
              <strong>Important:</strong> Assurez-vous que votre document est bien éclairé, 
              lisible et que toutes les informations sont visibles.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default IDDocumentUpload;
