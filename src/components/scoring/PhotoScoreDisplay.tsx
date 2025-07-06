import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Camera, Palette, Star, Heart } from 'lucide-react';
import { PhotoScore } from '../../types';
import { PhotoScoringService } from '../../services/photoScoringService';
import { supabase } from '../../supabase';

interface PhotoScoreDisplayProps {
  postId: string;
  imageUrl: string;
  title: string;
  description: string;
  initialScore?: PhotoScore;
}

export const PhotoScoreDisplay: React.FC<PhotoScoreDisplayProps> = ({
  postId,
  imageUrl,
  title,
  description,
  initialScore
}) => {
  const [score, setScore] = useState<PhotoScore | null>(initialScore || null);

  useEffect(() => {
    if (!initialScore && !score) {
      loadScore();
    }
  }, [postId]);

  const loadScore = async () => {
    try {
      const { data, error } = await supabase
        .from('photo_scores')
        .select('*')
        .eq('post_id', postId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // スコアが存在しない（正常）
          console.log('📊 No existing score found for post:', postId);
        } else {
          console.error('❌ Error loading score:', error);
        }
      } else if (data) {
        console.log('✅ Existing score loaded:', data);
        setScore(data);
      }
    } catch (err) {
      console.error('Failed to load score:', err);
    }
  };



  // getLevelColor関数を削除（シンプルデザインのため不要）

  if (!score) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
        <Award className="w-10 h-10 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">AI写真採点</h3>
        <p className="text-sm text-gray-600 mb-2">
          この投稿はまだ採点されていません
        </p>
        <p className="text-xs text-gray-500">
          投稿後のポップアップで自動採点されます
        </p>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-200 rounded-xl p-6"
      >
        {/* 総合スコア - シンプルデザイン */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-900 text-white mb-4">
            <div>
              <div className="text-2xl font-bold">{score.total_score}</div>
              <div className="text-xs opacity-80">/ 100</div>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xl font-bold text-gray-900">
              {score.score_level}級 · {score.level_description}
            </div>
            <div className="text-sm text-gray-600">AI写真採点結果</div>
          </div>
        </div>

        {/* 詳細スコア - シンプルリスト */}
        <div className="space-y-3 mb-6">
          <ScoreItem
            icon={<Camera className="w-4 h-4" />}
            title="技術的品質"
            score={score.technical_score}
            maxScore={25}
          />
          <ScoreItem
            icon={<Palette className="w-4 h-4" />}
            title="構図・バランス"
            score={score.composition_score}
            maxScore={25}
          />
          <ScoreItem
            icon={<Star className="w-4 h-4" />}
            title="創造性"
            score={score.creativity_score}
            maxScore={25}
          />
          <ScoreItem
            icon={<Heart className="w-4 h-4" />}
            title="エンゲージメント"
            score={score.engagement_score}
            maxScore={25}
          />
        </div>

        {/* AIコメント */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            AIフィードバック
          </h4>
          <p className="text-sm text-gray-600 leading-relaxed">{score.ai_comment}</p>
        </div>


      </motion.div>
    </AnimatePresence>
  );
};

interface ScoreItemProps {
  icon: React.ReactNode;
  title: string;
  score: number;
  maxScore: number;
}

const ScoreItem: React.FC<ScoreItemProps> = ({ icon, title, score, maxScore }) => {
  const percentage = (score / maxScore) * 100;

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-600">
          {icon}
        </div>
        <span className="text-sm font-medium text-gray-700">{title}</span>
      </div>
      <div className="flex items-center space-x-3">
        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gray-800 rounded-full"
          />
        </div>
        <span className="text-sm font-bold text-gray-900 min-w-[3rem] text-right">
          {score}/{maxScore}
        </span>
      </div>
    </div>
  );
};