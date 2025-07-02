// usePosts.ts の 439-458行目を以下のコードに置き換えてください

// 7. インスピレーション情報を保存（ポイント付与含む）
if (newPostInput.inspirationSourceId) {
  console.log('🎨 インスピレーション情報を保存:', {
    sourceId: newPostInput.inspirationSourceId,
    type: newPostInput.inspirationType,
    note: newPostInput.inspirationNote
  });
  
  try {
    // ポイント付与を含む完全なインスピレーション処理を実行
    const { data: inspirationId, error: inspirationError } = await supabase
      .rpc('create_inspiration_simple', {
        p_source_post_id: newPostInput.inspirationSourceId,
        p_inspired_post_id: postData.id,
        p_creator_id: userId,
        p_inspiration_type: newPostInput.inspirationType || 'direct',
        p_inspiration_note: newPostInput.inspirationNote ? decodeURIComponent(newPostInput.inspirationNote) : null
      });
    
    if (inspirationError) {
      console.error('❌ インスピレーション保存エラー:', inspirationError);
      // ポイント関連のエラーでも投稿自体は成功させる
    } else {
      console.log('✅ インスピレーション保存成功！ID:', inspirationId);
      
      // ポイント付与の確認
      try {
        const { data: pointsCheck } = await supabase
          .rpc('check_inspiration_points', { p_user_id: userId });
        console.log('💎 ポイント確認:', pointsCheck);
      } catch (pointsError) {
        console.log('ポイント確認エラー:', pointsError);
      }
    }
  } catch (error) {
    console.error('❌ インスピレーション保存で予期しないエラー:', error);
    // どんなエラーでも投稿は継続
  }
}