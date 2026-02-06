-- B-CART Review App - Initial Schema
-- Created: 2026-02-06

-- ============================================
-- 1. Shops Table (ショップ管理)
-- ============================================
CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_name TEXT NOT NULL,
  bcart_shop_id TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_shops_user_id ON shops(user_id);
CREATE INDEX IF NOT EXISTS idx_shops_bcart_shop_id ON shops(bcart_shop_id);

-- ============================================
-- 2. Reviews Table (レビュー管理)
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  author_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_reviews_shop_id ON reviews(shop_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_shop_product ON reviews(shop_id, product_id);

-- ============================================
-- 3. Row Level Security (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Shops policies
CREATE POLICY "Users can view own shops"
  ON shops FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shops"
  ON shops FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shops"
  ON shops FOR UPDATE
  USING (auth.uid() = user_id);

-- Reviews policies (for shop owners)
CREATE POLICY "Shop owners can view own reviews"
  ON reviews FOR SELECT
  USING (
    shop_id IN (SELECT id FROM shops WHERE user_id = auth.uid())
  );

CREATE POLICY "Shop owners can update own reviews"
  ON reviews FOR UPDATE
  USING (
    shop_id IN (SELECT id FROM shops WHERE user_id = auth.uid())
  );

CREATE POLICY "Shop owners can delete own reviews"
  ON reviews FOR DELETE
  USING (
    shop_id IN (SELECT id FROM shops WHERE user_id = auth.uid())
  );

-- Reviews policies (for public widget - using bcart_shop_id)
CREATE POLICY "Public can read approved reviews by bcart_shop_id"
  ON reviews FOR SELECT
  USING (
    status = 'approved'
    AND shop_id IN (SELECT id FROM shops)
  );

CREATE POLICY "Public can insert pending reviews"
  ON reviews FOR INSERT
  WITH CHECK (status = 'pending');

-- ============================================
-- 4. Functions
-- ============================================

-- Function to get shop_id from bcart_shop_id
CREATE OR REPLACE FUNCTION get_shop_id_by_bcart_id(p_bcart_shop_id TEXT)
RETURNS UUID AS $$
  SELECT id FROM shops WHERE bcart_shop_id = p_bcart_shop_id LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_shops_updated_at
  BEFORE UPDATE ON shops
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
