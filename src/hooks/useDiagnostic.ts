
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { getUserTransactionHistory, findUserByPhone } from "@/services/diagnosticService";

export const useDiagnostic = () => {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);

  const analyzeUserByPhone = async (phoneNumber: string) => {
    setIsAnalyzing(true);
    try {
      console.log("🔎 Début de l'analyse pour le numéro:", phoneNumber);
      
      const user = await findUserByPhone(phoneNumber);
      
      if (user) {
        const result = await getUserTransactionHistory(user.id);
        setDiagnosticResult(result);
        
        if (result) {
          const { actualBalance, theoreticalBalance, difference } = result;
          
          if (Math.abs(difference) > 0.01) { // Différence significative
            toast({
              title: "⚠️ Incohérence détectée",
              description: `Solde BD: ${actualBalance} FCFA vs Théorique: ${theoreticalBalance} FCFA (Diff: ${difference} FCFA)`,
              variant: "destructive"
            });
          } else {
            toast({
              title: "✅ Solde cohérent",
              description: `Le solde de ${user.full_name} est correct: ${actualBalance} FCFA`,
            });
          }
        }
      } else {
        toast({
          title: "Utilisateur non trouvé",
          description: "Aucun utilisateur trouvé avec ce numéro de téléphone",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erreur lors de l'analyse:", error);
      toast({
        title: "Erreur d'analyse",
        description: "Une erreur s'est produite lors de l'analyse",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeUserById = async (userId: string) => {
    setIsAnalyzing(true);
    try {
      const result = await getUserTransactionHistory(userId);
      setDiagnosticResult(result);
      
      if (result) {
        const { actualBalance, theoreticalBalance, difference } = result;
        
        if (Math.abs(difference) > 0.01) {
          toast({
            title: "⚠️ Incohérence détectée",
            description: `Solde BD: ${actualBalance} FCFA vs Théorique: ${theoreticalBalance} FCFA`,
            variant: "destructive"
          });
        } else {
          toast({
            title: "✅ Solde cohérent",
            description: `Le solde est correct: ${actualBalance} FCFA`,
          });
        }
      }
    } catch (error) {
      console.error("Erreur lors de l'analyse:", error);
      toast({
        title: "Erreur d'analyse",
        description: "Une erreur s'est produite lors de l'analyse",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    analyzeUserByPhone,
    analyzeUserById,
    isAnalyzing,
    diagnosticResult
  };
};
