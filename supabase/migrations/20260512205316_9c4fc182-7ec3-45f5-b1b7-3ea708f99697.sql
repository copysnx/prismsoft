
-- 1. PHONE VERIFICATIONS
DROP POLICY IF EXISTS "Users can view own verifications" ON public.phone_verifications;

-- 2. COUPONS
DROP POLICY IF EXISTS "Authenticated users can view active coupons" ON public.coupons;

CREATE OR REPLACE FUNCTION public.get_active_coupon_by_code(_code text)
RETURNS public.coupons
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.coupons
  WHERE upper(code) = upper(_code)
    AND is_active = true
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.get_active_coupon_by_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_active_coupon_by_code(text) TO anon, authenticated;

-- 3. AUDIT LOGS
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.audit_logs;

-- 4. ORDERS
CREATE POLICY "Users can create their own orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 5. USER ROLES (correct AS RESTRICTIVE placement)
CREATE POLICY "Only admins can modify user_roles"
ON public.user_roles
AS RESTRICTIVE
FOR ALL
TO authenticated, anon
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 6. REALTIME
ALTER PUBLICATION supabase_realtime DROP TABLE public.orders;
ALTER PUBLICATION supabase_realtime DROP TABLE public.delivered_keys;
ALTER PUBLICATION supabase_realtime DROP TABLE public.product_keys;
ALTER PUBLICATION supabase_realtime DROP TABLE public.profiles;
ALTER PUBLICATION supabase_realtime DROP TABLE public.user_roles;

-- 7. STORAGE: avatars
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

CREATE POLICY "Users can list their own avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 8. SECURITY DEFINER trigger helpers
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
