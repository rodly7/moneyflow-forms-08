-- Créer le trigger pour activer automatiquement le parrainage
DROP TRIGGER IF EXISTS trigger_auto_activate_referral ON recharges;

CREATE TRIGGER trigger_auto_activate_referral
  AFTER INSERT OR UPDATE ON recharges
  FOR EACH ROW
  EXECUTE FUNCTION auto_activate_referral_on_recharge();