import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, User, Phone, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import QRCodeSVG from 'qrcode.react';

const QRCode = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
  }, [user, navigate]);

  const qrData = {
    userId: user?.id || '',
    fullName: profile?.full_name || 'Utilisateur',
    phone: profile?.phone || '',
    timestamp: Date.now()
  };

  const handleDownload = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL();
      const a = document.createElement('a');
      a.href = url;
      a.download = 'qr-code-sendflow.png';
      a.click();
    }
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-blue-600 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-md mx-auto">
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-between mb-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/dashboard')}
                className="text-blue-600 hover:text-blue-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Télécharger
              </Button>
            </div>
            <CardTitle className="text-2xl font-bold text-blue-600 mb-2">
              Mon QR Code
            </CardTitle>
            <p className="text-gray-600">
              Partagez ce code pour recevoir des paiements
            </p>
          </CardHeader>
          
          <CardContent className="text-center space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-lg border-4 border-blue-100">
              <QRCodeSVG 
                value={JSON.stringify(qrData)}
                size={200}
                level="M"
                includeMargin={true}
                className="mx-auto"
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{profile.full_name}</span>
              </div>
              
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{profile.phone}</span>
              </div>
              
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{profile.country}</span>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <p className="text-xs text-blue-600 text-center">
                🔒 Ce QR code est sécurisé et unique à votre compte SendFlow
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QRCode;
