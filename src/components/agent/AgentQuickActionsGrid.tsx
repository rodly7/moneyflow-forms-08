
import { useNavigate } from "react-router-dom";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Users, 
  BarChart3,
  CreditCard,
  Smartphone,
  QrCode,
  FileText
} from "lucide-react";
import { AgentActionButton } from "./AgentActionButton";

export const AgentQuickActionsGrid = () => {
  const navigate = useNavigate();

  const primaryActions = [
    {
      title: "Retrait Client",
      description: "Effectuer un retrait",
      icon: ArrowUpRight,
      onClick: () => navigate("/agent-withdrawal-advanced"),
      variant: "primary" as const
    },
    {
      title: "Dépôt Client", 
      description: "Effectuer un dépôt",
      icon: ArrowDownLeft,
      onClick: () => navigate("/agent-deposit"),
      variant: "secondary" as const
    },
    {
      title: "Services Agent",
      description: "Gérer mes services",
      icon: Users,
      onClick: () => navigate("/agent-services"),
      variant: "primary" as const
    },
    {
      title: "Mes Rapports",
      description: "Voir performances",
      icon: BarChart3,
      onClick: () => navigate("/agent-performance-dashboard"),
      variant: "secondary" as const
    }
  ];

  const secondaryActions = [
    {
      title: "Recharge Mobile",
      description: "Crédits téléphone",
      icon: Smartphone,
      onClick: () => navigate("/mobile-recharge"),
      variant: "outline" as const
    },
    {
      title: "Paiement QR",
      description: "Scanner pour payer",
      icon: QrCode,
      onClick: () => navigate("/qr-payment"),
      variant: "outline" as const
    },
    {
      title: "Factures",
      description: "Paiement factures",
      icon: FileText,
      onClick: () => navigate("/bill-payments"),
      variant: "outline" as const
    },
    {
      title: "Cartes Prépayées",
      description: "Gestion cartes",
      icon: CreditCard,
      onClick: () => navigate("/prepaid-cards"),
      variant: "outline" as const
    }
  ];

  return (
    <div className="space-y-6">
      {/* Actions Principales */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Actions Principales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {primaryActions.map((action, index) => (
            <AgentActionButton
              key={index}
              title={action.title}
              description={action.description}
              icon={action.icon}
              onClick={action.onClick}
              variant={action.variant}
            />
          ))}
        </div>
      </div>

      {/* Actions Secondaires */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Services Additionnels</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {secondaryActions.map((action, index) => (
            <AgentActionButton
              key={index}
              title={action.title}
              description={action.description}
              icon={action.icon}
              onClick={action.onClick}
              variant={action.variant}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
