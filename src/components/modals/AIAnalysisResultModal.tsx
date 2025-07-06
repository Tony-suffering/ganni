import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Award, Star, MessageCircle, ShoppingBag, Eye, Lightbulb, ArrowRight, Brain, User } from 'lucide-react';
import { PhotoScore, AIComment } from '../../types';
import { PhotoScoringService } from '../../services/photoScoringService';
import { RelatedProducts } from '../products/RelatedProducts';
import { PersonalPattern } from '../../services/patternAnalysisService';

interface AIAnalysisResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewPost?: () => void;
  photoScore?: PhotoScore | null;
  aiComments?: AIComment[];
  personalPattern?: PersonalPattern | null;
  isAnalyzing?: boolean;
  analysisProgress?: {
    photoScore: boolean;
    aiComments: boolean;
    personalPattern: boolean;
  };
}

export const AIAnalysisResultModal: React.FC<AIAnalysisResultModalProps> = ({
  isOpen,
  onClose,
  onViewPost,
  photoScore,
  aiComments = [],
  personalPattern,
  isAnalyzing = false,
  analysisProgress = {
    photoScore: false,
    aiComments: false,
    personalPattern: false
  }
}) => {
  const [activeTab, setActiveTab] = useState<'score' | 'comments' | 'pattern'>('score');
  
  
  const isAnalysisComplete = !isAnalyzing && 
    (photoScore || aiComments.length > 0 || personalPattern);

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
                      analysisProgress.personalPattern 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      🧠 パターン分析
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
                  {personalPattern && (
                    <button
                      onClick={() => setActiveTab('pattern')}
                      className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'pattern'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Brain className="w-4 h-4 inline mr-2" />
                      あなたの分析
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



                  {/* パターン分析タブ */}
                  {activeTab === 'pattern' && personalPattern && (
                    <motion.div
                      key="pattern"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-6"
                    >
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                          <Brain className="w-8 h-8 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">あなたの個人分析</h3>
                        <p className="text-gray-600">この投稿から読み取れるあなたのパターンをAIが分析しました</p>
                      </div>

                      {/* 性格インサイト */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                        <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                          <User className="w-5 h-5 mr-2 text-blue-600" />
                          性格特性
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-700">創造性</span>
                                <span className="font-medium">{personalPattern.analysis.personalityInsights.creativity}/100</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-purple-400 to-pink-400 h-2 rounded-full transition-all"
                                  style={{ width: `${personalPattern.analysis.personalityInsights.creativity}%` }}
                                ></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-700">冒険心</span>
                                <span className="font-medium">{personalPattern.analysis.personalityInsights.adventure}/100</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-green-400 to-emerald-400 h-2 rounded-full transition-all"
                                  style={{ width: `${personalPattern.analysis.personalityInsights.adventure}%` }}
                                ></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-700">社交性</span>
                                <span className="font-medium">{personalPattern.analysis.personalityInsights.social}/100</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-blue-400 to-cyan-400 h-2 rounded-full transition-all"
                                  style={{ width: `${personalPattern.analysis.personalityInsights.social}%` }}
                                ></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-700">美的感受性</span>
                                <span className="font-medium">{personalPattern.analysis.personalityInsights.aestheticSensitivity}/100</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-pink-400 to-rose-400 h-2 rounded-full transition-all"
                                  style={{ width: `${personalPattern.analysis.personalityInsights.aestheticSensitivity}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-700">成長志向</span>
                                <span className="font-medium">{personalPattern.analysis.personalityInsights.growthOrientation}/100</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-orange-400 to-yellow-400 h-2 rounded-full transition-all"
                                  style={{ width: `${personalPattern.analysis.personalityInsights.growthOrientation}%` }}
                                ></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-700">ルーチン好み</span>
                                <span className="font-medium">{personalPattern.analysis.personalityInsights.routine}/100</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-indigo-400 to-purple-400 h-2 rounded-full transition-all"
                                  style={{ width: `${personalPattern.analysis.personalityInsights.routine}%` }}
                                ></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-700">完璧主義</span>
                                <span className="font-medium">{personalPattern.analysis.personalityInsights.perfectionism}/100</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-red-400 to-pink-400 h-2 rounded-full transition-all"
                                  style={{ width: `${personalPattern.analysis.personalityInsights.perfectionism}%` }}
                                ></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-700">マインドフルネス</span>
                                <span className="font-medium">{personalPattern.analysis.personalityInsights.mindfulness}/100</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-teal-400 to-green-400 h-2 rounded-full transition-all"
                                  style={{ width: `${personalPattern.analysis.personalityInsights.mindfulness}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 最適化提案 */}
                      {personalPattern.analysis.optimizationSuggestions.length > 0 && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
                          <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                            <Lightbulb className="w-5 h-5 mr-2 text-green-600" />
                            あなたへの提案
                          </h4>
                          <div className="space-y-3">
                            {personalPattern.analysis.optimizationSuggestions.slice(0, 3).map((suggestion, index) => (
                              <div key={index} className="bg-white rounded-lg p-4 border border-green-100">
                                <div className="flex items-start space-x-3">
                                  <div className={`w-2 h-2 rounded-full mt-2 ${
                                    suggestion.impact === 'high' ? 'bg-green-500' :
                                    suggestion.impact === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                                  }`}></div>
                                  <div className="flex-1">
                                    <h5 className="font-medium text-gray-900">{suggestion.category}</h5>
                                    <p className="text-gray-700 text-sm mt-1">{suggestion.suggestion}</p>
                                    <p className="text-gray-500 text-xs mt-1">{suggestion.reasoning}</p>
                                  </div>
                                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                                    suggestion.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                    suggestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {suggestion.difficulty === 'easy' ? '簡単' :
                                     suggestion.difficulty === 'medium' ? '普通' : '難しい'}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-center text-sm text-gray-500">
                        この分析は現在の投稿から推測されたものです。より多くの投稿を重ねることで、分析精度が向上します。
                      </div>
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