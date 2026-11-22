CREATE OR REPLACE FUNCTION public.is_barber_link_admin()
 RETURNS boolean LANGUAGE sql STABLE SET search_path TO ''
AS $function$
  SELECT lower(coalesce(auth.jwt() ->> 'email', '')) IN (
    'natanvivian39@gmail.com','douglasmachadodigao@gmail.com','juniorjosias2018@gmail.com','pedrooa2lite@gmail.com'
  );
$function$;