import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface SimplePWAQRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (userData: { userId: string; fullName: string; phone: string }) => void;
  title?: string;
  variant?: 'default' | 'payment';
  onMyCard?: () => void;
}

const SimplePWAQRScanner = ({ isOpen, onClose, onScanSuccess, title = "Scanner QR", variant = 'default', onMyCard }: SimplePWAQRScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualData, setManualData] = useState({
    userId: '',
    fullName: '',
    phone: ''
  });

  const handleSubmit = () => {
    if (!manualData.userId || !manualData.fullName || !manualData.phone) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    onScanSuccess({
      userId: manualData.userId,
      fullName: manualData.fullName,
      phone: manualData.phone
    });
    
    handleClose();
  };

  const startScanning = async () => {
    try {
      setError('');
      setIsScanning(true);
      
      const scanner = new Html5Qrcode("qr-reader-pwa");
      scannerRef.current = scanner;
      
      // Configuration ultra-simple et efficace
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 300, height: 300 },
          aspectRatio: 1.0,
          disableFlip: false
        },
        (decodedText) => {
          console.log('✅ QR scanné:', decodedText);
          
          // Arrêter immédiatement le scanner pour éviter les scans multiples
          stopScanning();
          
          try {
            // Tentative de parsing JSON d'abord
            const userData = JSON.parse(decodedText);
            
            // Vérification des champs requis
            if (userData && typeof userData === 'object' && 
                userData.userId && userData.fullName && userData.phone) {
              onScanSuccess(userData);
            } else {
              // JSON incomplet - utiliser comme fallback
              onScanSuccess({
                userId: 'manual-' + Date.now(),
                fullName: userData.fullName || userData.name || 'Utilisateur',
                phone: userData.phone || decodedText
              });
            }
          } catch {
            // Pas du JSON - traiter comme numéro de téléphone ou ID
            onScanSuccess({
              userId: 'scan-' + Date.now(),
              fullName: 'Utilisateur scanné',
              phone: decodedText
            });
          }
          
          handleClose();
        },
        () => {
          // Pas d'erreur logging pour éviter le spam
        }
      );
      
    } catch (err: any) {
      console.error('Erreur scanner:', err);
      setError('Impossible d\'accéder à la caméra');
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        // Vérifier si le scanner est en cours d'exécution avant d'essayer de l'arrêter
        const state = scannerRef.current.getState();
        if (state === 2) { // SCANNING state
          await scannerRef.current.stop();
        }
        scannerRef.current = null;
      } catch (err) {
        // Ignorer les erreurs de nettoyage silencieusement
        console.log('Scanner déjà arrêté');
      }
    }
    setIsScanning(false);
  };

  const handleClose = async () => {
    await stopScanning();
    setManualData({ userId: '', fullName: '', phone: '' });
    setShowManualInput(false);
    setError('');
    onClose();
  };

  const simulateQRScan = () => {
    const testData = {
      userId: 'dda64997-5dbd-4a5f-b049-cd68ed31fe40',
      fullName: 'Laureat NGANGOUE',
      phone: '+242065224790'
    };
    
    onScanSuccess(testData);
    handleClose();
  };

  useEffect(() => {
    console.log('🔍 SimplePWAQRScanner useEffect:', { isOpen, showManualInput, isScanning });
    
    if (isOpen && !showManualInput) {
      console.log('📱 Lancement du scanner automatiquement...');
      // Délai pour laisser le DOM se mettre à jour
      setTimeout(() => {
        startScanning();
      }, 100);
    }
    
    return () => {
      if (isOpen) {
        console.log('🛑 Nettoyage du scanner...');
        stopScanning();
      }
    };
  }, [isOpen, showManualInput]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-[9999] overflow-hidden touch-none" style={{ height: '100dvh' }}>
      {!showManualInput ? (
        variant === 'payment' ? (
          // Mode paiement - Interface iOS minimaliste sombre
          <div className="w-full h-full relative flex flex-col bg-black">
            {/* Header minimaliste avec bouton fermer à gauche et flash à droite */}
            <div className="absolute top-0 left-0 right-0 z-20 pt-[env(safe-area-inset-top)] px-6 py-4">
              <div className="flex justify-between items-center">
                {/* Bouton fermer */}
                <button 
                  onClick={handleClose}
                  className="w-10 h-10 flex items-center justify-center text-white/90 rounded-full"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
                
                {/* Bouton flash désactivé */}
                <button className="w-10 h-10 flex items-center justify-center text-white/50 rounded-full">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6.09 13.28a5 5 0 0 1 0-2.56L5 9.5a9 9 0 0 0 0 5l1.09-1.22Z"/>
                    <path d="M12 2a3 3 0 0 0-3 3v4a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                    <path d="M17.91 10.72a5 5 0 0 1 0 2.56L19 14.5a9 9 0 0 0 0-5l-1.09 1.22Z"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Zone caméra visible - la caméra couvre tout l'écran */}
            <div 
              id="qr-reader-pwa" 
              className="absolute inset-0 w-full h-full object-cover"
            />
            
            {/* Overlay avec carré semi-transparent centré plus haut */}
            <div className="absolute inset-0 flex items-center justify-center" style={{ paddingTop: '20vh', paddingBottom: '30vh' }}>
              {/* Fond sombre avec découpe claire pour le scanner */}
              <div className="absolute inset-0" style={{
                background: `
                  radial-gradient(400px at center, transparent 200px, rgba(0,0,0,0.8) 240px)
                `
              }}></div>
              
              {/* Cadre de scan transparent avec vision claire agrandi davantage */}
              <div className="relative z-10">
                <div className="w-80 h-80 border-2 border-white/70 rounded-3xl bg-transparent relative overflow-hidden">
                  {/* Coins du cadre avec style iOS */}
                  <div className="absolute top-3 left-3 w-8 h-8 border-l-4 border-t-4 border-white rounded-tl-xl"></div>
                  <div className="absolute top-3 right-3 w-8 h-8 border-r-4 border-t-4 border-white rounded-tr-xl"></div>
                  <div className="absolute bottom-3 left-3 w-8 h-8 border-l-4 border-b-4 border-white rounded-bl-xl"></div>
                  <div className="absolute bottom-3 right-3 w-8 h-8 border-r-4 border-b-4 border-white rounded-br-xl"></div>
                  
                  {/* Zone de délimitation du scanner - mieux centrée dans le cadre */}
                  <div className="absolute inset-6 border-2 border-white/50 rounded-2xl bg-white/5"></div>
                  <div className="absolute inset-8 border border-white/30 rounded-xl"></div>
                  
                  {/* Ligne de scan animée plus rapide dans la zone de délimitation */}
                  <div className="absolute inset-8 flex items-center justify-center">
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-white to-transparent animate-[pulse_1s_ease-in-out_infinite]"></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Message en dessous du cadre */}
            <div className="absolute bottom-0 left-0 right-0 pb-[env(safe-area-inset-bottom)]">
              <div className="px-6 pb-4">
                <p className="text-white text-center text-lg font-medium mb-8">
                  Scanner un Code QR pour payer ou envoyer
                </p>
                
                {/* Boutons côte à côte - style iOS */}
                <div className="flex gap-4 px-4">
                  <button
                    onClick={simulateQRScan}
                    className="flex-1 bg-white/20 backdrop-blur-sm text-white py-4 px-6 rounded-2xl font-medium text-base shadow-lg border border-white/10 hover:bg-white/30 transition-all duration-200"
                  >
                    Scanner un code
                  </button>
                  <button
                    onClick={onMyCard}
                    className="flex-1 bg-white text-black py-4 px-6 rounded-2xl font-medium text-base shadow-lg hover:bg-white/90 transition-all duration-200"
                  >
                    Ma carte
                  </button>
                </div>
              </div>
            </div>
            
            {/* Message d'erreur */}
            {error && (
              <div className="absolute top-1/2 left-4 right-4 transform -translate-y-1/2 bg-red-500/95 backdrop-blur text-white p-4 rounded-2xl text-center shadow-xl">
                <p className="font-medium">{error}</p>
              </div>
            )}
          </div>
        ) : (
          // Mode par défaut - Design existant
          <div className="w-full h-full relative flex flex-col">
            {/* Header avec boutons dans les coins - Responsive pour mobile */}
            <div className="absolute top-0 left-0 right-0 z-20 p-4 md:p-6">
              <div className="flex justify-between items-center">
                <button 
                  onClick={handleClose}
                  className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center text-white bg-black/40 backdrop-blur-sm rounded-full shadow-lg"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
                
                <button 
                  onClick={() => setShowManualInput(true)}
                  className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center text-white bg-black/40 backdrop-blur-sm rounded-full shadow-lg"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="3" height="8" x="13" y="2" rx="1.5"></rect>
                    <path d="M19 8.5V10h1.5A1.5 1.5 0 1 0 19 8.5"></path>
                    <rect width="3" height="8" x="8" y="14" rx="1.5"></rect>
                    <path d="M5 15.5V14H3.5A1.5 1.5 0 1 0 5 15.5"></path>
                    <rect width="8" height="3" x="14" y="13" rx="1.5"></rect>
                    <path d="M15.5 19H14v1.5a1.5 1.5 0 1 0 1.5-1.5"></path>
                    <rect width="8" height="3" x="2" y="8" rx="1.5"></rect>
                    <path d="M8.5 5H10V3.5A1.5 1.5 0 1 0 8.5 5"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Zone caméra avec cadre mobile responsive */}
            <div className="flex-1 relative">
              <div 
                id="qr-reader-pwa" 
                className="w-full h-full object-cover"
              />
              
              {/* Cadre de scan responsive avec design mobile propre */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative">
                  {/* Cadre principal - taille responsive */}
                  <div className="w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 border-4 border-white rounded-3xl bg-transparent shadow-2xl relative">
                    {/* Coins du cadre avec animation */}
                    <div className="absolute -top-1 -left-1 w-8 h-8 border-l-4 border-t-4 border-white rounded-tl-2xl"></div>
                    <div className="absolute -top-1 -right-1 w-8 h-8 border-r-4 border-t-4 border-white rounded-tr-2xl"></div>
                    <div className="absolute -bottom-1 -left-1 w-8 h-8 border-l-4 border-b-4 border-white rounded-bl-2xl"></div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 border-r-4 border-b-4 border-white rounded-br-2xl"></div>
                    
                    {/* Ligne de scan animée */}
                    <div className="absolute inset-4 overflow-hidden rounded-2xl">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent animate-pulse"></div>
                    </div>
                  </div>
                  
                  {/* Indicateur de focus */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white rounded-full bg-white/20 animate-ping"></div>
                  </div>
                </div>
              </div>
              
              {/* Overlay avec effet mobile - cadre du téléphone */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="w-full h-full" style={{
                  background: `
                    radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.4) 45%, rgba(0,0,0,0.9) 75%)
                  `
                }}></div>
              </div>
              
              {/* Zone safe area mobile - respect du notch */}
              <div className="absolute top-0 left-0 right-0 h-[env(safe-area-inset-top)] bg-black/20 backdrop-blur-sm"></div>
            </div>
            
            {/* Message d'erreur responsive */}
            {error && (
              <div className="absolute top-1/2 left-4 right-4 bg-red-500/95 backdrop-blur text-white p-4 rounded-2xl text-center shadow-xl border border-red-400/30">
                <p className="font-medium">{error}</p>
              </div>
            )}
            
            {/* Footer avec boutons - Design mobile propre */}
            <div className="absolute bottom-0 left-0 right-0 pb-[env(safe-area-inset-bottom)] bg-gradient-to-t from-black via-black/80 to-transparent">
              <div className="px-6 py-6 md:px-8 md:py-8">
                <div className="text-center mb-6">
                  <h3 className="text-white text-lg md:text-xl font-semibold mb-2">Scanner un Code QR</h3>
                  <p className="text-white/80 text-sm md:text-base">Positionnez le QR code dans le cadre pour scanner</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={simulateQRScan}
                    className="flex-1 bg-white/95 backdrop-blur text-black py-4 px-6 rounded-2xl font-semibold text-base md:text-lg shadow-xl hover:bg-white transition-all duration-200 min-h-[56px] flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h2M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z"></path>
                    </svg>
                    Scanner un code
                  </button>
                  <button
                    onClick={() => setShowManualInput(true)}
                    className="flex-1 bg-white/20 backdrop-blur border border-white/30 text-white py-4 px-6 rounded-2xl font-semibold text-base md:text-lg shadow-xl hover:bg-white/30 transition-all duration-200 min-h-[56px] flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                    Saisie manuelle
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      ) : (
        // Mode saisie manuelle
        <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-auto shadow-2xl border-2 border-blue-200 m-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">{title}</h2>
            <button 
              onClick={() => setShowManualInput(false)}
              className="text-blue-500 text-sm"
            >
              Scanner QR
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nom complet</label>
              <input
                type="text"
                value={manualData.fullName}
                onChange={(e) => setManualData(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="Nom du destinataire"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Téléphone</label>
              <input
                type="text"
                value={manualData.phone}
                onChange={(e) => setManualData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+221..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">ID Utilisateur</label>
              <input
                type="text"
                value={manualData.userId}
                onChange={(e) => setManualData(prev => ({ ...prev, userId: e.target.value }))}
                placeholder="ID du destinataire"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-600 mb-2">💡 Pour tester rapidement :</p>
              <button
                onClick={simulateQRScan}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 text-sm"
              >
                Utiliser données de test
              </button>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={handleSubmit}
                className="flex-1 bg-green-500 text-white py-3 px-4 rounded-md hover:bg-green-600 font-medium"
              >
                Confirmer
              </button>
              <button
                onClick={handleClose}
                className="flex-1 border border-gray-300 py-3 px-4 rounded-md hover:bg-gray-50 font-medium"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimplePWAQRScanner;