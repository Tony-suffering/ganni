// =============================================
// いいねボタン完全デバッグ（ブラウザコンソール用）
// 使用方法: アプリでF12 → Console → このスクリプトを実行
// =============================================

console.log('🔍 いいねボタン完全デバッグを開始...');

// Supabaseクライアント取得
let supabaseClient = null;

// 複数の方法でSupabaseクライアントを取得
if (typeof supabase !== 'undefined') {
    supabaseClient = supabase;
    console.log('✅ グローバルsupabaseクライアント取得成功');
} else if (typeof window._supabase !== 'undefined') {
    supabaseClient = window._supabase;
    console.log('✅ window._supabaseクライアント取得成功');
} else {
    console.log('❌ Supabaseクライアントが見つかりません');
}

// 包括的ないいねボタンデバッグ関数
async function debugLikeButtonComplete() {
    console.log('🔧 === いいねボタン完全デバッグ開始 ===');
    
    // 1. UI要素の確認
    console.log('\n1️⃣ UI要素の確認...');
    const likeButtons = document.querySelectorAll('button');
    const heartButtons = [];
    const possibleLikeButtons = [];
    
    likeButtons.forEach((button, index) => {
        const buttonText = button.innerText?.toLowerCase() || '';
        const buttonClass = button.className?.toLowerCase() || '';
        const buttonHTML = button.innerHTML?.toLowerCase() || '';
        
        // ハートアイコンやいいね関連の要素を探す
        if (buttonHTML.includes('heart') || 
            buttonHTML.includes('❤') || 
            buttonHTML.includes('♥') ||
            buttonClass.includes('heart') ||
            buttonClass.includes('like') ||
            buttonText.includes('いいね') ||
            buttonHTML.includes('<svg') && (buttonHTML.includes('heart') || buttonHTML.includes('like'))) {
            
            heartButtons.push({
                index,
                button,
                text: buttonText,
                class: buttonClass,
                html: button.innerHTML.substring(0, 100) + '...',
                disabled: button.disabled,
                visible: button.offsetParent !== null,
                clickable: !button.disabled && button.offsetParent !== null
            });
        }
        
        // クリック可能なボタンをすべて収集
        if (!button.disabled && button.offsetParent !== null) {
            possibleLikeButtons.push({
                index,
                button,
                text: buttonText.substring(0, 30),
                class: buttonClass.substring(0, 50)
            });
        }
    });
    
    console.log(`🔘 全ボタン数: ${likeButtons.length}`);
    console.log(`❤️ ハート関連ボタン数: ${heartButtons.length}`);
    console.log(`🖱️ クリック可能ボタン数: ${possibleLikeButtons.length}`);
    
    if (heartButtons.length > 0) {
        console.log('❤️ ハート関連ボタン詳細:', heartButtons);
    } else {
        console.log('⚠️ ハート関連ボタンが見つかりません');
        console.log('🔍 クリック可能ボタンの最初の10個:', possibleLikeButtons.slice(0, 10));
    }
    
    // 2. Supabaseテーブル確認
    if (supabaseClient) {
        console.log('\n2️⃣ Supabaseテーブル確認...');
        
        try {
            // ユーザー認証確認
            const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
            if (authError || !user) {
                console.error('❌ ユーザー認証エラー:', authError);
                return;
            }
            console.log('✅ ユーザー認証成功:', user.email);
            
            // テーブル存在確認
            const tableChecks = await Promise.allSettled([
                supabaseClient.from('likes').select('count', { count: 'exact', head: true }),
                supabaseClient.from('posts').select('count', { count: 'exact', head: true })
            ]);
            
            console.log('📊 テーブル確認結果:');
            console.log('  - likes:', tableChecks[0].status === 'fulfilled' ? '✅ 存在' : '❌ 不在');
            console.log('  - posts:', tableChecks[1].status === 'fulfilled' ? '✅ 存在' : '❌ 不在');
            
            if (tableChecks[0].status === 'rejected') {
                console.error('❌ likesテーブルエラー:', tableChecks[0].reason);
                return;
            }
            
            // 投稿データ確認
            const { data: posts, error: postsError } = await supabaseClient
                .from('posts')
                .select('id, title, author_id')
                .limit(3);
                
            if (postsError) {
                console.error('❌ 投稿取得エラー:', postsError);
                return;
            }
            
            console.log('📝 投稿サンプル:', posts);
            
        } catch (error) {
            console.error('❌ Supabaseテストエラー:', error);
        }
    }
    
    // 3. React usePosts フックの状態確認
    console.log('\n3️⃣ React状態確認...');
    
    // Reactアプリの状態を確認（可能であれば）
    const rootElement = document.querySelector('#root');
    if (rootElement) {
        console.log('🔍 Reactアプリが検出されました');
        
        // PostCardコンポーネントを探す
        const postCards = document.querySelectorAll('[class*="post"], [class*="card"]');
        console.log(`📱 投稿カード数: ${postCards.length}`);
        
        if (postCards.length > 0) {
            console.log('📋 最初の投稿カード:', {
                className: postCards[0].className,
                html: postCards[0].innerHTML.substring(0, 200) + '...'
            });
        }
    }
    
    // 4. 手動いいねテスト
    console.log('\n4️⃣ 手動いいねテスト...');
    
    if (supabaseClient && heartButtons.length > 0) {
        console.log('🎯 最初のハートボタンでテスト実行...');
        
        const testButton = heartButtons[0].button;
        
        // クリック前の状態確認
        console.log('📊 クリック前の状態:', {
            disabled: testButton.disabled,
            className: testButton.className,
            innerHTML: testButton.innerHTML.substring(0, 100)
        });
        
        // 実際にクリック
        try {
            console.log('🖱️ ボタンクリック実行...');
            testButton.click();
            
            // クリック後の状態確認
            setTimeout(() => {
                console.log('📊 クリック後の状態:', {
                    disabled: testButton.disabled,
                    className: testButton.className,
                    innerHTML: testButton.innerHTML.substring(0, 100)
                });
            }, 1000);
            
        } catch (clickError) {
            console.error('❌ クリック実行エラー:', clickError);
        }
    }
    
    // 5. ネットワーク監視
    console.log('\n5️⃣ ネットワーク監視設定...');
    
    // ネットワークリクエストを監視
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const url = args[0];
        if (typeof url === 'string' && (url.includes('likes') || url.includes('supabase'))) {
            console.log('🌐 Supabaseリクエスト検出:', {
                url: url.substring(0, 100),
                method: args[1]?.method || 'GET'
            });
        }
        return originalFetch.apply(this, args)
            .then(response => {
                if (typeof url === 'string' && url.includes('likes')) {
                    console.log('📡 いいねリクエスト結果:', {
                        status: response.status,
                        ok: response.ok
                    });
                }
                return response;
            })
            .catch(error => {
                if (typeof url === 'string' && url.includes('likes')) {
                    console.error('❌ いいねリクエストエラー:', error);
                }
                throw error;
            });
    };
    
    console.log('✅ ネットワーク監視を設定しました');
    
    // 6. コンソールエラー監視
    console.log('\n6️⃣ コンソールエラー監視設定...');
    
    const originalError = console.error;
    console.error = function(...args) {
        if (args.some(arg => 
            typeof arg === 'string' && 
            (arg.includes('like') || arg.includes('supabase') || arg.includes('post'))
        )) {
            console.log('🚨 いいね関連エラー検出:', args);
        }
        return originalError.apply(this, args);
    };
    
    console.log('✅ エラー監視を設定しました');
    
    console.log('\n🎯 === デバッグ完了 ===');
    console.log('💡 次の手順:');
    console.log('1. 実際にいいねボタンをクリックしてみてください');
    console.log('2. コンソールにエラーやネットワークログが表示されるか確認');
    console.log('3. 結果を報告してください');
}

