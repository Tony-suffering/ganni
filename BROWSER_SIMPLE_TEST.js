// =============================================
// 簡易ブラウザテスト（RLS問題対応版）
// 使用方法: アプリのページでF12 → Console → 貼り付けて実行
// =============================================

// 1. Supabaseクライアント確認
console.log('🔍 Supabase Client:', typeof supabase !== 'undefined' ? '✅ 利用可能' : '❌ 利用不可');

// 2. 認証状態確認
async function checkAuth() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        
        console.log('👤 認証状態:', user ? '✅ ログイン済み' : '❌ 未ログイン');
        if (user) {
            console.log('   ユーザーID:', user.id);
            console.log('   メール:', user.email);
        }
        return user;
    } catch (error) {
        console.error('❌ 認証確認エラー:', error);
        return null;
    }
}

// 3. テーブル直接アクセステスト
async function testDirectAccess() {
    try {
        // inspirationsテーブルの読み取りテスト
        const { data: inspirationsData, error: inspirationsError } = await supabase
            .from('inspirations')
            .select('*')
            .limit(1);
        
        console.log('📖 inspirations読み取り:', inspirationsError ? `❌ ${inspirationsError.message}` : '✅ 成功');
        
        // point_historyテーブルの読み取りテスト
        const { data: pointsData, error: pointsError } = await supabase
            .from('point_history')
            .select('*')
            .limit(1);
        
        console.log('📖 point_history読み取り:', pointsError ? `❌ ${pointsError.message}` : '✅ 成功');
        
        // user_pointsテーブルの読み取りテスト
        const { data: userPointsData, error: userPointsError } = await supabase
            .from('user_points')
            .select('*')
            .limit(1);
        
        console.log('📖 user_points読み取り:', userPointsError ? `❌ ${userPointsError.message}` : '✅ 成功');
        
    } catch (error) {
        console.error('❌ 直接アクセステストエラー:', error);
    }
}

// 4. SQL関数テスト
async function testSQLFunctions() {
    try {
        // 関数の存在確認
        const functions = [
            'create_inspiration_simple',
            'check_inspiration_points', 
            'get_inspiration_data'
        ];
        
        for (const funcName of functions) {
            try {
                // ダミーパラメータで関数存在確認
                await supabase.rpc(funcName, {});
            } catch (error) {
                if (error.message.includes('function') && error.message.includes('does not exist')) {
                    console.log(`❌ 関数不存在: ${funcName}`);
                } else {
                    console.log(`✅ 関数存在: ${funcName}`);
                }
            }
        }
    } catch (error) {
        console.error('❌ SQL関数テストエラー:', error);
    }
}

// 5. 投稿データ取得
async function getTestData() {
    try {
        const { data: posts, error } = await supabase
            .from('posts')
            .select('id, title, user_id, created_at')
            .order('created_at', { ascending: false })
            .limit(3);
        
        if (error) throw error;
        
        console.log('📝 テスト用投稿データ:');
        posts.forEach((post, index) => {
            console.log(`   ${index + 1}. ${post.title} (ID: ${post.id})`);
        });
        
        return posts;
    } catch (error) {
        console.error('❌ 投稿データ取得エラー:', error);
        return [];
    }
}

// 6. インスピレーション作成テスト（RLS無効化後）
async function testInspirationCreation(sourcePostId, inspiredPostId, userId) {
    try {
        console.log('🧪 インスピレーション作成テスト開始...');
        
        const { data, error } = await supabase.rpc('create_inspiration_simple', {
            p_source_post_id: sourcePostId,
            p_inspired_post_id: inspiredPostId,
            p_creator_id: userId,
            p_inspiration_type: 'direct',
            p_inspiration_note: 'ブラウザテスト用インスピレーション'
        });
        
        if (error) {
            console.error('❌ インスピレーション作成エラー:', error);
            return null;
        }
        
        console.log('✅ インスピレーション作成成功:', data);
        
        // ポイント確認
        const { data: pointsData, error: pointsError } = await supabase.rpc('check_inspiration_points', {
            p_user_id: userId
        });
        
        if (pointsError) {
            console.error('❌ ポイント確認エラー:', pointsError);
        } else {
            console.log('💎 ポイント状況:', pointsData);
        }
        
        return data;
    } catch (error) {
        console.error('❌ テスト実行エラー:', error);
        return null;
    }
}

// 7. 完全診断
async function runCompleteDiagnosis() {
    console.log('🚀 インスピレーション機能完全診断開始...\n');
    
    // Step 1: 認証確認
    console.log('--- Step 1: 認証確認 ---');
    const user = await checkAuth();
    
    // Step 2: テーブルアクセス確認
    console.log('\n--- Step 2: テーブルアクセス確認 ---');
    await testDirectAccess();
    
    // Step 3: SQL関数確認
    console.log('\n--- Step 3: SQL関数確認 ---');
    await testSQLFunctions();
    
    // Step 4: テストデータ取得
    console.log('\n--- Step 4: テストデータ取得 ---');
    const posts = await getTestData();
    
    // Step 5: インスピレーション作成テスト（ユーザーがログインしていて投稿が2つ以上ある場合）
    if (user && posts.length >= 2) {
        console.log('\n--- Step 5: インスピレーション作成テスト ---');
        await testInspirationCreation(posts[1].id, posts[0].id, user.id);
    } else {
        console.log('\n⚠️ インスピレーション作成テストをスキップ（ログインまたは投稿データ不足）');
    }
    
    console.log('\n✅ 診断完了！');
}

// 使用方法表示
console.log(`
🎯 **インスピレーション機能診断ツール**

1. 完全診断:
   runCompleteDiagnosis()

2. 個別テスト:
   checkAuth()
   testDirectAccess()
   testSQLFunctions()
   getTestData()

📝 まず runCompleteDiagnosis() を実行してください
`);

// 自動実行（コメントアウトを外すと自動実行）
// runCompleteDiagnosis();