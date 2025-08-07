import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface SimpleQRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (userData: { userId: string; fullName: string; phone: string }) => void;
}

const SimpleQRScanner = ({ isOpen, onClose, onScanSuccess }: SimpleQRScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string>('');
  
  useEffect(() => {
    if (!isOpen) return;
    
    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;
        
        // Configuration pour forcer absolument la caméra arrière
        const cameraConfig = {
          facingMode: { exact: "environment" } // Force caméra arrière
        };
        
        await scanner.start(
          cameraConfig,
          { 
            fps: 30,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            disableFlip: false
          },
          (decodedText) => {
            try {
              const userData = JSON.parse(decodedText);
              if (userData.userId && userData.fullName && userData.phone) {
                onScanSuccess(userData);
                onClose();
              }
            } catch {
              onScanSuccess({
                userId: 'scan-' + Date.now(),
                fullName: decodedText.substring(0, 20),
                phone: decodedText
              });
              onClose();
            }
          },
          () => {} // errorCallback
        );
      } catch (err: any) {
        setError(err.message);
      }
    };
    
    startScanner();
    
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [isOpen, onScanSuccess, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'black',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <button 
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          fontSize: '20px',
          cursor: 'pointer',
          zIndex: 10000
        }}
      >
        ×
      </button>
      
      <div 
        id="qr-reader" 
        style={{ 
          width: '100%',
          height: '100%'
        }}
      />
      
      {error && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          right: '20px',
          backgroundColor: 'red',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default SimpleQRScanner;