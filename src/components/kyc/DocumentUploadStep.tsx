
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Upload, FileText, X } from 'lucide-react';
import { toast } from 'sonner';

interface DocumentUploadStepProps {
  documentFile: File | null;
  documentType: string;
  onDocumentChange: (file: File | null) => void;
  onDocumentTypeChange: (type: string) => void;
  onNext: () => void;
  canProceed: boolean;
}

const DocumentUploadStep = ({
  documentFile,
  documentType,
  onDocumentChange,
  onDocumentTypeChange,
  onNext,
  canProceed
}: DocumentUploadStepProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation du fichier
    if (file.size > 10 * 1024 * 1024) { // 10MB
      toast.error('Le fichier ne doit pas dépasser 10 Mo');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Format non supporté. Utilisez JPG, PNG ou WebP');
      return;
    }

    onDocumentChange(file);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Téléchargez votre pièce d'identité</h3>
        <p className="text-gray-600 text-sm">
          Assurez-vous que le document est lisible et que toutes les informations sont visibles.
        </p>
      </div>

      {/* Type de document */}
      <div className="space-y-2">
        <Label htmlFor="document-type">Type de document *</Label>
        <Select value={documentType} onValueChange={onDocumentTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez le type de document" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="carte_identite">Carte d'identité</SelectItem>
            <SelectItem value="passeport">Passeport</SelectItem>
            <SelectItem value="permis_conduire">Permis de conduire</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Zone d'upload */}
      <div className="space-y-4">
        {!documentFile ? (
          <Card 
            className="border-2 border-dashed border-gray-300 hover:border-primary cursor-pointer transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="p-8 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium mb-2">Cliquez pour télécharger</p>
              <p className="text-sm text-gray-500">
                Formats acceptés: JPG, PNG, WebP (max 10 Mo)
              </p>
            </div>
          </Card>
        ) : (
          <Card className="border-green-200 bg-green-50">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">{documentFile.name}</p>
                    <p className="text-sm text-green-600">
                      {(documentFile.size / 1024 / 1024).toFixed(2)} Mo
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDocumentChange(null)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Aperçu de l'image */}
              <div className="mt-4">
                <img
                  src={URL.createObjectURL(documentFile)}
                  alt="Aperçu du document"
                  className="max-w-full max-h-64 mx-auto rounded-lg border"
                />
              </div>
            </div>
          </Card>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Conseils */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">Conseils pour une bonne photo :</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Document bien éclairé et lisible</li>
          <li>• Toutes les informations visibles</li>
          <li>• Pas de reflets ou d'ombres</li>
          <li>• Image nette et de bonne qualité</li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <Button 
          onClick={onNext} 
          disabled={!canProceed}
          className="min-w-32"
        >
          Continuer
        </Button>
      </div>
    </div>
  );
};

export default DocumentUploadStep;
