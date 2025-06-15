import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Calendar, Tag as TagIcon, MessageCircle, Sparkles, HelpCircle, Eye } from 'lucide-react';
import { Post } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface PostModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PostModal: React.FC<PostModalProps> = ({ post, isOpen, onClose }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const { user } = useAuth();

  const commentTypeLabels = {
    comment: { icon: MessageCircle, label: 'へい！', color: 'text-blue-600', bgColor: 'bg-blue-50' },
    question: { icon: HelpCircle, label: '質問や！', color: 'text-green-600', bgColor: 'bg-green-50' },
    observation: { icon: Eye, label: 'やるやん', color: 'text-purple-600', bgColor: 'bg-purple-50' }
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

  // Save and restore scroll position
  useEffect(() => {
    const contentElement = contentRef.current;
    
    const handleScroll = () => {
      if (contentElement) {
        setScrollPosition(contentElement.scrollTop);
      }
    };

    if (contentElement && isOpen && post) {
      contentElement.addEventListener('scroll', handleScroll, { passive: true });
      // Restore scroll position
      setTimeout(() => {
        if (contentElement) {
          contentElement.scrollTop = scrollPosition;
        }
      }, 100);
      
      return () => {
        contentElement.removeEventListener('scroll', handleScroll);
      };
    }
  }, [isOpen, scrollPosition, post]);

  // Reset scroll position when post changes
  useEffect(() => {
    setScrollPosition(0);
  }, [post?.id]);

  // コメント一覧取得
  const fetchComments = async () => {
    if (!post) return;
    setLoadingComments(true);
    const { data, error } = await supabase
      .from('comments')
      .select('id, content, created_at, user_id, profiles (name, avatar_url)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });
    if (!error && data) {
      setComments(data);
    }
    setLoadingComments(false);
  };

  useEffect(() => {
    if (isOpen && post) {
      fetchComments();
    }
  }, [isOpen, post?.id]);

  // コメント投稿
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || !post) return;
    await supabase.from('comments').insert({
      post_id: post.id,
      user_id: user.id,
      content: newComment,
    });
    setNewComment('');
    fetchComments();
  };

  return (
    <AnimatePresence>
      {isOpen && post && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with image and title overlay */}
            <div className="relative flex-shrink-0 ">
              <img
                src={post.imageUrl}
                alt={post.aiDescription}
                className="w-full h-30 md:h-40 object-cover"
              />
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full text-neutral-600 hover:text-neutral-800 hover:bg-white transition-all duration-200"
              > 
                <X className="w-6 h-6" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                <div className="flex flex-wrap gap-2 mb-3">
                  {post.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-3 py-1 text-sm font-medium text-white rounded-full"
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
                <h1 className="text-2xl md:text-3xl font-display font-bold text-white mb-2">
                  {post.title}
                </h1>
                <div className="flex items-center text-white/90 space-x-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">{formatDate(post.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content area with improved readability */}
            <div 
              ref={contentRef}
              className="flex-1 p-6 md:p-8 overflow-y-auto scroll-container"
            >
              {/* Author info */}
              <div className="flex items-center space-x-4 mb-6">
                <img
                  src={post.author.avatar || 'https://ui-avatars.com/api/?name=User&background=0072f5&color=fff'}
                  alt={post.author.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-medium text-neutral-900">{post.author.name}</h3>
                  <p className="text-sm text-neutral-500">投稿者</p>
                </div>
              </div>

              <div className="space-y-8">
                {/* AI Description */}
                <div>
                  <h3 className="flex items-center text-lg font-display font-semibold text-neutral-900 mb-4">
                    <Sparkles className="w-5 h-5 mr-2 text-primary-500" />
                    AI情景描写
                  </h3>
                  <div className="bg-gradient-to-r from-primary-50 to-accent-50 p-6 rounded-2xl">
                    <p className="text-neutral-700 italic leading-relaxed text-base">
                      "{post.aiDescription}"
                    </p>
                  </div>
                </div>

                {/* User Comment */}
                <div>
                  <h3 className="flex items-center text-lg font-display font-semibold text-neutral-900 mb-4">
                    <User className="w-5 h-5 mr-2 text-accent-500" />
                    撮影者の感想
                  </h3>
                  <div className="bg-neutral-50 p-6 rounded-2xl">
                    <p className="text-neutral-800 leading-relaxed whitespace-pre-line text-base">
                      {post.userComment}
                    </p>
                  </div>
                </div>

                {/* AI Generated Comments */}
                {post.aiComments && post.aiComments.length > 0 && (
                  <div>
                    <h3 className="flex items-center text-lg font-display font-semibold text-neutral-900 mb-6">
                      <MessageCircle className="w-5 h-5 mr-2 text-indigo-500" />
                      AI応答・対話
                      <span className="ml-2 px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-full">
                        {post.aiComments.length}件
                      </span>
                    </h3>
                    <div className="space-y-6">
                      {post.aiComments.map((comment, index) => {
                        const typeInfo = commentTypeLabels[comment.type as keyof typeof commentTypeLabels];
                        const CommentIcon = typeInfo.icon;
                        
                        return (
                          <motion.div
                            key={comment.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`border border-neutral-200 rounded-xl p-6 ${typeInfo.bgColor} shadow-sm hover:shadow-md transition-shadow duration-200`}
                          >
                            <div className="flex items-start space-x-4">
                              <div className={`p-2.5 rounded-lg bg-white ${typeInfo.color}`}>
                                <CommentIcon className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-3">
                                  <span className={`text-sm font-medium ${typeInfo.color}`}>
                                    {typeInfo.label}
                                  </span>
                                  <span className="text-xs text-neutral-500">
                                    {formatTime(comment.createdAt)}
                                  </span>
                                </div>
                                <p className="text-neutral-700 leading-relaxed text-base break-words">
                                  {comment.content}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* コメント一覧 */}
                <div className="mt-10">
                  <h3 className="text-lg font-semibold mb-4">コメント</h3>
                  {loadingComments ? (
                    <div className="text-neutral-500">読み込み中...</div>
                  ) : comments.length === 0 ? (
                    <div className="text-neutral-400">まだコメントはありません</div>
                  ) : (
                    <ul className="space-y-4">
                      {comments.map((c) => (
                        <li key={c.id} className="flex items-start space-x-3">
                          <img
                            src={c.profiles?.avatar_url || 'https://ui-avatars.com/api/?name=User&background=0072f5&color=fff'}
                            alt={c.profiles?.name || 'ユーザー'}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <div className="text-sm font-medium text-neutral-900">{c.profiles?.name || 'ユーザー'}</div>
                            <div className="text-xs text-neutral-500 mb-1">{new Date(c.created_at).toLocaleString('ja-JP')}</div>
                            <div className="text-neutral-800 text-base break-words">{c.content}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  {/* コメント投稿フォーム */}
                  {user && (
                    <form onSubmit={handleCommentSubmit} className="mt-6 flex items-center space-x-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        className="flex-1 border border-neutral-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="コメントを書く..."
                        maxLength={200}
                        required
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                      >投稿</button>
                    </form>
                  )}
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