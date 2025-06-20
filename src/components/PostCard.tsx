import React from 'react';
import { motion } from 'framer-motion';
import { User, Eye, MessageCircle, Trash2, Heart } from 'lucide-react';
import { Post } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabase';

interface PostCardProps {
  post: Post;
  onClick: () => void;
  index: number;
  likePost: (postId: string) => void;
  unlikePost: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onClick, index, likePost, unlikePost }) => {
  const { user } = useAuth();
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('本当にこの投稿を削除しますか？')) {
      await supabase.from('posts').delete().eq('id', post.id);
      // 投稿一覧の再取得はusePosts側で自動反映される想定
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    if (post.likedByCurrentUser) {
      unlikePost(post.id);
    } else {
      likePost(post.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer group"
      onClick={onClick}
    >
      <div className="relative overflow-hidden">
        <img
          src={post.imageUrl}
          alt={post.aiDescription}
          className="w-full h-48 md:h-56 object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-4 right-4 flex flex-wrap gap-2 max-w-[60%]">
          {post.tags.slice(0, 2).map((tag) => (
            <span
              key={tag.id}
              className="px-2 py-1 text-xs font-medium text-white rounded-full"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
            </span>
          ))}
          {user && (user.user_metadata?.name === post.author.name || (user.email && post.author.name && user.email.split('@')[0] === post.author.name)) && (
            <button
              onClick={handleDelete}
              className="ml-2 p-2 rounded-full bg-white/80 hover:bg-red-100 text-red-500 shadow transition-colors"
              title="投稿を削除"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="p-5 md:p-6">
        <div className="flex items-center space-x-3 mb-4">
          <img
            src={post.author.avatar && post.author.avatar !== '' ? post.author.avatar : `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author.name || 'ユーザー')}&background=0072f5&color=fff`}
            alt={post.author.name}
            className="w-8 h-8 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-900 truncate">{post.author.name}</p>
            <p className="text-xs text-neutral-500">{formatDate(post.createdAt)}</p>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-display font-semibold text-neutral-900 mb-3 line-clamp-2 leading-tight break-words">
          {post.title}
        </h3>

        <div className="space-y-3">
          {/* AI Description */}
          <div className="bg-neutral-50 p-3 rounded-lg">
            <p className="text-sm text-neutral-600 italic leading-relaxed line-clamp-3 break-words">
              "{post.aiDescription.slice(0, 120)}..."
            </p>
          </div>

          {/* User Comment */}
          <div className="min-h-[3rem]">
            <p className="text-sm text-neutral-700 line-clamp-3 leading-relaxed break-words">
              {post.userComment}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {post.tags.slice(2, 4).map((tag) => (
              <span
                key={tag.id}
                className="px-2 py-1 text-xs text-neutral-600 bg-neutral-100 rounded-full"
              >
                {tag.name}
              </span>
            ))}
          </div>
          {/* いいねボタン */}
          <button
            onClick={handleLike}
            className={`flex items-center space-x-1 px-2 py-1 rounded-full transition-colors ${post.likedByCurrentUser ? 'bg-pink-100 text-pink-600' : 'bg-neutral-100 text-neutral-500'} hover:bg-pink-200`}
            title={post.likedByCurrentUser ? 'いいねを取り消す' : 'いいね'}
          >
            <Heart className={`w-5 h-5 ${post.likedByCurrentUser ? 'fill-pink-500' : 'fill-none'}`} />
            <span className="text-sm font-semibold">{post.likeCount}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};