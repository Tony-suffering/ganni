// =============================================
// ゲーミフィケーションシステム動作テスト
// ブラウザのコンソールで段階的に実行してください
// =============================================

console.log('🎮 ゲーミフィケーションシステム動作テスト開始');

// Step 1: 現在のユーザーを確認
async function checkCurrentUser() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        
        if (user) {
            console.log('✅ 認証済みユーザー:', user.id);
            window.testUserId = user.id;
            return user.id;
        } else {
            console.log('❌ 未認証です');
            return null;
        }
    } catch (error) {
        console.error('❌ ユーザー確認エラー:', error);
        return null;
    }
}

// Step 2: ユーザーポイントを確認
async function checkUserPoints(userId) {
    try {
        const { data, error } = await supabase
            .from('user_points')
            .select('*')
            .eq('user_id', userId)
            .single();
            
        if (error) {
            console.log('⚠️ ユーザーポイント未存在:', error.message);
            return null;
        } else {
            console.log('✅ ユーザーポイント:', data);
            return data;
        }
    } catch (error) {
        console.error('❌ ユーザーポイント確認エラー:', error);
        return null;
    }
}

// Step 3: 投稿ボーナス統計を確認
async function checkPostBonusStats(userId) {
    try {
        const { data, error } = await supabase
            .from('user_post_stats')
            .select('*')
            .eq('user_id', userId)
            .single();
            
        if (error) {
            console.log('⚠️ 投稿統計未存在:', error.message);
            return null;
        } else {
            console.log('✅ 投稿統計:', data);
            return data;
        }
    } catch (error) {
        console.error('❌ 投稿統計確認エラー:', error);
        return null;
    }
}

// Step 4: ポイント履歴を確認
async function checkPointHistory(userId) {
    try {
        const { data, error } = await supabase
            .from('point_history')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);
            
        if (error) {
            console.log('⚠️ ポイント履歴確認エラー:', error.message);
            return [];
        } else {
            console.log('✅ ポイント履歴（最新10件）:', data);
            return data;
        }
    } catch (error) {
        console.error('❌ ポイント履歴確認エラー:', error);
        return [];
    }
}

// Step 5: データベース関数をテスト
async function testDatabaseFunctions(userId) {
    console.log('🔧 データベース関数テスト開始...');
    
    // calculate_post_bonus関数のテスト
    try {
        const { data, error } = await supabase.rpc('calculate_post_bonus', {
            p_post_id: '00000000-0000-0000-0000-000000000000', // ダミーID
            p_user_id: userId,
            p_photo_score: 85
        });
        
        if (error) {
            console.log('⚠️ calculate_post_bonus関数エラー:', error.message);
        } else {
            console.log('✅ calculate_post_bonus関数動作:', data);
        }
    } catch (error) {
        console.error('❌ calculate_post_bonus関数テストエラー:', error);
    }
}

// Step 6: 投稿トリガーの動作確認
async function checkPostTriggers() {
    try {
        // トリガーが存在するかチェック
        const { data, error } = await supabase
            .from('information_schema.triggers')
            .select('trigger_name, event_manipulation, action_statement')
            .eq('trigger_name', 'trigger_post_created_bonus');
            
        if (error) {
            console.log('⚠️ トリガー確認不可:', error.message);
        } else if (data && data.length > 0) {
            console.log('✅ 投稿ボーナストリガー存在:', data);
        } else {
            console.log('❌ 投稿ボーナストリガーが見つからない');
        }
    } catch (error) {
        console.log('⚠️ トリガー確認エラー:', error);
    }
}

// Step 7: 総合テスト実行
async function runGamificationTest() {
    console.log('🚀 ゲーミフィケーション総合テスト実行中...');
    
    const userId = await checkCurrentUser();
    if (!userId) {
        console.log('❌ ユーザー認証が必要です');
        return;
    }
    
    console.log('\n--- ユーザーデータ確認 ---');
    const userPoints = await checkUserPoints(userId);
    const postStats = await checkPostBonusStats(userId);
    const pointHistory = await checkPointHistory(userId);
    
    console.log('\n--- システム機能確認 ---');
    await testDatabaseFunctions(userId);
    await checkPostTriggers();
    
    console.log('\n--- テスト結果サマリー ---');
    const hasPoints = userPoints !== null;
    const hasStats = postStats !== null;
    const hasHistory = pointHistory.length > 0;
    
    console.log('✅ ユーザーポイントテーブル:', hasPoints ? '動作中' : '未初期化');
    console.log('✅ 投稿統計テーブル:', hasStats ? '動作中' : '未初期化');
    console.log('✅ ポイント履歴:', hasHistory ? '動作中' : '未記録');
    
    if (hasPoints && hasStats) {
        console.log('🎉 ゲーミフィケーションシステムは基本的に動作しています！');
    } else {
        console.log('⚠️ ゲーミフィケーションシステムに問題があります');
        
        if (!hasPoints) {
            console.log('💡 対処法: 投稿を作成するかインスピレーションを受け取ってポイントを初期化してください');
        }
        
        if (!hasStats) {
            console.log('💡 対処法: 投稿を作成して統計を初期化してください');
        }
    }
    
    return {
        userId,
        hasPoints,
        hasStats,
        hasHistory,
        userPoints,
        postStats,
        pointHistory
    };
}

// 自動実行
if (typeof supabase !== 'undefined') {
    console.log('🔄 テストを自動実行します...');
    runGamificationTest().then(result => {
        console.log('📊 テスト完了結果:', result);
        window.gamificationTestResult = result;
    });
} else {
    console.log('❌ supabaseクライアントが見つかりません');
    console.log('💡 アプリページでF12を開いてから実行してください');
}

// 個別実行用の関数をグローバルに設定
window.gamificationTest = {
    checkCurrentUser,
    checkUserPoints,
    checkPostBonusStats,
    checkPointHistory,
    testDatabaseFunctions,
    checkPostTriggers,
    runGamificationTest
};

console.log('📝 個別テスト実行方法:');
console.log('  - window.gamificationTest.checkCurrentUser()');
console.log('  - window.gamificationTest.checkUserPoints(userId)');
console.log('  - window.gamificationTest.runGamificationTest()');