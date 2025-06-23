import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Post } from '../types';
import { useAuth } from '../contexts/AuthContext';
import ConfirmationModal from './ConfirmationModal';
import { LazyImage } from './LazyImage';
import { ShareModal } from './ShareModal';
import { PhotoScoreBadge } from './PhotoScoreBadge';

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

const PostCard = ({ post, onClick, likePost, unlikePost, bookmarkPost, unbookmarkPost, deletePost, priority = false, index = 0 }: PostCardProps) => {
  const { user: currentUser } = useAuth();
  const { author, title, userComment, imageUrl, likeCount, likedByCurrentUser, bookmarkedByCurrentUser, createdAt, commentCount } = post;
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const isOwner = currentUser?.id === author.id;

  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: ja });

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (likedByCurrentUser) {
      unlikePost(post.id);
    } else {
      likePost(post.id);
    }
  };
  
  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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
    return author?.name || '匿名ユーザー';
  };

  const getAvatarUrl = (): string => {
    return author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(getDisplayName())}&background=random`;
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
                <span className="font-semibold text-gray-800 dark:text-gray-200 group-hover:underline">{getDisplayName()}</span>
                <span className="text-gray-500 dark:text-gray-400 font-mono mx-1">·</span>
                <span className="text-gray-500 dark:text-gray-400">{timeAgo}</span>
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
              <button onClick={handleBookmarkClick} className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                <Bookmark className={`w-6 h-6 ${bookmarkedByCurrentUser ? 'fill-current' : ''}`} />
              </button>
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
    </>
  );
};

export default PostCard;