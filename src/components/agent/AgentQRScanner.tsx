
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { QrCode, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SimpleQRScanner from "@/components/shared/SimpleQRScanner";

interface AgentQRScannerProps {
  onScanSuccess: (userData: { userId: string; fullName: string; phone: string }) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const AgentQRScanner = ({ onScanSuccess, isOpen, onClose }: AgentQRScannerProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Scanner le QR Code du client
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Demandez au client de présenter son QR code depuis son profil pour une identification rapide.
          </p>
          <SimpleQRScanner
            isOpen={isOpen}
            onClose={onClose}
            onScanSuccess={onScanSuccess}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
