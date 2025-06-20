import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Sparkles, Tag as TagIcon, Type, MessageCircle, HelpCircle, Eye, Wifi, WifiOff } from 'lucide-react';
import { Tag, AIComment } from '../types';
import { useAI } from '../hooks/useAI';
import { useAuth } from '../contexts/AuthContext';
import VoiceInputButton from "./VoiceInputButton";
import { generateImageAIComments } from "../lib/gemini";

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
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const { 
    generateDescription, 
    generateComments, 
    isGeneratingDescription, 
    isGeneratingComments,
    apiStatus 
  } = useAI();

  // Auto-resize textarea
  const autoResizeTextarea = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 300);
      textarea.style.height = `${newHeight}px`;
      
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
    if (!selectedImage || !formData.userComment.trim() || !formData.title.trim() || !user) {
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
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-shrink-0 p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-display font-semibold text-neutral-900">
                    新しい投稿
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div 
              ref={modalContentRef}
              className="flex-1 overflow-y-auto scroll-container p-6"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
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
                      placeholder="例: 今日のランチは美味しかった！"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200"
                      required
                      maxLength={100}
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
                      className="border-2 border-dashed border-neutral-300 rounded-2xl p-12 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-all duration-200"
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
                        className="w-full h-64 object-cover rounded-2xl"
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
                      placeholder="この写真を撮った時の感想や体験を教えてください..."
                      className="auto-resize-textarea w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200 scroll-container"
                      style={{ minHeight: '100px' }}
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
                    タグを選択（複数可）
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
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 text-neutral-600 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors"
                  >
                    キャンセル
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={!selectedImage || !formData.userComment.trim() || !formData.title.trim() || isGeneratingComments}
                    className="px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl font-medium hover:from-primary-600 hover:to-accent-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isGeneratingComments && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                    )}
                    <span>{isGeneratingComments ? 'AI応答生成中...' : '投稿する'}</span>
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};