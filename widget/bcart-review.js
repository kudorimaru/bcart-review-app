/**
 * B-CART レビューウィジェット v2.0
 *
 * 使用方法:
 * <div id="bcart-reviews" data-shop-id="your-bcart-shop-id" data-product-id="PRODUCT_ID"></div>
 * <script src="https://your-domain.com/widget/bcart-review.js"></script>
 */
(function() {
  'use strict';

  // ============================================
  // Supabase設定（固定）
  // ============================================
  const SUPABASE_URL = 'https://qxnxyjssgsnbsfqjrfrc.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4bnh5anNzZ3NuYnNmcWpyZnJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMTcxNTksImV4cCI6MjA4NTg5MzE1OX0.krm-1spjrDf42V9pM6OxhcjnAhecoFZNLltFmXf-FiY';

  // ============================================
  // ウィジェット検出・設定
  // ============================================
  const container = document.getElementById('bcart-reviews');
  if (!container) {
    console.error('[BcartReview] コンテナ #bcart-reviews が見つかりません');
    return;
  }

  const bcartShopId = container.getAttribute('data-shop-id');
  let productId = container.getAttribute('data-product-id');

  if (!bcartShopId) {
    console.error('[BcartReview] data-shop-id が必要です');
    return;
  }

  // 商品IDの自動検出
  if (!productId || productId === 'PRODUCT_ID') {
    productId = detectProductId();
  }

  if (!productId) {
    console.warn('[BcartReview] 商品IDを検出できませんでした');
    return;
  }

  // ============================================
  // 商品ID検出
  // ============================================
  function detectProductId() {
    // URLから取得 (/products/123 または /product/123 形式)
    const urlMatch = window.location.pathname.match(/\/products?\/(\d+)/);
    if (urlMatch) return urlMatch[1];

    // URLパラメータから取得
    const params = new URLSearchParams(window.location.search);
    if (params.get('product_id')) return params.get('product_id');
    if (params.get('id')) return params.get('id');

    // ページ内のdata属性から取得
    const productEl = document.querySelector('[data-product-id]');
    if (productEl && productEl !== container) {
      return productEl.getAttribute('data-product-id');
    }

    return null;
  }

  // ============================================
  // API
  // ============================================
  const api = {
    shopId: null, // 内部UUID

    async getShopId() {
      if (this.shopId) return this.shopId;

      const url = `${SUPABASE_URL}/rest/v1/shops?bcart_shop_id=eq.${bcartShopId}&select=id`;
      const res = await fetch(url, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      const shops = await res.json();
      if (shops && shops.length > 0) {
        this.shopId = shops[0].id;
      }
      return this.shopId;
    },

    async getReviews() {
      const shopId = await this.getShopId();
      if (!shopId) return [];

      const url = `${SUPABASE_URL}/rest/v1/reviews?` +
        `shop_id=eq.${shopId}&` +
        `product_id=eq.${productId}&` +
        `status=eq.approved&` +
        `order=created_at.desc`;

      const res = await fetch(url, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      return res.json();
    },

    async submitReview(data) {
      const shopId = await this.getShopId();
      if (!shopId) return false;

      const url = `${SUPABASE_URL}/rest/v1/reviews`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          shop_id: shopId,
          product_id: productId,
          rating: data.rating,
          comment: data.comment,
          author_name: data.authorName,
          status: 'pending'
        })
      });
      return res.ok;
    }
  };

  // ============================================
  // スタイル
  // ============================================
  const styles = `
    .bcart-review-widget {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      max-width: 100%;
      margin: 10px 0;
      font-size: 13px;
    }
    .bcart-review-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
      padding-bottom: 6px;
      border-bottom: 1px solid #e0e0e0;
      flex-wrap: wrap;
      gap: 6px;
    }
    .bcart-review-title {
      font-size: 14px;
      font-weight: bold;
      margin: 0;
    }
    .bcart-review-summary {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #666;
      font-size: 12px;
    }
    .bcart-review-avg {
      font-size: 16px;
      font-weight: bold;
      color: #f5a623;
    }
    .bcart-review-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .bcart-review-item {
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    .bcart-review-item:last-child {
      border-bottom: none;
    }
    .bcart-review-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
      flex-wrap: wrap;
      font-size: 12px;
    }
    .bcart-review-author {
      font-weight: 500;
    }
    .bcart-review-date {
      color: #999;
      font-size: 10px;
    }
    .bcart-review-stars {
      color: #f5a623;
      letter-spacing: 1px;
      font-size: 12px;
    }
    .bcart-review-comment {
      color: #333;
      line-height: 1.4;
      margin: 0;
      font-size: 12px;
    }
    .bcart-review-empty {
      text-align: center;
      padding: 15px;
      color: #999;
      font-size: 12px;
    }
    .bcart-review-form {
      background: #f9f9f9;
      padding: 12px;
      border-radius: 6px;
      margin-top: 10px;
    }
    .bcart-review-form-title {
      font-size: 13px;
      font-weight: bold;
      margin: 0 0 10px 0;
    }
    .bcart-form-group {
      margin-bottom: 10px;
    }
    .bcart-form-label {
      display: block;
      margin-bottom: 3px;
      font-weight: 500;
      font-size: 12px;
    }
    .bcart-form-input {
      width: 100%;
      padding: 6px 8px;
      border: 1px solid #ddd;
      border-radius: 3px;
      font-size: 12px;
      box-sizing: border-box;
    }
    .bcart-form-input:focus {
      outline: none;
      border-color: #f5a623;
    }
    .bcart-form-textarea {
      min-height: 60px;
      resize: vertical;
    }
    .bcart-star-rating {
      display: flex;
      gap: 2px;
      flex-direction: row-reverse;
      justify-content: flex-end;
    }
    .bcart-star-rating input {
      display: none;
    }
    .bcart-star-rating label {
      cursor: pointer;
      font-size: 18px;
      color: #ddd;
      transition: color 0.2s;
    }
    .bcart-star-rating label:hover,
    .bcart-star-rating label:hover ~ label,
    .bcart-star-rating input:checked ~ label {
      color: #f5a623;
    }
    .bcart-form-submit {
      background: #f5a623;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 3px;
      font-size: 12px;
      font-weight: bold;
      cursor: pointer;
      transition: background 0.2s;
    }
    .bcart-form-submit:hover {
      background: #e09000;
    }
    .bcart-form-submit:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    .bcart-form-message {
      padding: 8px;
      border-radius: 3px;
      margin-top: 8px;
      text-align: center;
      font-size: 12px;
    }
    .bcart-form-message.success {
      background: #e8f5e9;
      color: #2e7d32;
    }
    .bcart-form-message.error {
      background: #ffebee;
      color: #c62828;
    }
    .bcart-loading {
      text-align: center;
      padding: 15px;
      color: #999;
      font-size: 12px;
    }
  `;

  // ============================================
  // ユーティリティ
  // ============================================
  function renderStars(rating) {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
  }

  function calculateAverage(reviews) {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ============================================
  // UI生成
  // ============================================
  function renderWidget(reviews) {
    const avg = calculateAverage(reviews);
    const formId = 'bcart-form-' + Math.random().toString(36).substr(2, 9);

    console.log('[BcartReview] renderWidget called, formId:', formId, 'reviews:', reviews.length);

    container.innerHTML = `
      <div class="bcart-review-widget">
        <div class="bcart-review-header">
          <h3 class="bcart-review-title">カスタマーレビュー</h3>
          ${reviews.length > 0 ? `
            <div class="bcart-review-summary">
              <span class="bcart-review-avg">${avg}</span>
              <span class="bcart-review-stars">${renderStars(Math.round(avg))}</span>
              <span>(${reviews.length}件)</span>
            </div>
          ` : ''}
        </div>

        ${reviews.length > 0 ? `
          <ul class="bcart-review-list">
            ${reviews.map(r => `
              <li class="bcart-review-item">
                <div class="bcart-review-meta">
                  <span class="bcart-review-stars">${renderStars(r.rating)}</span>
                  <span class="bcart-review-author">${escapeHtml(r.author_name)}</span>
                  <span class="bcart-review-date">${formatDate(r.created_at)}</span>
                </div>
                <p class="bcart-review-comment">${escapeHtml(r.comment || '')}</p>
              </li>
            `).join('')}
          </ul>
        ` : `
          <div class="bcart-review-empty">
            まだレビューがありません。最初のレビューを書いてみませんか？
          </div>
        `}

        <div class="bcart-review-form">
          <h4 class="bcart-review-form-title">レビューを書く</h4>
          <div id="${formId}" class="bcart-review-form-inner">
            <div class="bcart-form-group">
              <label class="bcart-form-label">評価 *</label>
              <div class="bcart-star-rating">
                <input type="radio" id="${formId}-star5" name="${formId}-rating" value="5">
                <label for="${formId}-star5">★</label>
                <input type="radio" id="${formId}-star4" name="${formId}-rating" value="4">
                <label for="${formId}-star4">★</label>
                <input type="radio" id="${formId}-star3" name="${formId}-rating" value="3">
                <label for="${formId}-star3">★</label>
                <input type="radio" id="${formId}-star2" name="${formId}-rating" value="2">
                <label for="${formId}-star2">★</label>
                <input type="radio" id="${formId}-star1" name="${formId}-rating" value="1">
                <label for="${formId}-star1">★</label>
              </div>
            </div>
            <div class="bcart-form-group">
              <label class="bcart-form-label" for="${formId}-author">お名前 *</label>
              <input type="text" id="${formId}-author" class="bcart-form-input" maxlength="50" placeholder="ニックネームでもOK">
            </div>
            <div class="bcart-form-group">
              <label class="bcart-form-label" for="${formId}-comment">コメント</label>
              <textarea id="${formId}-comment" class="bcart-form-input bcart-form-textarea" maxlength="1000" placeholder="商品の感想をお聞かせください"></textarea>
            </div>
            <button type="button" class="bcart-form-submit">レビューを投稿する</button>
            <div class="bcart-form-message-area"></div>
          </div>
        </div>
      </div>
    `;

    // フォーム送信（divを使用、ネストされたformを避けるため）
    console.log('[BcartReview] Looking for form container:', formId);
    const formContainer = container.querySelector(`#${formId}`);
    console.log('[BcartReview] Form container found:', !!formContainer);
    if (!formContainer) {
      console.error('[BcartReview] フォームコンテナが見つかりません:', formId);
      return;
    }

    const submitBtn = formContainer.querySelector('.bcart-form-submit');
    const messageArea = formContainer.querySelector('.bcart-form-message-area');

    submitBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      // 手動で値を取得（FormDataの代わりに）
      const ratingInput = formContainer.querySelector(`input[name="${formId}-rating"]:checked`);
      const authorInput = formContainer.querySelector(`#${formId}-author`);
      const commentInput = formContainer.querySelector(`#${formId}-comment`);

      const rating = ratingInput ? parseInt(ratingInput.value, 10) : 0;
      const authorName = authorInput ? authorInput.value.trim() : '';
      const comment = commentInput ? commentInput.value.trim() : '';

      if (!rating || !authorName) {
        messageArea.innerHTML = '<div class="bcart-form-message error">評価とお名前は必須です</div>';
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = '送信中...';

      try {
        const success = await api.submitReview({ rating, authorName, comment });

        if (success) {
          messageArea.innerHTML = '<div class="bcart-form-message success">レビューを投稿しました。承認後に表示されます。</div>';
          // 手動でフォームをリセット
          formContainer.querySelectorAll(`input[name="${formId}-rating"]`).forEach(r => r.checked = false);
          if (authorInput) authorInput.value = '';
          if (commentInput) commentInput.value = '';
        } else {
          throw new Error('投稿に失敗しました');
        }
      } catch (err) {
        messageArea.innerHTML = '<div class="bcart-form-message error">エラーが発生しました。しばらくしてからお試しください。</div>';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'レビューを投稿する';
      }
    });
  }

  // ============================================
  // 初期化
  // ============================================
  async function init() {
    // スタイル注入
    const styleEl = document.createElement('style');
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);

    // ローディング表示
    container.innerHTML = '<div class="bcart-loading">読み込み中...</div>';

    try {
      const reviews = await api.getReviews();
      renderWidget(reviews);
    } catch (err) {
      console.error('[BcartReview] エラー:', err);
      container.innerHTML = '<div class="bcart-review-empty">レビューの読み込みに失敗しました</div>';
    }
  }

  // 実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
