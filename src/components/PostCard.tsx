import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Send, Lightbulb, MoreHorizontal, Trash2, FolderPlus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Post } from '../types';
import { useAuth } from '../contexts/AuthContext';
import ConfirmationModal from './ConfirmationModal';
import { LazyImage } from './LazyImage';
import { ShareModal } from './ShareModal';
import { PhotoScoreBadge } from './PhotoScoreBadge';
import { UserBadgesDisplay } from './gamification/UserBadgesDisplay';
import { PointsNotification } from './gamification/PointsNotification';
import { useGamification } from '../hooks/useGamification';

interface PostCardProps {
  post: Post;
  onClick: () => void;
  likePost: (postId: string) => void;
  unlikePost: (postId: string) => void;
  bookmarkPost: (postId: string) => void;
  unbookmarkPost: (postId: string) => void;
  deletePost: (postId: string) => void;
  priority?: boolean; // 優先読み込み
  index?: number; // インデックス
}

const PostCard = React.memo(({ post, onClick, likePost, unlikePost, bookmarkPost, unbookmarkPost, deletePost, priority = false, index = 0 }: PostCardProps) => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const { recentPointsGained } = useGamification();
  const { author, title, userComment, imageUrl, likeCount, likedByCurrentUser, bookmarkedByCurrentUser, createdAt, commentCount, inspiration } = post;
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const isOwner = currentUser?.id === author.id;

  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: ja });

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('🖱️ いいねボタンクリック:', {
      postId: post.id,
      currentlyLiked: likedByCurrentUser,
      action: likedByCurrentUser ? 'unlike' : 'like'
    });
    
    try {
      if (likedByCurrentUser) {
        console.log('👎 いいね解除実行中...');
        await unlikePost(post.id);
        console.log('✅ いいね解除完了');
      } else {
        console.log('👍 いいね追加実行中...');
        await likePost(post.id);
        console.log('✅ いいね追加完了');
      }
    } catch (error) {
      console.error('❌ いいね操作エラー:', error);
    }
  };
  
  const handleInspirationClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('💡 インスピレーションボタンクリック:', {
      postId: post.id,
      postTitle: post.title,
      currentUser: !!currentUser,
      userId: currentUser?.id
    });
    
    if (!currentUser) {
      console.warn('⚠️ ユーザーが未ログイン - インスピレーション機能を利用できません');
      // TODO: ログインが必要な旨のメッセージを表示
      return;
    }
    
    console.log('🔄 インスピレーションページに遷移:', `/inspiration/${post.id}`);
    navigate(`/inspiration/${post.id}`);
  };
  
  const handleCollectionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      return;
    }
    if (bookmarkedByCurrentUser) {
      unbookmarkPost(post.id);
    } else {
      bookmarkPost(post.id);
    }
  };
  
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOptionsOpen(false);
    setIsConfirmDeleteOpen(true);
  };

  const confirmDelete = () => {
    deletePost(post.id);
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsShareModalOpen(true);
  };
  
  const getDisplayName = (): string => {
    return author?.name || post.author_name || '匿名ユーザー';
  };

  const getAvatarUrl = (): string => {
    return author?.avatar || post.author_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(getDisplayName())}&background=random`;
  };

  const caption = (
    <>
      <Link to={`/profile/${author.id}`} className="font-semibold hover:underline">{getDisplayName()}</Link>
      <span className="ml-2">{title}</span>
      {userComment && <p className="text-gray-500 dark:text-gray-400">{userComment}</p>}
    </>
  );

  return (
    <>
      <div className="w-full max-w-lg mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          {/* Card Header */}
          <div className="p-3 flex items-center justify-between">
            <Link to={`/profile/${author.id}`} className="flex items-center space-x-3 group">
              <div className="relative">
                <img
                  src={getAvatarUrl()}
                  alt={`${getDisplayName()}'s avatar`}
                  className="w-9 h-9 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow"
                />
              </div>
              <div className="text-sm">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-gray-800 dark:text-gray-200 group-hover:underline">{getDisplayName()}</span>
                  {/* 作者のバッジ表示（将来的にバッジ情報が投稿に含まれる場合） */}
                  {post.author.badges && (
                    <UserBadgesDisplay 
                      userBadges={post.author.badges} 
                      variant="inline"
                    />
                  )}
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">{timeAgo}</span>
                </div>
              </div>
            </Link>
            <div className="relative">
              <button onClick={(e) => { e.stopPropagation(); setIsOptionsOpen(!isOptionsOpen); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2">
                <MoreHorizontal className="w-5 h-5" />
              </button>
              {isOptionsOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg z-10" onMouseLeave={() => setIsOptionsOpen(false)}>
                  {isOwner && (
                    <button onClick={handleDeleteClick} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      削除
                    </button>
                  )}
                   {/* 他のオプションもここに追加可能 */}
                </div>
              )}
            </div>
          </div>
          
          {/* Inspiration Info - moved to top */}
          {inspiration && inspiration.source_post && (
            <div className="px-3 pb-2">
              <Link 
                to={`/inspiration/${inspiration.source_post_id}`}
                className="flex items-center space-x-2 text-sm bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">🔗</span>
                </div>
                <span className="text-blue-800 dark:text-blue-200">
                  <span className="font-medium">{inspiration.source_post.author.name}</span>
                  さんの『{inspiration.source_post.title}』からインスパイア
                </span>
                <span className="ml-auto px-2 py-0.5 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded">
                  {getInspirationTypeLabel(inspiration.type)}
                </span>
              </Link>
              {inspiration.note && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 px-2 italic">
                  「{inspiration.note}」
                </p>
              )}
            </div>
          )}

          {/* Post Image with Padding */}
          <div className="p-4">
            <div className="cursor-pointer relative" onClick={onClick}>
              {imageUrl && (
                <>
                  <LazyImage
                    src={imageUrl}
                    alt={title}
                    className="rounded-md w-full h-auto"
                    aspectRatio="aspect-auto"
                    threshold={0.1}
                    rootMargin="200px"
                    priority={priority}
                    index={index}
                  />
                  {/* Tags Overlay */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="absolute top-2 left-2 flex flex-wrap gap-1 max-w-[70%]">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag.id}
                          className="px-2 py-1 text-xs font-medium text-white rounded-full shadow-lg backdrop-blur-sm"
                          style={{ backgroundColor: `${tag.color}CC` }}
                        >
                          {tag.name}
                        </span>
                      ))}
                      {post.tags.length > 3 && (
                        <span className="px-2 py-1 text-xs font-medium text-white bg-black bg-opacity-60 rounded-full shadow-lg backdrop-blur-sm">
                          +{post.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Photo Score Badge */}
                  {post.photoScore && (
                    <div className="absolute top-2 right-2">
                      <PhotoScoreBadge score={post.photoScore} size="small" />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Card Footer */}
          <div className="p-3 pt-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-4">
                <button onClick={handleLikeClick} className="relative text-gray-700 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-500 transition-colors">
                  <Heart className={`w-6 h-6 ${likedByCurrentUser ? 'text-red-500 fill-current' : ''}`} />
                  {likeCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-semibold">
                      {likeCount > 9 ? '9+' : likeCount}
                    </span>
                  )}
                </button>
                <button onClick={onClick} className="relative text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                  <MessageCircle className="w-6 h-6" />
                  {commentCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-semibold">
                      {commentCount > 9 ? '9+' : commentCount}
                    </span>
                  )}
                </button>
                <button onClick={handleShareClick} className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                  <Send className="w-6 h-6" />
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={handleCollectionClick} 
                  className={`relative transition-all duration-300 hover:scale-105 group ${
                    bookmarkedByCurrentUser 
                      ? 'text-yellow-500 hover:text-yellow-600' 
                      : 'text-gray-600 hover:text-yellow-500'
                  }`}
                  title="コレクションに追加/削除"
                >
                  <FolderPlus className={`w-6 h-6 group-hover:drop-shadow-lg ${
                    bookmarkedByCurrentUser ? 'fill-current' : ''
                  }`} />
                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                    {bookmarkedByCurrentUser ? 'コレクションから削除' : 'コレクションに追加'}
                  </span>
                </button>
                <button 
                  onClick={handleInspirationClick} 
                  className="relative transition-all duration-300 text-gray-600 hover:text-gray-500 hover:scale-105 group"
                  title="インスピレーション・ラボを開く"
                >
                  <Lightbulb className="w-7 h-7 group-hover:drop-shadow-lg" />
                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                    インスピレーション
                  </span>
                </button>
              </div>
            </div>


            <div className="text-sm text-gray-800 dark:text-gray-200">
              {caption}
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="投稿を削除"
        message="この投稿を本当に削除しますか？この操作は元に戻すことはできません。"
        confirmText="削除"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        post={post}
      />

      {/* ポイント獲得通知 */}
      {recentPointsGained && (
        <PointsNotification
          points={recentPointsGained.points}
          type={recentPointsGained.type}
          source={recentPointsGained.source}
          isVisible={true}
        />
      )}
    </>
  );
});

// インスピレーションタイプのラベル取得
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

export default PostCard;