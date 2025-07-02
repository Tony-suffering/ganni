import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, ArrowRight, X, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AIInspirationRecommendBannerProps {
  isVisible: boolean;
  onDismiss: () => void;
  message?: string;
  targetPath?: string;
}

export const AIInspirationRecommendBanner: React.FC<AIInspirationRecommendBannerProps> = ({
  isVisible,
  onDismiss,
  message = "素晴らしい写真ですね！他の投稿者にインスピレーションを与えてみませんか？",
  targetPath = "/inspiration/explore"
}) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const handleExploreClick = () => {
    navigate(targetPath);
    onDismiss();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.95 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            duration: 0.3
          }}
          className="fixed top-20 md:top-24 left-4 right-4 z-50 mx-auto max-w-2xl"
        >
          <div className="relative">
            {/* グラデーション背景 */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-600 rounded-xl blur-sm opacity-75"></div>
            
            {/* メインコンテンツ */}
            <div className="relative bg-white/95 backdrop-blur-sm rounded-xl border border-purple-200 shadow-xl overflow-hidden">
              {/* 装飾的なグラデーション */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-600"></div>
              
              <div className="p-4 md:p-6">
                <div className="flex items-start gap-4">
                  {/* AIアイコン */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                        <Lightbulb className="w-6 h-6 text-white" />
                      </div>
                      {/* 輝きエフェクト */}
                      <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full blur-md -z-10"
                      />
                    </div>
                  </div>

                  {/* メッセージコンテンツ */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-purple-500" />
                          <span className="text-sm font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                            AI レコメンド
                          </span>
                        </div>
                        
                        <p className="text-gray-800 font-medium text-sm md:text-base leading-relaxed">
                          {message}
                        </p>
                      </div>

                      {/* 閉じるボタン */}
                      <button
                        onClick={onDismiss}
                        className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-200 group"
                        aria-label="バナーを閉じる"
                      >
                        <X className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                      </button>
                    </div>

                    {/* アクションボタン */}
                    <motion.button
                      onClick={handleExploreClick}
                      onHoverStart={() => setIsHovered(true)}
                      onHoverEnd={() => setIsHovered(false)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <span>探索</span>
                      <motion.div
                        animate={{ x: isHovered ? 4 : 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </motion.div>
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* 底部の装飾ライン */}
              <div className="h-1 bg-gradient-to-r from-transparent via-purple-300 to-transparent opacity-30"></div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};