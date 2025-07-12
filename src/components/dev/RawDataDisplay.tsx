import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

interface RawPostData {
  id: string;
  title: string;
  user_comment: string;
  ai_description: string;
  created_at: string;
  author_id: string;
  profiles?: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
}

interface RawPhotoScore {
  id: string;
  post_id: string;
  technical_score: number;
  composition_score: number;
  creativity_score: number;
  engagement_score: number;
  total_score: number;
  score_level: string;
  level_description: string;
  ai_comment: string;
  image_analysis?: any;
  created_at: string;
  updated_at: string;
}

interface RawAIComment {
  id: string;
  post_id: string;
  type: string;
  content: string;
  created_at: string;
}

export const RawDataDisplay: React.FC = () => {
  const [posts, setPosts] = useState<RawPostData[]>([]);
  const [photoScores, setPhotoScores] = useState<RawPhotoScore[]>([]);
  const [aiComments, setAIComments] = useState<RawAIComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRawData = async () => {
      try {
        setLoading(true);
        console.log('🔍 Supabaseから実際のデータを取得中...');
        
        // 最新の3つの投稿を取得
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select(`
            id,
            title,
            user_comment,
            ai_description,
            created_at,
            author_id,
            profiles:author_id (id, name, avatar_url)
          `)
          .order('created_at', { ascending: false })
          .limit(3);

        if (postsError) {
          console.error('投稿データ取得エラー:', postsError);
          setError('投稿データの取得に失敗しました: ' + postsError.message);
          return;
        }

        console.log('✅ 投稿データ取得成功:', postsData?.length, '件');
        console.log('投稿データ詳細:', postsData);
        setPosts(postsData || []);

        // 各投稿のphoto_scoresを取得
        if (postsData && postsData.length > 0) {
          const postIds = postsData.map(post => post.id);
          
          const { data: scoresData, error: scoresError } = await supabase
            .from('photo_scores')
            .select('*')
            .in('post_id', postIds);

          if (scoresError) {
            console.error('photo_scoresデータ取得エラー:', scoresError);
          } else {
            console.log('✅ photo_scoresデータ取得成功:', scoresData?.length, '件');
            console.log('photo_scoresデータ詳細:', scoresData);
            setPhotoScores(scoresData || []);
          }

          // 各投稿のai_commentsを取得
          const { data: commentsData, error: commentsError } = await supabase
            .from('ai_comments')
            .select('*')
            .in('post_id', postIds);

          if (commentsError) {
            console.error('ai_commentsデータ取得エラー:', commentsError);
          } else {
            console.log('✅ ai_commentsデータ取得成功:', commentsData?.length, '件');
            console.log('ai_commentsデータ詳細:', commentsData);
            setAIComments(commentsData || []);
          }
        }

      } catch (err: any) {
        console.error('データ取得エラー:', err);
        setError('データの取得に失敗しました: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRawData();
  }, []);

  const getPhotoScoreForPost = (postId: string) => {
    return photoScores.find(score => score.post_id === postId);
  };

  const getAICommentsForPost = (postId: string) => {
    return aiComments.filter(comment => comment.post_id === postId);
  };

  if (loading) {
    return (
      <div className="p-8 bg-gray-100 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">
            Supabase実データ表示
          </h1>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">データを読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-gray-100 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-red-600">
            データ取得エラー
          </h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          Supabase実データ表示（生データ）
        </h1>
        
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-700 text-sm">
            これはSupabaseデータベースから取得した実際のデータをそのまま表示しています。
            データの加工や変更は一切行われていません。
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">投稿データが見つかりませんでした。</p>
          </div>
        ) : (
          <div className="space-y-8">
            {posts.map((post, index) => {
              const photoScore = getPhotoScoreForPost(post.id);
              const postAIComments = getAICommentsForPost(post.id);
              
              return (
                <div key={post.id} className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-2xl font-bold mb-4 text-gray-800">
                    投稿 #{index + 1}
                  </h2>
                  
                  {/* 基本投稿情報 */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 text-green-600">
                      📝 投稿基本情報（postsテーブル）
                    </h3>
                    <div className="bg-gray-50 rounded p-4 space-y-2">
                      <p><strong>ID:</strong> {post.id}</p>
                      <p><strong>タイトル（そのまま）:</strong> "{post.title}"</p>
                      <p><strong>ユーザーコメント（そのまま）:</strong> "{post.user_comment}"</p>
                      <p><strong>AI説明（そのまま）:</strong> "{post.ai_description}"</p>
                      <p><strong>作成日時:</strong> {new Date(post.created_at).toLocaleString('ja-JP')}</p>
                      <p><strong>作成者ID:</strong> {post.author_id}</p>
                      {post.profiles && (
                        <p><strong>作成者名（そのまま）:</strong> "{post.profiles.name}"</p>
                      )}
                    </div>
                  </div>

                  {/* Photo Scores */}
                  {photoScore && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 text-purple-600">
                        📊 写真スコア（photo_scoresテーブル）
                      </h3>
                      <div className="bg-purple-50 rounded p-4 space-y-2">
                        <p><strong>総合スコア:</strong> {photoScore.total_score}</p>
                        <p><strong>技術スコア:</strong> {photoScore.technical_score}</p>
                        <p><strong>構図スコア:</strong> {photoScore.composition_score}</p>
                        <p><strong>創造性スコア:</strong> {photoScore.creativity_score}</p>
                        <p><strong>エンゲージメントスコア:</strong> {photoScore.engagement_score}</p>
                        <p><strong>レベル:</strong> {photoScore.score_level}</p>
                        <p><strong>レベル説明:</strong> "{photoScore.level_description}"</p>
                        <p><strong>AI評価コメント（そのまま）:</strong> "{photoScore.ai_comment}"</p>
                        <p><strong>作成日時:</strong> {new Date(photoScore.created_at).toLocaleString('ja-JP')}</p>
                        <p><strong>更新日時:</strong> {new Date(photoScore.updated_at).toLocaleString('ja-JP')}</p>
                        {photoScore.image_analysis && (
                          <div>
                            <strong>画像解析データ:</strong>
                            <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-auto">
                              {JSON.stringify(photoScore.image_analysis, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* AI Comments */}
                  {postAIComments.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 text-blue-600">
                        🤖 AIコメント（ai_commentsテーブル）
                      </h3>
                      <div className="space-y-3">
                        {postAIComments.map((comment, commentIndex) => (
                          <div key={comment.id} className="bg-blue-50 rounded p-4">
                            <p><strong>コメント #{commentIndex + 1}</strong></p>
                            <p><strong>タイプ:</strong> {comment.type}</p>
                            <p><strong>内容（そのまま）:</strong> "{comment.content}"</p>
                            <p><strong>作成日時:</strong> {new Date(comment.created_at).toLocaleString('ja-JP')}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                      上記のデータは全てSupabaseデータベースから直接取得した生データです。
                      文字列の前後の引用符も含めて、データの加工は一切行われていません。
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};