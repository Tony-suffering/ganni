import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Award, Star, MessageCircle, ShoppingBag, Eye, Lightbulb, ArrowRight } from 'lucide-react';
import { PhotoScore, AIComment, ProductRecommendation } from '../types';
import { PhotoScoringService } from '../services/photoScoringService';
import { RelatedProducts } from './RelatedProducts';

interface AIAnalysisResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewPost?: () => void;
  photoScore?: PhotoScore | null;
  aiComments?: AIComment[];
  productRecommendations?: ProductRecommendation | null;
  isAnalyzing?: boolean;
  analysisProgress?: {
    photoScore: boolean;
    aiComments: boolean;
    productRecommendations: boolean;
  };
}

export const AIAnalysisResultModal: React.FC<AIAnalysisResultModalProps> = ({
  isOpen,
  onClose,
  onViewPost,
  photoScore,
  aiComments = [],
  productRecommendations,
  isAnalyzing = false,
  analysisProgress = {
    photoScore: false,
    aiComments: false,
    productRecommendations: false
  }
}) => {
  const [activeTab, setActiveTab] = useState<'score' | 'comments' | 'products'>('score');
  
  console.log('🔍 AIAnalysisResultModal rendered:', {
    isOpen,
    isAnalyzing,
    photoScore: !!photoScore,
    aiCommentsCount: aiComments.length,
    productRecommendations: !!productRecommendations,
    analysisProgress
  });
  
  const isAnalysisComplete = !isAnalyzing && 
    (photoScore || aiComments.length > 0 || productRecommendations);

  const getScoreInfo = (score?: PhotoScore | null) => {
    if (!score) return null;
    return PhotoScoringService.getScoreLevel(score.total_score);
  };

  const scoreInfo = getScoreInfo(photoScore);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex-shrink-0 p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {isAnalyzing ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full"
                      />
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">AI分析中...</h2>
                        <p className="text-sm text-gray-600">あなたの写真を詳しく分析しています</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Star className="w-8 h-8 text-purple-600" />
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">🎉 AI分析完了！</h2>
                        <p className="text-sm text-gray-600">あなたの写真の分析結果をご覧ください</p>
                      </div>
                    </>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Progress Indicator */}
            {isAnalyzing && (
              <div className="flex-shrink-0 p-4 bg-gray-50 border-b border-gray-200">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">分析進捗</span>
                    <span className="text-gray-600">
                      {Object.values(analysisProgress).filter(Boolean).length}/3 完了
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className={`p-2 rounded text-center text-xs ${
                      analysisProgress.photoScore 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      📊 写真採点
                    </div>
                    <div className={`p-2 rounded text-center text-xs ${
                      analysisProgress.aiComments 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      💬 AIコメント
                    </div>
                    <div className={`p-2 rounded text-center text-xs ${
                      analysisProgress.productRecommendations 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      🛍️ 商品推薦
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Navigation */}
            {isAnalysisComplete && (
              <div className="flex-shrink-0 border-b border-gray-200">
                <div className="flex">
                  {photoScore && (
                    <button
                      onClick={() => setActiveTab('score')}
                      className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'score'
                          ? 'border-purple-500 text-purple-600'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Award className="w-4 h-4 inline mr-2" />
                      写真採点
                    </button>
                  )}
                  {aiComments.length > 0 && (
                    <button
                      onClick={() => setActiveTab('comments')}
                      className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'comments'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <MessageCircle className="w-4 h-4 inline mr-2" />
                      AIコメント
                    </button>
                  )}
                  {productRecommendations && (
                    <button
                      onClick={() => setActiveTab('products')}
                      className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'products'
                          ? 'border-orange-500 text-orange-600'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <ShoppingBag className="w-4 h-4 inline mr-2" />
                      関連商品
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {isAnalyzing ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                      <Eye className="w-8 h-8 text-purple-600" />
                    </div>
                    <p className="text-gray-600">
                      AIがあなたの写真を詳しく分析しています。<br />
                      しばらくお待ちください...
                    </p>
                  </div>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  {/* 写真採点タブ */}
                  {activeTab === 'score' && photoScore && (
                    <motion.div
                      key="score"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-6"
                    >
                      {/* メインスコア */}
                      <div className="text-center">
                        <div className="inline-flex items-center space-x-4 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl">
                          {scoreInfo && (
                            <span
                              className="px-4 py-2 rounded-full text-white font-bold text-2xl"
                              style={{ backgroundColor: scoreInfo.color }}
                            >
                              {photoScore.score_level}級
                            </span>
                          )}
                          <div className="text-left">
                            <div className="text-4xl font-bold text-purple-900">
                              {photoScore.total_score}点
                            </div>
                            <div className="text-sm text-purple-600">
                              {scoreInfo?.description}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 詳細スコア */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-xl">
                          <div className="text-sm text-gray-600 mb-1">技術的品質</div>
                          <div className="text-2xl font-bold text-gray-900">
                            {photoScore.technical_score}/25
                          </div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl">
                          <div className="text-sm text-gray-600 mb-1">構図・バランス</div>
                          <div className="text-2xl font-bold text-gray-900">
                            {photoScore.composition_score}/25
                          </div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl">
                          <div className="text-sm text-gray-600 mb-1">創造性</div>
                          <div className="text-2xl font-bold text-gray-900">
                            {photoScore.creativity_score}/25
                          </div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl">
                          <div className="text-sm text-gray-600 mb-1">エンゲージメント</div>
                          <div className="text-2xl font-bold text-gray-900">
                            {photoScore.engagement_score}/25
                          </div>
                        </div>
                      </div>

                      {/* AIコメント */}
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                        <h4 className="font-medium text-gray-900 mb-2">AI評価コメント</h4>
                        <p className="text-gray-700 italic">"{photoScore.ai_comment}"</p>
                      </div>
                    </motion.div>
                  )}

                  {/* AIコメントタブ */}
                  {activeTab === 'comments' && aiComments.length > 0 && (
                    <motion.div
                      key="comments"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-4"
                    >
                      {aiComments.map((comment, index) => (
                        <div
                          key={comment.id}
                          className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100"
                        >
                          <div className="flex items-center space-x-2 mb-2">
                            <MessageCircle className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">
                              {comment.type === 'ai_comment' && 'AIコメント'}
                              {comment.type === 'ai_question' && 'AI質問'}
                              {comment.type === 'ai_observation' && 'AI観察'}
                              {comment.type === 'comment' && 'コメント'}
                              {comment.type === 'question' && '質問'}
                              {comment.type === 'observation' && '観察'}
                              {!['ai_comment', 'ai_question', 'ai_observation', 'comment', 'question', 'observation'].includes(comment.type) && 'AIコメント'}
                            </span>
                          </div>
                          <p className="text-gray-700">{comment.content}</p>
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {/* 関連商品タブ */}
                  {activeTab === 'products' && productRecommendations && (
                    <motion.div
                      key="products"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <RelatedProducts
                        recommendations={productRecommendations.recommendations}
                        showHeader={false}
                        maxGroupsToShow={3}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>

            {/* インスピレーション促進セクション */}
            {isAnalysisComplete && photoScore && photoScore.total_score >= 70 && (
              <div className="flex-shrink-0 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-t border-purple-100">
                <div className="flex items-center space-x-3 text-sm">
                  <Lightbulb className="w-5 h-5 text-purple-600" />
                  <div className="flex-1">
                    <p className="text-purple-800 font-medium">素晴らしい写真ですね！</p>
                    <p className="text-purple-600">他の投稿者にインスピレーションを与えてみませんか？</p>
                  </div>
                  <button
                    onClick={() => {
                      // インスピレーション機能への導線
                      window.location.href = '/inspiration-lab';
                    }}
                    className="flex items-center space-x-1 px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors"
                  >
                    <span className="text-xs font-medium">探索</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex-shrink-0 p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  閉じる
                </button>
                {onViewPost && isAnalysisComplete && (
                  <button
                    onClick={onViewPost}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    投稿を見る
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};