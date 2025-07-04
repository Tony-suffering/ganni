import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, Users, Lightbulb, Heart, Tag, TrendingUp, Zap, Trophy } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabase';
import { Post } from '../types';
import PostCard from '../components/PostCard';
import { MasonryGrid } from '../components/layout/MasonryGrid';

interface InspirationData {
  id: string;
  source_post_id: string;
  inspired_post_id: string;
  creator_id: string;
  inspiration_type: string;
  inspiration_note?: string;
  chain_level: number;
  created_at: string;
  inspired_post?: Post;
  creator?: {
    id: string;
    name: string;
    avatar: string;
  };
}

interface InspirationStats {
  post_id: string;
  inspiration_given_count: number;
  inspiration_received_count: number;
  chain_depth: number;
}

interface InspirationTag {
  id: string;
  name: string;
  description?: string;
  color: string;
}

interface AIInspirationSuggestion {
  id: string;
  suggested_post_id: string;
  suggestion_reason: string;
  similarity_score: number;
  suggestion_type: string;
  suggested_post?: Post;
}

export const InspirationLab: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [inspirations, setInspirations] = useState<InspirationData[]>([]);
  const [inspirationStats, setInspirationStats] = useState<InspirationStats | null>(null);
  const [similarUsers, setSimilarUsers] = useState<any[]>([]);
  const [inspirationTags, setInspirationTags] = useState<InspirationTag[]>([]);
  const [aiSuggestions, setAISuggestions] = useState<AIInspirationSuggestion[]>([]);
  const [selectedInspirationNote, setSelectedInspirationNote] = useState('');
  const [selectedInspirationType, setSelectedInspirationType] = useState('direct');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (postId) {
      fetchPostData();
      fetchInspirations();
      fetchInspirationStats();
      fetchSimilarUsers();
      fetchInspirationTags();
      if (user) {
        fetchAISuggestions();
      }
    }
  }, [postId, user]);

  const fetchPostData = async () => {
    if (!postId) return;

    try {
      setLoading(true);
      
      // メイン投稿を取得
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (postError) {
        console.error('投稿取得エラー:', postError);
        return;
      }

      if (!postData) {
        console.error('投稿データが見つかりません');
        return;
      }

      // 作成者情報を別途取得
      let authorData = null;
      if (postData.author_id) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, name, avatar_url')
          .eq('id', postData.author_id)
          .single();

        if (userError) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, name, avatar_url')
            .eq('id', postData.author_id)
            .single();

          if (!profileError && profileData) {
            authorData = profileData;
          }
        } else {
          authorData = userData;
        }
      }

      const authorName = authorData?.name || '匿名ユーザー';
      const avatarUrl = authorData?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=random`;

      // 投稿データを整形
      const formattedPost: Post = {
        id: postData.id,
        title: postData.title,
        imageUrl: postData.image_url,
        aiDescription: postData.ai_description || '',
        userComment: postData.user_comment || '',
        author: {
          id: postData.author_id,
          name: authorName,
          avatar: avatarUrl
        },
        tags: [],
        createdAt: postData.created_at,
        updatedAt: postData.updated_at,
        likeCount: 0,
        likedByCurrentUser: false,
        bookmarkedByCurrentUser: false,
        aiComments: [],
        commentCount: 0
      };

      setPost(formattedPost);

    } catch (error) {
      console.error('データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInspirations = async () => {
    if (!postId) return;

    try {
      // 新しいinspirationsテーブルからデータを取得
      const { data: inspirationsData, error: inspirationsError } = await supabase
        .from('inspirations')
        .select(`
          id,
          source_post_id,
          inspired_post_id,
          creator_id,
          inspiration_type,
          inspiration_note,
          chain_level,
          created_at
        `)
        .eq('source_post_id', postId)
        .order('created_at', { ascending: false });

      if (inspirationsError) {
        console.error('インスピレーション取得エラー:', inspirationsError);
        setInspirations([]);
        return;
      }

      if (!inspirationsData || inspirationsData.length === 0) {
        setInspirations([]);
        return;
      }

      // 投稿データと作成者データを並行して取得
      const postIds = inspirationsData.map(i => i.inspired_post_id);
      const creatorIds = inspirationsData.map(i => i.creator_id);

      const [postsResult, creatorsResult] = await Promise.all([
        supabase.from('posts').select('*').in('id', postIds),
        supabase.from('users').select('id, name, avatar_url').in('id', creatorIds)
      ]);

      const postsData = postsResult.data || [];
      let creatorsData = creatorsResult.data || [];

      // usersテーブルで取得できなかった場合はprofilesテーブルを試す
      if (creatorsResult.error) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .in('id', creatorIds);
        creatorsData = profilesData || [];
      }

      // データを整形
      const formattedInspirations: InspirationData[] = inspirationsData.map(inspiration => {
        const postData = postsData.find(p => p.id === inspiration.inspired_post_id);
        const creatorData = creatorsData.find(c => c.id === inspiration.creator_id);
        
        let formattedPost = null;
        if (postData) {
          const authorData = creatorsData.find(c => c.id === postData.author_id);
          const authorName = authorData?.name || '匿名ユーザー';
          const avatarUrl = authorData?.avatar_url || 
            `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=random`;

          formattedPost = {
            id: postData.id,
            title: postData.title,
            imageUrl: postData.image_url,
            aiDescription: postData.ai_description || '',
            userComment: postData.user_comment || '',
            author: {
              id: postData.author_id,
              name: authorName,
              avatar: avatarUrl
            },
            tags: [],
            createdAt: postData.created_at,
            updatedAt: postData.updated_at,
            likeCount: 0,
            likedByCurrentUser: false,
            bookmarkedByCurrentUser: false,
            aiComments: [],
            commentCount: 0
          };
        }

        return {
          ...inspiration,
          inspired_post: formattedPost,
          creator: creatorData ? {
            id: creatorData.id,
            name: creatorData.name || '匿名ユーザー',
            avatar: creatorData.avatar_url || 
              `https://ui-avatars.com/api/?name=${encodeURIComponent(creatorData.name || '匿名ユーザー')}&background=random`
          } : undefined
        };
      });

      setInspirations(formattedInspirations);
    } catch (error) {
      console.error('インスピレーション取得エラー:', error);
      setInspirations([]);
    }
  };

  const fetchInspirationStats = async () => {
    if (!postId) return;

    try {
      const { data: statsData, error: statsError } = await supabase
        .from('inspiration_stats')
        .select('*')
        .eq('post_id', postId)
        .single();

      if (statsError && statsError.code !== 'PGRST116') {
        console.error('統計取得エラー:', statsError);
      } else if (statsData) {
        setInspirationStats(statsData);
      }
    } catch (error) {
      console.error('統計取得エラー:', error);
    }
  };

  const fetchInspirationTags = async () => {
    try {
      const { data: tagsData, error: tagsError } = await supabase
        .from('inspiration_tags')
        .select('*')
        .order('name');

      if (tagsError) {
        console.error('タグ取得エラー:', tagsError);
      } else if (tagsData) {
        setInspirationTags(tagsData);
      }
    } catch (error) {
      console.error('タグ取得エラー:', error);
    }
  };

  const fetchAISuggestions = async () => {
    if (!user || !postId) return;

    try {
      const { data: suggestionsData, error: suggestionsError } = await supabase
        .from('ai_inspiration_suggestions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_viewed', false)
        .limit(3);

      if (suggestionsError) {
        console.error('AI提案取得エラー:', suggestionsError);
      } else if (suggestionsData) {
        // 提案された投稿の詳細を取得
        const suggestedPostIds = suggestionsData.map(s => s.suggested_post_id);
        const { data: postsData } = await supabase
          .from('posts')
          .select('*')
          .in('id', suggestedPostIds);

        const formattedSuggestions = suggestionsData.map(suggestion => ({
          ...suggestion,
          suggested_post: postsData?.find(p => p.id === suggestion.suggested_post_id)
        }));

        setAISuggestions(formattedSuggestions);
      }
    } catch (error) {
      console.error('AI提案取得エラー:', error);
    }
  };

  const fetchSimilarUsers = async () => {
    if (!postId || !user) return;

    try {
      // この投稿をブックマークした他のユーザーを取得
      const { data: bookmarks, error } = await supabase
        .from('bookmarks')
        .select('user_id')
        .eq('post_id', postId)
        .neq('user_id', user.id)
        .limit(6);

      if (error) {
        console.error('類似ユーザー取得エラー:', error);
        // ブックマークテーブルが存在しない場合は空配列を設定
        setSimilarUsers([]);
        return;
      }

      if (!bookmarks || bookmarks.length === 0) {
        setSimilarUsers([]);
        return;
      }

      // ユーザー情報を別途取得
      const userIds = bookmarks.map(b => b.user_id);
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, avatar_url')
        .in('id', userIds);

      if (usersError) {
        console.log('usersテーブル取得エラー、profilesテーブルを試行:', usersError);
        // profilesテーブルを試す
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .in('id', userIds);

        if (!profilesError && profilesData) {
          const users = profilesData.map(user => ({
            id: user.id,
            name: user.name || '匿名ユーザー',
            avatar: user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || '匿名ユーザー')}&background=random`
          }));
          setSimilarUsers(users);
        } else {
          setSimilarUsers([]);
        }
      } else if (usersData) {
        const users = usersData.map(user => ({
          id: user.id,
          name: user.name || '匿名ユーザー',
          avatar: user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || '匿名ユーザー')}&background=random`
        }));
        setSimilarUsers(users);
      }
    } catch (error) {
      console.error('類似ユーザー取得エラー:', error);
      setSimilarUsers([]);
    }
  };

  const handleCreateInspiredPost = () => {
    if (!user || !postId) return;
    
    // インスピレーション情報をURLパラメータで渡して新規投稿画面へ
    navigate(`/?inspiration=${postId}&type=${selectedInspirationType}&note=${encodeURIComponent(selectedInspirationNote)}`);
  };

  const getInspirationTypeLabel = (type: string) => {
    const typeLabels = {
      direct: '直接的',
      style: 'スタイル',
      concept: 'コンセプト',
      technique: '技法',
      composition: '構図',
      mood: 'ムード'
    };
    return typeLabels[type as keyof typeof typeLabels] || type;
  };

  const getInspirationTypeColor = (type: string) => {
    const typeColors = {
      direct: 'bg-gray-100 text-gray-900 border border-gray-300',
      style: 'bg-gray-200 text-gray-900 border border-gray-400',
      concept: 'bg-gray-300 text-gray-900 border border-gray-500',
      technique: 'bg-black text-white border border-gray-700',
      composition: 'bg-gray-600 text-white border border-gray-700',
      mood: 'bg-gray-800 text-white border border-gray-900'
    };
    return typeColors[type as keyof typeof typeColors] || 'bg-gray-100 text-gray-800 border border-gray-300';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500 mb-4">投稿が見つかりません</p>
          <button 
            onClick={() => navigate('/')} 
            className="btn-primary"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 mt-16 md:mt-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-16 md:top-20 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg shadow-md">
                  <Lightbulb className="w-6 h-6 text-gray-800 dark:text-gray-300" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    インスピレーション・ラボ
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    この写真からインスピレーションを受けよう
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Main Photo */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
            >
              <div className="aspect-square">
                <img
                  src={post.imageUrl}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {post.title}
                </h2>
                <div className="flex items-center space-x-3 mb-4">
                  <img
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {post.author.name}
                  </span>
                </div>
                {post.userComment && (
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    {post.userComment}
                  </p>
                )}
                {post.aiDescription && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>AI分析:</strong> {post.aiDescription}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right: Inspiration Options */}
          <div className="space-y-6">
            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                インスピレーション・アクション
              </h3>
              
              {/* インスピレーションタイプ選択 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  インスピレーションのタイプ
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'direct', label: '直接的', desc: 'そのまま真似' },
                    { value: 'style', label: 'スタイル', desc: '撮影スタイル' },
                    { value: 'concept', label: 'コンセプト', desc: 'アイデア' },
                    { value: 'technique', label: '技法', desc: '撮影技法' },
                    { value: 'composition', label: '構図', desc: '構図設計' },
                    { value: 'mood', label: 'ムード', desc: '雰囲気' }
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setSelectedInspirationType(type.value)}
                      className={`p-3 text-left rounded-lg border transition-all ${
                        selectedInspirationType === type.value
                          ? 'border-gray-800 bg-gray-800 text-white'
                          : 'border-gray-300 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="font-medium text-sm">{type.label}</div>
                      <div className="text-xs opacity-75">{type.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* インスピレーションメモ */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  インスピレーションメモ（任意）
                </label>
                <textarea
                  value={selectedInspirationNote}
                  onChange={(e) => setSelectedInspirationNote(e.target.value)}
                  placeholder="どこに魅力を感じましたか？（例：色使いが素敵、構図が印象的）"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleCreateInspiredPost}
                  className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-lg hover:from-gray-900 hover:to-black transition-all duration-200 shadow-lg"
                >
                  <Camera className="w-5 h-5" />
                  <span>この写真からインスパイアされて投稿する</span>
                </button>
                <button className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200">
                  <Heart className="w-5 h-5" />
                  <span>似た感じの写真を見る</span>
                </button>
              </div>
            </motion.div>

            {/* Similar Users */}
            {similarUsers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>この写真を気に入った他のユーザー</span>
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {similarUsers.map((user) => (
                    <div key={user.id} className="text-center">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-12 h-12 rounded-full mx-auto mb-2"
                      />
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {user.name}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Inspired Posts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                この写真からインスパイアされた投稿 ({inspirations.length}件)
              </h3>
              {inspirations.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lightbulb className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">
                    まだインスパイアされた投稿はありません
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                    最初の投稿者になってみませんか？
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {inspirations.map((inspiration) => (
                    <div key={inspiration.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                      {/* Inspiration Type and Chain Level */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${getInspirationTypeColor(inspiration.inspiration_type)}`}>
                            {getInspirationTypeLabel(inspiration.inspiration_type)}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            レベル {inspiration.chain_level}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          {new Date(inspiration.created_at).toLocaleDateString('ja-JP')}
                        </span>
                      </div>

                      {/* Inspiration Note */}
                      {inspiration.inspiration_note && (
                        <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border-l-4 border-blue-300 dark:border-blue-600">
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            <strong>インスピレーション:</strong> {inspiration.inspiration_note}
                          </p>
                        </div>
                      )}

                      {/* Inspired Post Info */}
                      {inspiration.inspired_post && (
                        <div className="flex space-x-3 cursor-pointer" onClick={() => navigate(`/post/${inspiration.inspired_post?.id}`)}>
                          <img
                            src={inspiration.inspired_post.imageUrl}
                            alt={inspiration.inspired_post.title}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {inspiration.inspired_post.title}
                            </h4>
                            <div className="flex items-center space-x-2 mt-1">
                              <img
                                src={inspiration.inspired_post.author.avatar}
                                alt={inspiration.inspired_post.author.name}
                                className="w-4 h-4 rounded-full"
                              />
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {inspiration.inspired_post.author.name}
                              </span>
                            </div>
                            {inspiration.inspired_post.userComment && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                {inspiration.inspired_post.userComment}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};