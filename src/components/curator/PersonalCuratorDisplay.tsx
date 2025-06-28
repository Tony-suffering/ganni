import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  TrendingUp, 
  Compass, 
  Heart, 
  Music, 
  Palette, 
  Target,
  Clock,
  ChevronRight,
  Sparkles,
  Award,
  Calendar
} from 'lucide-react';
import { 
  PersonalizedSuggestion, 
  EmotionAnalysis, 
  LifestylePattern, 
  GrowthTracking,
  CulturalContext
} from '../../types/curator';
import { emotionAnalysisService } from '../../services/emotionAnalysisService';
import { culturalIntegrationService } from '../../services/culturalIntegrationService';
import { lifestyleConciergeService } from '../../services/lifestyleConciergeService';
import { growthPartnerService } from '../../services/growthPartnerService';

interface PersonalCuratorDisplayProps {
  postId: string;
  userId: string;
  userPosts: any[];
  userLocation?: { latitude: number; longitude: number };
}

export const PersonalCuratorDisplay: React.FC<PersonalCuratorDisplayProps> = ({
  postId,
  userId,
  userPosts,
  userLocation
}) => {
  const [activeTab, setActiveTab] = useState<'insights' | 'suggestions' | 'growth'>('insights');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 分析データ状態
  const [emotionAnalysis, setEmotionAnalysis] = useState<EmotionAnalysis | null>(null);
  const [lifestylePattern, setLifestylePattern] = useState<LifestylePattern | null>(null);
  const [growthTracking, setGrowthTracking] = useState<GrowthTracking | null>(null);
  const [culturalContext, setCulturalContext] = useState<CulturalContext | null>(null);
  const [suggestions, setSuggestions] = useState<PersonalizedSuggestion[]>([]);

  useEffect(() => {
    if (userPosts.length > 0) {
      runAnalysis();
    }
  }, [userId, userPosts]);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🧠 Starting comprehensive user analysis...');
      
      const analysisRequest = {
        userId,
        posts: userPosts.slice(-10).map(post => ({
          id: post.id,
          title: post.title,
          description: post.userComment || '',
          imageUrl: post.imageUrl,
          createdAt: post.createdAt,
          tags: post.tags?.map((tag: any) => tag.name) || []
        })),
        analysisDepth: 'standard' as const
      };

      // 並行して複数の分析を実行
      const [emotionResult, lifestyleResult, growthResult] = await Promise.all([
        emotionAnalysisService.analyzeUserEmotions(analysisRequest),
        lifestyleConciergeService.analyzeLifestylePattern(analysisRequest),
        growthPartnerService.trackGrowthProgress(analysisRequest)
      ]);

      if (emotionResult.success && emotionResult.data) {
        setEmotionAnalysis(emotionResult.data);
        console.log('✅ Emotion analysis completed');
        
        // 感情分析が完了したら文化的コンテキストを取得
        const culturalResult = await culturalIntegrationService.generateCulturalContext(
          emotionResult.data,
          userLocation
        );
        
        if (culturalResult.success && culturalResult.data) {
          setCulturalContext(culturalResult.data);
          console.log('✅ Cultural context generated');
        }
      }

      if (lifestyleResult.success && lifestyleResult.data) {
        setLifestylePattern(lifestyleResult.data);
        console.log('✅ Lifestyle pattern analyzed');
      }

      if (growthResult.success && growthResult.data) {
        setGrowthTracking(growthResult.data);
        console.log('✅ Growth tracking completed');
      }

      // 全ての分析が完了したら統合提案を生成
      if (emotionResult.data && lifestyleResult.data && growthResult.data) {
        await generateIntegratedSuggestions(
          emotionResult.data,
          lifestyleResult.data,
          growthResult.data
        );
      }

    } catch (err: any) {
      console.error('❌ Analysis failed:', err);
      setError(err.message || '分析に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const generateIntegratedSuggestions = async (
    emotion: EmotionAnalysis,
    lifestyle: LifestylePattern,
    growth: GrowthTracking
  ) => {
    try {
      console.log('💡 Generating integrated suggestions...');
      
      // 複数のサービスから提案を取得
      const [lifestyleSuggestions, growthSuggestions] = await Promise.all([
        lifestyleConciergeService.generatePersonalizedSuggestions(emotion, lifestyle, userLocation),
        growthPartnerService.generateGrowthSuggestions(growth, emotion, lifestyle)
      ]);

      const allSuggestions: PersonalizedSuggestion[] = [];
      
      if (lifestyleSuggestions.success && lifestyleSuggestions.data) {
        allSuggestions.push(...lifestyleSuggestions.data);
      }
      
      if (growthSuggestions.success && growthSuggestions.data) {
        allSuggestions.push(...growthSuggestions.data);
      }

      // 提案を優先度とエンゲージメントでソート
      allSuggestions.sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority] || 0;
        const bPriority = priorityOrder[b.priority] || 0;
        
        if (aPriority !== bPriority) return bPriority - aPriority;
        return b.estimatedEngagement - a.estimatedEngagement;
      });

      setSuggestions(allSuggestions.slice(0, 6)); // 上位6つを表示
      console.log('✅ Integrated suggestions generated');
      
    } catch (err) {
      console.error('Failed to generate suggestions:', err);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-600">AIキュレーターが分析中...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="text-center py-4">
          <p className="text-red-500 text-sm">{error}</p>
          <button
            onClick={runAnalysis}
            className="mt-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  if (!emotionAnalysis && !lifestylePattern && !growthTracking) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="text-center py-8">
          <Brain className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">AIパーソナルキュレーター</h3>
          <p className="text-sm text-gray-600 mb-4">
            投稿データからあなたの感情・嗜好・成長パターンを分析し、<br/>
            パーソナライズされた体験提案を行います
          </p>
          <button
            onClick={runAnalysis}
            className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors flex items-center mx-auto"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            分析開始
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">AIパーソナルキュレーター</h3>
              <p className="text-sm text-indigo-100">感情・嗜好・成長の統合分析</p>
            </div>
          </div>
          <div className="text-xs text-indigo-100">
            最終更新: {new Date().toLocaleDateString('ja-JP')}
          </div>
        </div>
      </div>

      {/* タブ */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <TabButton
            icon={Heart}
            label="感情・嗜好"
            isActive={activeTab === 'insights'}
            onClick={() => setActiveTab('insights')}
          />
          <TabButton
            icon={Compass}
            label="提案"
            isActive={activeTab === 'suggestions'}
            onClick={() => setActiveTab('suggestions')}
          />
          <TabButton
            icon={TrendingUp}
            label="成長"
            isActive={activeTab === 'growth'}
            onClick={() => setActiveTab('growth')}
          />
        </div>
      </div>

      {/* コンテンツ */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <InsightsPanel 
                emotionAnalysis={emotionAnalysis}
                lifestylePattern={lifestylePattern}
                culturalContext={culturalContext}
              />
            </motion.div>
          )}
          
          {activeTab === 'suggestions' && (
            <motion.div
              key="suggestions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <SuggestionsPanel suggestions={suggestions} />
            </motion.div>
          )}
          
          {activeTab === 'growth' && (
            <motion.div
              key="growth"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <GrowthPanel growthTracking={growthTracking} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// タブボタンコンポーネント
interface TabButtonProps {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ icon: Icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
      isActive
        ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`}
  >
    <Icon className="w-4 h-4" />
    <span>{label}</span>
  </button>
);

// 感情・嗜好パネル
interface InsightsPanelProps {
  emotionAnalysis: EmotionAnalysis | null;
  lifestylePattern: LifestylePattern | null;
  culturalContext: CulturalContext | null;
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({ 
  emotionAnalysis, 
  lifestylePattern, 
  culturalContext 
}) => {
  if (!emotionAnalysis && !lifestylePattern) {
    return (
      <div className="text-center py-8 text-gray-500">
        分析データがありません
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 感情分析 */}
      {emotionAnalysis && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Heart className="w-5 h-5 mr-2 text-pink-500" />
            現在の感情状態
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(emotionAnalysis.emotions).map(([emotion, value]) => (
              <EmotionCard key={emotion} emotion={emotion} value={value} />
            ))}
          </div>
        </div>
      )}

      {/* 興味・関心分野 */}
      {emotionAnalysis && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-indigo-500" />
            興味・関心分野
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(emotionAnalysis.interests).map(([interest, value]) => (
              <InterestCard key={interest} interest={interest} value={value} />
            ))}
          </div>
        </div>
      )}

      {/* 文化的コンテキスト */}
      {culturalContext && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Music className="w-5 h-5 mr-2 text-purple-500" />
            おすすめ音楽・アート
          </h4>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-medium text-gray-700 mb-2">音楽ジャンル</h5>
              <div className="space-y-2">
                {culturalContext.music.genres.map((genre, index) => (
                  <span key={index} className="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm mr-2">
                    {genre}
                  </span>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-2">気分: {culturalContext.music.mood}</p>
            </div>
            <div>
              <h5 className="font-medium text-gray-700 mb-2">アートスタイル</h5>
              <div className="space-y-2">
                {culturalContext.art.styles.map((style, index) => (
                  <span key={index} className="inline-block bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm mr-2">
                    {style}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 生活パターン */}
      {lifestylePattern && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-green-500" />
            生活パターン
          </h4>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="font-medium text-gray-700 mb-2">活動時間帯</h5>
              <div className="space-y-1">
                {lifestylePattern.timePatterns.mostActiveHours.map(hour => (
                  <span key={hour} className="inline-block bg-green-100 text-green-700 px-2 py-1 rounded text-sm mr-1">
                    {hour}:00
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="font-medium text-gray-700 mb-2">活動レベル</h5>
              <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                lifestylePattern.behaviorPatterns.activityLevel === 'high' ? 'bg-red-100 text-red-700' :
                lifestylePattern.behaviorPatterns.activityLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {lifestylePattern.behaviorPatterns.activityLevel === 'high' ? '高' :
                 lifestylePattern.behaviorPatterns.activityLevel === 'medium' ? '中' : '低'}
              </span>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="font-medium text-gray-700 mb-2">行動半径</h5>
              <span className="text-lg font-semibold text-gray-900">
                {lifestylePattern.behaviorPatterns.travelRadius}km
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 感情カード
const EmotionCard: React.FC<{ emotion: string; value: number }> = ({ emotion, value }) => {
  const getEmotionInfo = (emotion: string) => {
    const mapping: Record<string, { label: string; color: string; icon: string }> = {
      joy: { label: '喜び', color: 'yellow', icon: '😊' },
      peace: { label: '平安', color: 'blue', icon: '😌' },
      excitement: { label: '興奮', color: 'red', icon: '🤩' },
      melancholy: { label: '憂愁', color: 'purple', icon: '😔' },
      nostalgia: { label: '郷愁', color: 'orange', icon: '🥺' },
      curiosity: { label: '好奇心', color: 'green', icon: '🤔' },
      stress: { label: 'ストレス', color: 'gray', icon: '😰' }
    };
    return mapping[emotion] || { label: emotion, color: 'gray', icon: '😐' };
  };

  const info = getEmotionInfo(emotion);
  const percentage = Math.round(value * 100);

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{info.label}</span>
        <span className="text-lg">{info.icon}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div 
          className={`bg-${info.color}-500 h-2 rounded-full transition-all duration-1000`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-gray-600">{percentage}%</span>
    </div>
  );
};

// 興味カード
const InterestCard: React.FC<{ interest: string; value: number }> = ({ interest, value }) => {
  const getInterestInfo = (interest: string) => {
    const mapping: Record<string, { label: string; icon: string }> = {
      nature: { label: '自然', icon: '🌿' },
      urban: { label: '都市', icon: '🏙️' },
      art: { label: 'アート', icon: '🎨' },
      food: { label: '食べ物', icon: '🍜' },
      people: { label: '人物', icon: '👥' },
      travel: { label: '旅行', icon: '✈️' },
      culture: { label: '文化', icon: '🏛️' },
      technology: { label: 'テクノロジー', icon: '💻' }
    };
    return mapping[interest] || { label: interest, icon: '📷' };
  };

  const info = getInterestInfo(interest);
  const percentage = Math.round(value * 100);

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{info.label}</span>
        <span className="text-lg">{info.icon}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div 
          className="bg-indigo-500 h-2 rounded-full transition-all duration-1000"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-gray-600">{percentage}%</span>
    </div>
  );
};

// 提案パネル
const SuggestionsPanel: React.FC<{ suggestions: PersonalizedSuggestion[] }> = ({ suggestions }) => {
  if (suggestions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        まだ提案がありません
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Sparkles className="w-5 h-5 mr-2 text-yellow-500" />
        パーソナライズされた提案
      </h4>
      {suggestions.map((suggestion, index) => (
        <SuggestionCard key={suggestion.id} suggestion={suggestion} index={index} />
      ))}
    </div>
  );
};

// 提案カード
const SuggestionCard: React.FC<{ suggestion: PersonalizedSuggestion; index: number }> = ({ 
  suggestion, 
  index 
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  const priorityColor = getPriorityColor(suggestion.priority);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h5 className="font-semibold text-gray-900">{suggestion.title}</h5>
            <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${priorityColor}-100 text-${priorityColor}-700`}>
              {suggestion.priority}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-3">{suggestion.description}</p>
          <p className="text-xs text-gray-500 italic">{suggestion.reasoning}</p>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-3 mb-3">
        <h6 className="text-sm font-medium text-gray-700 mb-2">具体的なアクション</h6>
        <p className="text-sm text-gray-600">{suggestion.content.primaryAction}</p>
        {suggestion.content.timeRecommendation && (
          <div className="mt-2 flex items-center text-xs text-gray-500">
            <Clock className="w-3 h-3 mr-1" />
            <span>{suggestion.content.timeRecommendation.bestTime} • {suggestion.content.timeRecommendation.duration}</span>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          <span>期待エンゲージメント: {Math.round(suggestion.estimatedEngagement * 100)}%</span>
          <span>提案者: {suggestion.generatedBy.replace('_', ' ')}</span>
        </div>
        <button className="flex items-center text-indigo-600 hover:text-indigo-700 text-sm font-medium">
          詳細
          <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </motion.div>
  );
};

// 成長パネル
const GrowthPanel: React.FC<{ growthTracking: GrowthTracking | null }> = ({ growthTracking }) => {
  if (!growthTracking) {
    return (
      <div className="text-center py-8 text-gray-500">
        成長データがありません
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
        成長トラッキング
      </h4>
      
      {/* スキルレベル */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h5 className="font-medium text-gray-700 mb-4">写真スキル</h5>
          <div className="space-y-3">
            <SkillBar label="技術力" value={growthTracking.photographySkills.technical} color="blue" />
            <SkillBar label="芸術性" value={growthTracking.photographySkills.artistic} color="purple" />
            <SkillBar label="一貫性" value={growthTracking.photographySkills.consistency} color="green" />
            <SkillBar label="改善度" value={growthTracking.photographySkills.improvement} color="orange" />
          </div>
        </div>
        
        <div>
          <h5 className="font-medium text-gray-700 mb-4">体験の多様性</h5>
          <div className="space-y-3">
            <SkillBar label="場所" value={growthTracking.experienceDiversity.locationDiversity} color="red" />
            <SkillBar label="時間" value={growthTracking.experienceDiversity.timeDiversity} color="yellow" />
            <SkillBar label="被写体" value={growthTracking.experienceDiversity.subjectDiversity} color="indigo" />
            <SkillBar label="スタイル" value={growthTracking.experienceDiversity.styleDiversity} color="pink" />
          </div>
        </div>
      </div>

      {/* マイルストーン */}
      {growthTracking.milestones.length > 0 && (
        <div>
          <h5 className="font-medium text-gray-700 mb-4 flex items-center">
            <Award className="w-4 h-4 mr-2" />
            最近の成果
          </h5>
          <div className="space-y-3">
            {growthTracking.milestones.slice(-3).map((milestone) => (
              <div key={milestone.id} className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                <div className={`p-2 rounded-full ${
                  milestone.significance === 'major' ? 'bg-yellow-200 text-yellow-700' :
                  milestone.significance === 'medium' ? 'bg-blue-200 text-blue-700' :
                  'bg-gray-200 text-gray-700'
                }`}>
                  <Award className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h6 className="font-medium text-gray-900">{milestone.title}</h6>
                  <p className="text-sm text-gray-600">{milestone.description}</p>
                  <p className="text-xs text-gray-500 flex items-center mt-1">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(milestone.achievedAt).toLocaleDateString('ja-JP')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// スキルバー
const SkillBar: React.FC<{ label: string; value: number; color: string }> = ({ 
  label, 
  value, 
  color 
}) => (
  <div>
    <div className="flex items-center justify-between mb-1">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <span className="text-sm text-gray-600">{value}/100</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
        className={`bg-${color}-500 h-2 rounded-full transition-all duration-1000`}
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);