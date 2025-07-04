import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Share2, Twitter, Facebook, MessageCircle, Check } from 'lucide-react';
import { Post } from '../../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, post }) => {
  const [copied, setCopied] = useState(false);

  if (!post) return null;

  // 投稿のURLを生成
  const postUrl = `${window.location.origin}/posts/${post.id}`;
  const shareText = `${post.title} - AIコメンテーター`;

  // クリップボードにコピー
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('コピーに失敗:', error);
      // フォールバック: 古いブラウザ対応
      const textArea = document.createElement('textarea');
      textArea.value = postUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // SNS共有リンク生成
  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(postUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`,
    line: `https://line.me/R/msg/text/?${encodeURIComponent(`${shareText} ${postUrl}`)}`,
  };

  // Web Share API（モバイル端末）
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareText,
          text: post.userComment || post.aiDescription,
          url: postUrl,
        });
      } catch (error) {
        console.log('共有がキャンセルされました');
      }
    }
  };

  const shareOptions = [
    {
      id: 'copy',
      label: 'リンクをコピー',
      icon: copied ? Check : Copy,
      color: copied ? 'text-green-600' : 'text-gray-600',
      bgColor: copied ? 'bg-green-50 hover:bg-green-100' : 'bg-gray-50 hover:bg-gray-100',
      action: copyToClipboard,
    },
    {
      id: 'twitter',
      label: 'Twitterで共有',
      icon: Twitter,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      action: () => window.open(shareLinks.twitter, '_blank'),
    },
    {
      id: 'facebook',
      label: 'Facebookで共有',
      icon: Facebook,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      action: () => window.open(shareLinks.facebook, '_blank'),
    },
    {
      id: 'line',
      label: 'LINEで共有',
      icon: MessageCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-50 hover:bg-green-100',
      action: () => window.open(shareLinks.line, '_blank'),
    },
  ];

  // ネイティブ共有が利用可能な場合は追加
  if (navigator.share) {
    shareOptions.unshift({
      id: 'native',
      label: '共有',
      icon: Share2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100',
      action: handleNativeShare,
    });
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* オーバーレイ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center p-2 sm:p-4 pb-safe pt-8 sm:pt-4"
            onClick={onClose}
          >
            {/* モーダル */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] sm:max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* ヘッダー */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  投稿を共有
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* スクロール可能なコンテンツエリア */}
              <div className="flex-1 overflow-y-auto">
                {/* 投稿プレビュー */}
                <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex space-x-3">
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {post.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {post.userComment || post.aiDescription}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      by {post.author.name}
                    </p>
                  </div>
                </div>
              </div>

                {/* 共有オプション */}
                <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 gap-2 sm:gap-3">
                  {shareOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <motion.button
                        key={option.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={option.action}
                        className={`flex items-center space-x-3 w-full p-3 sm:p-4 rounded-xl transition-colors ${option.bgColor}`}
                      >
                        <div className={`p-2 rounded-lg ${option.bgColor.replace('hover:', '')}`}>
                          <Icon className={`w-5 h-5 ${option.color}`} />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {option.label}
                        </span>
                        {option.id === 'copy' && copied && (
                          <span className="text-xs text-green-600 ml-auto">
                            コピーしました！
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* URL表示 */}
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    投稿URL
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={postUrl}
                      readOnly
                      className="flex-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};