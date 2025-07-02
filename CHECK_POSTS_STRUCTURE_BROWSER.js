// =============================================
// postsテーブル構造確認（ブラウザコンソール用）
// 使用方法: アプリでF12 → Console → このスクリプトを実行
// =============================================

console.log('🔍 postsテーブル構造確認を開始...');

// Supabaseクライアント取得
let supabaseClient = null;

if (typeof supabase !== 'undefined') {
    supabaseClient = supabase;
    console.log('✅ グローバルsupabaseクライアント取得成功');
} else if (typeof window._supabase !== 'undefined') {
    supabaseClient = window._supabase;
    console.log('✅ window._supabaseクライアント取得成功');
} else {
    console.log('❌ Supabaseクライアントが見つかりません');
}

// postsテーブル構造確認関数
async function checkPostsTableStructure() {
    if (!supabaseClient) {
        console.error('❌ Supabaseクライアントが利用できません');
        return;
    }

    try {
        console.log('📊 postsテーブルのサンプルデータを取得...');
        
        // サンプルデータを取得してカラム構造を確認
        const { data: posts, error: postsError } = await supabaseClient
            .from('posts')
            .select('*')
            .limit(1);

        if (postsError) {
            console.error('❌ postsテーブル取得エラー:', postsError);
            return;
        }

        if (!posts || posts.length === 0) {
            console.log('⚠️ postsテーブルにデータがありません');
            return;
        }

        const samplePost = posts[0];
        console.log('📝 サンプル投稿データ:', samplePost);
        
        // カラム名を抽出
        const columns = Object.keys(samplePost);
        console.log('📋 postsテーブルのカラム一覧:', columns);
        
        // ユーザー関連カラムを特定
        const userColumns = columns.filter(col => 
            col.includes('user') || 
            col.includes('author') || 
            col.includes('creator') || 
            col.includes('owner') ||
            col.includes('created_by')
        );
        
        console.log('👤 ユーザー関連カラム:', userColumns);
        
        // 最も可能性の高いカラムを特定
        let primaryUserColumn = null;
        if (userColumns.includes('author_id')) {
            primaryUserColumn = 'author_id';
        } else if (userColumns.includes('user_id')) {
            primaryUserColumn = 'user_id';
        } else if (userColumns.includes('created_by')) {
            primaryUserColumn = 'created_by';
        } else if (userColumns.includes('owner_id')) {
            primaryUserColumn = 'owner_id';
        } else if (userColumns.length > 0) {
            primaryUserColumn = userColumns[0];
        }
        
        console.log('✅ 推奨ユーザーカラム:', primaryUserColumn);
        
        // カラムの値の型を確認
        if (primaryUserColumn && samplePost[primaryUserColumn]) {
            console.log(`📝 ${primaryUserColumn}の値例:`, samplePost[primaryUserColumn]);
            console.log(`📝 ${primaryUserColumn}の型:`, typeof samplePost[primaryUserColumn]);
        }
        
        // 修正用SQLを生成
        if (primaryUserColumn) {
            console.log('🔧 修正用SQL:');
            console.log(`
-- postsテーブルの正しいカラム名: ${primaryUserColumn}
-- 以下のSQLで設定を更新してください:

SELECT set_config('app.posts_user_column', '${primaryUserColumn}', false);

-- または、マイグレーションファイルの先頭に以下を追加:
DO $$
BEGIN
  PERFORM set_config('app.posts_user_column', '${primaryUserColumn}', false);
  RAISE NOTICE 'postsテーブルのユーザーカラムを % に設定しました', '${primaryUserColumn}';
END $$;
            `);
        }
        
        // 現在のusePosts実装との整合性確認
        console.log('🔄 usePosts実装との整合性確認...');
        
        // Reactアプリでauthorオブジェクトがどのように構成されているかチェック
        if (samplePost.author) {
            console.log('👤 author オブジェクト:', samplePost.author);
        }
        
        // リレーション情報の確認
        const relationColumns = columns.filter(col => 
            typeof samplePost[col] === 'object' && samplePost[col] !== null
        );
        console.log('🔗 リレーション カラム:', relationColumns);
        
        console.log('✅ postsテーブル構造確認完了');
        
        return {
            columns,
            userColumns,
            primaryUserColumn,
            samplePost
        };
        
    } catch (error) {
        console.error('❌ 構造確認エラー:', error);
    }
}

// 自動実行
if (supabaseClient) {
    console.log('🚀 postsテーブル構造確認を自動実行...');
    checkPostsTableStructure();
} else {
    console.log('💡 Supabaseクライアント設定後、checkPostsTableStructure() を実行してください');
}

// グローバル関数として登録
window.checkPostsTableStructure = checkPostsTableStructure;

console.log(`
🎯 **postsテーブル構造確認ツール**

📋 実行コマンド:
- checkPostsTableStructure() : テーブル構造の詳細確認

💡 確認ポイント:
1. ユーザー関連カラムの名前
2. データの型と構造
3. リレーション情報
4. usePosts実装との整合性

🔧 問題解決:
確認結果に基づいて正しいカラム名でマイグレーションを修正します
`);