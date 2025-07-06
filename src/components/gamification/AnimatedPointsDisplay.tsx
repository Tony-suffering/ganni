import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CountUp from 'react-countup';

interface AnimatedPointsDisplayProps {
  currentPoints: number;
  level: number;
  levelName: string;
  previousPoints?: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
}

export const AnimatedPointsDisplay: React.FC<AnimatedPointsDisplayProps> = ({
  currentPoints,
  level,
  levelName,
  previousPoints
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [displayPoints, setDisplayPoints] = useState(currentPoints);
  const prevPointsRef = useRef(currentPoints);

  // ポイント変化を検知してアニメーションを開始
  useEffect(() => {
    console.log('🖥️ AnimatedPointsDisplay - ポイント変化チェック:', {
      currentPoints,
      previousPoints,
      isIncrease: previousPoints !== undefined && previousPoints < currentPoints,
      isDifferent: previousPoints !== currentPoints
    });
    
    // 前回のポイントが設定されており、かつ現在のポイントより小さい場合（増加）
    if (previousPoints !== undefined && previousPoints < currentPoints) {
      console.log('✨ デスクトップアニメーション開始！ 増加分:', currentPoints - previousPoints);
      setIsAnimating(true);
      
      // パーティクルを生成
      const newParticles: Particle[] = [];
      const particleCount = Math.min(10, currentPoints - previousPoints);
      
      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          id: Date.now() + i,
          x: Math.random() * 60 - 30,
          y: Math.random() * 60 - 30
        });
      }
      
      setParticles(newParticles);
      
      // アニメーション終了後にリセット
      setTimeout(() => {
        setIsAnimating(false);
        setParticles([]);
        console.log('🎬 デスクトップアニメーション終了');
      }, 1200);
    }
    
    prevPointsRef.current = currentPoints;
    setDisplayPoints(currentPoints);
  }, [currentPoints, previousPoints]);

  return (
    <div className="relative flex items-center gap-3 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* ポイント表示部分 */}
      <div className="relative flex items-center gap-2">
        {/* 星アイコン */}
        <motion.span
          className="text-xs text-gray-500"
          animate={isAnimating ? {
            rotate: [0, 360],
            scale: [1, 1.3, 1]
          } : {}}
          transition={{ duration: 0.4 }}
        >
          ⭐
        </motion.span>
        
        {/* カウントアップ数値 */}
        <motion.div
          animate={isAnimating ? {
            scale: [1, 1.5, 1],
            color: ['#111827', '#FCD34D', '#111827']
          } : {}}
          transition={{ duration: 0.4 }}
          className="text-lg font-bold text-gray-900"
        >
          <CountUp
            start={previousPoints || currentPoints}
            end={currentPoints}
            duration={0.6}
            separator=","
            preserveValue
          />
        </motion.div>
        
        <span className="text-xs text-gray-500">点</span>
        
        {/* パーティクルエフェクト */}
        <AnimatePresence>
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute pointer-events-none"
              initial={{ 
                opacity: 1, 
                scale: 0,
                x: 0,
                y: 0
              }}
              animate={{ 
                opacity: 0, 
                scale: 1.5,
                x: particle.x,
                y: particle.y - 40
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              <span className="text-yellow-400 text-lg">⭐</span>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* 波紋エフェクト */}
        <AnimatePresence>
          {isAnimating && (
            <motion.div
              className="absolute inset-0 rounded-full bg-yellow-400"
              initial={{ scale: 0.8, opacity: 0.5 }}
              animate={{ scale: 3, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              style={{ transformOrigin: 'center' }}
            />
          )}
        </AnimatePresence>
      </div>
      
      <div className="w-px h-4 bg-gray-300"></div>
      
      {/* レベル表示部分 */}
      <motion.div 
        className="flex items-center gap-1"
        animate={isAnimating ? {
          scale: [1, 1.1, 1]
        } : {}}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <span className="text-xs text-gray-500 font-medium">Lv.{level}</span>
        <span className="text-xs text-gray-400">{levelName}</span>
      </motion.div>
      
      {/* ポイント増加通知 */}
      <AnimatePresence>
        {isAnimating && previousPoints !== undefined && (
          <motion.div
            className="absolute -top-8 left-1/2 transform -translate-x-1/2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
              +{currentPoints - previousPoints}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};