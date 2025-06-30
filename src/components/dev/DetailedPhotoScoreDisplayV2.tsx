import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, Camera, Palette, Star, Heart, Eye, Zap, Target, 
  TrendingUp, BarChart3, Clock, Shield, AlertCircle 
} from 'lucide-react';
import { DetailedPhotoScore } from '../../types';
import { PhotoScoringServiceV2 } from '../../services/photoScoringServiceV2';
import { DevAuthService, devLog } from '../../utils/devAuth';

interface DetailedPhotoScoreDisplayV2Props {
  postId: string;
  imageUrl: string;
  title: string;
  description: string;
  userEmail?: string;
}

export const DetailedPhotoScoreDisplayV2: React.FC<DetailedPhotoScoreDisplayV2Props> = ({
  postId,
  imageUrl,
  title,
  description,
  userEmail
}) => {
  const [score, setScore] = useState<DetailedPhotoScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDevAuthenticated, setIsDevAuthenticated] = useState(false);
  const [secretKey, setSecretKey] = useState('');
  const [showSecretInput, setShowSecretInput] = useState(false);

  useEffect(() => {
    // 開発者認証チェック
    const isDev = DevAuthService.isDeveloper(userEmail);
    const storedAuth = DevAuthService.getStoredDevAuth();
    const isAuthenticated = isDev || storedAuth.authenticated;
    
    devLog.info('Developer auth check', { 
      userEmail, 
      isDev, 
      storedAuth: storedAuth.authenticated, 
      isAuthenticated 
    });
    
    setIsDevAuthenticated(isAuthenticated);
  }, [userEmail]);

  const handleSecretAuth = () => {
    devLog.info('Attempting secret authentication', { secretKey: secretKey.replace(/./g, '*') });
    
    if (DevAuthService.authenticateWithSecret(secretKey)) {
      DevAuthService.storeDevAuth();
      setIsDevAuthenticated(true);
      setShowSecretInput(false);
      setSecretKey('');
      setError(null);
      devLog.info('✅ Developer authenticated successfully with secret key');
    } else {
      const errorMsg = `無効なシークレットキーです（入力: ${secretKey}）`;
      setError(errorMsg);
      devLog.warn('❌ Invalid secret key', { inputKey: secretKey });
    }
  };

  const generateDetailedScore = async () => {
    if (!isDevAuthenticated) {
      setError('開発者認証が必要です');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const startTime = Date.now();
      devLog.info('Starting detailed photo scoring V2', { postId, title });
      
      const scoringService = new PhotoScoringServiceV2();
      
      // API接続テスト
      const apiAvailable = await scoringService.testAPIConnection();
      devLog.info('Gemini API status', { available: apiAvailable });
      
      const detailedScore = await scoringService.scorePhotoDetailed(imageUrl, title, description);
      
      devLog.performance('Detailed scoring completed', startTime);
      devLog.info('Detailed score result', detailedScore);
      
      setScore(detailedScore);
    } catch (err: any) {
      devLog.error('Detailed scoring failed', err);
      setError(err.message || '詳細採点に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 認証されていない場合の表示
  if (!isDevAuthenticated) {
    return (
      <div className="bg-gradient-to-br from-gray-900 to-black text-white rounded-xl p-6 border border-gray-700">
        <div className="text-center">
          <Shield className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-red-400 mb-2">開発者専用機能</h3>
          <p className="text-sm text-gray-400 mb-4">
            1000点満点詳細採点システム（β版）
          </p>
          
          {!showSecretInput ? (
            <button
              onClick={() => setShowSecretInput(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm"
            >
              開発者認証
            </button>
          ) : (
            <div className="space-y-3">
              <input
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="シークレットキーを入力"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                onKeyPress={(e) => e.key === 'Enter' && handleSecretAuth()}
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleSecretAuth}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm"
                >
                  認証
                </button>
                <button
                  onClick={() => setShowSecretInput(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors text-sm"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}
          
          {error && (
            <p className="text-red-400 text-sm mt-2">{error}</p>
          )}
        </div>
      </div>
    );
  }

  // スコア未生成の場合
  if (!score) {
    return (
      <div className="bg-gradient-to-br from-purple-900 to-indigo-900 text-white rounded-xl p-6 border border-purple-700">
        <div className="text-center">
          <Award className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">🚀 AI詳細写真採点 V2</h3>
          <p className="text-sm text-purple-200 mb-4">
            1000点満点・16項目による超詳細分析
          </p>
          
          <div className="bg-black/30 rounded-lg p-4 mb-4">
            <p className="text-xs text-purple-300 mb-2">⚡ 分析項目 (1000点満点)</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>• 技術的品質 (300pt)</div>
              <div>• 構図・アート性 (250pt)</div>
              <div>• 創造性・表現力 (250pt)</div>
              <div>• エンゲージメント (200pt)</div>
            </div>
          </div>
          
          <button
            onClick={generateDetailedScore}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center mx-auto"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                分析中...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 mr-2" />
                詳細採点を開始
              </>
            )}
          </button>
          
          {error && (
            <p className="text-red-400 text-sm mt-3">{error}</p>
          )}
        </div>
      </div>
    );
  }

  const levelInfo = PhotoScoringServiceV2.getDetailedScoreLevel(score.totalScore);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-900 to-gray-900 text-white rounded-xl p-6 border border-slate-700"
      >
        {/* ヘッダー部分 */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
               style={{ background: `linear-gradient(135deg, ${levelInfo.color}, ${levelInfo.color}99)` }}>
            <div className="text-center">
              <div className="text-2xl">{levelInfo.badge}</div>
              <div className="text-lg font-bold">{score.totalScore}</div>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-2xl font-bold" style={{ color: levelInfo.color }}>
              {score.scoreLevel}級 ({score.totalScore}/1000)
            </div>
            <div className="text-sm text-gray-300">{levelInfo.description}</div>
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
              <span className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {score.processingTime}ms
              </span>
              <span className="flex items-center">
                <BarChart3 className="w-3 h-3 mr-1" />
                信頼度 {(score.confidence * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* 詳細スコア */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <ScoreCategory
            icon={<Camera className="w-5 h-5" />}
            title="技術的品質"
            score={score.technical.total}
            maxScore={300}
            color="#3B82F6"
            breakdown={[
              { label: '露出・明度', score: score.technical.exposure, max: 60 },
              { label: 'フォーカス', score: score.technical.focus, max: 60 },
              { label: '色彩・画質', score: score.technical.colorQuality, max: 60 },
              { label: '撮影技術', score: score.technical.shootingTechnique, max: 60 },
              { label: '後処理', score: score.technical.postProcessing, max: 60 }
            ]}
          />
          
          <ScoreCategory
            icon={<Palette className="w-5 h-5" />}
            title="構図・アート性"
            score={score.composition.total}
            maxScore={250}
            color="#9CA3AF"
            breakdown={[
              { label: '基本構図法', score: score.composition.basicComposition, max: 80 },
              { label: '空間構成', score: score.composition.spatialComposition, max: 70 },
              { label: '視覚バランス', score: score.composition.visualBalance, max: 50 },
              { label: '独創的視点', score: score.composition.creativeViewpoint, max: 50 }
            ]}
          />
          
          <ScoreCategory
            icon={<Star className="w-5 h-5" />}
            title="創造性・表現力"
            score={score.creativity.total}
            maxScore={250}
            color="#F59E0B"
            breakdown={[
              { label: '光の表現', score: score.creativity.lightExpression, max: 80 },
              { label: '被写体・瞬間', score: score.creativity.subjectMoment, max: 70 },
              { label: 'ストーリー', score: score.creativity.storytelling, max: 60 },
              { label: '芸術的価値', score: score.creativity.artisticValue, max: 40 }
            ]}
          />
          
          <ScoreCategory
            icon={<Heart className="w-5 h-5" />}
            title="エンゲージメント"
            score={score.engagement.total}
            maxScore={200}
            color="#EF4444"
            breakdown={[
              { label: '視覚インパクト', score: score.engagement.visualImpact, max: 70 },
              { label: '共感・親近感', score: score.engagement.relatability, max: 60 },
              { label: 'SNS適性', score: score.engagement.socialMedia, max: 40 },
              { label: '記憶定着度', score: score.engagement.memorability, max: 30 }
            ]}
          />
        </div>

        {/* 総合コメント */}
        <div className="bg-slate-800 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center">
            <Eye className="w-4 h-4 mr-2" />
            AI総合評価
          </h4>
          <p className="text-sm text-gray-100 leading-relaxed">{score.overallComment}</p>
        </div>

        {/* 詳細フィードバック */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FeedbackSection
            title="✨ 強み"
            items={score.detailedFeedback.strengths}
            color="text-green-400"
          />
          <FeedbackSection
            title="🎯 改善点"
            items={score.detailedFeedback.improvements}
            color="text-yellow-400"
          />
          <FeedbackSection
            title="🔧 技術アドバイス"
            items={score.detailedFeedback.technicalAdvice}
            color="text-blue-400"
          />
          <FeedbackSection
            title="💡 創造的提案"
            items={score.detailedFeedback.creativeSuggestions}
            color="text-purple-400"
          />
        </div>

        {/* デバッグ情報 */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Analysis V{score.analysisVersion}</span>
            <span>Post ID: {postId}</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// スコアカテゴリーコンポーネント
interface ScoreCategoryProps {
  icon: React.ReactNode;
  title: string;
  score: number;
  maxScore: number;
  color: string;
  breakdown: { label: string; score: number; max: number }[];
}

const ScoreCategory: React.FC<ScoreCategoryProps> = ({ icon, title, score, maxScore, color, breakdown }) => {
  const percentage = (score / maxScore) * 100;

  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div style={{ color }}>{icon}</div>
          <span className="font-medium text-sm">{title}</span>
        </div>
        <span className="text-lg font-bold" style={{ color }}>
          {score}/{maxScore}
        </span>
      </div>
      
      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
      
      <div className="space-y-1">
        {breakdown.map((item, index) => (
          <div key={index} className="flex justify-between text-xs">
            <span className="text-gray-400">{item.label}</span>
            <span className="text-gray-300">{item.score}/{item.max}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// フィードバックセクション
interface FeedbackSectionProps {
  title: string;
  items: string[];
  color: string;
}

const FeedbackSection: React.FC<FeedbackSectionProps> = ({ title, items, color }) => (
  <div className="bg-slate-800 rounded-lg p-4">
    <h4 className={`text-sm font-medium mb-2 ${color}`}>{title}</h4>
    <ul className="space-y-1">
      {items.map((item, index) => (
        <li key={index} className="text-xs text-gray-300 leading-relaxed">
          • {item}
        </li>
      ))}
    </ul>
  </div>
);