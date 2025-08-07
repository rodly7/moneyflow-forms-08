-- Vérifier et créer les triggers pour les notifications automatiques

-- Trigger pour notifier lors de la complétion d'un dépôt (recharge)
DROP TRIGGER IF EXISTS trigger_notify_deposit_completed ON recharges;
CREATE TRIGGER trigger_notify_deposit_completed
    AFTER UPDATE ON recharges
    FOR EACH ROW
    EXECUTE FUNCTION notify_deposit_completed();

-- Trigger pour notifier lors de la réception d'argent (transfert)
DROP TRIGGER IF EXISTS trigger_notify_money_received ON transfers;
CREATE TRIGGER trigger_notify_money_received
    AFTER INSERT OR UPDATE ON transfers
    FOR EACH ROW
    EXECUTE FUNCTION notify_money_received();

-- Trigger pour notifier lors de la création d'une demande de retrait
DROP TRIGGER IF EXISTS trigger_notify_withdrawal_created ON withdrawal_requests;
CREATE TRIGGER trigger_notify_withdrawal_created
    AFTER INSERT ON withdrawal_requests
    FOR EACH ROW
    EXECUTE FUNCTION notify_withdrawal_created();