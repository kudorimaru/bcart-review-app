# B-CART レビューアプリ セットアップガイド

## 概要

B-CARTショップに商品レビュー機能を追加するアプリです。

**構成:**
- Supabase（データベース + API）
- JavaScript ウィジェット（レビュー表示・投稿）
- B-CART script_tags API（ウィジェット埋め込み）

---

## STEP 1: Supabase セットアップ

### 1-1. アカウント作成

1. [Supabase](https://supabase.com/) にアクセス
2. 「Start your project」でアカウント作成（GitHub連携可）
3. 新規プロジェクトを作成
   - Project name: `bcart-review`（任意）
   - Database Password: 安全なパスワードを設定（控えておく）
   - Region: `Northeast Asia (Tokyo)` を選択

### 1-2. データベース作成

1. 左メニューから「SQL Editor」を開く
2. 「New query」をクリック
3. `supabase/schema.sql` の内容をコピー＆ペースト
4. 「Run」で実行

**確認方法:**
- 左メニュー「Table Editor」で `reviews` テーブルが作成されていればOK

### 1-3. API設定の取得

1. 左メニュー「Project Settings」→「API」
2. 以下の値をメモ:
   - **Project URL**: `https://xxxxxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1...`（長い文字列）

---

## STEP 2: ウィジェットのホスティング

### 方法A: Supabase Storage（推奨）

1. 左メニュー「Storage」→「New bucket」
2. バケット名: `widget`、Public: ON
3. `widget/bcart-review.js` をアップロード
4. ファイルをクリック → 「Get URL」でURLを取得

**URL例:** `https://xxx.supabase.co/storage/v1/object/public/widget/bcart-review.js`

### 方法B: 他のCDN/サーバー

- Cloudflare Pages
- Vercel
- 自社サーバー

※ HTTPSが必須です

---

## STEP 3: B-CART パートナー登録

### 3-1. パートナープログラム登録

1. [B-CART Developer](https://api.bcart.jp/) にアクセス
2. 「パートナー登録」から申請
3. 3営業日以内にデモ環境情報がメールで届く

### 3-2. 開発者アカウント作成

1. B-CART管理画面にログイン
2. 「各種設定」→「外部連携」→「Bカートアプリストア」
3. 「アカウント発行」を実行

### 3-3. OAuthクライアント作成

1. [B-CART Developer](https://api.bcart.jp/) にログイン
2. 「OAuthクライアント」→「新規作成」
3. 設定:
   - 名前: `レビューアプリ`
   - リダイレクトURI: `https://your-domain.com/callback`（後で設定可）
4. 発行された `client_id` と `client_secret` をメモ

---

## STEP 4: script_tags API でウィジェット登録

ショップにウィジェットを埋め込むには script_tags API を使用します。

### リクエスト例

```bash
curl -X POST https://api.bcart.jp/api/v1/script_tags \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "src": "https://xxx.supabase.co/storage/v1/object/public/widget/bcart-review.js",
    "display_scope": "product"
  }'
```

**パラメータ:**
- `src`: ウィジェットのURL
- `display_scope`: 表示ページ
  - `product`: 商品詳細ページ
  - `all`: 全ページ
  - `cart`: カートページ

---

## STEP 5: ウィジェット設定

各ショップにウィジェットを設置する際、HTMLに以下を追加:

```html
<!-- レビューウィジェット -->
<script
  src="https://xxx.supabase.co/storage/v1/object/public/widget/bcart-review.js"
  data-supabase-url="https://xxxxxxxx.supabase.co"
  data-supabase-anon-key="eyJhbGciOiJIUzI1..."
  data-shop-id="shop_12345">
</script>
<div id="bcart-review-widget"></div>
```

**属性説明:**
| 属性 | 必須 | 説明 |
|------|------|------|
| data-supabase-url | ○ | SupabaseのProject URL |
| data-supabase-anon-key | ○ | Supabaseのanon key |
| data-shop-id | ○ | ショップ識別子（任意の文字列でOK） |
| data-container-id | × | ウィジェットを表示するdivのID（デフォルト: bcart-review-widget） |

---

## STEP 6: レビュー管理

### 承認待ちレビューの確認

1. Supabaseダッシュボード → Table Editor → `reviews`
2. フィルタ: `status = pending`
3. 該当行の `status` を `approved` に変更

### ビューの活用

- `pending_reviews`: 承認待ち一覧
- `shop_stats`: ショップ別統計

---

## ファイル構成

```
review-app/
├── SETUP.md              # このファイル
├── supabase/
│   └── schema.sql        # DBスキーマ
└── widget/
    └── bcart-review.js   # レビューウィジェット
```

---

## トラブルシューティング

### レビューが表示されない

1. ブラウザのコンソールでエラー確認
2. `data-supabase-url` と `data-supabase-anon-key` が正しいか確認
3. Supabaseの RLS ポリシーが有効か確認

### 商品IDが検出できない

ウィジェットは以下の順序で商品IDを検出します:
1. URL パス: `/products/123` または `/product/123`
2. URL パラメータ: `?product_id=123` または `?id=123`
3. data属性: `<div data-product-id="123">`
4. meta tag: `<meta property="product:id" content="123">`

B-CARTのページ構造に合わせて検出ロジックを調整してください。

### CORS エラー

Supabase側の設定を確認:
- Project Settings → API → CORS で許可ドメインを追加

---

## 次のステップ（拡張案）

- [ ] 購入者確認（orders API連携）
- [ ] 画像投稿機能
- [ ] 管理ダッシュボード（独自UI）
- [ ] メール通知（新規レビュー時）
- [ ] スパム対策（reCAPTCHA等）

---

## 参考リンク

- [Supabase Docs](https://supabase.com/docs)
- [B-CART API ドキュメント](https://docs.api.bcart.jp/)
- [B-CART Developer](https://api.bcart.jp/)
