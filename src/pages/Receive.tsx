import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, QrCode, Copy, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, getCurrencyForCountry } from "@/lib/utils/currency";

const Receive = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [qrCode, setQrCode] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (user?.id) {
      setQrCode(user.id);
    }
  }, [user?.id]);

  const userCurrency = profile?.country ? getCurrencyForCountry(profile.country) : 'XAF';

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(qrCode);
    setIsCopied(true);
    toast({
      title: "Code copié",
      description: "Le code QR a été copié dans le presse-papiers.",
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="container mx-auto p-4">
      <Button variant="ghost" className="mb-4" onClick={handleGoBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour
      </Button>

      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="mr-2 h-5 w-5" />
            Recevoir de l'argent
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6">
          {qrCode ? (
            <>
              <QRCodeSVG value={qrCode} size={256} level="H" />
              <p className="text-sm text-muted-foreground mt-4">
                Scannez ce code QR pour recevoir de l'argent.
              </p>
              <p className="text-lg font-semibold mt-2">
                Votre code: {qrCode}
              </p>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleCopyCode} disabled={isCopied}>
                  {isCopied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copié!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copier le code
                    </>
                  )}
                </Button>
                {profile?.balance !== undefined && (
                  <p className="text-sm text-muted-foreground">
                    Solde actuel: {formatCurrency(profile.balance, userCurrency)}
                  </p>
                )}
              </div>
            </>
          ) : (
            <p>Chargement du code QR...</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Receive;
