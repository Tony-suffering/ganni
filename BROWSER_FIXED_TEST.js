// =============================================
// 修正版ブラウザテスト（カラム名対応）
// 使用方法: アプリのページでF12 → Console → 貼り付けて実行
// =============================================

// 1. テーブル構造確認
async function checkTableStructure() {
    try {
        // postsテーブルのカラム確認
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .limit(1);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            console.log('📋 postsテーブルのカラム:');
            Object.keys(data[0]).forEach(key => {
                console.log(`   - ${key}`);
            });
            return Object.keys(data[0]);
        }
        
        return [];
    } catch (error) {
        console.error('❌ テーブル構造確認エラー:', error);
        return [];
    }
}

// 2. 正しいカラム名で投稿データ取得
async function getPostsData() {
    try {
        const { data, error } = await supabase
            .from('posts')
            .select('id, title, author_id, created_at')
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (error) throw error;
        
        console.log('📝 投稿データ:');
        data.forEach((post, index) => {
            console.log(`   ${index + 1}. ${post.title} (ID: ${post.id}, 作成者: ${post.author_id})`);
        });
        
        return data;
    } catch (error) {
        console.error('❌ 投稿データ取得エラー:', error);
        return [];
    }
}

// 3. 現在のユーザー取得
async function getCurrentUser() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        
        if (user) {
            console.log('👤 現在のユーザー:');
            console.log(`   ID: ${user.id}`);
            console.log(`   メール: ${user.email}`);
        } else {
            console.log('❌ ユーザーがログインしていません');
        }
        
        return user;
    } catch (error) {
        console.error('❌ ユーザー取得エラー:', error);
        return null;
    }
}

// 4. インスピレーション作成テスト
async function testInspiration(sourcePostId, inspiredPostId, userId) {
    try {
        console.log('🧪 インスピレーション作成テスト...');
        console.log(`   元投稿: ${sourcePostId}`);
        console.log(`   新投稿: ${inspiredPostId}`);
        console.log(`   ユーザー: ${userId}`);
        
        const { data, error } = await supabase.rpc('create_inspiration_simple', {
            p_source_post_id: sourcePostId,
            p_inspired_post_id: inspiredPostId,
            p_creator_id: userId,
            p_inspiration_type: 'direct',
            p_inspiration_note: 'ブラウザ修正版テスト'
        });
        
        if (error) {
            console.error('❌ インスピレーション作成エラー:', error);
            return false;
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
        
        return true;
    } catch (error) {
        console.error('❌ テスト実行エラー:', error);
        return false;
    }
}

// 5. データベース状態確認
async function checkDatabaseState() {
    try {
        console.log('🔍 データベース状態確認...');
        
        // inspirationsテーブル確認
        const { data: inspirations, error: inspError } = await supabase
            .from('inspirations')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(3);
        
        console.log('📊 最新のインスピレーション:', inspError ? `❌ ${inspError.message}` : `✅ ${inspirations?.length || 0}件`);
        
        // point_historyテーブル確認
        const { data: points, error: pointsError } = await supabase
            .from('point_history')
            .select('*')
            .eq('source_type', 'inspiration_given')
            .order('created_at', { ascending: false })
            .limit(3);
        
        console.log('📊 インスピレーションポイント履歴:', pointsError ? `❌ ${pointsError.message}` : `✅ ${points?.length || 0}件`);
        
        // user_pointsテーブル確認
        const { data: userPoints, error: userPointsError } = await supabase
            .from('user_points')
            .select('*')
            .order('total_points', { ascending: false })
            .limit(3);
        
        console.log('📊 ユーザーポイント:', userPointsError ? `❌ ${userPointsError.message}` : `✅ ${userPoints?.length || 0}人`);
        
        return {
            inspirations: inspirations || [],
            points: points || [],
            userPoints: userPoints || []
        };
    } catch (error) {
        console.error('❌ データベース状態確認エラー:', error);
        return null;
    }
}

// 6. 完全テストフロー
async function runFixedInsprationTest() {
    console.log('🚀 修正版インスピレーションテスト開始...\n');
    
    // Step 1: テーブル構造確認
    console.log('--- Step 1: テーブル構造確認 ---');
    await checkTableStructure();
    
    // Step 2: ユーザー確認
    console.log('\n--- Step 2: ユーザー確認 ---');
    const user = await getCurrentUser();
    
    // Step 3: 投稿データ取得
    console.log('\n--- Step 3: 投稿データ取得 ---');
    const posts = await getPostsData();
    
    // Step 4: データベース状態確認
    console.log('\n--- Step 4: データベース状態確認 ---');
    await checkDatabaseState();
    
    // Step 5: インスピレーション作成テスト
    if (user && posts.length >= 2) {
        console.log('\n--- Step 5: インスピレーション作成テスト ---');
        const success = await testInspiration(posts[1].id, posts[0].id, user.id);
        
        if (success) {
            console.log('\n--- Step 6: テスト後のデータベース状態 ---');
            await checkDatabaseState();
        }
    } else {
        console.log('\n⚠️ インスピレーション作成テストをスキップ（ユーザーまたは投稿データ不足）');
    }
    
    console.log('\n✅ 修正版テスト完了！');
}

// 使用方法表示
console.log(`
🎯 **修正版インスピレーション機能テスト**

1. 完全テスト:
   runFixedInsprationTest()

2. 個別確認:
   checkTableStructure()
   getCurrentUser()
   getPostsData() 
   checkDatabaseState()

📝 まず runFixedInsprationTest() を実行してください
`);

// 自動実行（コメントアウトを外すと自動実行）
// runFixedInsprationTest();