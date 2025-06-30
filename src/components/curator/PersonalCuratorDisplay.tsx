import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  TrendingUp, 
  Compass, 
  Heart, 
  Music, 
  Palette, 
  Target,
  Clock,
  ChevronRight,
  Award,
  Calendar,
  RefreshCw,
  BookOpen,
  Camera,
  Trophy
} from 'lucide-react';
import { 
  PersonalizedSuggestion, 
  EmotionAnalysis, 
  LifestylePattern, 
  GrowthTracking,
  CulturalContext
} from '../../types/curator';
import { emotionAnalysisService } from '../../services/emotionAnalysisService'; // 裏側で使用
import { culturalIntegrationService } from '../../services/culturalIntegrationService';
import { lifestyleConciergeService } from '../../services/lifestyleConciergeService';
import { growthPartnerService } from '../../services/growthPartnerService';
import { photoAnalysisDeepService, PhotoCreativeProfile } from '../../services/photoAnalysisDeepService';
import { premiumSuggestionService } from '../../services/premiumSuggestionService';
import { updateExistingPhotoScores } from '../../utils/updateExistingPhotoScores';
import { personalityInsightService, DeepPersonalityProfile } from '../../services/personalityInsightService';
import { dynamicCommentService, DynamicComment } from '../../services/dynamicCommentService';
import { PhotoScoreV2 } from '../../types/photoScoreV2';

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
  const [activeTab, setActiveTab] = useState<'insights' | 'suggestions'>('insights');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 分析データ状態
  const [emotionAnalysis, setEmotionAnalysis] = useState<EmotionAnalysis | null>(null);
  const [lifestylePattern, setLifestylePattern] = useState<LifestylePattern | null>(null);
  const [growthTracking, setGrowthTracking] = useState<GrowthTracking | null>(null);
  const [culturalContext, setCulturalContext] = useState<CulturalContext | null>(null);
  const [photoCreativeProfile, setPhotoCreativeProfile] = useState<PhotoCreativeProfile | null>(null);
  const [suggestions, setSuggestions] = useState<PersonalizedSuggestion[]>([]);
  const [hasAnalyzed, setHasAnalyzed] = useState(false); // 分析済みフラグ
  const [isUpdatingScores, setIsUpdatingScores] = useState(false); // 既存スコア更新中フラグ
  const [deepPersonalityProfile, setDeepPersonalityProfile] = useState<DeepPersonalityProfile | null>(null);
  const [dynamicComments, setDynamicComments] = useState<DynamicComment[]>([]);

  // ローカルストレージキー
  const analysisStorageKey = `aiCurator_${userId}`;

  // 分析結果をローカルストレージに保存
  const saveAnalysisToStorage = (analysisData: any) => {
    try {
      const dataToSave = {
        timestamp: Date.now(),
        userId,
        emotionAnalysis,
        lifestylePattern,
        growthTracking,
        culturalContext,
        photoCreativeProfile,
        suggestions,
        deepPersonalityProfile,
        dynamicComments,
        hasAnalyzed: true
      };
      
      console.log('💾 Saving to localStorage:', {
        key: analysisStorageKey,
        hasEmotionAnalysis: !!dataToSave.emotionAnalysis,
        hasLifestylePattern: !!dataToSave.lifestylePattern,
        hasDeepPersonalityProfile: !!dataToSave.deepPersonalityProfile,
        hasSuggestions: !!(dataToSave.suggestions?.length),
        timestamp: new Date(dataToSave.timestamp).toLocaleString()
      });
      
      localStorage.setItem(analysisStorageKey, JSON.stringify(dataToSave));
      console.log('✅ 分析結果をローカルストレージに保存しました');
    } catch (error) {
      console.warn('⚠️ ローカルストレージへの保存に失敗:', error);
    }
  };

  // ローカルストレージから分析結果を復元（永続化）
  const loadAnalysisFromStorage = () => {
    try {
      console.log('🔍 Loading from localStorage key:', analysisStorageKey);
      const stored = localStorage.getItem(analysisStorageKey);
      console.log('🔍 Stored data found:', !!stored);
      
      if (stored) {
        const data = JSON.parse(stored);
        console.log('🔍 Parsed data:', {
          hasEmotionAnalysis: !!data.emotionAnalysis,
          hasLifestylePattern: !!data.lifestylePattern,
          hasDeepPersonalityProfile: !!data.deepPersonalityProfile,
          hasSuggestions: !!(data.suggestions?.length),
          hasAnalyzed: data.hasAnalyzed,
          timestamp: new Date(data.timestamp).toLocaleString()
        });
        
        // 時間制限を撤廃 - 永続的に保存
        if (data.emotionAnalysis) setEmotionAnalysis(data.emotionAnalysis);
        if (data.lifestylePattern) setLifestylePattern(data.lifestylePattern);
        if (data.growthTracking) setGrowthTracking(data.growthTracking);
        if (data.culturalContext) setCulturalContext(data.culturalContext);
        if (data.photoCreativeProfile) setPhotoCreativeProfile(data.photoCreativeProfile);
        if (data.suggestions) setSuggestions(data.suggestions);
        if (data.deepPersonalityProfile) setDeepPersonalityProfile(data.deepPersonalityProfile);
        if (data.dynamicComments) setDynamicComments(data.dynamicComments);
        if (data.hasAnalyzed) setHasAnalyzed(true);
        
        console.log('✅ ローカルストレージから分析結果を復元しました（永続保存）');
        return true;
      } else {
        console.log('💡 ローカルストレージにデータが見つかりません');
      }
    } catch (error) {
      console.warn('⚠️ ローカルストレージからの読み込みに失敗:', error);
      localStorage.removeItem(analysisStorageKey);
    }
    return false;
  };

  // キャッシュをクリア
  const clearAnalysisCache = () => {
    localStorage.removeItem(analysisStorageKey);
    setEmotionAnalysis(null);
    setLifestylePattern(null);
    setGrowthTracking(null);
    setCulturalContext(null);
    setPhotoCreativeProfile(null);
    setSuggestions([]);
    setDeepPersonalityProfile(null);
    setDynamicComments([]);
    setHasAnalyzed(false);
    console.log('🧹 分析結果キャッシュをクリアしました');
  };

  // コンポーネントマウント時にキャッシュから復元（新しい投稿があっても既存結果を維持）
  useEffect(() => {
    if (userId) {
      const restored = loadAnalysisFromStorage();
      if (!restored) {
        console.log('💡 新規分析が必要です');
      }
    }
  }, [userId]); // userPostsを依存配列から削除して、新しい投稿があってもリセットしない

  // 自動分析を無効化 - 手動トリガーのみ
  // useEffect(() => {
  //   if (userPosts.length > 0) {
  //     runAnalysis();
  //   }
  // }, [userId, userPosts]);

  // 再分析を実行（キャッシュクリア付き）
  const runReanalysis = async () => {
    console.log('🔄 Starting re-analysis with cache clear...');
    clearAnalysisCache();
    await runAnalysis();
  };

  // 強制分析実行（デバッグ用）
  const forceAnalysis = async () => {
    console.log('🔥 Force analysis execution...');
    clearAnalysisCache();
    setLoading(true);
    setError(null);
    setHasAnalyzed(false);
    
    // 少し待ってから分析実行
    setTimeout(async () => {
      await runAnalysis();
    }, 100);
  };

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('✨ Starting comprehensive user analysis...');
      console.log('📊 Current state before analysis:', {
        emotionAnalysis: !!emotionAnalysis,
        lifestylePattern: !!lifestylePattern,
        deepPersonalityProfile: !!deepPersonalityProfile,
        suggestions: suggestions?.length,
        hasAnalyzed
      });
      
      // デバッグ: userPostsの内容を確認
      console.log('📊 User posts data:', userPosts.length, 'posts');
      console.log('📊 Photo scores found:', userPosts.filter(post => post.photoScore).length);
      console.log('📊 Sample post data:', userPosts[0]);
      
      const postsWithScores = userPosts.slice(-10).map(post => {
        const hasPhotoScore = !!post.photoScore;
        const hasImageAnalysis = !!post.photoScore?.image_analysis;
        const specificContent = post.photoScore?.image_analysis?.specificContent;
        const mainSubject = post.photoScore?.image_analysis?.mainSubject;
        
        console.log(`📸 Post "${post.title}": photoScore=${hasPhotoScore}, imageAnalysis=${hasImageAnalysis}`);
        if (hasImageAnalysis) {
          console.log(`   └ 具体的内容: ${specificContent || '不明'}`);
          console.log(`   └ 主被写体: ${mainSubject || '不明'}`);
          console.log(`   └ 画像分析データ:`, post.photoScore?.image_analysis);
        }
        
        return {
          id: post.id,
          title: post.title,
          description: post.userComment || '',
          imageUrl: post.imageUrl,
          createdAt: post.createdAt,
          tags: post.tags?.map((tag: any) => tag.name) || [],
          photoScore: post.photoScore || undefined
        };
      });
      
      const analysisRequest = {
        userId,
        posts: postsWithScores,
        analysisDepth: 'standard' as const
      };

      // 並行して複数の分析を実行（感情分析を裏側で使用）
      const [emotionResult, lifestyleResult, growthResult, photoProfileResult] = await Promise.all([
        emotionAnalysisService.analyzeUserEmotions(analysisRequest), // 裏側でのみ使用
        lifestyleConciergeService.analyzeLifestylePattern(analysisRequest),
        growthPartnerService.trackGrowthProgress(analysisRequest),
        photoAnalysisDeepService.generateDeepPhotoInsights(analysisRequest)
      ]);
      
      // 新しい深層性格分析を実行
      if (postsWithScores.length > 0) {
        const photoScores: Record<string, PhotoScoreV2> = {};
        postsWithScores.forEach(post => {
          if (post.photoScore) {
            photoScores[post.id] = {
              ...post.photoScore,
              imageAnalysis: post.photoScore.image_analysis
            };
          }
        });
        
        const personalityProfile = await personalityInsightService.analyzeDeepPersonality(
          userPosts,
          photoScores
        );
        setDeepPersonalityProfile(personalityProfile);
        console.log('✅ Deep personality analysis completed');
        
        // 最新の投稿に対する動的コメントを生成
        if (userPosts.length > 0 && userPosts[0].photoScore) {
          const latestPost = userPosts[0];
          const latestScore: PhotoScoreV2 = {
            ...latestPost.photoScore,
            imageAnalysis: latestPost.photoScore.image_analysis
          };
          
          const comments = await dynamicCommentService.generateCommentVariations(
            personalityProfile,
            latestPost,
            latestScore,
            3
          );
          setDynamicComments(comments);
          console.log('✅ Dynamic comments generated:', comments.length);
        }
      }
      
      // 感情分析結果を処理（表示はしないが内部で使用）
      if (emotionResult.success && emotionResult.data) {
        setEmotionAnalysis(emotionResult.data);
        console.log('✅ Emotion analysis completed (for internal use)');
        
        // 感情分析が完了したら文化的コンテキストを取得
        const culturalResult = await culturalIntegrationService.generateCulturalContext(
          emotionResult.data,
          userLocation
        );
        
        if (culturalResult.success && culturalResult.data) {
          setCulturalContext(culturalResult.data);
          console.log('✅ Cultural context generated');
        }
        
        // 中間保存
        setTimeout(() => saveAnalysisToStorage({}), 500);
      }

      if (lifestyleResult.success && lifestyleResult.data) {
        setLifestylePattern(lifestyleResult.data);
        console.log('✅ Lifestyle pattern analyzed');
        setTimeout(() => saveAnalysisToStorage({}), 500);
      }

      if (growthResult.success && growthResult.data) {
        setGrowthTracking(growthResult.data);
        console.log('✅ Growth tracking completed');
        setTimeout(() => saveAnalysisToStorage({}), 500);
      }

      if (photoProfileResult.success && photoProfileResult.data) {
        setPhotoCreativeProfile(photoProfileResult.data);
        console.log('✅ Photo creative profile generated');
        setTimeout(() => saveAnalysisToStorage({}), 500);
      }

      // 全ての分析が完了したら統合提案を生成
      if (emotionResult.data && lifestyleResult.data) {
        await generatePremiumSuggestions(
          emotionResult.data,
          lifestyleResult.data,
          photoProfileResult.data
        );
      }

    } catch (err: any) {
      console.error('❌ Analysis failed:', err);
      setError(err.message || '分析に失敗しました');
    } finally {
      setHasAnalyzed(true); // 分析完了フラグを設定
      setLoading(false);
      
      console.log('📊 Analysis completed, final state:', {
        emotionAnalysis: !!emotionAnalysis,
        lifestylePattern: !!lifestylePattern,
        deepPersonalityProfile: !!deepPersonalityProfile,
        suggestions: suggestions?.length,
        hasAnalyzed: true
      });
      
      // 分析結果をローカルストレージに保存（複数回試行）
      const saveWithRetry = () => {
        setTimeout(() => {
          saveAnalysisToStorage({});
          // 2秒後にもう一度保存を試行
          setTimeout(() => {
            saveAnalysisToStorage({});
          }, 2000);
        }, 1000);
      };
      saveWithRetry();
    }
  };

  const updatePhotoScores = async () => {
    setIsUpdatingScores(true);
    setError(null);
    
    try {
      console.log('🔄 既存の写真スコアを更新開始...');
      const result = await updateExistingPhotoScores();
      
      if (result.success) {
        console.log(`✅ ${result.updated}件の写真スコアを更新しました`);
        // 投稿データを再取得
        window.location.reload(); // 簡易的にページをリロード
      } else {
        setError(result.error || '写真スコアの更新に失敗しました');
      }
    } catch (err: any) {
      console.error('❌ 写真スコア更新エラー:', err);
      setError(err.message || '写真スコアの更新に失敗しました');
    } finally {
      setIsUpdatingScores(false);
    }
  };

  const generatePremiumSuggestions = async (
    emotion: EmotionAnalysis,
    lifestyle: LifestylePattern,
    photoCreativeProfile: PhotoCreativeProfile | null
  ) => {
    try {
      console.log('💎 Generating premium suggestions with Gemini integration...');
      
      // プレミアム提案サービスで高品質提案を生成
      const premiumResult = await premiumSuggestionService.generatePremiumSuggestions(
        emotion,
        lifestyle,
        photoCreativeProfile
      );

      if (premiumResult.success && premiumResult.data) {
        setSuggestions(premiumResult.data);
        console.log('✅ Premium suggestions generated:', premiumResult.data.length);
      } else {
        console.warn('❌ Premium suggestions failed, fallback to basic suggestions');
        // フォールバック：従来の基本提案
        await generateBasicSuggestions(emotion, lifestyle);
      }
      
    } catch (err) {
      console.error('Failed to generate premium suggestions:', err);
      // フォールバック：従来の基本提案
      await generateBasicSuggestions(emotion, lifestyle);
    }
  };

  const generateBasicSuggestions = async (
    emotion: EmotionAnalysis,
    lifestyle: LifestylePattern
  ) => {
    try {
      // フォールバック用の基本提案
      const lifestyleSuggestions = await lifestyleConciergeService.generatePersonalizedSuggestions(
        emotion, 
        lifestyle, 
        userLocation
      );

      if (lifestyleSuggestions.success && lifestyleSuggestions.data) {
        setSuggestions(lifestyleSuggestions.data.slice(0, 2));
        console.log('✅ Basic fallback suggestions generated');
      }
    } catch (err) {
      console.error('Failed to generate basic suggestions:', err);
    }
  };

  // 初期状態：分析未実行（hasAnalyzedでチェック）
  if (!hasAnalyzed && !loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="text-center py-12">
          <Sparkles className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            AIパーソナルキュレーター
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            あなたの投稿をAIが分析し、個人化された提案を作成します。
            成長トラッキング、ライフスタイル分析、音楽推薦などを提供します。
          </p>
          <div className="space-y-3">
            <motion.button
              onClick={forceAnalysis}
              disabled={userPosts.length === 0}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white font-semibold rounded-xl hover:from-gray-800 hover:to-gray-900 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              AI分析を開始
            </motion.button>
            
            {/* デバッグ用：キャッシュクリアボタン */}
            <motion.button
              onClick={clearAnalysisCache}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              キャッシュクリア
            </motion.button>
            
            {/* デバッグ用：データ確認ボタン */}
            <motion.button
              onClick={() => {
                console.log('🔍 Current localStorage data:');
                const stored = localStorage.getItem(analysisStorageKey);
                if (stored) {
                  const data = JSON.parse(stored);
                  console.log('Data:', data);
                  console.log('Keys:', Object.keys(data));
                } else {
                  console.log('No data found in localStorage');
                }
                console.log('🔍 All localStorage keys:', Object.keys(localStorage));
              }}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              データ確認
            </motion.button>
          </div>
          {userPosts.length === 0 && (
            <p className="text-sm text-amber-600 mt-4">
              分析するには最低1枚の投稿が必要です
            </p>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-600">分析中（詳細な分析のため数分かかる場合があります）</span>
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
            className="mt-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  // この条件分岐を削除 - hasAnalyzedが設定されていれば常に結果を表示

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">AIパーソナルキュレーター</h3>
              <p className="text-sm text-gray-200">感情・嗜好・成長の統合分析</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-xs text-gray-200">
              最終更新: {new Date().toLocaleDateString('ja-JP')}
            </div>
            <motion.button
              onClick={runReanalysis}
              disabled={loading}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-1"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              <span>再分析</span>
            </motion.button>
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
                photoCreativeProfile={photoCreativeProfile}
                userPosts={userPosts}
                deepPersonalityProfile={deepPersonalityProfile}
                dynamicComments={dynamicComments}
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
  photoCreativeProfile: PhotoCreativeProfile | null;
  userPosts: any[];
  deepPersonalityProfile: DeepPersonalityProfile | null;
  dynamicComments: DynamicComment[];
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({ 
  emotionAnalysis, 
  lifestylePattern, 
  culturalContext,
  photoCreativeProfile,
  userPosts,
  deepPersonalityProfile,
  dynamicComments
}) => {
  // デバッグ用ログ
  console.log('🔍 InsightsPanel Debug:', {
    emotionAnalysis: !!emotionAnalysis,
    lifestylePattern: !!lifestylePattern,
    deepPersonalityProfile: !!deepPersonalityProfile,
    culturalContext: !!culturalContext,
    photoCreativeProfile: !!photoCreativeProfile
  });

  // hasAnalyzedがtrueなら、データがなくても基本的な分析を表示
  if (!emotionAnalysis && !lifestylePattern && !deepPersonalityProfile && !culturalContext && !photoCreativeProfile) {
    // 基本的な分析を表示（フォールバック）
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl border border-gray-200">
          <h4 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Sparkles className="w-7 h-7 mr-3 text-gray-600" />
            あなたの基本プロファイル
          </h4>
          <div className="bg-white p-6 rounded-xl border border-gray-100">
            <h5 className="text-lg font-bold text-gray-900 mb-3">
              創作への情熱を持つ表現者
            </h5>
            <p className="text-gray-700 leading-relaxed text-base">
              あなたの{userPosts.length}件の投稿からは、日常の美しさを見出し、それを他者と共有したいという温かい気持ちが伝わってきます。
              技術的な完璧さよりも、心に響く瞬間を大切にするあなたの姿勢は、真の芸術家の資質を示しています。
              継続的な創作活動を通じて、あなただけの表現世界をさらに豊かに育んでいってください。
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 新しい深層性格分析 */}
      {deepPersonalityProfile && (
        <div>
          <h4 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Sparkles className="w-7 h-7 mr-3 text-gray-600" />
            あなたの深層性格プロファイル
          </h4>
          <NewDeepPersonalityAnalysis 
            profile={deepPersonalityProfile}
            dynamicComments={dynamicComments}
            userPosts={userPosts}
          />
        </div>
      )}
      
      {/* 従来の深層心理分析（フォールバック） */}
      {!deepPersonalityProfile && emotionAnalysis && emotionAnalysis.interests && (
        <div>
          <h4 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Target className="w-6 h-6 mr-3 text-gray-700" />
            あなたの深層心理分析
          </h4>
          <DeepPsychologyAnalysis 
            emotionAnalysis={emotionAnalysis} 
            lifestylePattern={lifestylePattern} 
            photoCreativeProfile={photoCreativeProfile}
            userPosts={userPosts}
          />
        </div>
      )}

      {/* 文化的コンテキスト */}
      {culturalContext && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Music className="w-5 h-5 mr-2 text-gray-500" />
            おすすめ音楽・アート
          </h4>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-medium text-gray-700 mb-2">音楽ジャンル</h5>
              <div className="space-y-2">
                {culturalContext.music.genres.map((genre, index) => (
                  <span key={index} className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm mr-2">
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

    </div>
  );
};

// 深層心理分析コンポーネント
const DeepPsychologyAnalysis: React.FC<{ 
  emotionAnalysis: EmotionAnalysis;
  lifestylePattern: LifestylePattern | null;
  photoCreativeProfile: PhotoCreativeProfile | null;
  userPosts: any[];
}> = ({ emotionAnalysis, lifestylePattern, photoCreativeProfile, userPosts }) => {
  
  // 実際の投稿データから具体的で個性的な心理分析を生成
  const generatePsychologyInsights = () => {
    const insights: {category: string; title: string; description: string; strength: number}[] = [];
    
    // 実際の投稿データ分析
    const titles = userPosts.map(p => p.title || '').filter(t => t.length > 0);
    const comments = userPosts.map(p => p.userComment || '').filter(c => c.length > 0);
    const allTags = userPosts.flatMap(p => p.tags || []).map(tag => typeof tag === 'string' ? tag : tag.name);
    
    // 写真創作プロファイルがある場合の具体的分析
    if (photoCreativeProfile) {
      insights.push({
        category: "創作者としての本質",
        title: `「${titles[0] || ''}」に現れるあなたの美的世界観`,
        description: `${photoCreativeProfile.creativePersonality}。特に「${titles.slice(0,2).join('」「')}」といった投稿タイトルからは、あなたの独特な感性と物事を捉える視点の深さが伺えます。一般的な表現を超えた、あなただけの表現世界を構築している稀有なビジュアル・ストーリーテラーです。`,
        strength: 95
      });
      
      insights.push({
        category: "表現スタイル", 
        title: `${photoCreativeProfile.compositionStyle?.split('。')[0] || '独自の美学'}を持つ表現者`,
        description: `${photoCreativeProfile.compositionStyle}。${photoCreativeProfile.colorSensitivity}。あなたの「${comments.find(c => c.length > 10) || titles[1] || ''}」といった投稿からも分かるように、一目でそれとわかる独特のトーンと世界観を確立されています。`,
        strength: 88
      });
      
      insights.push({
        category: "心理的特性",
        title: `「${allTags.slice(0,3).join('、')}」に表れる独特の観察眼`,
        description: `${photoCreativeProfile.subjectPsychology}。あなたが選ぶ「${allTags.slice(0,2).join('」「')}」といったタグからも、表面的な美しさを超えて本質を見抜く洞察力の深さが読み取れます。この観察眼は創作だけでなく、人生のあらゆる場面で大きな強みとなっているはずです。`,
        strength: 92
      });
    }

    // 写真技術データと投稿内容の統合分析
    const postsWithScores = userPosts.filter(post => post.photoScore);
    if (postsWithScores.length > 0) {
      const latestPost = postsWithScores[0];
      const photoScore = latestPost.photoScore;
      
      if (photoScore.technical_score > 70) {
        insights.push({
          category: "技術的才能",
          title: `「${latestPost.title}」で証明された${photoScore.technical_score}点の技術力`,
          description: `あなたの「${latestPost.title}」における技術スコア${photoScore.technical_score}点は、構図、露出、フォーカスなどの基本技術が非常に高いレベルにあることを示しています。特に「${photoScore.ai_comment?.split('。')[0] || 'この作品の技術的完成度'}」という評価からも、あなたの技術的基盤の確かさが分かります。`,
          strength: Math.round(photoScore.technical_score)
        });
      }
      
      if (photoScore.composition_score > 75) {
        insights.push({
          category: "構図感覚",
          title: `${photoScore.composition_score}点が物語る天性の構図バランス感覚`,
          description: `「${latestPost.title}」での構図スコア${photoScore.composition_score}点が証明するように、あなたは被写体の配置、視線誘導、画面バランスにおいて直感的に優れた判断ができる稀有な才能をお持ちです。${latestPost.userComment ? `「${latestPost.userComment}」というコメントからも、` : ''}構図への深い理解と感性が伺えます。`,
          strength: Math.round(photoScore.composition_score)
        });
      }
      
      if (photoScore.creativity_score > 65) {
        insights.push({
          category: "創造性",
          title: `「${latestPost.title}」に込められた${photoScore.creativity_score}点の独創性`,
          description: `創造性スコア${photoScore.creativity_score}点と「${photoScore.ai_comment || 'この作品の独創的な表現'}」という評価は、あなたが一般的な視点を超えた独特の表現力を持っていることを物語っています。特に「${latestPost.title}」というタイトル選択からも、あなたの創造的センスの深さが読み取れます。`,
          strength: Math.round(photoScore.creativity_score)
        });
      }
      
      // 複数の投稿がある場合の成長分析
      if (postsWithScores.length > 1) {
        const oldestPost = postsWithScores[postsWithScores.length - 1];
        const growthRate = photoScore.total_score - oldestPost.photoScore.total_score;
        if (Math.abs(growthRate) > 5) {
          insights.push({
            category: "成長軌跡",
            title: `「${oldestPost.title}」から「${latestPost.title}」への創作進化`,
            description: `「${oldestPost.title}」（${oldestPost.photoScore.total_score}点）から「${latestPost.title}」（${photoScore.total_score}点）への変化は、あなたの創作者としての確実な成長を物語っています。${growthRate > 0 ? `${growthRate}点の向上は、技術と感性の両面での発展を示しています。` : `新しい表現への挑戦姿勢が伺えます。`}`,
            strength: Math.min(95, 70 + Math.abs(growthRate))
          });
        }
      }
    }
    
    // 投稿パターンから読み取れる感情的特性
    if (titles.length > 0 && comments.length > 0) {
      // タイトルの特徴分析
      const shortTitles = titles.filter(t => t.length <= 5);
      const longTitles = titles.filter(t => t.length > 10);
      
      if (shortTitles.length > longTitles.length) {
        insights.push({
          category: "表現特性",
          title: `「${shortTitles.slice(0,2).join('」「')}」に表れる簡潔な美学`,
          description: `あなたの「${shortTitles.slice(0,3).join('」「')}」といった簡潔なタイトルは、無駄を削ぎ落とした本質的な表現力の現れです。短い言葉に深い意味を込める才能は、視覚的表現においても同様の研ぎ澄まされた美意識として発揮されています。`,
          strength: 89
        });
      }
      
      // コメントの深さ分析
      const deepComments = comments.filter(c => c.length > 20);
      if (deepComments.length > 0) {
        insights.push({
          category: "内省的特性",
          title: `「${deepComments[0].substring(0,15)}...」に込められた内省的思考`,
          description: `あなたの「${deepComments[0]}」といった深いコメントからは、作品の背景にある思考の深さと内省的な性格が読み取れます。表面的な表現を超えて、創作の意図や感情を言語化する能力は、視覚表現においても深い物語性を生み出す源となっています。`,
          strength: 91
        });
      }
    }
    
    // タグ使用パターンから読み取れる個性
    if (allTags.length > 0) {
      const uniqueTags = [...new Set(allTags)];
      const tagVariety = uniqueTags.length / userPosts.length;
      
      if (tagVariety > 1.5) {
        insights.push({
          category: "創造的多様性",
          title: `「${uniqueTags.slice(0,4).join('」「')}」が示すマルチ創造性`,
          description: `あなたが使用する「${uniqueTags.slice(0,5).join('」「')}」といった多様なタグは、幅広い視点と豊富な表現引き出しを持つ創造的多様性の証です。一つのスタイルに固執せず、常に新しい表現の可能性を探求する姿勢は、真のアーティストの特質です。`,
          strength: 86
        });
      }
    }
    
    // 興味分析からの洞察
    if (emotionAnalysis?.interests) {
      const topInterests = Object.entries(emotionAnalysis.interests)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 2);
      
      if (topInterests.length > 0) {
        const interestMap: Record<string, string> = {
          nature: "自然界の神秘に魅せられた環境哲学者",
          art: "美的価値を直感的に理解する芸術的知性の持ち主", 
          technology: "テクノロジーと人間性の調和を求める未来志向の思考家",
          travel: "多様な文化と価値観を受け入れる世界市民的な感性の持ち主",
          people: "人間の本質を見抜く卓越した心理洞察力の持ち主"
        };
        
        topInterests.forEach(([interest, value], index) => {
          if (value > 0.6 && interestMap[interest]) {
            insights.push({
              category: "専門的関心",
              title: interestMap[interest],
              description: `${interest}への深い関心は、あなたの世界観の重要な柱となっています。この分野での洞察力と感性は、あなたの人格形成に大きな影響を与え、独特の視点と価値観を育んでいます。`,
              strength: Math.round(value * 100)
            });
          }
        });
      }
    }
    
    return insights;
  };
  
  const insights = generatePsychologyInsights();
  
  return (
    <div className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl border border-gray-200">
      <div className="space-y-8">
        {insights.map((insight, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.3 }}
            className="relative"
          >
            {/* カテゴリーラベル */}
            <div className="flex items-center mb-3">
              <span className="px-3 py-1 bg-gray-900 text-white text-xs font-semibold rounded-full">
                {insight.category}
              </span>
              <div className="ml-auto flex items-center">
                <span className="text-sm text-gray-500 mr-2">適合度</span>
                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gray-800 transition-all duration-1000"
                    style={{ width: `${insight.strength}%` }}
                  />
                </div>
                <span className="ml-2 text-sm font-semibold text-gray-800">{insight.strength}%</span>
              </div>
            </div>
            
            {/* メインコンテンツ */}
            <div className="bg-white p-6 rounded-xl border border-gray-100">
              <h5 className="text-lg font-bold text-gray-900 mb-3 leading-tight">
                {insight.title}
              </h5>
              <p className="text-gray-700 leading-relaxed text-base">
                {insight.description}
              </p>
            </div>
          </motion.div>
        ))}
        
        {/* 総合評価 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: insights.length * 0.3 }}
          className="bg-gray-900 text-white p-6 rounded-xl mt-8"
        >
          <h5 className="text-lg font-bold mb-3">AI分析官からの総評</h5>
          <p className="text-gray-100 leading-relaxed">
            {(() => {
              const titles = userPosts.map(p => p.title || '').filter(t => t.length > 0);
              const postsWithScores = userPosts.filter(post => post.photoScore);
              const latestScore = postsWithScores[0]?.photoScore;
              const allTags = userPosts.flatMap(p => p.tags || []).map(tag => typeof tag === 'string' ? tag : tag.name);
              const uniqueTags = [...new Set(allTags)];
              
              return `「${titles[0] || 'あなたの作品'}」から「${titles[titles.length-1] || '最新作'}」まで、${userPosts.length}作品の分析を通じて見えてきたのは、${latestScore ? `${latestScore.total_score}点という高評価が示す` : ''}あなたの創作者としての確かな実力と独特の個性です。特に「${uniqueTags.slice(0,3).join('」「')}」といった多様な表現領域への挑戦と、${postsWithScores.length > 1 ? `${postsWithScores[0]?.photoScore?.total_score}点に到達した` : ''}技術的成長は、単なる趣味を超えた真剣な創作活動の証です。あなたの作品は、見る人に新しい視点と深い感動を与える特別な力を持っています。`;
            })()}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

// 生活パターンの物語的表示
const LifestyleStoryPanel: React.FC<{ lifestylePattern: LifestylePattern }> = ({ lifestylePattern }) => {
  const getActivityStory = () => {
    const { activityLevel, travelRadius, favoriteLocations } = lifestylePattern.behaviorPatterns;
    const { mostActiveHours } = lifestylePattern.timePatterns;
    
    let story = "";
    
    if (activityLevel === 'high' && travelRadius > 15) {
      story = `活動的な探検家タイプ。半径${travelRadius}kmの広範囲を行動圏とし、新しい発見を求めて移動を続けています。`;
    } else if (activityLevel === 'medium' && travelRadius < 10) {
      story = `地域密着型の観察者。半径${travelRadius}km内で深い洞察を得て、見慣れた場所に新しい美しさを発見しています。`;
    } else {
      story = `バランス型の創作者。${travelRadius}kmの行動範囲で、馴染みの場所と新しい発見を組み合わせています。`;
    }
    
    if (mostActiveHours[0] < 10) {
      story += " 朝型の生活リズムで、清々しい光の中で最高の作品を生み出します。";
    } else if (mostActiveHours[0] > 16) {
      story += " 夕方から夜にかけて活発になり、都市の光と影のコントラストを巧みに捉えます。";
    }
    
    return story;
  };
  
  return (
    <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-xl">
      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Clock className="w-5 h-5 mr-2 text-green-500" />
        あなたの生活パターン物語
      </h4>
      
      <p className="text-gray-800 leading-relaxed mb-4">
        {getActivityStory()}
      </p>
      
      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <div className="bg-white/70 p-4 rounded-lg">
          <h5 className="font-medium text-gray-700 mb-2">最適な創作時間</h5>
          <div className="flex items-center space-x-2">
            {lifestylePattern.timePatterns.mostActiveHours.map(hour => (
              <span key={hour} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                {hour}:00
              </span>
            ))}
          </div>
        </div>
        
        <div className="bg-white/70 p-4 rounded-lg">
          <h5 className="font-medium text-gray-700 mb-2">お気に入りの場所タイプ</h5>
          <div className="flex flex-wrap gap-2">
            {lifestylePattern.behaviorPatterns.favoriteLocations.slice(0, 3).map((location, idx) => (
              <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                {location}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// 感情カード（削除予定）
const EmotionCard: React.FC<{ emotion: string; value: number }> = ({ emotion, value }) => {
  const getEmotionInfo = (emotion: string) => {
    const mapping: Record<string, { label: string; color: string; icon: string }> = {
      joy: { label: '喜び', color: 'yellow', icon: '😊' },
      peace: { label: '平安', color: 'blue', icon: '😌' },
      excitement: { label: '興奮', color: 'red', icon: '🤩' },
      melancholy: { label: '憂愁', color: 'gray', icon: '😔' },
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
  console.log('🎯 SuggestionsPanel Debug:', { suggestionsLength: suggestions?.length, suggestions });
  
  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        提案を生成中...
      </div>
    );
  }

  const hasPremiumSuggestions = suggestions.some(s => s.monetization);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-xl font-bold text-gray-900 flex items-center">
          <Sparkles className="w-6 h-6 mr-3 text-yellow-500" />
          {hasPremiumSuggestions ? 'プレミアム AI 提案' : 'パーソナライズされた提案'}
        </h4>
        {hasPremiumSuggestions && (
          <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full">
            GEMINI POWERED
          </span>
        )}
      </div>
      
      {hasPremiumSuggestions && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-sm text-gray-700">
            <strong>💎 プレミアム提案:</strong> Geminiの深層分析により、あなただけの高品質な体験提案を生成しました。
            料理・フィットネス・読書・ライフスタイルの4つのカテゴリーから、パーソナライズされた具体的な提案をお届けします。
          </p>
        </div>
      )}
      
      <div className="space-y-4">
        {suggestions.map((suggestion, index) => (
          <SuggestionCard key={suggestion.id} suggestion={suggestion} index={index} />
        ))}
      </div>
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'food': return '🍽️';
      case 'fitness': return '💪';
      case 'education': return '📚';
      case 'lifestyle': return '✨';
      default: return '💡';
    }
  };

  const priorityColor = getPriorityColor(suggestion.priority);
  const typeIcon = getTypeIcon(suggestion.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <span className="text-2xl">{typeIcon}</span>
            <div className="flex-1">
              <h5 className="font-bold text-gray-900 text-lg">{suggestion.title}</h5>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${priorityColor}-100 text-${priorityColor}-700`}>
                  {suggestion.priority}
                </span>
                {suggestion.monetization && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                    Premium
                  </span>
                )}
              </div>
            </div>
          </div>
          <p className="text-gray-600 mb-3 leading-relaxed">{suggestion.description}</p>
          <p className="text-sm text-gray-500 italic border-l-2 border-gray-300 pl-3">
            {suggestion.reasoning}
          </p>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <h6 className="text-sm font-bold text-gray-800 mb-3 flex items-center">
          <Target className="w-4 h-4 mr-2 text-indigo-500" />
          具体的なアクション
        </h6>
        <p className="text-gray-700 font-medium">{suggestion.content.primaryAction}</p>
        {suggestion.content.timeRecommendation && (
          <div className="mt-3 flex items-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-2 text-gray-400" />
            <span>{suggestion.content.timeRecommendation.bestTime} • {suggestion.content.timeRecommendation.duration}</span>
          </div>
        )}
        
        {/* 準備事項の表示 */}
        {suggestion.content.preparations && suggestion.content.preparations.length > 0 && (
          <div className="mt-3">
            <h6 className="text-xs font-semibold text-gray-700 mb-2">必要な準備</h6>
            <div className="space-y-1">
              {suggestion.content.preparations.slice(0, 3).map((prep, idx) => (
                <span key={idx} className="inline-block bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs mr-2 mb-1">
                  {prep}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* 投資情報（マネタイゼーション詳細は非表示） */}
      {suggestion.monetization && (
        <div className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-200">
          <h6 className="text-sm font-bold text-blue-800 mb-2">参考予算</h6>
          <div className="flex items-center justify-between">
            <span className="text-blue-700 font-semibold">
              概算予算: ¥{suggestion.monetization.estimatedValue.toLocaleString()}
            </span>
            <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
              おすすめ度: {suggestion.monetization.conversionPotential === 'high' ? '高' : suggestion.monetization.conversionPotential === 'medium' ? '中' : '低'}
            </span>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          <span>期待効果: {Math.round(suggestion.estimatedEngagement * 100)}%</span>
          <span>AI提案</span>
        </div>
        <button className="flex items-center text-indigo-600 hover:text-indigo-700 font-semibold transition-colors">
          詳細を見る
          <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </motion.div>
  );
};

// 成長物語パネル
const GrowthPanel: React.FC<{ growthTracking: GrowthTracking | null }> = ({ growthTracking }) => {
  if (!growthTracking) {
    return (
      <div className="text-center py-8 text-gray-500">
        成長データがありません
      </div>
    );
  }

  // 成長の物語を生成
  const generateGrowthStory = () => {
    const { technical, artistic, consistency } = growthTracking.photographySkills;
    
    let currentPhase = "";
    let storyText = "";
    let nextChapter = "";
    
    if (technical < 50 && artistic < 50) {
      currentPhase = "発見期";
      storyText = "写真という表現手段との出会い。基本的な構図と光の扱いを学び始め、日常の中に美しさを見つける喜びを発見しています。";
      nextChapter = "実験期への扉：様々な構図やアングルに挑戦してみましょう";
    } else if (technical < 75 && artistic < 75) {
      currentPhase = "実験期";
      storyText = "技術的な基礎を固めながら、独自の表現を模索中。三分割法や光の方向を意識し、被写体との対話を深めています。";
      nextChapter = "洗練期への扉：感性と技術の融合を目指しましょう";
    } else if (technical < 85 || artistic < 85) {
      currentPhase = "洗練期";
      storyText = "技術と感性のバランスが取れ始め、独自のスタイルが確立されつつあります。光と影の詩的な表現に優れています。";
      nextChapter = "マスター期への扉：ジャンルの枠を超えた表現に挑戦";
    } else {
      currentPhase = "マスター期";
      storyText = "高い技術力と独創性を持つアーティスト。あなたの作品は他者にインスピレーションを与える力を持っています。";
      nextChapter = "指導者の道：他の創作者を導く存在へ";
    }
    
    return { currentPhase, storyText, nextChapter };
  };

  const story = generateGrowthStory();
  
  // スキルの視覚的表現を計算
  const getSkillLevel = (score: number) => {
    if (score >= 85) return { level: "エキスパート", color: "from-gray-500 to-pink-500", width: "95%" };
    if (score >= 70) return { level: "上級者", color: "from-blue-500 to-indigo-500", width: "80%" };
    if (score >= 50) return { level: "中級者", color: "from-green-500 to-blue-500", width: "60%" };
    return { level: "初心者", color: "from-yellow-500 to-green-500", width: "30%" };
  };

  const technicalLevel = getSkillLevel(growthTracking.photographySkills.technical);
  const artisticLevel = getSkillLevel(growthTracking.photographySkills.artistic);

  return (
    <div className="space-y-6">
      {/* 成長物語のメインセクション */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8 rounded-2xl">
        <h4 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <BookOpen className="w-6 h-6 mr-3 text-indigo-600" />
          あなたの写真的成長物語
        </h4>
        
        <div className="space-y-6">
          {/* 現在の章 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-full text-lg font-semibold mb-4">
              第3章：{story.currentPhase}
            </div>
            <p className="text-gray-800 text-lg leading-relaxed max-w-3xl mx-auto">
              {story.storyText}
            </p>
          </motion.div>
          
          {/* スキルの視覚的表現 */}
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/70 p-6 rounded-xl"
            >
              <h5 className="font-semibold text-gray-800 mb-4 flex items-center">
                <Camera className="w-5 h-5 mr-2 text-blue-500" />
                技術力：{technicalLevel.level}
              </h5>
              <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${technicalLevel.color} transition-all duration-1000`}
                  style={{ width: technicalLevel.width }}
                />
              </div>
              <span className="text-sm text-gray-600 mt-2 block">
                {growthTracking.photographySkills.technical}/100
              </span>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/70 p-6 rounded-xl"
            >
              <h5 className="font-semibold text-gray-800 mb-4 flex items-center">
                <Palette className="w-5 h-5 mr-2 text-gray-500" />
                芸術性：{artisticLevel.level}
              </h5>
              <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${artisticLevel.color} transition-all duration-1000`}
                  style={{ width: artisticLevel.width }}
                />
              </div>
              <span className="text-sm text-gray-600 mt-2 block">
                {growthTracking.photographySkills.artistic}/100
              </span>
            </motion.div>
          </div>
        </div>
      </div>

      {/* 次章予告 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-xl border-l-4 border-amber-400"
      >
        <h5 className="font-semibold text-amber-800 mb-2 flex items-center">
          <Sparkles className="w-5 h-5 mr-2" />
          次章予告
        </h5>
        <p className="text-amber-700">{story.nextChapter}</p>
      </motion.div>

      {/* 最近の成果（マイルストーン） */}
      {growthTracking.milestones.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white p-6 rounded-xl border border-gray-200"
        >
          <h5 className="font-semibold text-gray-800 mb-4 flex items-center">
            <Award className="w-5 h-5 mr-2 text-yellow-500" />
            最近達成した成果
          </h5>
          <div className="space-y-3">
            {growthTracking.milestones.slice(-2).map((milestone, index) => (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + index * 0.1 }}
                className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg"
              >
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h6 className="font-medium text-gray-900">{milestone.title}</h6>
                  <p className="text-sm text-gray-600">{milestone.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
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

// 新しい深層性格分析コンポーネント
const NewDeepPersonalityAnalysis: React.FC<{
  profile: DeepPersonalityProfile;
  dynamicComments: DynamicComment[];
  userPosts: any[];
}> = ({ profile, dynamicComments, userPosts }) => {
  const [selectedComment, setSelectedComment] = useState(0);
  
  return (
    <div className="space-y-8">
      {/* 核となる性格プロファイル */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-indigo-900 via-gray-900 to-pink-900 text-white p-8 rounded-2xl shadow-2xl"
      >
        <div className="mb-4">
          <span className="inline-block px-4 py-1 bg-white/20 backdrop-blur rounded-full text-sm font-semibold mb-4">
            核となる性格タイプ
          </span>
          <h3 className="text-3xl font-bold mb-4">{profile.corePersonality.type}</h3>
          <p className="text-lg leading-relaxed text-white/90">
            {profile.corePersonality.description}
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div>
            <h4 className="text-sm font-semibold text-white/70 mb-3">独自の強み</h4>
            <div className="space-y-2">
              {profile.corePersonality.strengths.map((strength, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <span className="text-white/90">{strength}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white/70 mb-3">内なる欲求</h4>
            <div className="space-y-2">
              {profile.corePersonality.hiddenDesires.map((desire, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <Heart className="w-4 h-4 text-pink-400" />
                  <span className="text-white/90">{desire}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* 動的に生成されたパーソナルコメント */}
      {dynamicComments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-200"
        >
          <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <RefreshCw className="w-5 h-5 mr-2 text-amber-600" />
            AIからの個人的なメッセージ
          </h4>
          
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <p className="text-gray-800 leading-relaxed text-lg">
                {dynamicComments[selectedComment].main}
              </p>
              {dynamicComments[selectedComment].insight && (
                <p className="text-sm text-gray-600 mt-4 italic border-l-4 border-amber-400 pl-4">
                  {dynamicComments[selectedComment].insight}
                </p>
              )}
            </div>
            
            {dynamicComments.length > 1 && (
              <div className="flex justify-center space-x-2">
                {dynamicComments.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedComment(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === selectedComment ? 'bg-amber-600 w-8' : 'bg-amber-300'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
      
      {/* 性格次元の詳細分析 */}
      <div className="grid md:grid-cols-2 gap-6">
        {profile.dimensions.slice(0, 4).map((dimension, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + idx * 0.1 }}
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h5 className="font-bold text-gray-900">{dimension.dimension}</h5>
              <span className="text-2xl font-bold text-indigo-600">
                {Math.round(dimension.score * 100)}%
              </span>
            </div>
            <p className="text-gray-700 text-sm mb-3">{dimension.insight}</p>
            <div className="space-y-1">
              {dimension.evidence.slice(0, 2).map((evidence, eidx) => (
                <p key={eidx} className="text-xs text-gray-500 italic">
                  • {evidence}
                </p>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* 創造的アーキタイプ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-br from-gray-50 to-indigo-50 p-6 rounded-2xl"
      >
        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <Palette className="w-5 h-5 mr-2 text-gray-600" />
          創造的アーキタイプ
        </h4>
        <div className="bg-white/70 p-6 rounded-xl">
          <h5 className="text-xl font-bold text-gray-900 mb-2">
            {profile.creativeArchetype.name}
          </h5>
          <p className="text-gray-700 mb-4">{profile.creativeArchetype.description}</p>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700 font-medium">
              進化段階: {profile.creativeArchetype.evolutionStage}
            </span>
          </div>
        </div>
      </motion.div>
      
      {/* 感情の風景 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="grid md:grid-cols-2 gap-6"
      >
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl">
          <h5 className="font-bold text-gray-900 mb-4 flex items-center">
            <Heart className="w-5 h-5 mr-2 text-blue-600" />
            感情的風景
          </h5>
          <p className="text-gray-700 mb-4">{profile.emotionalLandscape.innerWorld}</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">感情表現スタイル</span>
              <span className="text-sm font-medium text-blue-700">
                {profile.emotionalLandscape.expressionStyle}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">感情の幅</span>
              <span className="text-sm font-medium text-blue-700">
                {Math.round(profile.emotionalLandscape.emotionalRange * 100)}%
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl">
          <h5 className="font-bold text-gray-900 mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-green-600" />
            成長の洞察
          </h5>
          <div className="space-y-3">
            <div>
              <span className="text-xs font-semibold text-green-700">現在のフェーズ</span>
              <p className="text-sm text-gray-700">{profile.growthInsights.currentPhase}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-green-700">次のレベルへの鍵</span>
              <p className="text-sm text-gray-700">{profile.growthInsights.nextLevelUnlock}</p>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* ユニークな特徴 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-8 rounded-2xl"
      >
        <h4 className="text-xl font-bold mb-6 flex items-center">
          <Sparkles className="w-6 h-6 mr-3 text-yellow-400" />
          あなただけの特別な署名
        </h4>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <h5 className="text-sm font-semibold text-gray-400 mb-3">個性的な癖</h5>
            <div className="space-y-2">
              {profile.uniqueSignature.quirks.map((quirk, idx) => (
                <span key={idx} className="block text-gray-200">{quirk}</span>
              ))}
            </div>
          </div>
          <div>
            <h5 className="text-sm font-semibold text-gray-400 mb-3">隠れた才能</h5>
            <div className="space-y-2">
              {profile.uniqueSignature.hiddenTalents.map((talent, idx) => (
                <span key={idx} className="block text-gray-200">{talent}</span>
              ))}
            </div>
          </div>
          <div>
            <h5 className="text-sm font-semibold text-gray-400 mb-3">無意識のパターン</h5>
            <div className="space-y-2">
              {profile.uniqueSignature.unconsciousPatterns.map((pattern, idx) => (
                <span key={idx} className="block text-gray-200">{pattern}</span>
              ))}
            </div>
          </div>
        </div>
        {profile.uniqueSignature.personalMythology && (
          <div className="mt-6 pt-6 border-t border-gray-700">
            <h5 className="text-sm font-semibold text-gray-400 mb-2">個人的な神話</h5>
            <p className="text-gray-200 italic">{profile.uniqueSignature.personalMythology}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};