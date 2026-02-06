/**
 * B-CART レビューウィジェット
 *
 * 使用方法:
 * <script
 *   src="https://your-domain.com/bcart-review.js"
 *   data-supabase-url="https://xxx.supabase.co"
 *   data-supabase-anon-key="your-anon-key"
 *   data-shop-id="your-shop-id">
 * </script>
 * <div id="bcart-review-widget"></div>
 */
(function() {
  'use strict';

  // ============================================
  // 設定取得
  // ============================================
  const script = document.currentScript;
  const CONFIG = {
    supabaseUrl: script.getAttribute('data-supabase-url'),
    supabaseKey: script.getAttribute('data-supabase-anon-key'),
    shopId: script.getAttribute('data-shop-id'),
    containerId: script.getAttribute('data-container-id') || 'bcart-review-widget'
  };

  // 設定チェック
  if (!CONFIG.supabaseUrl || !CONFIG.supabaseKey || !CONFIG.shopId) {
    console.error('[BcartReview] 必須設定が不足しています: data-supabase-url, data-supabase-anon-key, data-shop-id');
    return;
  }

  // ============================================
  // 商品ID検出
  // ============================================
  function detectProductId() {
    // 方法1: URLから取得 (/products/123 形式)
    const urlMatch = window.location.pathname.match(/\/products?\/(\d+)/);
    if (urlMatch) return urlMatch[1];

    // 方法2: URLパラメータから取得
    const params = new URLSearchParams(window.location.search);
    if (params.get('product_id')) return params.get('product_id');
    if (params.get('id')) return params.get('id');

    // 方法3: ページ内のdata属性から取得
    const productEl = document.querySelector('[data-product-id]');
    if (productEl) return productEl.getAttribute('data-product-id');

    // 方法4: meta tagから取得
    const metaProduct = document.querySelector('meta[property="product:id"]');
    if (metaProduct) return metaProduct.content;

    return null;
  }

  // ============================================
  // Supabase API呼び出し
  // ============================================
  const api = {
    async getReviews(productId) {
      const url = `${CONFIG.supabaseUrl}/rest/v1/reviews?` +
        `shop_id=eq.${CONFIG.shopId}&` +
        `product_id=eq.${productId}&` +
        `status=eq.approved&` +
        `order=created_at.desc`;

      const res = await fetch(url, {
        headers: {
          'apikey': CONFIG.supabaseKey,
          'Authorization': `Bearer ${CONFIG.supabaseKey}`
        }
      });
      return res.json();
    },

    async submitReview(data) {
      const url = `${CONFIG.supabaseUrl}/rest/v1/reviews`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'apikey': CONFIG.supabaseKey,
          'Authorization': `Bearer ${CONFIG.supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          shop_id: CONFIG.shopId,
          product_id: data.productId,
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
      margin: 20px 0;
    }
    .bcart-review-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e0e0e0;
    }
    .bcart-review-title {
      font-size: 18px;
      font-weight: bold;
      margin: 0;
    }
    .bcart-review-summary {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #666;
    }
    .bcart-review-avg {
      font-size: 24px;
      font-weight: bold;
      color: #f5a623;
    }
    .bcart-review-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .bcart-review-item {
      padding: 16px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    .bcart-review-item:last-child {
      border-bottom: none;
    }
    .bcart-review-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }
    .bcart-review-author {
      font-weight: 500;
    }
    .bcart-review-date {
      color: #999;
      font-size: 12px;
    }
    .bcart-review-stars {
      color: #f5a623;
      letter-spacing: 2px;
    }
    .bcart-review-comment {
      color: #333;
      line-height: 1.6;
      margin: 0;
    }
    .bcart-review-empty {
      text-align: center;
      padding: 40px;
      color: #999;
    }
    .bcart-review-form {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
    }
    .bcart-review-form-title {
      font-size: 16px;
      font-weight: bold;
      margin: 0 0 16px 0;
    }
    .bcart-form-group {
      margin-bottom: 16px;
    }
    .bcart-form-label {
      display: block;
      margin-bottom: 6px;
      font-weight: 500;
      font-size: 14px;
    }
    .bcart-form-input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      box-sizing: border-box;
    }
    .bcart-form-input:focus {
      outline: none;
      border-color: #f5a623;
    }
    .bcart-form-textarea {
      min-height: 100px;
      resize: vertical;
    }
    .bcart-star-rating {
      display: flex;
      gap: 4px;
      flex-direction: row-reverse;
      justify-content: flex-end;
    }
    .bcart-star-rating input {
      display: none;
    }
    .bcart-star-rating label {
      cursor: pointer;
      font-size: 28px;
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
      padding: 12px 24px;
      border-radius: 4px;
      font-size: 14px;
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
      padding: 12px;
      border-radius: 4px;
      margin-top: 12px;
      text-align: center;
    }
    .bcart-form-message.success {
      background: #e8f5e9;
      color: #2e7d32;
    }
    .bcart-form-message.error {
      background: #ffebee;
      color: #c62828;
    }
  `;

  // ============================================
  // UI生成
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

  function renderWidget(container, reviews, productId) {
    const avg = calculateAverage(reviews);

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
          <form id="bcart-review-form">
            <div class="bcart-form-group">
              <label class="bcart-form-label">評価 *</label>
              <div class="bcart-star-rating">
                <input type="radio" id="star5" name="rating" value="5" required>
                <label for="star5">★</label>
                <input type="radio" id="star4" name="rating" value="4">
                <label for="star4">★</label>
                <input type="radio" id="star3" name="rating" value="3">
                <label for="star3">★</label>
                <input type="radio" id="star2" name="rating" value="2">
                <label for="star2">★</label>
                <input type="radio" id="star1" name="rating" value="1">
                <label for="star1">★</label>
              </div>
            </div>
            <div class="bcart-form-group">
              <label class="bcart-form-label" for="bcart-author">お名前 *</label>
              <input type="text" id="bcart-author" name="author" class="bcart-form-input" required maxlength="50" placeholder="ニックネームでもOK">
            </div>
            <div class="bcart-form-group">
              <label class="bcart-form-label" for="bcart-comment">コメント</label>
              <textarea id="bcart-comment" name="comment" class="bcart-form-input bcart-form-textarea" maxlength="1000" placeholder="商品の感想をお聞かせください"></textarea>
            </div>
            <button type="submit" class="bcart-form-submit">レビューを投稿する</button>
            <div id="bcart-form-message"></div>
          </form>
        </div>
      </div>
    `;

    // フォーム送信ハンドラ
    const form = container.querySelector('#bcart-review-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = form.querySelector('.bcart-form-submit');
      const messageEl = container.querySelector('#bcart-form-message');

      const formData = new FormData(form);
      const rating = parseInt(formData.get('rating'), 10);
      const authorName = formData.get('author').trim();
      const comment = formData.get('comment').trim();

      if (!rating || !authorName) {
        messageEl.className = 'bcart-form-message error';
        messageEl.textContent = '評価とお名前は必須です';
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = '送信中...';

      try {
        const success = await api.submitReview({
          productId,
          rating,
          authorName,
          comment
        });

        if (success) {
          messageEl.className = 'bcart-form-message success';
          messageEl.textContent = 'レビューを投稿しました。承認後に表示されます。';
          form.reset();
        } else {
          throw new Error('投稿に失敗しました');
        }
      } catch (err) {
        messageEl.className = 'bcart-form-message error';
        messageEl.textContent = 'エラーが発生しました。しばらくしてからお試しください。';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'レビューを投稿する';
      }
    });
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
  // 初期化
  // ============================================
  async function init() {
    // スタイル注入
    const styleEl = document.createElement('style');
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);

    // コンテナ取得
    const container = document.getElementById(CONFIG.containerId);
    if (!container) {
      console.error(`[BcartReview] コンテナが見つかりません: #${CONFIG.containerId}`);
      return;
    }

    // 商品ID検出
    const productId = detectProductId();
    if (!productId) {
      console.warn('[BcartReview] 商品IDを検出できませんでした');
      container.innerHTML = '<div class="bcart-review-empty">レビューを表示できません</div>';
      return;
    }

    // レビュー取得・表示
    try {
      const reviews = await api.getReviews(productId);
      renderWidget(container, reviews, productId);
    } catch (err) {
      console.error('[BcartReview] レビュー取得エラー:', err);
      container.innerHTML = '<div class="bcart-review-empty">レビューの読み込みに失敗しました</div>';
    }
  }

  // DOMContentLoaded後に初期化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
