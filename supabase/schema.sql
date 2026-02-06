-- ============================================
-- B-CART レビューアプリ - Supabase スキーマ
-- ============================================
-- Supabase SQL Editor で実行してください

-- 1. reviewsテーブル作成
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  author_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. インデックス作成（検索高速化）
CREATE INDEX IF NOT EXISTS idx_reviews_shop_product ON reviews(shop_id, product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);

-- 3. updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_updated_at ON reviews;
CREATE TRIGGER trigger_update_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 4. Row Level Security (RLS) 有効化
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 5. RLSポリシー設定

-- 誰でも承認済みレビューを閲覧可能
CREATE POLICY "Public can read approved reviews"
  ON reviews
  FOR SELECT
  USING (status = 'approved');

-- 誰でもレビューを投稿可能（pendingステータスで作成）
CREATE POLICY "Anyone can insert reviews"
  ON reviews
  FOR INSERT
  WITH CHECK (status = 'pending');

-- サービスロールのみ全操作可能（管理用）
CREATE POLICY "Service role has full access"
  ON reviews
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- 管理用ビュー（Supabaseダッシュボードで確認しやすく）
-- ============================================

-- 承認待ちレビュー一覧
CREATE OR REPLACE VIEW pending_reviews AS
SELECT
  id,
  shop_id,
  product_id,
  rating,
  comment,
  author_name,
  created_at
FROM reviews
WHERE status = 'pending'
ORDER BY created_at DESC;

-- ショップ別レビュー統計
CREATE OR REPLACE VIEW shop_stats AS
SELECT
  shop_id,
  COUNT(*) FILTER (WHERE status = 'approved') AS approved_count,
  COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
  ROUND(AVG(rating) FILTER (WHERE status = 'approved'), 1) AS avg_rating
FROM reviews
GROUP BY shop_id;
