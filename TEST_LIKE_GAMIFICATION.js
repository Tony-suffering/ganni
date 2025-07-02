// =============================================
// いいね機能ゲーミフィケーション統合テスト
// 使用方法: アプリのページでF12 → Console → 実行
// =============================================

console.log('🧪 いいね機能ゲーミフィケーション統合テストを開始...');

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
    console.log('💡 ブラウザで以下を実行してください:');
    console.log('   window._supabase = [あなたのSupabaseクライアント];');
}

// テスト実行関数
async function testLikeGamification() {
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
        
        // 1. テスト前のポイント状況確認
        console.log('📊 テスト前のポイント状況確認...');
        const { data: beforePoints, error: beforeError } = await supabaseClient
            .from('user_points')
            .select('*')
            .eq('user_id', currentUserId)
            .single();
            
        if (beforeError && beforeError.code !== 'PGRST116') { // PGRST116 = no rows found
            console.error('❌ ポイント確認エラー:', beforeError);
            return;
        }
        
        console.log('💎 テスト前ポイント:', beforePoints || 'ポイント未初期化');
        
        // 2. テスト対象の投稿を取得（自分以外の投稿）
        console.log('🔍 テスト対象投稿を検索...');
        const { data: testPosts, error: postsError } = await supabaseClient
            .from('posts')
            .select('id, title, user_id')
            .neq('user_id', currentUserId)
            .limit(3);
            
        if (postsError) {
            console.error('❌ 投稿取得エラー:', postsError);
            return;
        }
        
        if (!testPosts || testPosts.length === 0) {
            console.log('⚠️ テスト可能な投稿が見つかりません（他のユーザーの投稿が必要）');
            return;
        }
        
        const targetPost = testPosts[0];
        console.log('🎯 テスト対象投稿:', targetPost);
        
        // 3. 既存のいいねを確認・削除
        console.log('🧹 既存のいいねをクリアしています...');
        const { error: deleteError } = await supabaseClient
            .from('likes')
            .delete()
            .eq('user_id', currentUserId)
            .eq('post_id', targetPost.id);
            
        if (deleteError) {
            console.warn('⚠️ 既存いいね削除エラー（継続）:', deleteError);
        }
        
        // 少し待機
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 4. いいねを実行
        console.log('❤️ いいねを実行中...');
        const { data: likeData, error: likeError } = await supabaseClient
            .from('likes')
            .insert([{
                user_id: currentUserId,
                post_id: targetPost.id
            }])
            .select()
            .single();
            
        if (likeError) {
            console.error('❌ いいね実行エラー:', likeError);
            return;
        }
        
        console.log('✅ いいね実行成功:', likeData);
        
        // 5. ポイント付与を待機して確認
        console.log('⏳ ポイント付与処理を待機中...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 6. テスト後のポイント状況確認
        console.log('📊 テスト後のポイント状況確認...');
        const { data: afterPoints, error: afterError } = await supabaseClient
            .from('user_points')
            .select('*')
            .eq('user_id', currentUserId)
            .single();
            
        if (afterError) {
            console.error('❌ テスト後ポイント確認エラー:', afterError);
            return;
        }
        
        console.log('💎 テスト後ポイント:', afterPoints);
        
        // 7. ポイント履歴確認
        console.log('📝 ポイント履歴確認...');
        const { data: pointHistory, error: historyError } = await supabaseClient
            .from('point_history')
            .select('*')
            .eq('user_id', currentUserId)
            .in('source_type', ['like_given', 'like_received'])
            .order('created_at', { ascending: false })
            .limit(5);
            
        if (historyError) {
            console.error('❌ ポイント履歴確認エラー:', historyError);
        } else {
            console.log('📈 最新いいねポイント履歴:', pointHistory);
        }
        
        // 8. 投稿者のポイント確認
        console.log('👤 投稿者のポイント確認...');
        const { data: authorPoints, error: authorError } = await supabaseClient
            .from('user_points')
            .select('*')
            .eq('user_id', targetPost.user_id)
            .single();
            
        if (authorError) {
            console.warn('⚠️ 投稿者ポイント確認エラー:', authorError);
        } else {
            console.log('👥 投稿者ポイント状況:', authorPoints);
        }
        
        // 9. 活動ログ確認
        console.log('📊 活動ログ確認...');
        const today = new Date().toISOString().split('T')[0];
        const { data: activityLog, error: activityError } = await supabaseClient
            .from('daily_activity_logs')
            .select('*')
            .eq('user_id', currentUserId)
            .eq('activity_date', today)
            .single();
            
        if (activityError) {
            console.warn('⚠️ 活動ログ確認エラー:', activityError);
        } else {
            console.log('📅 今日の活動ログ:', activityLog);
        }
        
        // 10. いいね削除テスト
        console.log('🗑️ いいね削除テスト...');
        const { error: unlikeError } = await supabaseClient
            .from('likes')
            .delete()
            .eq('user_id', currentUserId)
            .eq('post_id', targetPost.id);
            
        if (unlikeError) {
            console.error('❌ いいね削除エラー:', unlikeError);
        } else {
            console.log('✅ いいね削除成功');
            
            // 削除後のポイント確認
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const { data: finalPoints } = await supabaseClient
                .from('user_points')
                .select('*')
                .eq('user_id', currentUserId)
                .single();
                
            console.log('💎 いいね削除後ポイント:', finalPoints);
        }
        
        // 11. 結果まとめ
        console.log('\n🎯 テスト結果まとめ:');
        console.log('=====================================');
        
        if (beforePoints && afterPoints) {
            const lpDiff = (afterPoints.learning_points || 0) - (beforePoints.learning_points || 0);
            const ipDiff = (afterPoints.influence_points || 0) - (beforePoints.influence_points || 0);
            
            console.log(`📈 LP変化: ${beforePoints.learning_points || 0} → ${afterPoints.learning_points || 0} (${lpDiff >= 0 ? '+' : ''}${lpDiff})`);
            console.log(`📈 IP変化: ${beforePoints.influence_points || 0} → ${afterPoints.influence_points || 0} (${ipDiff >= 0 ? '+' : ''}${ipDiff})`);
            
            if (ipDiff > 0) {
                console.log('✅ いいね送信でIP付与成功');
            } else {
                console.log('❌ いいね送信でIP付与失敗');
            }
        } else {
            console.log('⚠️ ポイント比較データ不足');
        }
        
        if (pointHistory && pointHistory.length > 0) {
            console.log('✅ ポイント履歴記録成功');
        } else {
            console.log('❌ ポイント履歴記録失敗');
        }
        
        if (activityLog && activityLog.likes_given > 0) {
            console.log('✅ 活動ログ更新成功');
        } else {
            console.log('❌ 活動ログ更新失敗');
        }
        
        console.log('=====================================');
        console.log('🎉 いいね機能ゲーミフィケーションテスト完了！');
        
    } catch (error) {
        console.error('❌ テスト実行エラー:', error);
    }
}

