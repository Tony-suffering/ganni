import { supabase } from '../supabase';
import { PhotoScoringService } from '../services/photoScoringService';

// グローバル関数として追加（開発用）
if (typeof window !== 'undefined') {
  (window as any).updateExistingPhotoScores = updateExistingPhotoScores;
  (window as any).updateSinglePhotoScore = updateSinglePhotoScore;
}

/**
 * 既存の写真スコアに画像分析データを追加するユーティリティ
 */
export async function updateExistingPhotoScores() {
  console.log('🔄 既存の写真スコアに画像分析データを追加開始...');
  
  try {
    // image_analysisがNULLの写真スコアを取得
    const { data: photoScores, error: fetchError } = await supabase
      .from('photo_scores')
      .select(`
        id,
        post_id,
        posts!inner(id, title, user_comment, image_url)
      `)
      .is('image_analysis', null)
      .limit(10); // 一度に10件まで処理

    if (fetchError) {
      console.error('❌ 写真スコア取得エラー:', fetchError);
      return { success: false, error: fetchError.message };
    }

    if (!photoScores || photoScores.length === 0) {
      console.log('✅ 更新が必要な写真スコアはありません');
      return { success: true, updated: 0 };
    }

    console.log(`📊 ${photoScores.length}件の写真スコアを更新します`);

    const scoringService = new PhotoScoringService();
    let updatedCount = 0;

    for (const scoreData of photoScores) {
      try {
        const post = (scoreData as any).posts;
        console.log(`🔄 処理中: "${post.title}" (ID: ${post.id})`);

        // 画像分析を含む新しいスコアを生成
        const newScore = await scoringService.scorePhoto(
          post.image_url,
          post.title,
          post.user_comment
        );

        if (newScore.imageAnalysis) {
          // データベースを更新
          const { error: updateError } = await supabase
            .from('photo_scores')
            .update({
              image_analysis: newScore.imageAnalysis
            })
            .eq('id', scoreData.id);

          if (updateError) {
            console.error(`❌ 更新エラー (ID: ${scoreData.id}):`, updateError);
          } else {
            console.log(`✅ 更新完了: "${post.title}"`);
            console.log(`   └ 具体的内容: ${newScore.imageAnalysis.specificContent || '不明'}`);
            console.log(`   └ 主被写体: ${newScore.imageAnalysis.mainSubject || '不明'}`);
            updatedCount++;
          }
        } else {
          console.log(`⚠️ 画像分析データが生成されませんでした: "${post.title}"`);
        }

        // API制限を避けるため少し待機
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`❌ 処理エラー (ID: ${scoreData.id}):`, error);
      }
    }

    console.log(`🎉 完了: ${updatedCount}/${photoScores.length}件を更新しました`);
    return { success: true, updated: updatedCount };

  } catch (error) {
    console.error('❌ 更新処理でエラー:', error);
    return { success: false, error: error instanceof Error ? error.message : '不明なエラー' };
  }
}

/**
 * 特定の投稿の写真スコアに画像分析データを追加
 */
export async function updateSinglePhotoScore(postId: string) {
  console.log(`🔄 投稿 ${postId} の画像分析データを更新...`);
  
  try {
    // 投稿と写真スコアを取得
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, title, user_comment, image_url')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      console.error('❌ 投稿取得エラー:', postError);
      return { success: false, error: '投稿が見つかりません' };
    }

    const { data: photoScore, error: scoreError } = await supabase
      .from('photo_scores')
      .select('id')
      .eq('post_id', postId)
      .single();

    if (scoreError || !photoScore) {
      console.error('❌ 写真スコア取得エラー:', scoreError);
      return { success: false, error: '写真スコアが見つかりません' };
    }

    // 画像分析を含む新しいスコアを生成
    const scoringService = new PhotoScoringService();
    const newScore = await scoringService.scorePhoto(
      post.image_url,
      post.title,
      post.user_comment
    );

    if (!newScore.imageAnalysis) {
      return { success: false, error: '画像分析データが生成されませんでした' };
    }

    // データベースを更新
    const { error: updateError } = await supabase
      .from('photo_scores')
      .update({
        image_analysis: newScore.imageAnalysis
      })
      .eq('id', photoScore.id);

    if (updateError) {
      console.error('❌ 更新エラー:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log(`✅ 更新完了: "${post.title}"`);
    console.log(`   └ 具体的内容: ${newScore.imageAnalysis.specificContent || '不明'}`);
    console.log(`   └ 主被写体: ${newScore.imageAnalysis.mainSubject || '不明'}`);

    return { success: true, imageAnalysis: newScore.imageAnalysis };

  } catch (error) {
    console.error('❌ 更新処理でエラー:', error);
    return { success: false, error: error instanceof Error ? error.message : '不明なエラー' };
  }
}