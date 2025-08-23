
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Send, Scan, QrCode, CreditCard, Receipt, Bell, User, Settings } from "lucide-react";
import RechargeAccountButton from "@/components/dashboard/RechargeAccountButton";

const ActionButtons = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const isAgent = profile?.role === 'agent';

  const primaryActions = [
    {
      icon: Send,
      label: "Transférer",
      path: "/transfer",
      color: "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700",
      description: "Envoyer de l'argent"
    },
    {
      icon: Scan,
      label: "Scanner QR",
      path: "/qr-payment",
      color: "bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700",
      description: "Payer avec QR"
    },
    {
      icon: QrCode,
      label: "Mon QR Code",
      path: "/qr-code",
      color: "bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700",
      description: "Partager mon code"
    },
    {
      icon: CreditCard,
      label: isAgent ? "Services Agent" : "Épargnes",
      path: isAgent ? "/agent-services" : "/savings",
      color: "bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700",
      description: isAgent ? "Services d'agent" : "Gérer mes épargnes"
    },
  ];

  const secondaryActions = [
    {
      icon: Receipt,
      label: "Historique",
      path: "/transactions",
      color: "bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700",
      description: "Mes transactions"
    },
    {
      icon: CreditCard,
      label: "Factures",
      path: "/bill-payments",
      color: "bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700",
      description: "Payer mes factures"
    },
    {
      icon: User,
      label: "Profil",
      path: "/verify-identity",
      color: "bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700",
      description: "Mon compte"
    },
    {
      icon: Settings,
      label: "Paramètres",
      path: "/change-password",
      color: "bg-gradient-to-r from-gray-500 to-slate-600 hover:from-gray-600 hover:to-slate-700",
      description: "Configuration"
    },
  ];

  return (
    <div className="space-y-6">
      {/* Bouton Recharger mon compte - en évidence */}
      <div className="mb-6">
        <RechargeAccountButton 
          fullWidth 
          size="lg" 
          className="h-20 text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-xl rounded-2xl"
        />
      </div>

      {/* Actions principales - encore plus grandes */}
      <div className="grid grid-cols-2 gap-4">
        {primaryActions.map((action, index) => {
          const IconComponent = action.icon;
          return (
            <button
              key={index}
              onClick={() => navigate(action.path)}
              className={`
                min-h-[160px] w-full flex flex-col items-center justify-center gap-4 
                rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 
                transform hover:scale-105 active:scale-95 ${action.color} 
                text-white border-0 p-6
              `}
              style={{ height: '160px' }}
            >
              <div className="p-4 bg-white/20 rounded-xl backdrop-blur-sm">
                <IconComponent className="w-12 h-12 text-white" />
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-white leading-tight">{action.label}</div>
                <div className="text-sm text-white/80 mt-1">{action.description}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Actions secondaires - également agrandies */}
      <div className="grid grid-cols-2 gap-4">
        {secondaryActions.map((action, index) => {
          const IconComponent = action.icon;
          return (
            <button
              key={index}
              onClick={() => navigate(action.path)}
              className={`
                min-h-[120px] w-full flex flex-col items-center justify-center gap-3 
                rounded-xl shadow-md hover:shadow-lg transition-all duration-300 
                transform hover:scale-105 active:scale-95 ${action.color} 
                text-white border-0 p-4
              `}
              style={{ height: '120px' }}
            >
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <IconComponent className="w-8 h-8 text-white" />
              </div>
              <div className="text-center">
                <div className="text-base font-semibold text-white leading-tight">{action.label}</div>
                <div className="text-xs text-white/80 mt-1">{action.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ActionButtons;
