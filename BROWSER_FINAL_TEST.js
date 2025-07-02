// =============================================
// 最終ブラウザテスト（Supabaseクライアント問題対応）
// 使用方法: アプリのページでF12 → Console → 段階的に実行
// =============================================

// Step 1: Supabaseクライアントを取得する
console.log('🔍 Step 1: Supabaseクライアント取得方法を試行...');

// 方法1: グローバル変数確認
if (typeof supabase !== 'undefined') {
    console.log('✅ Method 1: グローバルsupabaseが利用可能');
    window._supabase = supabase;
} else {
    console.log('❌ Method 1: グローバルsupabaseが利用不可');
}

// 方法2: window._supabase確認
if (typeof window._supabase !== 'undefined') {
    console.log('✅ Method 2: window._supabaseが利用可能');
} else {
    console.log('❌ Method 2: window._supabaseが利用不可');
}

// 方法3: Reactアプリのコンテキストから取得を試行
if (typeof window.React !== 'undefined') {
    console.log('✅ Method 3: React利用可能 - コンテキスト確認中...');
} else {
    console.log('❌ Method 3: React利用不可');
}

// 方法4: ES6 モジュールインポートを試行
console.log('🔄 Method 4: 動的インポートを試行...');
import('./supabase.js').then(module => {
    if (module.supabase) {
        window._supabase = module.supabase;
        console.log('✅ Method 4: 動的インポート成功');
        runSupabaseTest();
    } else {
        console.log('❌ Method 4: supabaseオブジェクトが見つからない');
    }
}).catch(error => {
    console.log('❌ Method 4: 動的インポート失敗:', error.message);
    
    // 方法5: 相対パスでの再試行
    console.log('🔄 Method 5: 相対パス変更して再試行...');
    import('../supabase.js').then(module => {
        window._supabase = module.supabase;
        console.log('✅ Method 5: 成功');
        runSupabaseTest();
    }).catch(error2 => {
        console.log('❌ Method 5: 失敗:', error2.message);
        showManualInstructions();
    });
});

// Supabaseテスト実行関数
function runSupabaseTest() {
    console.log('🧪 Supabaseテスト開始...');
    
    const client = window._supabase;
    if (!client) {
        console.log('❌ Supabaseクライアントが利用できません');
        return;
    }
    
    // 認証確認
    client.auth.getUser().then(({ data: { user }, error }) => {
        if (error) {
            console.error('❌ 認証確認エラー:', error);
            return;
        }
        
        if (!user) {
            console.log('❌ ユーザーがログインしていません');
            return;
        }
        
        console.log('✅ ユーザー確認:', user.email);
        
        // 実際のインスピレーション作成テスト
        const testParams = {
            p_source_post_id: '97503713-fb23-43ef-8655-c3e50f69e2d3',
            p_inspired_post_id: '6df09611-b19f-439d-b517-cd95f9c63725',
            p_creator_id: user.id,
            p_inspiration_type: 'direct',
            p_inspiration_note: 'ブラウザ最終テスト'
        };
        
        console.log('🎯 インスピレーション作成テスト:', testParams);
        
        client.rpc('create_inspiration_simple', testParams)
            .then(({ data, error }) => {
                if (error) {
                    console.error('❌ インスピレーション作成エラー:', error);
                } else {
                    console.log('✅ インスピレーション作成成功:', data);
                    
                    // ポイント確認
                    return client.rpc('check_inspiration_points', { p_user_id: user.id });
                }
            })
            .then(({ data, error }) => {
                if (error) {
                    console.error('❌ ポイント確認エラー:', error);
                } else {
                    console.log('💎 ポイント状況:', data);
                }
            })
            .catch(error => {
                console.error('❌ テスト実行エラー:', error);
            });
    });
}

// 手動実行手順を表示
function showManualInstructions() {
    console.log(`
🔧 **手動でSupabaseクライアントを設定する方法**

以下のコードを順番に実行してください:

1. まず、Supabaseクライアントを手動設定:
   
   // 方法A: アプリケーション内でsupabaseクライアントを探す
   const appElement = document.querySelector('#root') || document.querySelector('[data-reactroot]');
   if (appElement && appElement._reactInternalFiber) {
     // React Fiberからコンテキストを取得（高度）
     console.log('React Fiber検出、手動でコンテキスト確認が必要');
   }
   
   // 方法B: 直接Supabaseを初期化（緊急用）
   import('https://cdn.skypack.dev/@supabase/supabase-js').then(({ createClient }) => {
     const SUPABASE_URL = 'あなたのSupabaseプロジェクトURL';
     const SUPABASE_ANON_KEY = 'あなたのSupabase匿名キー';
     window._supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
     console.log('✅ 手動Supabaseクライアント設定完了');
   });

2. 設定後、テスト実行:
   
   runSupabaseTest()

🎯 **SQLテストは既に成功しているので、フロントエンド統合が最後のステップです**
`);
}

// 結果確認用の簡易関数
window.checkInspirationResults = function() {
    const client = window._supabase;
    if (!client) {
        console.log('❌ Supabaseクライアントが設定されていません');
        return;
    }
    
    Promise.all([
        client.from('inspirations').select('*').order('created_at', { ascending: false }).limit(3),
        client.from('point_history').select('*').ilike('source_type', 'inspiration%').order('created_at', { ascending: false }).limit(3),
        client.from('user_points').select('*').order('total_points', { ascending: false }).limit(3)
    ]).then(([inspirations, points, userPoints]) => {
        console.log('📊 最新インスピレーション:', inspirations.data);
        console.log('💎 最新ポイント履歴:', points.data);
        console.log('👥 ユーザーポイント:', userPoints.data);
    }).catch(error => {
        console.error('❌ 結果確認エラー:', error);
    });
};

console.log(`
🎯 **最終テスト手順**

1. 上記の自動処理を待つ
2. 成功しない場合は showManualInstructions() を参照
3. 結果確認: checkInspirationResults()

💡 SQLテストは成功しているので、残りはフロントエンド統合のみです！
`);