
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const QrScanner = () => {
  const navigate = useNavigate();
  const { isAgent } = useAuth();

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 py-4 px-0">
      <div className="max-w-md mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/dashboard')}
            className="text-gray-700"
          >
            <X className="w-5 h-5" />
          </Button>
          <h2 className="text-xl font-semibold">Fonctionnalité obsolète</h2>
          <div className="w-9"></div>
        </div>
      
        <div className="space-y-6">
          <div className="card border rounded-lg shadow-md p-4 bg-white">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-600 mb-2">
                Cette fonctionnalité a été remplacée par le nouveau système de retrait.
              </p>
              <p className="text-xs text-gray-500">
                Veuillez utiliser le nouveau système accessible depuis le tableau de bord.
              </p>
            </div>

            <Button
              variant="default"
              onClick={() => navigate('/withdraw')}
              className="w-full mb-4"
            >
              <X className="mr-2 h-4 w-4" />
              Retourner au tableau de bord
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QrScanner;
