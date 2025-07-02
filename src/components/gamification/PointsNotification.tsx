import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Heart } from 'lucide-react';

interface PointsNotificationProps {
  points: number;
  type: 'learning' | 'influence';
  source: string;
  isVisible: boolean;
}

export const PointsNotification: React.FC<PointsNotificationProps> = ({
  points,
  type,
  source,
  isVisible
}) => {
  const isInfluence = type === 'influence';
  const icon = isInfluence ? Star : Heart;
  const bgColor = isInfluence ? 'bg-purple-500' : 'bg-pink-500';
  const textColor = isInfluence ? 'text-purple-100' : 'text-pink-100';
  const pointsLabel = isInfluence ? 'IP' : 'LP';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ 
            duration: 0.3,
            ease: "easeOut"
          }}
          className="fixed top-20 right-4 z-50"
        >
          <div className={`${bgColor} ${textColor} px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm border border-white/20`}>
            <div className="flex items-center space-x-2">
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                {React.createElement(icon, { 
                  size: 20, 
                  className: isInfluence ? 'text-yellow-300' : 'text-red-300' 
                })}
              </motion.div>
              
              <div className="flex flex-col">
                <div className="flex items-center space-x-1">
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="font-bold text-lg"
                  >
                    +{points}
                  </motion.span>
                  <span className="text-sm font-medium">{pointsLabel}</span>
                </div>
                <span className="text-xs opacity-90">{source}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};