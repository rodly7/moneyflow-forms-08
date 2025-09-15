-- Create trigger to mirror completed transfers to merchant_payments when recipient is a merchant
CREATE OR REPLACE FUNCTION public.create_merchant_payment_from_transfer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  merchant_profile RECORD;
  merchant_uuid uuid;
  payer_uuid uuid;
  merchant_name text;
  payment_exists boolean;
BEGIN
  -- Only process completed transfers
  IF NEW.status IS DISTINCT FROM 'completed' THEN
    RETURN NEW;
  END IF;

  payer_uuid := NEW.sender_id;

  -- Try to resolve merchant by recipient_id
  IF NEW.recipient_id IS NOT NULL THEN
    SELECT id, full_name, role
      INTO merchant_profile
    FROM public.profiles
    WHERE id = NEW.recipient_id;

    IF merchant_profile.role = 'merchant' THEN
      merchant_uuid := merchant_profile.id;
      merchant_name := merchant_profile.full_name;
    END IF;
  END IF;

  -- If not found and phone is present, resolve by phone
  IF merchant_uuid IS NULL AND NEW.recipient_phone IS NOT NULL THEN
    SELECT id, full_name, role
      INTO merchant_profile
    FROM public.profiles
    WHERE phone = NEW.recipient_phone
    LIMIT 1;

    IF merchant_profile.role = 'merchant' THEN
      merchant_uuid := merchant_profile.id;
      merchant_name := merchant_profile.full_name;
    END IF;
  END IF;

  -- If recipient is not a merchant, exit
  IF merchant_uuid IS NULL THEN
    RETURN NEW;
  END IF;

  -- Avoid duplicates: check for a very recent similar merchant payment
  SELECT EXISTS (
    SELECT 1
    FROM public.merchant_payments mp
    WHERE mp.merchant_id = merchant_uuid::text
      AND mp.user_id = payer_uuid
      AND mp.amount = NEW.amount
      AND mp.created_at > (now() - interval '2 minutes')
  ) INTO payment_exists;

  IF payment_exists THEN
    RETURN NEW;
  END IF;

  -- Insert merchant payment record
  INSERT INTO public.merchant_payments (
    user_id,
    merchant_id,
    amount,
    business_name,
    description,
    currency,
    status
  ) VALUES (
    payer_uuid,
    merchant_uuid::text,
    NEW.amount,
    merchant_name,
    'Transfert client',
    COALESCE(NEW.currency, 'XAF'),
    'completed'
  );

  RETURN NEW;
END;
$$;

-- Create trigger on transfers insert
DROP TRIGGER IF EXISTS trg_create_merchant_payment_from_transfer ON public.transfers;
CREATE TRIGGER trg_create_merchant_payment_from_transfer
AFTER INSERT ON public.transfers
FOR EACH ROW
EXECUTE FUNCTION public.create_merchant_payment_from_transfer();