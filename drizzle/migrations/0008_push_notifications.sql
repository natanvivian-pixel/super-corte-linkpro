CREATE OR REPLACE FUNCTION public.is_barber_link_admin()
 RETURNS boolean LANGUAGE sql STABLE SET search_path TO ''
AS $$
  SELECT lower(coalesce(auth.jwt() ->> 'email', '')) IN (
    'natanvivian39@gmail.com','douglasmachadodigao@gmail.com','juniorjosias2018@gmail.com');
$$;
CREATE TABLE public.push_tokens (
  token text PRIMARY KEY,
  user_id uuid NOT NULL,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_tokens TO authenticated;
GRANT ALL ON public.push_tokens TO service_role;
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY push_own ON public.push_tokens FOR ALL TO authenticated
  USING (user_id = auth.uid() AND public.is_barber_link_admin())
  WITH CHECK (user_id = auth.uid() AND public.is_barber_link_admin() AND lower(email) = lower(auth.jwt() ->> 'email'));