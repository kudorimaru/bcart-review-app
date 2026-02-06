-- ============================================
-- B-CART Review App - Public Read Policy for Shops
-- ============================================
-- Run this in Supabase SQL Editor to fix widget access issue
--
-- Problem: Widget cannot read shops table due to RLS
-- Solution: Add public read policy for shops table
-- ============================================

-- Drop existing policy if exists (to avoid conflict)
DROP POLICY IF EXISTS "Public can read shops for widget" ON shops;

-- Add public read policy for widget
-- This allows the widget to look up shop_id by bcart_shop_id
CREATE POLICY "Public can read shops for widget"
  ON shops FOR SELECT
  USING (true);

-- Verify the policy was created
SELECT * FROM pg_policies WHERE tablename = 'shops';
