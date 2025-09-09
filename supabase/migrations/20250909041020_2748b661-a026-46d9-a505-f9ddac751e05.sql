-- Crédit simple sans changer le statut
UPDATE profiles 
SET balance = balance + 200
WHERE id IN ('1d92a1e7-9528-4cef-b6be-910b63eed648', '7d56ac43-b926-48ba-906d-4b9f46dacb4e');