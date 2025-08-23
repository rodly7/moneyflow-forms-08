
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Send, ArrowDownLeft, ArrowUpRight, Receipt, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { RechargeAccountButton } from "./RechargeAccountButton";

export const ActionButtons = () => {
  const { profile } = useAuth();

  // Vérifier si l'utilisateur est un agent
  const isAgent = profile?.role === 'agent';

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Bouton Recharger mon compte - seulement pour les utilisateurs normaux */}
          {!isAgent && (
            <div className="col-span-full">
              <RechargeAccountButton />
            </div>
          )}

          <Button asChild className="h-16 flex flex-col gap-2">
            <Link to="/transfer">
              <Send className="w-6 h-6" />
              <span>Envoyer</span>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-16 flex flex-col gap-2">
            <Link to="/deposit">
              <ArrowDownLeft className="w-6 h-6" />
              <span>Déposer</span>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-16 flex flex-col gap-2">
            <Link to="/withdrawal">
              <ArrowUpRight className="w-6 h-6" />
              <span>Retirer</span>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-16 flex flex-col gap-2">
            <Link to="/receipts">
              <Receipt className="w-6 h-6" />
              <span>Reçus</span>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
