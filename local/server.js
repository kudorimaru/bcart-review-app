/**
 * B-CART レビューアプリ - ローカル開発サーバー
 *
 * Supabase REST API をモックして、ローカルでウィジェットをテストできます。
 *
 * 使用方法:
 *   node server.js
 *   ブラウザで http://localhost:3000 を開く
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;

// インメモリデータベース（サーバー再起動でリセット）
let reviews = [
  {
    id: '1',
    shop_id: 'test_shop_001',
    product_id: '12345',
    rating: 5,
    comment: 'とても良い商品でした！梱包も丁寧で、届くのも早かったです。また購入したいと思います。',
    author_name: '田中太郎',
    status: 'approved',
    created_at: '2026-02-01T10:00:00Z'
  },
  {
    id: '2',
    shop_id: 'test_shop_001',
    product_id: '12345',
    rating: 4,
    comment: '品質は良いのですが、もう少し安いと嬉しいです。',
    author_name: '佐藤花子',
    status: 'approved',
    created_at: '2026-01-28T15:30:00Z'
  },
  {
    id: '3',
    shop_id: 'test_shop_001',
    product_id: '12345',
    rating: 3,
    comment: '普通です。可もなく不可もなく。',
    author_name: '鈴木一郎',
    status: 'pending',
    created_at: '2026-02-05T09:00:00Z'
  }
];

// MIMEタイプマッピング
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

// クエリパラメータをパース（Supabase形式: field=eq.value）
function parseSupabaseQuery(query) {
  const filters = {};
  for (const [key, value] of Object.entries(query)) {
    if (key === 'order') {
      filters._order = value; // created_at.desc
    } else if (value.startsWith('eq.')) {
      filters[key] = value.substring(3);
    }
  }
  return filters;
}

// レビューをフィルタリング
function filterReviews(filters) {
  let result = [...reviews];

  for (const [key, value] of Object.entries(filters)) {
    if (key === '_order') continue;
    result = result.filter(r => r[key] === value);
  }

  // ソート
  if (filters._order) {
    const [field, direction] = filters._order.split('.');
    result.sort((a, b) => {
      if (direction === 'desc') {
        return new Date(b[field]) - new Date(a[field]);
      }
      return new Date(a[field]) - new Date(b[field]);
    });
  }

  return result;
}

// サーバー作成
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // CORS ヘッダー
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, apikey, Authorization, Prefer');

  // プリフライトリクエスト
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // ========== API エンドポイント ==========

  // GET /rest/v1/reviews - レビュー取得（Supabase互換）
  if (pathname === '/rest/v1/reviews' && req.method === 'GET') {
    const filters = parseSupabaseQuery(parsedUrl.query);
    const filtered = filterReviews(filters);

    console.log(`[API] GET /rest/v1/reviews - ${filtered.length} 件`);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(filtered));
    return;
  }

  // POST /rest/v1/reviews - レビュー投稿（Supabase互換）
  if (pathname === '/rest/v1/reviews' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const newReview = {
          id: String(Date.now()),
          shop_id: data.shop_id,
          product_id: data.product_id,
          rating: data.rating,
          comment: data.comment || '',
          author_name: data.author_name,
          status: 'pending',
          created_at: new Date().toISOString()
        };

        reviews.push(newReview);
        console.log(`[API] POST /rest/v1/reviews - 新規レビュー追加 (ID: ${newReview.id})`);
        console.log(`      評価: ${'★'.repeat(newReview.rating)} by ${newReview.author_name}`);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(newReview));
      } catch (e) {
        console.error('[API] POST エラー:', e.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // GET /api/reviews - 全レビュー確認用（管理用）
  if (pathname === '/api/reviews' && req.method === 'GET') {
    console.log(`[API] GET /api/reviews - 全 ${reviews.length} 件`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(reviews, null, 2));
    return;
  }

  // POST /api/reviews/:id/approve - レビュー承認（管理用）
  const approveMatch = pathname.match(/^\/api\/reviews\/([^/]+)\/approve$/);
  if (approveMatch && req.method === 'POST') {
    const id = approveMatch[1];
    const review = reviews.find(r => r.id === id);
    if (review) {
      review.status = 'approved';
      console.log(`[API] レビュー承認: ID ${id}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(review));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    }
    return;
  }

  // ========== 静的ファイル配信 ==========

  let filePath;
  if (pathname === '/' || pathname === '/index.html') {
    filePath = path.join(__dirname, 'test-product.html');
  } else if (pathname === '/widget/bcart-review.js') {
    filePath = path.join(__dirname, '..', 'widget', 'bcart-review.js');
  } else {
    filePath = path.join(__dirname, pathname);
  }

  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        console.log(`[404] ${pathname}`);
        res.writeHead(404);
        res.end('Not Found');
      } else {
        console.error(`[500] ${pathname}:`, err.message);
        res.writeHead(500);
        res.end('Internal Server Error');
      }
      return;
    }

    console.log(`[200] ${pathname}`);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('========================================');
  console.log('  B-CART レビューアプリ ローカルサーバー');
  console.log('========================================');
  console.log('');
  console.log(`  テストページ: http://localhost:${PORT}/`);
  console.log(`  全レビュー:   http://localhost:${PORT}/api/reviews`);
  console.log('');
  console.log('  初期データ:');
  console.log('    - 承認済み: 2件');
  console.log('    - 承認待ち: 1件');
  console.log('');
  console.log('  Ctrl+C で終了');
  console.log('========================================');
  console.log('');
});
