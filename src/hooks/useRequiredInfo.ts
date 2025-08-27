
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export const useRequiredInfo = () => {
  const { profile, user } = useAuth();
  const [showRequiredInfoModal, setShowRequiredInfoModal] = useState(false);

  useEffect(() => {
    if (profile && user) {
      // Vérifier si les informations obligatoires sont manquantes
      const missingBirthDate = !profile.birth_date;
      const missingIdCard = !profile.id_card_photo_url;
      
      if (missingBirthDate || missingIdCard) {
        setShowRequiredInfoModal(true);
      }
    }
  }, [profile, user]);

  const handleComplete = () => {
    setShowRequiredInfoModal(false);
  };

  return {
    showRequiredInfoModal,
    handleComplete
  };
};
