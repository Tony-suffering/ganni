import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Type, MessageCircle, HelpCircle, Eye, Star, Lightbulb } from 'lucide-react';
import { Tag, AIComment, Post } from '../../types';
import { useAI } from '../../hooks/useAI';
import { useAuth } from '../../contexts/AuthContext';
import VoiceInputButton from "../VoiceInputButton";
import { generateImageAIComments } from "../../lib/gemini";
import { supabase } from '../../supabase';

interface NewPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  tags: Tag[];
  onSubmit: (postData: any) => void;
  inspirationPostId?: string;
}

export const NewPostModal: React.FC<NewPostModalProps> = ({
  isOpen,
  onClose,
  tags,
  onSubmit,
  inspirationPostId
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
  
  
  // TypeScript用の型定義
  declare global {
    interface Window {
      geminiApiTested?: boolean;
    }
  }
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [inspirationPost, setInspirationPost] = useState<Post | null>(null);

  const { apiStatus } = useAI();

  // インスピレーション元の投稿を取得
  useEffect(() => {
    const fetchInspirationPost = async () => {
      console.log('🔍 インスピレーション元ID:', inspirationPostId);
      if (!inspirationPostId) {
        console.log('❌ インスピレーション元IDが見つかりません');
        setInspirationPost(null);
        return;
      }

      try {
        const { data: postData, error } = await supabase
          .from('posts')
          .select('*')
          .eq('id', inspirationPostId)
          .single();

        if (error) {
          console.error('インスピレーション元投稿取得エラー:', error);
          return;
        }

        if (postData) {
          // 作成者情報を取得
          let authorData = null;
          if (postData.author_id) {
            const { data: userData } = await supabase
              .from('users')
              .select('id, name, avatar_url')
              .eq('id', postData.author_id)
              .single();

            if (!userData) {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('id, name, avatar_url')
                .eq('id', postData.author_id)
                .single();
              authorData = profileData;
            } else {
              authorData = userData;
            }
          }

          const authorName = authorData?.name || '匿名ユーザー';
          const avatarUrl = authorData?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=random`;

          const formattedPost: Post = {
            id: postData.id,
            title: postData.title,
            imageUrl: postData.image_url,
            aiDescription: postData.ai_description || '',
            userComment: postData.user_comment || '',
            author: {
              id: postData.author_id,
              name: authorName,
              avatar: avatarUrl
            },
            tags: [],
            createdAt: postData.created_at,
            updatedAt: postData.updated_at,
            likeCount: 0,
            likedByCurrentUser: false,
            bookmarkedByCurrentUser: false,
            aiComments: [],
            commentCount: 0
          };

          setInspirationPost(formattedPost);
          console.log('✅ インスピレーション元投稿を設定:', formattedPost.title);
        }
      } catch (error) {
        console.error('インスピレーション元投稿取得エラー:', error);
      }
    };

    fetchInspirationPost();
  }, [inspirationPostId]);

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

  // 画像を圧縮する関数
  const compressImage = (file: File, maxWidth: number = 1920, quality: number = 0.85): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        try {
          // アスペクト比を保持して最大幅に調整
          const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
          canvas.width = img.width * ratio;
          canvas.height = img.height * ratio;
          
          if (!ctx) {
            throw new Error('Canvas context not available');
          }
          
          // 高品質でリサイズ
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // JPEG形式で圧縮
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          
          // サイズチェック
          const sizeInBytes = (compressedDataUrl.split(',')[1].length * 3) / 4;
          console.log('🖼️ Compressed image size:', sizeInBytes, 'bytes');
          
          if (sizeInBytes > 4 * 1024 * 1024) {
            // さらに圧縮が必要な場合
            const lowerQuality = canvas.toDataURL('image/jpeg', 0.6);
            resolve(lowerQuality);
          } else {
            resolve(compressedDataUrl);
          }
        } catch (error) {
          console.error('Image compression failed:', error);
          // 圧縮に失敗した場合は元の画像を使用
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // ファイルタイプチェック
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('JPEG、PNG、WebP形式の画像ファイルを選択してください。');
        return;
      }
      
      // ファイルサイズチェック (20MB制限)
      if (file.size > 20 * 1024 * 1024) {
        alert('ファイルサイズが大きすぎます。20MB以下の画像を選択してください。');
        return;
      }
      
      setSelectedImage(file);
      // 画像を圧縮してから使用
      const compressedBase64 = await compressImage(file);
      setImagePreview(compressedBase64);
      
      // 画像AIコメント生成は削除（投稿後に実行）
      setFormData(prev => ({ ...prev, imageAIDescription: '', aiComments: [] }));
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
        return;
      }
      return;
    }

    try {
      setIsLoading(true);
      
      // インスピレーション情報をデバッグ
      const urlParams = new URLSearchParams(window.location.search);
      const inspirationType = urlParams.get('type') || 'direct';
      const inspirationNote = urlParams.get('note') || '';
      
      console.log('🎯 NewPostModal - インスピレーション情報:', {
        inspirationPostId,
        inspirationType,
        inspirationNote,
        urlParams: Object.fromEntries(urlParams.entries())
      });

      // シンプルな投稿データ作成（AI処理は投稿後に実行）
      const postData = {
        title: formData.title,
        imageUrl: imagePreview,
        imageAIDescription: formData.imageAIDescription,
        userComment: formData.userComment,
        author: {
          id: user.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'ユーザー',
          avatar: user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_metadata?.name || user.email?.split('@')[0] || 'ユーザー')}&background=0072f5&color=fff`
        },
        tags: formData.tags,
        // AI処理は投稿後に非同期で実行されるため、初期値を設定
        aiDescription: '',
        aiComments: [],
        photoScore: null,
        // インスピレーション元の情報を追加
        inspirationSourceId: inspirationPostId || null,
        // URLパラメータから追加情報を取得
        inspirationType,
        inspirationNote
      };
      
      console.log('📤 NewPostModal - 送信する投稿データ:', postData);
      
      // デバッグ: インスピレーション情報をログ出力
      console.log('🔍 NewPostModal デバッグ情報:');
      console.log('  - inspirationPostId:', inspirationPostId);
      console.log('  - inspirationType:', postData.inspirationType);
      console.log('  - inspirationNote:', postData.inspirationNote);
      console.log('  - inspirationSourceId:', postData.inspirationSourceId);
      console.log('  - URLパラメータ:');
      urlParams.forEach((value, key) => {
        console.log(`    ${key}: ${value}`);
      });
      console.log('  - 投稿データ全体:', postData);
      
      onSubmit(postData);
      onClose();
      
      // フォームをリセット
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
                  {inspirationPostId && (
                    <span className="text-sm font-normal text-gray-600 block">
                      インスピレーション投稿
                    </span>
                  )}
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
                {/* Inspiration Source */}
                {inspirationPost && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <Lightbulb className="w-5 h-5 text-gray-600" />
                      <span className="text-sm font-medium text-gray-800">インスピレーション元</span>
                    </div>
                    <div className="flex space-x-3">
                      <img
                        src={inspirationPost.imageUrl}
                        alt={inspirationPost.title}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {inspirationPost.title}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <img
                            src={inspirationPost.author.avatar}
                            alt={inspirationPost.author.name}
                            className="w-4 h-4 rounded-full"
                          />
                          <span className="text-xs text-gray-600">
                            {inspirationPost.author.name}
                          </span>
                        </div>
                        {inspirationPost.userComment && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {inspirationPost.userComment}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

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
                      placeholder="例：黄金時間の街並み"
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



                {/* AI Analysis Preview */}
                {formData.title && formData.userComment && (
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
                    <h4 className="flex items-center text-lg font-semibold text-indigo-900 mb-3">
                      <Eye className="w-5 h-5 mr-2" />
                      投稿後のAI分析について
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-neutral-700">📊 写真採点 (100点満点)</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-neutral-700">🛍️ 関連商品推薦</span>
                      </div>
                    </div>
                    <p className="text-xs text-indigo-600 mt-3">
                      投稿完了後、AIが自動的に分析を開始し、結果をポップアップでお知らせします
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