// データベーストリガー確認関数
async function checkTriggers() {
    if (!supabaseClient) {
        console.error('❌ Supabaseクライアントが利用できません');
        return;
    }
    
    console.log('🔍 データベーストリガー確認...');
    
    const { data, error } = await supabaseClient.rpc('check_triggers_sql', {
        query: `
        SELECT 
            trigger_name,
            event_manipulation,
            action_timing,
            table_name
        FROM information_schema.triggers 
        WHERE trigger_name LIKE '%like%'
        ORDER BY trigger_name;
        `
    });
    
    if (error) {
        console.error('❌ トリガー確認エラー:', error);
    } else {
        console.log('🔧 いいね関連トリガー:', data);
    }
}

// 自動実行
if (supabaseClient) {
    console.log('🚀 テストを自動実行します...');
    testLikeGamification();
} else {
    console.log('💡 Supabaseクライアントを設定後、testLikeGamification() を実行してください');
}

// 手動実行用に関数をグローバルに登録
window.testLikeGamification = testLikeGamification;
window.checkTriggers = checkTriggers;

console.log(`
🎯 **いいね機能ゲーミフィケーションテスト**

📋 手動実行コマンド:
- testLikeGamification()  : 完全テスト実行
- checkTriggers()         : トリガー存在確認

💡 期待される動作:
- いいね送信: +1 IP (Influence Points)
- いいね受信: +2 LP (Learning Points)  
- いいね削除: ポイント減少
- 活動ログ: likes_given/likes_received 更新

🔧 トラブルシューティング:
- マイグレーション未実行の場合、supabase db push を実行
- 権限エラーの場合、RLSポリシーを確認
`);