// 直接いいね操作テスト関数
async function testDirectLike() {
    if (!supabaseClient) {
        console.error('❌ Supabaseクライアントが必要です');
        return;
    }
    
    console.log('🧪 直接いいね操作テスト...');
    
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
            console.error('❌ ユーザーが認証されていません');
            return;
        }
        
        const { data: posts } = await supabaseClient
            .from('posts')
            .select('id, title, author_id')
            .neq('author_id', user.id)
            .limit(1);
            
        if (!posts || posts.length === 0) {
            console.log('⚠️ テスト可能な投稿がありません');
            return;
        }
        
        const testPost = posts[0];
        console.log('🎯 テスト対象投稿:', testPost);
        
        // いいね追加テスト
        const { data: likeData, error: likeError } = await supabaseClient
            .from('likes')
            .insert([{
                user_id: user.id,
                post_id: testPost.id
            }])
            .select();
            
        if (likeError) {
            console.error('❌ いいね追加エラー:', likeError);
        } else {
            console.log('✅ いいね追加成功:', likeData);
            
            // 即座に削除
            await supabaseClient
                .from('likes')
                .delete()
                .eq('user_id', user.id)
                .eq('post_id', testPost.id);
                
            console.log('🗑️ テスト用いいねを削除しました');
        }
        
    } catch (error) {
        console.error('❌ 直接テストエラー:', error);
    }
}

// 自動実行
if (supabaseClient) {
    debugLikeButtonComplete();
} else {
    console.log('💡 Supabaseクライアント設定後、以下を実行してください:');
    console.log('- debugLikeButtonComplete() : 完全デバッグ');
    console.log('- testDirectLike() : 直接いいねテスト');
}

// グローバル関数として登録
window.debugLikeButtonComplete = debugLikeButtonComplete;
window.testDirectLike = testDirectLike;

console.log(`
🎯 **いいねボタン完全デバッグツール**

📋 実行コマンド:
- debugLikeButtonComplete() : 包括的デバッグ
- testDirectLike() : データベース直接テスト

🔧 このツールで確認すること:
1. UIボタンの存在と状態
2. Supabaseテーブルの状態
3. ネットワークリクエストの監視
4. エラーメッセージの確認
5. 直接的なデータベース操作

💡 実行後、実際にいいねボタンをクリックして結果を確認してください
`);