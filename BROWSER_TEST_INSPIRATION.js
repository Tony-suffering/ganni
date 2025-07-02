// =============================================
// ブラウザコンソールでのインスピレーション機能テスト
// 使用方法: ブラウザのDeveloper Toolsのコンソールにコピペして実行
// =============================================

// 1. Supabaseクライアントの存在確認
console.log('🔍 Supabase Client:', window.supabase || 'Not found');

// 2. 現在のユーザー確認
async function checkCurrentUser() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        console.log('👤 Current User:', user);
        return user;
    } catch (error) {
        console.error('❌ User check error:', error);
        return null;
    }
}

// 3. 最新の投稿を取得
async function getLatestPosts() {
    try {
        const { data, error } = await supabase
            .from('posts')
            .select('id, title, user_id, created_at')
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (error) throw error;
        console.log('📝 Latest Posts:', data);
        return data;
    } catch (error) {
        console.error('❌ Posts fetch error:', error);
        return [];
    }
}

// 4. インスピレーション関数をテスト
async function testInspirationFunction(sourcePostId, inspiredPostId, userId) {
    try {
        console.log('🧪 Testing inspiration function with:', {
            sourcePostId,
            inspiredPostId,
            userId
        });
        
        const { data, error } = await supabase.rpc('create_inspiration_simple', {
            p_source_post_id: sourcePostId,
            p_inspired_post_id: inspiredPostId,
            p_creator_id: userId,
            p_inspiration_type: 'direct',
            p_inspiration_note: 'ブラウザテスト用'
        });
        
        if (error) {
            console.error('❌ Inspiration function error:', error);
            return null;
        }
        
        console.log('✅ Inspiration created:', data);
        return data;
    } catch (error) {
        console.error('❌ Unexpected error:', error);
        return null;
    }
}

// 5. ポイント確認
async function checkUserPoints(userId) {
    try {
        const { data, error } = await supabase.rpc('check_inspiration_points', {
            p_user_id: userId
        });
        
        if (error) {
            console.error('❌ Points check error:', error);
            return null;
        }
        
        console.log('💎 User Points:', data);
        return data;
    } catch (error) {
        console.error('❌ Points check unexpected error:', error);
        return null;
    }
}

// 6. インスピレーション情報確認
async function checkInspirationData(postId) {
    try {
        const { data, error } = await supabase.rpc('get_inspiration_data', {
            p_post_id: postId
        });
        
        if (error) {
            console.error('❌ Inspiration data error:', error);
            return null;
        }
        
        console.log('🎨 Inspiration Data:', data);
        return data;
    } catch (error) {
        console.error('❌ Inspiration data unexpected error:', error);
        return null;
    }
}

// 7. 完全テストフロー
async function runFullInspirationTest() {
    console.log('🚀 Starting full inspiration test...');
    
    // Step 1: ユーザー確認
    const user = await checkCurrentUser();
    if (!user) {
        console.log('❌ No user logged in. Please log in first.');
        return;
    }
    
    // Step 2: 投稿取得
    const posts = await getLatestPosts();
    if (posts.length < 2) {
        console.log('❌ Need at least 2 posts to test inspiration.');
        return;
    }
    
    const sourcePost = posts[1]; // 2番目の投稿を元投稿として使用
    const inspiredPost = posts[0]; // 1番目の投稿をインスピレーション投稿として使用
    
    console.log('📋 Test Setup:', {
        sourcePost: sourcePost.title,
        inspiredPost: inspiredPost.title,
        user: user.email
    });
    
    // Step 3: インスピレーション作成前のポイント確認
    console.log('\n--- Before Inspiration ---');
    await checkUserPoints(user.id);
    
    // Step 4: インスピレーション作成
    console.log('\n--- Creating Inspiration ---');
    const inspirationId = await testInspirationFunction(
        sourcePost.id,
        inspiredPost.id,
        user.id
    );
    
    if (!inspirationId) {
        console.log('❌ Failed to create inspiration');
        return;
    }
    
    // Step 5: インスピレーション作成後のポイント確認
    console.log('\n--- After Inspiration ---');
    await checkUserPoints(user.id);
    
    // Step 6: インスピレーション情報確認
    console.log('\n--- Inspiration Data Check ---');
    await checkInspirationData(inspiredPost.id);
    
    console.log('✅ Full test completed!');
}

// 使用方法をコンソールに表示
console.log(`
🎯 **インスピレーション機能テスト方法**

1. 基本テスト:
   runFullInspirationTest()

2. 個別テスト:
   checkCurrentUser()
   getLatestPosts()
   checkUserPoints('ユーザーID')
   checkInspirationData('投稿ID')

3. 手動テスト:
   testInspirationFunction('元投稿ID', '新投稿ID', 'ユーザーID')

📝 まず runFullInspirationTest() を実行してください
`);

// 自動実行（コメントアウトを外すと即座に実行されます）
// runFullInspirationTest();