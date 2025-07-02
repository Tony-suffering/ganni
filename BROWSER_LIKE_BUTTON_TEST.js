// =============================================
// いいねボタン機能テスト（ブラウザコンソール用）
// 使用方法: アプリでF12 → Console → このスクリプトを実行
// =============================================

console.log('🧪 いいねボタン機能テストを開始...');

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
    console.log('💡 手動で設定してください: window._supabase = [あなたのSupabaseクライアント];');
}

// いいねボタンテスト関数
async function testLikeButton() {
    if (!supabaseClient) {
        console.error('❌ Supabaseクライアントが利用できません');
        return;
    }

    try {
        console.log('🔐 ユーザー認証確認...');
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        
        if (authError || !user) {
            console.error('❌ ユーザー認証に失敗:', authError);
            return;
        }
        
        console.log('✅ ユーザー認証成功:', user.email);
        const currentUserId = user.id;

        // 1. データベーステーブル存在確認
        console.log('🔍 データベーステーブル確認...');
        
        const tableChecks = await Promise.allSettled([
            supabaseClient.from('likes').select('count', { count: 'exact', head: true }),
            supabaseClient.from('posts').select('count', { count: 'exact', head: true }),
            supabaseClient.from('bookmarks').select('count', { count: 'exact', head: true })
        ]);

        console.log('📊 テーブル存在確認結果:');
        console.log('  - likes:', tableChecks[0].status === 'fulfilled' ? '✅ 存在' : '❌ 不在');
        console.log('  - posts:', tableChecks[1].status === 'fulfilled' ? '✅ 存在' : '❌ 不在'); 
        console.log('  - bookmarks:', tableChecks[2].status === 'fulfilled' ? '✅ 存在' : '❌ 不在');

        if (tableChecks[0].status === 'rejected') {
            console.error('❌ likesテーブルが存在しません。マイグレーションを実行してください。');
            console.log('💡 実行するマイグレーション: 20250702150000_create_likes_table.sql');
            return;
        }

        // 2. 投稿データ取得
        console.log('📝 投稿データ取得...');
        const { data: posts, error: postsError } = await supabaseClient
            .from('posts')
            .select('id, title, user_id')
            .neq('user_id', currentUserId)
            .limit(5);

        if (postsError) {
            console.error('❌ 投稿データ取得エラー:', postsError);
            return;
        }

        if (!posts || posts.length === 0) {
            console.log('⚠️ テスト可能な投稿が見つかりません（他のユーザーの投稿が必要）');
            return;
        }

        const targetPost = posts[0];
        console.log('🎯 テスト対象投稿:', targetPost);

        // 3. 既存のいいね確認
        console.log('💭 既存のいいね状況確認...');
        const { data: existingLikes, error: likesCheckError } = await supabaseClient
            .from('likes')
            .select('*')
            .eq('user_id', currentUserId)
            .eq('post_id', targetPost.id);

        if (likesCheckError) {
            console.error('❌ いいね確認エラー:', likesCheckError);
            return;
        }

        const isAlreadyLiked = existingLikes && existingLikes.length > 0;
        console.log(`💡 既存いいね状況: ${isAlreadyLiked ? 'いいね済み' : '未いいね'}`);

        // 4. いいね操作テスト
        if (isAlreadyLiked) {
            console.log('🗑️ いいね削除テスト実行...');
            
            const { error: unlikeError } = await supabaseClient
                .from('likes')
                .delete()
                .eq('user_id', currentUserId)
                .eq('post_id', targetPost.id);

            if (unlikeError) {
                console.error('❌ いいね削除エラー:', unlikeError);
            } else {
                console.log('✅ いいね削除成功');
            }
        } else {
            console.log('❤️ いいね追加テスト実行...');
            
            const { data: likeData, error: likeError } = await supabaseClient
                .from('likes')
                .insert([{
                    user_id: currentUserId,
                    post_id: targetPost.id
                }])
                .select()
                .single();

            if (likeError) {
                console.error('❌ いいね追加エラー:', likeError);
                console.log('🔧 エラー詳細:', {
                    code: likeError.code,
                    message: likeError.message,
                    details: likeError.details
                });
            } else {
                console.log('✅ いいね追加成功:', likeData);
            }
        }

        // 5. 結果確認
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('📊 テスト結果確認...');
        const { data: finalLikes, error: finalError } = await supabaseClient
            .from('likes')
            .select('*')
            .eq('post_id', targetPost.id);

        if (finalError) {
            console.error('❌ 結果確認エラー:', finalError);
        } else {
            console.log('💖 投稿のいいね一覧:', finalLikes);
            console.log(`📈 いいね数: ${finalLikes ? finalLikes.length : 0}`);
        }

        // 6. UI要素の確認
        console.log('🎨 UI要素の確認...');
        const likeButtons = document.querySelectorAll('[data-testid="like-button"], .heart-button, button[class*="like"]');
        console.log(`🔘 いいねボタン要素数: ${likeButtons.length}`);
        
        likeButtons.forEach((button, index) => {
            console.log(`  Button ${index + 1}:`, {
                className: button.className,
                disabled: button.disabled,
                visible: button.offsetParent !== null
            });
        });

        // 7. イベントリスナーの確認
        console.log('🎯 イベントリスナー確認...');
        if (likeButtons.length > 0) {
            const firstButton = likeButtons[0];
            const events = getEventListeners(firstButton);
            console.log('📝 最初のいいねボタンのイベントリスナー:', events);
        }

        console.log('🎉 いいねボタンテスト完了！');
        console.log('='.repeat(50));

    } catch (error) {
        console.error('❌ テスト実行エラー:', error);
    }
}

