
-- Ajouter la colonne birth_date à la table profiles
ALTER TABLE public.profiles 
ADD COLUMN birth_date DATE;

-- Mettre à jour la fonction de gestion des nouveaux utilisateurs pour inclure birth_date
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    phone, 
    country, 
    address, 
    role,
    birth_date
  )
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'country',
    new.raw_user_meta_data ->> 'address',
    COALESCE((new.raw_user_meta_data ->> 'role')::user_role, 'user'),
    CASE 
      WHEN new.raw_user_meta_data ->> 'birth_date' IS NOT NULL 
      THEN (new.raw_user_meta_data ->> 'birth_date')::DATE 
      ELSE NULL 
    END
  );
  RETURN new;
END;
$$;
