import React from 'react';
import { Wifi, WifiOff, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAI } from '../hooks/useAI';

export const AIStatusIndicator: React.FC = () => {
  const { apiStatus } = useAI();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center space-x-2 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm border border-neutral-200"
    >
      <div className="flex items-center space-x-1">
        {apiStatus.available ? (
          <>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Star className="w-4 h-4 text-green-500" />
            </motion.div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4 text-orange-500" />
            <div className="w-2 h-2 bg-orange-500 rounded-full" />
          </>
        )}
      </div>
      <span className="text-xs text-neutral-600 font-medium">
        {apiStatus.provider}
      </span>
    </motion.div>
  );
};