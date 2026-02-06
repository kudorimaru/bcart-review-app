# B-CART レビューアプリ

## アプリ概要

商品レビュー機能をB-CARTショップに追加するアプリです。お客様からのレビュー投稿、管理者による承認管理、商品ページへのレビュー表示が可能です。

## 主な機能

### 1. レビュー投稿機能
- 星評価（1〜5）
- テキストコメント
- 投稿者名の入力
- スパム防止の承認制

### 2. レビュー管理画面
- 管理者ログイン/新規登録
- レビュー一覧表示
- ステータス別フィルター（承認待ち/承認済み/却下）
- 承認/却下/削除操作
- リアルタイム統計表示

### 3. ウィジェット表示
- 商品ページに埋め込み可能
- 承認済みレビューのみ表示
- 平均評価の自動計算
- レスポンシブデザイン対応

## 導入方法

### STEP 1: アカウント登録
1. 管理画面（https://kudorimaru.github.io/bcart-review-app/admin/）にアクセス
2. 「新規登録」をクリック
3. ショップ名、B-CARTショップID、メールアドレス、パスワードを入力
4. 登録完了

### STEP 2: ウィジェット設置
管理画面に表示される埋め込みコードを商品ページのHTMLに追加します。

```html
<div id="bcart-reviews"
     data-shop-id="YOUR_BCART_SHOP_ID"
     data-product-id="PRODUCT_ID">
</div>
<script src="https://kudorimaru.github.io/bcart-review-app/widget/bcart-review.js"></script>
```

### STEP 3: レビュー管理
1. 管理画面にログイン
2. 投稿されたレビューを確認
3. 適切なレビューを「承認」、不適切なものを「却下」

## 料金プラン

| プラン | 月額 | 機能 |
|--------|------|------|
| Free | 無料 | 基本機能、月100件まで |
| Pro | 980円 | 無制限、カスタマイズ、優先サポート |

## 技術仕様

- **バックエンド**: Supabase (PostgreSQL)
- **認証**: Supabase Auth
- **フロントエンド**: Vanilla JavaScript
- **ホスティング**: GitHub Pages

## サポート

- メール: support@craval.jp
- ドキュメント: https://github.com/kudorimaru/bcart-review-app

## 更新履歴

### v1.0.0 (2026-02-06)
- 初回リリース
- レビュー投稿/表示機能
- 管理画面
- ウィジェット

---

開発: 株式会社Craval
