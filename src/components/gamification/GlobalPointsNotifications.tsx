import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePointsNotification } from '../../contexts/PointsNotificationContext';
import { Camera, Trophy, Heart, Lightbulb, Star, Gift, Zap } from 'lucide-react';

const iconMap = {
  photo_quality: Camera,
  milestone: Trophy,
  like: Heart,
  inspiration: Lightbulb,
  post_bonus: Gift,
  streak: Zap,
  default: Star
};

export const GlobalPointsNotifications: React.FC = () => {
  const { notifications } = usePointsNotification();

  return (
    <div className="fixed top-20 right-4 z-50 pointer-events-none space-y-2">
      <AnimatePresence>
        {notifications.map((notification, index) => {
          const Icon = iconMap[notification.icon as keyof typeof iconMap] || iconMap.default;
          const bgColor = notification.type === 'influence' ? 'bg-purple-500' : 'bg-pink-500';
          const borderColor = notification.type === 'influence' ? 'border-purple-300' : 'border-pink-300';
          
          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 25,
                delay: index * 0.1 // 複数通知の場合は少しずらして表示
              }}
              className="pointer-events-auto"
            >
              <div className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm border ${borderColor} border-opacity-30 flex items-center space-x-3 min-w-[200px]`}>
                <motion.div
                  initial={{ rotate: -180, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="flex-shrink-0"
                >
                  <Icon size={24} className="text-white/90" />
                </motion.div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ 
                        delay: 0.3 + index * 0.1, 
                        type: "spring",
                        stiffness: 400
                      }}
                      className="font-bold text-lg"
                    >
                      +{notification.points}
                    </motion.span>
                    <span className="text-sm font-medium">
                      {notification.type === 'influence' ? 'IP' : 'LP'}
                    </span>
                  </div>
                  <div className="text-xs opacity-90 leading-tight">
                    {notification.source}
                  </div>
                </div>

                {/* パーティクル効果 */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="absolute -top-1 -right-1"
                >
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 180, 360]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    className="w-3 h-3 text-yellow-300"
                  >
                    <Star size={12} className="fill-current" />
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};