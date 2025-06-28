import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lightbulb,
  MapPin,
  Camera,
  Palette,
  Clock,
  Zap,
  Target,
  RefreshCw,
  ChevronRight,
  Star,
  TrendingUp,
  Coffee,
  Sun,
  Moon,
  Leaf
} from 'lucide-react';
import { Post } from '../../types';
import { UserPostService } from '../../services/userPostService';

interface SimpleAISuggestionsProps {
  posts: Post[];
  user: any;
}

interface SimpleSuggestion {
  id: string;
  type: 'location' | 'technique' | 'time' | 'style' | 'mood';
  title: string;
  description: string;
  reasoning: string;
  actionText: string;
  priority: 'low' | 'medium' | 'high';
  icon: React.ElementType;
  color: string;
  estimatedImpact: number; // 1-10
}

export const SimpleAISuggestions: React.FC<SimpleAISuggestionsProps> = ({ posts, user }) => {
  const [suggestions, setSuggestions] = useState<SimpleSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<SimpleSuggestion | null>(null);

  const userPostService = new UserPostService();

  useEffect(() => {
    generateSimpleSuggestions();
  }, [posts]);

  const generateSimpleSuggestions = async () => {
    setLoading(true);
    
    try {
      console.log('🤖 Generating simple AI suggestions...');
      
      // 投稿データを分析
      const timeAnalysis = userPostService.analyzePostingTimes(posts);
      const emotionalTrends = userPostService.analyzeEmotionalTrends(posts);
      const diversityScore = userPostService.calculateDiversityScore(posts);
      
      // 分析結果に基づいて提案を生成
      const generatedSuggestions = await createSuggestionsFromAnalysis({
        posts,
        timeAnalysis,
        emotionalTrends,
        diversityScore,
        userPostService
      });
      
      setSuggestions(generatedSuggestions);
      console.log(`✅ Generated ${generatedSuggestions.length} AI suggestions`);
      
    } catch (error) {
      console.error('❌ Failed to generate suggestions:', error);
      setSuggestions(getDefaultSuggestions());
    } finally {
      setLoading(false);
    }
  };

  const refreshSuggestions = async () => {
    setRefreshing(true);
    await generateSimpleSuggestions();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600">AIが提案を考え中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
            AIからの提案
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            あなたの投稿パターンを分析した、パーソナライズされた提案です
          </p>
        </div>
        <button
          onClick={refreshSuggestions}
          disabled={refreshing}
          className={`flex items-center px-4 py-2 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors ${
            refreshing ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          新しい提案
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {suggestions.map((suggestion, index) => (
          <SuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            index={index}
            onClick={() => setSelectedSuggestion(suggestion)}
          />
        ))}
      </div>

      {/* 詳細モーダル */}
      <AnimatePresence>
        {selectedSuggestion && (
          <SuggestionDetailModal
            suggestion={selectedSuggestion}
            onClose={() => setSelectedSuggestion(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// 提案カードコンポーネント
interface SuggestionCardProps {
  suggestion: SimpleSuggestion;
  index: number;
  onClick: () => void;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({ suggestion, index, onClick }) => {
  const Icon = suggestion.icon;
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return { text: '優先度高', color: 'bg-red-100 text-red-700' };
      case 'medium': return { text: '推奨', color: 'bg-yellow-100 text-yellow-700' };
      case 'low': return { text: '提案', color: 'bg-green-100 text-green-700' };
      default: return { text: '提案', color: 'bg-gray-100 text-gray-700' };
    }
  };

  const priorityBadge = getPriorityBadge(suggestion.priority);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={onClick}
      className={`cursor-pointer border-2 rounded-xl p-6 hover:shadow-md transition-all duration-300 ${getPriorityColor(suggestion.priority)}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${suggestion.color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${priorityBadge.color}`}>
          {priorityBadge.text}
        </span>
      </div>

      <h4 className="text-lg font-semibold text-gray-900 mb-2">{suggestion.title}</h4>
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{suggestion.description}</p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center text-xs text-gray-500">
          <Star className="w-3 h-3 mr-1" />
          <span>期待効果: {suggestion.estimatedImpact}/10</span>
        </div>
        <div className="flex items-center text-indigo-600 text-sm font-medium">
          <span>詳細を見る</span>
          <ChevronRight className="w-4 h-4 ml-1" />
        </div>
      </div>
    </motion.div>
  );
};

// 提案詳細モーダル
interface SuggestionDetailModalProps {
  suggestion: SimpleSuggestion;
  onClose: () => void;
}

const SuggestionDetailModal: React.FC<SuggestionDetailModalProps> = ({ suggestion, onClose }) => {
  const Icon = suggestion.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg ${suggestion.color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            ×
          </button>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-3">{suggestion.title}</h3>
        <p className="text-gray-600 mb-4">{suggestion.description}</p>
        
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <h4 className="font-semibold text-blue-900 mb-2">なぜこの提案？</h4>
          <p className="text-blue-800 text-sm">{suggestion.reasoning}</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h4 className="font-semibold text-gray-900 mb-2">具体的なアクション</h4>
          <p className="text-gray-700 text-sm">{suggestion.actionText}</p>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center">
            <Star className="w-4 h-4 mr-1 text-yellow-500" />
            <span>期待効果: {suggestion.estimatedImpact}/10</span>
          </div>
          <div className="flex items-center">
            <Target className="w-4 h-4 mr-1" />
            <span>種類: {getSuggestionTypeLabel(suggestion.type)}</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          提案を参考にする
        </button>
      </motion.div>
    </motion.div>
  );
};

// 提案生成ロジック
async function createSuggestionsFromAnalysis(data: {
  posts: Post[];
  timeAnalysis: any;
  emotionalTrends: any;
  diversityScore: any;
  userPostService: UserPostService;
}): Promise<SimpleSuggestion[]> {
  const { posts, timeAnalysis, emotionalTrends, diversityScore } = data;
  const suggestions: SimpleSuggestion[] = [];

  // 1. 時間帯による提案
  if (timeAnalysis.mostActiveHour >= 6 && timeAnalysis.mostActiveHour <= 11) {
    suggestions.push({
      id: 'morning-golden-hour',
      type: 'time',
      title: '朝の黄金時間を活用',
      description: 'あなたは朝型のクリエイターです。日の出前後30分の特別な光を活用してみませんか？',
      reasoning: `投稿分析により、あなたは${timeAnalysis.mostActiveHour}時台に最も活発に活動されています。朝の時間帯は写真撮影に理想的です。`,
      actionText: '明日の日の出30分前に屋外に出て、ゴールデンアワーの撮影にチャレンジしてみましょう。',
      priority: 'high',
      icon: Sun,
      color: 'bg-orange-500',
      estimatedImpact: 9
    });
  } else if (timeAnalysis.mostActiveHour >= 18 && timeAnalysis.mostActiveHour <= 22) {
    suggestions.push({
      id: 'evening-blue-hour',
      type: 'time',
      title: '夕暮れのブルーアワー',
      description: '夜型のあなたには、夕暮れ後の魔法的な時間帯がおすすめです。',
      reasoning: `${timeAnalysis.mostActiveHour}時台での活動が多いことから、夕方〜夜の時間帯を有効活用できそうです。`,
      actionText: '今度の晴れた日の夕暮れ後20分間、街の明かりと空の青のコントラストを撮影してみてください。',
      priority: 'high',
      icon: Moon,
      color: 'bg-indigo-500',
      estimatedImpact: 8
    });
  }

  // 2. 多様性による提案
  if (diversityScore.tagDiversity < 50) {
    suggestions.push({
      id: 'expand-subjects',
      type: 'style',
      title: '新しい被写体に挑戦',
      description: '撮影ジャンルを広げることで、新しい発見と成長の機会が生まれます。',
      reasoning: 'タグの多様性スコアが50%未満であることから、撮影対象の幅を広げる余地があります。',
      actionText: 'これまで撮影したことのないジャンル（人物、建築、マクロなど）に1つ挑戦してみましょう。',
      priority: 'medium',
      icon: Palette,
      color: 'bg-purple-500',
      estimatedImpact: 7
    });
  }

  // 3. 感情的傾向による提案
  if (emotionalTrends.calmCount / posts.length > 0.6) {
    suggestions.push({
      id: 'energetic-challenge',
      type: 'mood',
      title: 'エネルギッシュな撮影にチャレンジ',
      description: '落ち着いた作品が多いあなたに、動きやエネルギーを感じる撮影をおすすめします。',
      reasoning: '投稿の60%以上が落ち着いたトーンであることから、対比となる活動的な撮影が新鮮な発見をもたらすでしょう。',
      actionText: 'スポーツイベント、お祭り、街の活気のある場所で動きのある写真を撮ってみましょう。',
      priority: 'medium',
      icon: Zap,
      color: 'bg-red-500',
      estimatedImpact: 6
    });
  } else if (emotionalTrends.energeticCount / posts.length > 0.6) {
    suggestions.push({
      id: 'calm-exploration',
      type: 'mood',
      title: '静寂の美しさを探る',
      description: 'エネルギッシュな作品が多いあなたに、静けさの中の美を見つける撮影をおすすめします。',
      reasoning: 'エネルギッシュな投稿が多いことから、静かで瞑想的な写真が新しい表現の可能性を開くでしょう。',
      actionText: '早朝の公園、図書館、静かなカフェなどで落ち着いた雰囲気の写真を撮ってみましょう。',
      priority: 'medium',
      icon: Leaf,
      color: 'bg-green-500',
      estimatedImpact: 6
    });
  }

  // 4. 技術的提案
  suggestions.push({
    id: 'composition-rule',
    type: 'technique',
    title: '構図の法則を意識した撮影',
    description: '三分割法や黄金比を意識することで、より魅力的な構図を作れます。',
    reasoning: '基本的な構図の法則を意識することで、写真の視覚的な魅力が格段に向上します。',
    actionText: 'カメラのグリッド機能を有効にして、被写体を交点に配置する撮影を10枚試してみましょう。',
    priority: 'medium',
    icon: Camera,
    color: 'bg-blue-500',
    estimatedImpact: 8
  });

  // 5. 場所による提案
  if (posts.length >= 5) {
    suggestions.push({
      id: 'new-location',
      type: 'location',
      title: '新しい撮影スポットを開拓',
      description: 'いつもと違う場所での撮影は、新鮮な視点と創造性をもたらします。',
      reasoning: '定期的に新しい場所を探索することで、撮影技術と芸術的感性の両方が向上します。',
      actionText: '今週末、今まで行ったことのない近隣エリアを散策して、3つの新しい撮影スポットを見つけましょう。',
      priority: 'low',
      icon: MapPin,
      color: 'bg-teal-500',
      estimatedImpact: 7
    });
  }

  // ランダムに4-6個の提案を選択
  const shuffled = suggestions.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(6, Math.max(4, shuffled.length)));
}

// デフォルト提案
function getDefaultSuggestions(): SimpleSuggestion[] {
  return [
    {
      id: 'golden-hour',
      type: 'time',
      title: 'ゴールデンアワーで撮影',
      description: '日の出・日の入りの1時間は、最も美しい自然光を活用できる時間帯です。',
      reasoning: '多くの写真家が推薦する、最も美しい光の時間帯を活用してみましょう。',
      actionText: '明日の日の出または日の入り時刻をチェックして、屋外での撮影を計画しましょう。',
      priority: 'high',
      icon: Sun,
      color: 'bg-orange-500',
      estimatedImpact: 9
    },
    {
      id: 'rule-of-thirds',
      type: 'technique',
      title: '三分割法を練習',
      description: '基本的な構図の法則をマスターして、より魅力的な写真を撮りましょう。',
      reasoning: '構図の基本を身につけることで、写真の視覚的魅力が大幅に向上します。',
      actionText: 'カメラのグリッド表示を有効にして、被写体を交点に配置する練習をしてみましょう。',
      priority: 'medium',
      icon: Camera,
      color: 'bg-blue-500',
      estimatedImpact: 8
    },
    {
      id: 'explore-neighborhood',
      type: 'location',
      title: '近所の新スポット発見',
      description: '身近な場所にも、まだ発見していない素晴らしい被写体があるかもしれません。',
      reasoning: '新しい視点で見慣れた場所を探索することで、意外な発見があります。',
      actionText: '普段通らない道を歩いて、興味深い建物、植物、光景を探してみましょう。',
      priority: 'low',
      icon: MapPin,
      color: 'bg-teal-500',
      estimatedImpact: 6
    },
    {
      id: 'try-macro',
      type: 'style',
      title: 'マクロ撮影に挑戦',
      description: '小さな世界の美しさを発見する、マクロ撮影を試してみませんか？',
      reasoning: '日常の小さなディテールに焦点を当てることで、新しい表現の可能性が広がります。',
      actionText: '花、昆虫、水滴など、小さな被写体に可能な限り近づいて撮影してみましょう。',
      priority: 'medium',
      icon: Palette,
      color: 'bg-purple-500',
      estimatedImpact: 7
    }
  ];
}

// 提案タイプのラベル
function getSuggestionTypeLabel(type: string): string {
  switch (type) {
    case 'location': return '場所';
    case 'technique': return '技術';
    case 'time': return '時間';
    case 'style': return 'スタイル';
    case 'mood': return '雰囲気';
    default: return '一般';
  }
}