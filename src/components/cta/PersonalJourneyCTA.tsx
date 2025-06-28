import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
  Sparkles,
  Brain,
  TrendingUp,
  Gift,
  ArrowRight,
  Star,
  Zap,
  Eye,
  Target,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { analyticsService } from '../../services/analyticsService';

interface PersonalJourneyCTAProps {
  variant?: 'header' | 'mobile' | 'floating' | 'inline';
  className?: string;
}

export const PersonalJourneyCTA: React.FC<PersonalJourneyCTAProps> = ({ 
  variant = 'header', 
  className = '' 
}) => {
  const { user } = useAuth();
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);
  const [pulseCount, setPulseCount] = useState(0);
  const [showSparkles, setShowSparkles] = useState(false);

  // パルスアニメーション
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseCount(prev => prev + 1);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // キラキラエフェクト
  useEffect(() => {
    const sparkleInterval = setInterval(() => {
      setShowSparkles(true);
      setTimeout(() => setShowSparkles(false), 1000);
    }, 5000);

    return () => clearInterval(sparkleInterval);
  }, []);

  const handleClick = () => {
    analyticsService.trackEvent('dashboard_cta_click', 'navigation', variant);
  };

  // ダッシュボードページでは表示しない
  if (location.pathname === '/dashboard') {
    return null;
  }

  // ログインしていない場合は表示しない
  if (!user) {
    return null;
  }

  // ヘッダー用（デスクトップ）
  if (variant === 'header') {
    return (
      <Link
        to="/dashboard"
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`relative group ${className}`}
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="relative overflow-hidden"
        >
          {/* グレー背景 */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg group-hover:from-gray-700 group-hover:to-gray-800 transition-all" />
          
          {/* 光るエフェクト */}
          <motion.div
            animate={{
              x: [-100, 200],
              opacity: [0, 0.3, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatDelay: 4
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
          />

          <div className="relative flex items-center space-x-2 px-4 py-2.5 text-white">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <Target className="w-5 h-5" />
            </motion.div>
            
            <span className="font-medium text-sm whitespace-nowrap hidden sm:inline">
              分析
            </span>
            
            <ArrowRight className="w-4 h-4" />
          </div>

          {/* キラキラエフェクト */}
          <AnimatePresence>
            {showSparkles && (
              <>
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: [0, 0.8, 0], 
                      opacity: [0, 0.6, 0],
                      x: [0, (Math.random() - 0.5) * 30],
                      y: [0, (Math.random() - 0.5) * 20]
                    }}
                    exit={{ scale: 0 }}
                    transition={{ duration: 1.5, delay: i * 0.2 }}
                    className="absolute"
                    style={{
                      left: `${30 + Math.random() * 40}%`,
                      top: `${30 + Math.random() * 40}%`
                    }}
                  >
                    <Sparkles className="w-2 h-2 text-gray-200" />
                  </motion.div>
                ))}
              </>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ホバー時の追加情報 */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50"
            >
              <div className="bg-white shadow-xl rounded-lg p-4 border border-gray-200 w-64">
                <div className="text-center">
                  <div className="text-sm font-semibold text-gray-900 mb-2">
                    パーソナル分析結果
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>あなただけの性格診断</div>
                    <div>専用おすすめ商品</div>
                    <div>成長トラッキング</div>
                  </div>
                  <div className="mt-3 text-xs text-purple-600 font-medium">
                    クリックして詳細を確認 →
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Link>
    );
  }

  // モバイル用（ボトムナビ）
  if (variant === 'mobile') {
    return (
      <Link
        to="/dashboard"
        onClick={handleClick}
        className={`relative group ${className}`}
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="relative inline-flex flex-col items-center justify-center"
        >
          {/* グレー背景 */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg" />

          <div className="relative flex flex-col items-center justify-center px-2 py-1.5 text-white min-w-12 min-h-12">
            <BarChart3 className="w-5 h-5" />
            <span className="text-xs font-medium mt-0.5">分析</span>
          </div>
        </motion.div>
      </Link>
    );
  }

  // フローティング用（ページ内固定）
  if (variant === 'floating') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`fixed bottom-20 right-4 z-40 ${className}`}
      >
        <Link
          to="/dashboard"
          onClick={handleClick}
          className="block group"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="relative"
          >
            {/* グレー背景 */}
            <div className="absolute inset-0 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full shadow-lg" />
            
            {/* リップルエフェクト */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.4, 0, 0.4]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeOut"
              }}
              className="absolute inset-0 bg-gray-600 rounded-full"
            />

            <div className="relative flex items-center justify-center w-14 h-14 text-white">
              <Eye className="w-7 h-7" />
            </div>
          </motion.div>

        </Link>
      </motion.div>
    );
  }

  // インライン用（コンテンツ内）
  if (variant === 'inline') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${className}`}
      >
        <Link
          to="/dashboard"
          onClick={handleClick}
          className="block group"
        >
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 rounded-xl p-6 shadow-2xl"
          >
            {/* 動く背景パターン */}
            <motion.div
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%']
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.3"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                backgroundSize: '60px 60px'
              }}
            />

            <div className="relative flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    className="p-2 bg-white/20 rounded-lg"
                  >
                    <Brain className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      パーソナル分析結果
                    </h3>
                    <p className="text-white/80 text-sm">
                      あなただけの詳細レポート
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { icon: Target, text: '性格診断', color: 'bg-yellow-400' },
                    { icon: Gift, text: 'おすすめ商品', color: 'bg-green-400' },
                    { icon: TrendingUp, text: '成長分析', color: 'bg-blue-400' }
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      animate={{
                        scale: [1, 1.05, 1],
                        rotate: [0, 1, -1, 0]
                      }}
                      transition={{
                        duration: 2,
                        delay: index * 0.3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="flex flex-col items-center text-center"
                    >
                      <div className={`p-2 ${item.color} rounded-lg mb-1`}>
                        <item.icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs text-white/90">{item.text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              <motion.div
                animate={{
                  x: [0, 5, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="flex flex-col items-center"
              >
                <div className="bg-white/20 rounded-full p-3 mb-2">
                  <ArrowRight className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-white/90 font-medium">クリック</span>
              </motion.div>
            </div>

            {/* 光るエフェクト */}
            <motion.div
              animate={{
                x: [-100, 400],
                opacity: [0, 0.5, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatDelay: 2,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
            />
          </motion.div>
        </Link>
      </motion.div>
    );
  }

  return null;
};