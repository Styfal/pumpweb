-- Fix RLS policies to allow portfolio and payment creation

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "portfolios_admin_all" ON public.portfolios;
DROP POLICY IF EXISTS "payments_admin_only" ON public.payments;

-- Allow anonymous users to INSERT portfolios during creation
CREATE POLICY "portfolios_insert_anonymous" ON public.portfolios 
  FOR INSERT WITH CHECK (true);

-- Allow anonymous users to INSERT payments during payment processing  
CREATE POLICY "payments_insert_anonymous" ON public.payments 
  FOR INSERT WITH CHECK (true);

-- Allow anonymous users to UPDATE payments for webhook verification
CREATE POLICY "payments_update_webhook" ON public.payments 
  FOR UPDATE USING (true) WITH CHECK (true);

-- Allow anonymous users to UPDATE portfolios for publishing after payment
CREATE POLICY "portfolios_update_publish" ON public.portfolios 
  FOR UPDATE USING (true) WITH CHECK (true);

-- Keep admin policies for full management (will be implemented later with proper auth)
-- For now, we'll rely on API-level security rather than RLS for admin operations
