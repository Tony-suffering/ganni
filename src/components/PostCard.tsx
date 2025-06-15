import React from 'react';
import { motion } from 'framer-motion';
import { User, Eye, MessageCircle } from 'lucide-react';
import { Post } from '../types';

interface PostCardProps {
  post: Post;
  onClick: () => void;
  index: number;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onClick, index }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
        </div>
      </div>

      <div className="p-5 md:p-6">
        <div className="flex items-center space-x-3 mb-4">
          <img
            src={post.author.avatar}
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
          <div className="flex items-center space-x-3 flex-shrink-0 ml-2">
            {post.aiComments && post.aiComments.length > 0 && (
              <div className="flex items-center space-x-1 text-sm text-accent-600">
                <MessageCircle className="w-4 h-4" />
                <span>{post.aiComments.length}</span>
              </div>
            )}
            <button className="flex items-center space-x-1 text-sm text-primary-500 hover:text-primary-600 transition-colors">
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">詳細</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};