// データベース構造確認関数
async function checkDatabaseStructure() {
    if (!supabaseClient) {
        console.error('❌ Supabaseクライアントが利用できません');
        return;
    }

    console.log('🏗️ データベース構造確認...');

    try {
        // テーブル構造確認用のクエリ
        const structureQueries = [
            "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'likes' ORDER BY column_name",
            "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'posts' AND column_name IN ('id', 'user_id', 'author_id') ORDER BY column_name",
            "SELECT trigger_name, event_manipulation, action_timing FROM information_schema.triggers WHERE trigger_name LIKE '%like%' ORDER BY trigger_name"
        ];

        for (const [index, query] of structureQueries.entries()) {
            try {
                const { data, error } = await supabaseClient.rpc('sql', { query });
                if (error) {
                    console.warn(`⚠️ クエリ ${index + 1} 実行エラー:`, error);
                } else {
                    console.log(`📋 クエリ ${index + 1} 結果:`, data);
                }
            } catch (queryError) {
                console.warn(`⚠️ クエリ ${index + 1} エラー:`, queryError);
            }
        }
    } catch (error) {
        console.error('❌ データベース構造確認エラー:', error);
    }
}

// いいねボタンクリックシミュレーション
function simulateLikeButtonClick() {
    console.log('🎭 いいねボタンクリックシミュレーション...');
    
    const likeButtons = document.querySelectorAll('button[class*="heart"], button[class*="like"], [data-testid="like-button"]');
    
    if (likeButtons.length === 0) {
        console.log('❌ いいねボタンが見つかりません');
        return;
    }

    console.log(`🔍 ${likeButtons.length}個のいいねボタンを発見`);
    
    // 最初のボタンをクリック
    const firstButton = likeButtons[0];
    console.log('🖱️ 最初のいいねボタンをクリック...');
    
    try {
        firstButton.click();
        console.log('✅ クリック実行完了');
        
        // クリック後の状態確認
        setTimeout(() => {
            console.log('📊 クリック後の状態:', {
                className: firstButton.className,
                disabled: firstButton.disabled,
                ariaPressed: firstButton.getAttribute('aria-pressed')
            });
        }, 500);
        
    } catch (clickError) {
        console.error('❌ クリック実行エラー:', clickError);
    }
}

// 自動実行
if (supabaseClient) {
    console.log('🚀 テストを自動実行します...');
    testLikeButton();
} else {
    console.log('💡 Supabaseクライアントを設定後、以下のコマンドを実行してください:');
    console.log('  - testLikeButton()              : 完全テスト');
    console.log('  - checkDatabaseStructure()      : DB構造確認');
    console.log('  - simulateLikeButtonClick()     : UI操作テスト');
}

// グローバル関数として登録
window.testLikeButton = testLikeButton;
window.checkDatabaseStructure = checkDatabaseStructure;
window.simulateLikeButtonClick = simulateLikeButtonClick;

console.log(`
🎯 **いいねボタン機能テスト完了**

📋 テストコマンド:
- testLikeButton()              : データベース操作テスト
- checkDatabaseStructure()      : データベース構造確認
- simulateLikeButtonClick()     : UI操作テスト

🔧 問題が見つかった場合:
1. マイグレーション未実行: 20250702150000_create_likes_table.sql を実行
2. カラム名エラー: 20250702152000_fix_post_gamification_columns.sql を実行
3. UI問題: ブラウザのコンソールエラーを確認

💡 すべて正常に動作すれば、いいねボタンが使用可能になります！
`);