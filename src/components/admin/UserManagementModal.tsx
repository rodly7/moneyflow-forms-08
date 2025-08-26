import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Wallet, Activity, Settings, Phone, Mail, MapPin, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils/currency";

interface UserData {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  balance: number;
  country: string;
  role: string;
  created_at: string;
  last_login: string;
  is_active: boolean;
}

interface UserManagementModalProps {
  open: boolean;
  onClose: () => void;
  user: UserData | null;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({ open, onClose, user }) => {
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [balance, setBalance] = useState(0);
  const [role, setRole] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name);
      setEmail(user.email);
      setPhone(user.phone);
      setBalance(user.balance);
      setRole(user.role);
      setIsActive(user.is_active);
    }
  }, [user]);

  const handleSaveChanges = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          email: email,
          phone: phone,
          balance: balance,
          role: role,
          is_active: isActive,
        })
        .eq('id', user.id);

      if (error) {
        console.error("Error updating user:", error);
        toast({
          title: "Error",
          description: "Failed to update user information.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "User information updated successfully.",
      });
      onClose();
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-6 h-6 mr-2" />
            Gestion de l'utilisateur
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="account" className="space-y-4">
          <TabsList>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="w-4 h-4 mr-1" />
              Compte
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="w-4 h-4 mr-1" />
              Activité
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4 mr-1" />
              Paramètres
            </TabsTrigger>
          </TabsList>
          <TabsContent value="account" className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Nom complet</Label>
                <Input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="balance">Solde</Label>
                <Input
                  type="number"
                  id="balance"
                  value={balance}
                  onChange={(e) => setBalance(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="role">Rôle</Label>
                <Input
                  type="text"
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="isActive">Actif</Label>
                <select
                  id="isActive"
                  className="w-full border rounded-md py-2 px-3"
                  value={isActive ? 'true' : 'false'}
                  onChange={(e) => setIsActive(e.target.value === 'true')}
                >
                  <option value="true">Oui</option>
                  <option value="false">Non</option>
                </select>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="activity" className="space-y-2">
            <ScrollArea className="h-[300px] w-full">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Date de création:
                  </span>
                  <span>{new Date(user.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Dernière connexion:
                  </span>
                  <span>{new Date(user.last_login).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Solde actuel:
                  </span>
                  <span>{formatCurrency(user.balance, "XAF")}</span>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="settings" className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Téléphone:
                </span>
                <span>{user.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Email:
                </span>
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Pays:
                </span>
                <span>{user.country}</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleSaveChanges}
            className="ml-2"
            disabled={isLoading}
          >
            {isLoading ? "Enregistrement..." : "Enregistrer les modifications"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
