import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { X, User, Calendar, Tag as TagIcon, MessageCircle, Star, HelpCircle, Eye, Heart } from 'lucide-react';
import { LazyImage } from '../layout/LazyImage';
import { PhotoScoreDisplay } from '../scoring/PhotoScoreDisplay';
import { DetailedPhotoScoreDisplayV2 } from '../dev/DetailedPhotoScoreDisplayV2';
import { PersonalCuratorDisplay } from '../curator/PersonalCuratorDisplay';
import { Post, Comment } from '../../types';
import { supabase } from '../../supabase';
import { useAuth } from '../../contexts/AuthContext';
import { DevAuthService } from '../../utils/devAuth';

interface PostModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  likePost: (postId: string) => void;
  unlikePost: (postId: string) => void;
}

export const PostModal: React.FC<PostModalProps> = ({ post, isOpen, onClose, likePost, unlikePost }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const { user } = useAuth();

  const commentTypeLabels = {
    comment: { icon: MessageCircle, label: 'ゴシップ記事（笑）', color: 'text-blue-600', bgColor: 'bg-blue-50' },
    question: { icon: HelpCircle, label: '質問です！', color: 'text-green-600', bgColor: 'bg-green-50' },
    observation: { icon: Eye, label: 'また投稿してね！', color: 'text-purple-600', bgColor: 'bg-purple-50' },
    ai_comment: { icon: Star, label: 'AI評価', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
    ai_question: { icon: HelpCircle, label: 'AI質問', color: 'text-pink-600', bgColor: 'bg-pink-50' },
    ai_observation: { icon: Eye, label: 'AI観察', color: 'text-teal-600', bgColor: 'bg-teal-50' }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ライク機能のハンドラー
  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!post) return;
    
    if (post.likedByCurrentUser) {
      unlikePost(post.id);
    } else {
      likePost(post.id);
    }
  };

  // コメント一覧取得
  const fetchComments = async () => {
    if (!post) return;
    setLoadingComments(true);
    try {
      // まず、commentsテーブルが存在するかチェック
      console.log('Fetching comments for post:', post.id);
      
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('id, content, user_id, post_id, created_at')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });
      
      if (commentsError) {
        console.error('コメント取得エラー:', commentsError);
        console.error('エラー詳細:', {
          message: commentsError.message,
          details: commentsError.details,
          hint: commentsError.hint,
          code: commentsError.code
        });
        
        // テーブルが存在しない場合は空配列を設定
        setComments([]);
        return;
      }
      
      console.log('Comments data received:', commentsData);
      
      if (commentsData && commentsData.length > 0) {
        // ユーザー情報を取得
        const userIds = [...new Set(commentsData.map(c => c.user_id))];
        console.log('取得するユーザーID:', userIds);
        
        // 空の配列チェック
        if (userIds.length === 0) {
          console.log('ユーザーIDが空のため、ユーザー情報取得をスキップ');
          setComments([]);
          return;
        }
        
        // usersテーブルまたはprofilesテーブルからユーザー情報を取得
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, name, avatar_url')
          .in('id', userIds);
        
        let finalUsersData = usersData;
        
        if (usersError) {
          console.log('usersテーブルからの取得失敗、profilesテーブルを試行:', usersError);
          // usersテーブルが無い場合、profilesテーブルを試す
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, name, avatar_url')
            .in('id', userIds);
          
          if (profilesError) {
            console.log('profilesテーブルからの取得も失敗:', profilesError);
          } else {
            console.log('profilesからユーザー情報を取得:', profilesData);
            finalUsersData = profilesData;
          }
        } else {
          console.log('usersからユーザー情報を取得:', usersData);
        }
        
        // ユーザー情報のマップを作成
        const userMap = new Map();
        if (finalUsersData) {
          finalUsersData.forEach(user => userMap.set(user.id, user));
        }
        
        // 現在のユーザー情報も追加（認証されたユーザーの場合）
        if (user && !userMap.has(user.id)) {
          userMap.set(user.id, {
            id: user.id,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'ユーザー',
            avatar_url: user.user_metadata?.avatar_url
          });
        }
        
        // コメントデータにユーザー情報を結合
        const formattedComments: Comment[] = commentsData.map(comment => {
          const commentUser = userMap.get(comment.user_id);
          return {
            id: comment.id,
            content: comment.content,
            type: 'user',
            author_id: comment.user_id,
            post_id: comment.post_id,
            parent_id: null,
            published: true,
            created_at: comment.created_at,
            updated_at: comment.created_at,
            author: {
              id: comment.user_id,
              name: commentUser?.name || 'ユーザー',
              avatar_url: commentUser?.avatar_url
            }
          };
        });
        
        console.log('フォーマット済みコメント:', formattedComments);
        setComments(formattedComments);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error('コメント取得の予期しないエラー:', error);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    if (isOpen && post) {
      fetchComments();
    }
  }, [isOpen, post?.id]);

  useEffect(() => {
    if (!post) return;
    // Supabaseのリアルタイム購読
    const channelName = `comments_changes_${post.id}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `post_id=eq.${post.id}` },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [post?.id]);

  // コメント投稿
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !post) return;
    
    if (!user) {
      alert('コメント投稿にはログインが必要です');
      return;
    }
    
    try {
      // 認証状態を詳しくチェック
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('認証状態チェック:', {
        user: user,
        session: session,
        sessionError: sessionError
      });
      
      console.log('コメント投稿開始:', {
        post_id: post.id,
        user_id: user.id,
        content: newComment.trim()
      });
      
      // テスト用にuser_idを確実に設定
      const userId = user.id || 'test-user-id';
      console.log('使用するuser_id:', userId);
      
      const { data, error } = await supabase.from('comments').insert({
        post_id: post.id,
        user_id: userId,
        content: newComment.trim()
      }).select();
      
      if (error) {
        console.error('コメント投稿エラー:', error);
        console.error('エラー詳細:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        alert(`コメントの投稿に失敗しました: ${error.message}`);
        return;
      }
      
      console.log('コメント投稿成功:', data);
      
      // 投稿者に通知を送信（自分以外の場合）
      if (post.author.id !== user.id) {
        const { createNotification } = await import('../../utils/notifications');
        await createNotification({
          recipientId: post.author.id,
          senderId: user.id,
          postId: post.id,
          type: 'comment',
          content: newComment.trim()
        });
      }
      
      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('コメント投稿の予期しないエラー:', error);
      alert('コメントの投稿に失敗しました');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && post && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
          onClick={onClose}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-[51] p-2 bg-black/50 text-white hover:bg-black/70 rounded-full shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="閉じる"
          >
            <X className="w-7 h-7" />
          </button>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[95vh] overflow-hidden flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 写真（横幅いっぱい） */}
            <div className="relative">
              <LazyImage
                src={post.imageUrl}
                alt={post.aiDescription}
                className="w-full max-h-32 md:max-h-40 object-cover rounded-t-3xl"
                aspectRatio="aspect-auto"
                priority={true} // モーダルで開いた画像は優先読み込み
              />
              {/* Tags Overlay */}
              {post.tags && post.tags.length > 0 && (
                <div className="absolute top-3 left-3 flex flex-wrap gap-1 max-w-[70%]">
                  {post.tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag.id}
                      className="px-3 py-1 text-sm font-medium text-white rounded-full shadow-lg backdrop-blur-sm"
                      style={{ backgroundColor: `${tag.color}CC` }}
                    >
                      {tag.name}
                    </span>
                  ))}
                  {post.tags.length > 4 && (
                    <span className="px-3 py-1 text-sm font-medium text-white bg-black bg-opacity-60 rounded-full shadow-lg backdrop-blur-sm">
                      +{post.tags.length - 4}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* タイトル・日付・いいねボタン 横並び */}
            <div className="flex items-center justify-between gap-2 px-4 pt-4">
              <div className="flex flex-col min-w-0 flex-1">
                <h1 className="text-lg md:text-xl font-display font-bold text-neutral-900 truncate mb-1">{post.title}</h1>
                <div className="flex items-center text-neutral-500 space-x-2 text-xs">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(post.createdAt)}</span>
                </div>
              </div>
              <button
                onClick={handleLike}
                className={`flex items-center justify-center p-3 rounded-full shadow transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 text-2xl ${post.likedByCurrentUser ? 'bg-pink-100 text-pink-600' : 'bg-neutral-100 text-neutral-500'} hover:bg-pink-200`}
                title={post.likedByCurrentUser ? 'いいねを取り消す' : 'いいね'}
                aria-label="いいね"
                style={{ minWidth: '48px', minHeight: '48px' }}
              >
                <Heart className={`w-7 h-7 ${post.likedByCurrentUser ? 'fill-pink-500' : 'fill-none'}`} />
                <span className="ml-1 text-base font-semibold">{post.likeCount}</span>
              </button>
            </div>


            {/* Content area with improved readability */}
            <div 
              ref={contentRef}
              className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto scroll-smooth overscroll-contain"
            >
              {/* Author info */}
              <Link 
                to={`/profile/${post.author.id}`} 
                className="flex items-center space-x-4 mb-6 hover:bg-gray-50 p-2 rounded-lg transition-colors group"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose(); // モーダルを閉じる
                }}
              >
                <img
                  src={post.author.avatar && post.author.avatar !== '' ? post.author.avatar : `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author.name || 'ユーザー')}&background=0072f5&color=fff`}
                  alt={post.author.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600 shadow-sm"
                />
                <div>
                  <h3 className="font-medium text-neutral-900 group-hover:underline">{post.author.name}</h3>
                  <p className="text-sm text-neutral-500">投稿者</p>
                </div>
              </Link>

              <div className="space-y-8">
                {/* 画像AI説明 */}
                {post.imageAIDescription && (
                  <div>
                    <h3 className="flex items-center text-lg font-display font-semibold text-indigo-900 mb-4">
                      <Star className="w-5 h-5 mr-2 text-indigo-500" />
                      この画像のAI説明
                    </h3>
                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-2xl">
                      <p className="text-neutral-700 italic leading-relaxed text-base">
                        "{post.imageAIDescription}"
                      </p>
                    </div>
                  </div>
                )}
                {/* User Comment - 感想を先に表示 */}
                <div>
                  <h3 className="flex items-center text-lg font-display font-semibold text-neutral-900 mb-4">
                    <User className="w-5 h-5 mr-2 text-gray-500" />
                    感想・コメント
                  </h3>
                  <div className="bg-neutral-50 p-6 rounded-2xl">
                    <p className="text-neutral-800 leading-relaxed whitespace-pre-line text-base">
                      {post.userComment}
                    </p>
                  </div>
                </div>

                {/* AIコメント */}
                {post.aiComments && post.aiComments.length > 0 && (
                  <div>
                    <h3 className="flex items-center text-lg font-display font-semibold text-gray-900 mb-4">
                      <MessageCircle className="w-5 h-5 mr-2 text-gray-500" />
                      AIコメント
                    </h3>
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-2xl">
                      <p className="text-neutral-700 italic leading-relaxed text-base">
                        "{post.aiComments[0].content}"
                      </p>
                    </div>
                  </div>
                )}


                {/* コメント一覧 */}
                <div className="mt-10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="flex items-center text-lg font-semibold text-neutral-900">
                      <MessageCircle className="w-5 h-5 mr-2 text-blue-500" />
                      コメント
                      <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                        {comments.length}件
                      </span>
                    </h3>
                  </div>
                  {loadingComments ? (
                    <div className="text-neutral-500">読み込み中...</div>
                  ) : comments.length === 0 ? (
                    <div className="text-neutral-400">まだコメントはありません</div>
                  ) : (
                    <ul className="space-y-4 pb-4">
                      {comments.map((comment) => {
                        const displayName = comment.author?.name || 'ユーザー';
                        const avatarUrl = comment.author?.avatar_url || 
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&size=40`;
                        
                        return (
                          <li key={comment.id} className="flex items-start space-x-3">
                            <div className="relative">
                              <img
                                src={avatarUrl}
                                alt={`${displayName}のアバター`}
                                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600 shadow-sm"
                                onError={(e) => {
                                  // 画像読み込みエラー時のフォールバック
                                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&size=40`;
                                }}
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-sm font-semibold text-neutral-900">{displayName}</span>
                                <span className="text-xs text-neutral-500">
                                  {new Date(comment.created_at).toLocaleString('ja-JP', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <div className="text-neutral-800 text-base break-words py-2 px-3 bg-neutral-100 rounded-lg max-w-xs sm:max-w-md shadow-sm">
                                {comment.content}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {/* コメント投稿フォーム */}
                  {user && (
                    <form onSubmit={handleCommentSubmit} className="mt-6 flex items-center space-x-2 w-full">
                      <input
                        type="text"
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        className="flex-1 border border-neutral-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
                        placeholder="コメントを書く..."
                        maxLength={200}
                        required
                      />
                      <button
                        type="submit"
                        className="px-5 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-base font-semibold"
                      >投稿</button>
                    </form>
                  )}
                </div>

                {/* AI Photo Score Section */}
                <div className="mt-8">
                  <PhotoScoreDisplay
                    postId={post.id}
                    imageUrl={post.imageUrl}
                    title={post.title}
                    description={post.userComment}
                    initialScore={post.photoScore}
                  />
                </div>



                {/* Footer info */}
                <div className="flex items-center justify-between pt-6 border-t border-neutral-200">
                  <div className="flex items-center space-x-2 text-sm text-neutral-500">
                    <TagIcon className="w-4 h-4" />
                    <span className="break-words">{post.tags.map(tag => tag.name).join(', ')}</span>
                  </div>
                  <div className="text-sm text-neutral-500 flex-shrink-0 ml-4">
                    投稿日: {formatDate(post.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};