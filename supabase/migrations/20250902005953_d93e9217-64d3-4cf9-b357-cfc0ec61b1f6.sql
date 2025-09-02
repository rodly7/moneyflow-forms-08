-- Supprimer les données de test créées précédemment
DELETE FROM merchant_payments 
WHERE merchant_id = 'ed8f7137-a629-461f-a064-0c0e392efbe8' 
AND business_name IN ('Boutique Test', 'Client Premium', 'Entreprise ABC');