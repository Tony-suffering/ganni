// プッシュ通知用 Service Worker

const CACHE_NAME = 'ai-commentator-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/favicon.svg',
];

// Service Worker インストール
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: キャッシング開始');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('Service Worker: キャッシング完了');
        return self.skipWaiting();
      })
  );
});

// Service Worker アクティベート
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: 古いキャッシュを削除', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// プッシュイベントの処理
self.addEventListener('push', (event) => {
  console.log('Service Worker: プッシュ通知受信', event);

  let notificationData = {
    title: 'AIコメンテーター',
    body: '新しい通知があります',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: 'default',
    data: {
      url: '/'
    }
  };

  // プッシュデータがある場合は解析
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        ...data
      };
    } catch (e) {
      console.error('プッシュデータの解析に失敗:', e);
      notificationData.body = event.data.text();
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    data: notificationData.data,
    requireInteraction: false,
    actions: [
      {
        action: 'view',
        title: '見る',
        icon: '/favicon.svg'
      },
      {
        action: 'close',
        title: '閉じる'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// 通知クリックイベントの処理
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: 通知クリック', event);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // デフォルトアクションまたは'view'アクション
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // 既に開いているタブがあるかチェック
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // 新しいタブを開く
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// 通知閉じるイベントの処理
self.addEventListener('notificationclose', (event) => {
  console.log('Service Worker: 通知が閉じられました', event);
  
  // アナリティクスなどの処理をここに追加可能
});

// バックグラウンド同期（オプション）
self.addEventListener('sync', (event) => {
  console.log('Service Worker: バックグラウンド同期', event);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // バックグラウンドでの処理（未読通知の同期など）
      syncNotifications()
    );
  }
});

// 通知同期関数
async function syncNotifications() {
  try {
    // オフライン時に蓄積された通知の同期処理
    console.log('Service Worker: 通知同期処理実行');
  } catch (error) {
    console.error('Service Worker: 通知同期エラー', error);
  }
}

// フェッチイベント（キャッシング戦略）
self.addEventListener('fetch', (event) => {
  // 画像ファイルのキャッシング戦略
  if (event.request.destination === 'image') {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request)
            .then((response) => {
              // レスポンスが有効な場合のみキャッシュ
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(event.request, responseClone);
                  });
              }
              return response;
            });
        })
    );
  }
});