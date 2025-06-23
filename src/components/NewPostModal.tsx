import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Sparkles, Tag as TagIcon, Type, MessageCircle, HelpCircle, Eye, Wifi, WifiOff, Award } from 'lucide-react';
import { Tag, AIComment } from '../types';
import { useAI } from '../hooks/useAI';
import { useAuth } from '../contexts/AuthContext';
import VoiceInputButton from "./VoiceInputButton";
import { generateImageAIComments } from "../lib/gemini";
import { PhotoScoringService } from '../services/photoScoringService';

interface NewPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  tags: Tag[];
  onSubmit: (postData: any) => void;
}

export const NewPostModal: React.FC<NewPostModalProps> = ({
  isOpen,
  onClose,
  tags,
  onSubmit
}) => {
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    userComment: '',
    aiDescription: '',
    imageAIDescription: '',
    textAIDescription: '',
    aiComments: [] as AIComment[],
    tags: [] as Tag[],
  });
  
  const [photoScore, setPhotoScore] = useState<any>(null);
  const [isGeneratingScore, setIsGeneratingScore] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isComposing, setIsComposing] = useState(false);

  const { 
    generateDescription, 
    generateComments, 
    isGeneratingDescription, 
    isGeneratingComments,
    apiStatus 
  } = useAI();

  // Auto-resize textarea
  const autoResizeTextarea = () => {
    // IME入力中はリサイズしない
    if (isComposing) return;
    
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 300);
      textarea.style.height = `${newHeight}px`;
      
      // スクロール位置の調整もIME入力中はスキップ
      if (!isComposing) {
        setTimeout(() => {
          const modalContent = modalContentRef.current;
          if (modalContent && textarea.scrollTop > 0) {
            const textareaRect = textarea.getBoundingClientRect();
            const modalRect = modalContent.getBoundingClientRect();
            
            if (textareaRect.bottom > modalRect.bottom - 100) {
              modalContent.scrollTop += textareaRect.bottom - modalRect.bottom + 100;
            }
          }
        }, 0);
      }
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, userComment: e.target.value }));
    autoResizeTextarea();
  };

  useEffect(() => {
    const modalContent = modalContentRef.current;
    
    const handleScroll = () => {
      if (modalContent) {
        setScrollPosition(modalContent.scrollTop);
      }
    };

    if (modalContent && isOpen) {
      modalContent.addEventListener('scroll', handleScroll, { passive: true });
      modalContent.scrollTop = scrollPosition;
      
      return () => {
        modalContent.removeEventListener('scroll', handleScroll);
      };
    }
  }, [isOpen, scrollPosition]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(autoResizeTextarea, 100);
    }
  }, [isOpen, formData.userComment]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        setImagePreview(base64);
        // 画像AIコメント生成
        setFormData(prev => ({ ...prev, imageAIDescription: '', aiComments: [] })); // まず空に
        setPhotoScore(null); // フォトスコアをリセット
        try {
          const { description, comments } = await generateImageAIComments(base64);
          setFormData(prev => ({ ...prev, imageAIDescription: description || 'AI説明の生成に失敗しました', aiComments: comments || [] }));
        } catch (err) {
          setFormData(prev => ({ ...prev, imageAIDescription: 'AI説明の生成に失敗しました', aiComments: [] }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGeneratePhotoScore = async () => {
    if (!imagePreview || !formData.title.trim()) {
      alert('画像とタイトルを入力してからAI写真採点を実行してください');
      return;
    }
    
    try {
      setIsGeneratingScore(true);
      const scoringService = new PhotoScoringService();
      const score = await scoringService.scorePhoto(imagePreview, formData.title, formData.userComment);
      const levelInfo = PhotoScoringService.getScoreLevel(score.total);
      
      setPhotoScore({
        technical_score: score.technical,
        composition_score: score.composition,
        creativity_score: score.creativity,
        engagement_score: score.engagement,
        total_score: score.total,
        score_level: levelInfo.level,
        level_description: levelInfo.description,
        ai_comment: score.comment
      });
    } catch (error) {
      console.error('Photo scoring failed:', error);
      alert('AI写真採点中にエラーが発生しました。');
    } finally {
      setIsGeneratingScore(false);
    }
  };

  const handleGenerateAIDescription = async () => {
    if (!formData.title.trim() || !formData.userComment.trim()) {
      alert('タイトルと感想を入力してからAI生成を実行してください');
      return;
    }
    try {
      const description = await generateDescription(formData.title, formData.userComment, formData.imageAIDescription);
      setFormData(prev => ({ ...prev, textAIDescription: description }));
    } catch (error) {
      alert('AI描写生成中にエラーが発生しました。');
    }
  };

  // タグ選択ハンドラ
  const handleTagToggle = (tag: Tag) => {
    setFormData(prev => {
      const exists = prev.tags.some(t => t.id === tag.id);
      return {
        ...prev,
        tags: exists ? prev.tags.filter(t => t.id !== tag.id) : [...prev.tags, tag]
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImage || !formData.userComment.trim() || !formData.title.trim() || !user || formData.tags.length === 0) {
      if (formData.tags.length === 0) {
        alert('少なくとも1つのタグを選択してください。');
      }
      return;
    }

    try {
      setIsLoading(true);
      let imageUrl = imagePreview;
      let aiDescription = formData.aiDescription;
      // 1. AI説明文がなければ生成
      if (!aiDescription) {
        aiDescription = await generateDescription(formData.title, formData.userComment, formData.imageAIDescription);
        setFormData(prev => ({ ...prev, aiDescription }));
      }
      // 2. AIコメントが未生成の場合のみ生成
      let aiComments = formData.aiComments && formData.aiComments.length > 0
        ? formData.aiComments
        : await generateComments(formData.title, formData.userComment, aiDescription);
      // 3. 投稿データ作成
      const postData = {
        title: formData.title,
        imageUrl: imageUrl,
        aiDescription: aiDescription,
        imageAIDescription: formData.imageAIDescription,
        userComment: formData.userComment,
        author: {
          id: user.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'ユーザー',
          avatar: user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_metadata?.name || user.email?.split('@')[0] || 'ユーザー')}&background=0072f5&color=fff`
        },
        aiComments: aiComments,
        tags: formData.tags
      };
      onSubmit(postData);
      onClose();
      setSelectedImage(null);
      setImagePreview('');
      setFormData({
        title: '',
        userComment: '',
        aiDescription: '',
        imageAIDescription: '',
        textAIDescription: '',
        aiComments: [],
        tags: []
      });
      setPhotoScore(null);
      setScrollPosition(0);
    } catch (error) {
      console.error('Post submission failed:', error);
      alert('投稿中にエラーが発生しました。ネットワーク接続を確認して再試行してください。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] md:max-h-[90vh] m-2 md:m-4 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex-shrink-0 p-3 sm:p-4 md:p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-display font-semibold text-neutral-900">
                  新しい投稿
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <X className="w-5 sm:w-6 h-5 sm:h-6" />
                </button>
              </div>
            </div>

            {/* Scrollable Modal Content */}
            <div 
              ref={modalContentRef}
              className="flex-1 overflow-y-auto scroll-container p-3 sm:p-4 md:p-6 pb-2"
            >
              <form id="new-post-form" onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                {/* Title */}
                <div>
                  <label className="flex items-center text-sm font-medium text-neutral-700 mb-3">
                    <Type className="w-4 h-4 mr-2" />
                    タイトルを書いてください <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="例：夕焼けと飛行機雲"
                      required
                    />
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">
                    文字数: {formData.title.length}/100
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3">
                    写真をアップロード <span className="text-red-500 ml-1">*</span>
                  </label>
                  {!imagePreview ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-neutral-300 rounded-2xl p-8 md:p-12 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-all duration-200"
                    >
                      <Upload className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                      <p className="text-neutral-600 font-medium mb-2">
                        クリックして写真を選択
                      </p>
                      <p className="text-sm text-neutral-500">
                        または、ドラッグ&ドロップ
                      </p>
                    </div>
                  ) : (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 md:h-64 object-cover rounded-2xl"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImage(null);
                          setImagePreview('');
                          setFormData(prev => ({ ...prev, aiDescription: '' }));
                        }}
                        className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-neutral-50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {/* 画像AI説明 */}
                      <div className="space-y-6">
                        <div>
                          <h3 className="flex items-center text-lg font-display font-semibold text-indigo-900 mb-4">
                            <Sparkles className="w-5 h-5 mr-2 text-indigo-500" />
                            この画像のAI説明
                          </h3>
                          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-2xl">
                            <p className="text-neutral-700 italic leading-relaxed text-base">
                              {formData.imageAIDescription
                                ? `"${formData.imageAIDescription}"`
                                : 'あと数秒で表示されるので少し待っててね！'}
                            </p>
                          </div>
                        </div>

                        {/* AI写真採点セクション */}
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="flex items-center text-lg font-display font-semibold text-purple-900">
                              <Award className="w-5 h-5 mr-2 text-purple-500" />
                              AI写真採点
                            </h3>
                            <button
                              type="button"
                              onClick={handleGeneratePhotoScore}
                              disabled={isGeneratingScore || !imagePreview || !formData.title.trim()}
                              className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50"
                            >
                              <Award className="w-4 h-4" />
                              <span>{isGeneratingScore ? '採点中...' : '採点開始'}</span>
                            </button>
                          </div>
                          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl">
                            {isGeneratingScore ? (
                              <div className="flex items-center space-x-3 text-purple-600">
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full"
                                />
                                <span className="text-sm">AI写真採点中です...</span>
                              </div>
                            ) : photoScore ? (
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <span className={`px-3 py-1 rounded-full text-white font-bold text-lg`} 
                                          style={{ backgroundColor: PhotoScoringService.getScoreLevel(photoScore.total_score).color }}>
                                      {photoScore.score_level}級
                                    </span>
                                    <span className="text-2xl font-bold text-purple-900">{photoScore.total_score}点</span>
                                  </div>
                                  <span className="text-sm text-purple-600">{photoScore.level_description}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div>技術的品質: {photoScore.technical_score}/25</div>
                                  <div>構図・バランス: {photoScore.composition_score}/25</div>
                                  <div>創造性: {photoScore.creativity_score}/25</div>
                                  <div>エンゲージメント: {photoScore.engagement_score}/25</div>
                                </div>
                                <p className="text-sm text-purple-700 italic">"{photoScore.ai_comment}"</p>
                              </div>
                            ) : (
                              <p className="text-sm text-neutral-700 italic">
                                画像とタイトルを入力してから「採点開始」ボタンを押してください
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                {/* User Comment */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3">
                    あなたの感想・体験 <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <textarea
                      ref={textareaRef}
                      value={formData.userComment}
                      onChange={handleTextareaChange}
                      onCompositionStart={() => setIsComposing(true)}
                      onCompositionEnd={() => {
                        setIsComposing(false);
                        autoResizeTextarea();
                      }}
                      placeholder="この写真を撮った時の感想や体験を教えてください..."
                      className="auto-resize-textarea w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200 scroll-container"
                      style={{ minHeight: '100px', resize: 'none' }}
                      required
                    />
                  </div>
                  <div className="text-xs text-primary-600 mt-1 font-semibold"></div>
                  <div className="text-xs text-neutral-500 mt-1">
                    文字数: {formData.userComment.length}
                  </div>
                </div>

                {/* AIコメンテーター */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-neutral-700">
                      AIコメンテーター
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateAIDescription}
                      disabled={isGeneratingDescription || !formData.title.trim() || !formData.userComment.trim()}
                      className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg hover:from-primary-600 hover:to-accent-600 transition-all duration-200 disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{isGeneratingDescription ? '生成中...' : 'AI生成'}</span>
                    </button>
                  </div>
                  <div className="mt-4 p-4 bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl min-h-[100px] flex items-center">
                    {isGeneratingDescription ? (
                      <div className="flex items-center space-x-3 text-primary-600">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full"
                        />
                        <span className="text-sm">AIコメンテーターがコメントを生成中です...</span>
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-700 italic">
                        {formData.textAIDescription || 'タイトルと感想を入力してから「AI生成」ボタンを押してください'}
                      </p>
                    )}
                  </div>
                </div>

                {/* AI Response Preview */}
                {formData.title && formData.userComment && (
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-200">
                    <h4 className="flex items-center text-lg font-semibold text-indigo-900 mb-3">
                      <Sparkles className="w-5 h-5 mr-2" />
                      投稿してからまた開いたら見れるよ！
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm">
                        <MessageCircle className="w-4 h-4 text-blue-600" />
                        <span className="text-neutral-700">独創的なコメント</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <HelpCircle className="w-4 h-4 text-green-600" />
                        <span className="text-neutral-700">対話を促す質問</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Eye className="w-4 h-4 text-purple-600" />
                        <span className="text-neutral-700">新しい気づきの観察</span>
                      </div>
                    </div>
                    <p className="text-xs text-indigo-600 mt-3">
                      投稿後、{apiStatus.provider}があなたの作品を分析して3つの応答を生成します
                    </p>
                  </div>
                )}

                {/* タグ選択 */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3">
                    タグを選択（複数可） <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <button
                        type="button"
                        key={tag.id}
                        onClick={() => handleTagToggle(tag)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex-shrink-0 ${formData.tags.some(t => t.id === tag.id) ? 'text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}
                        style={{ backgroundColor: formData.tags.some(t => t.id === tag.id) ? tag.color : undefined }}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                  {formData.tags.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">
                      少なくとも1つのタグを選択してください
                    </p>
                  )}
                  {formData.tags.length > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      {formData.tags.length}個のタグが選択されています
                    </p>
                  )}
                </div>
              </form>
            </div>
            
            {/* Modal Footer */}
            <div className="flex-shrink-0 p-2 md:p-6 border-t border-neutral-200 bg-gray-50">
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  form="new-post-form"
                  disabled={isLoading || !selectedImage || !formData.title.trim() || !formData.userComment.trim() || formData.tags.length === 0}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? '投稿中...' : '投稿する'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};