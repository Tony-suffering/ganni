import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useSearchParams } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';

// Providers and Hooks
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { usePosts } from './hooks/usePosts';
import { useTags } from './hooks/useTags';
import { useHighlightUpdater } from './hooks/useHighlightUpdater';
import { usePostAIAnalysis } from './hooks/usePostAIAnalysis';
import './utils/updateExistingPhotoScores'; // グローバル関数を有効化

// Services
import { analyticsService } from './services/analyticsService';

// Components
import { Header } from './components/Header';
import { PhotoRankingSection } from './components/PhotoRankingSection';
import { MasonryGrid } from './components/MasonryGrid';
import { PostModal } from './components/PostModal';
import { NewPostModal } from './components/NewPostModal';
import { AIAnalysisResultModal } from './components/AIAnalysisResultModal';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginModal } from './components/auth/LoginModal';
import { RegisterModal } from './components/auth/RegisterModal';
import { PersonalJourneyCTA } from './components/cta/PersonalJourneyCTA';
import BottomNavBar from './components/BottomNavBar';
import UserProfile from './pages/UserProfile';
import { ImageDebugTest } from './components/ImageDebugTest';
import { LazyImageDirectTest } from './components/LazyImageDirectTest';

// Pages
import { ProfileEdit } from './pages/ProfileEdit';
import { Settings } from './pages/Settings';
import { Bookmarks } from './pages/Bookmarks';
import { PersonalDashboard } from './pages/PersonalDashboard';
import { InspirationLab } from './pages/InspirationLab';

// Data and Types
import { Post } from './types';

/**
 * AppContentコンポーネント
 * アプリケーションの主要なUIとロジックを担当します。
 * useAuthフックを使用するため、AuthProviderの子要素である必要があります。
 */
function AppContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [analyzingPostId, setAnalyzingPostId] = useState<string | null>(null);

  // useAuthフックで認証状態とローディング状態を取得
  const { loading: authLoading, user } = useAuth();

  // ユーザー情報をアナリティクスサービスに設定
  useEffect(() => {
    if (user) {
      analyticsService.setUser(user.id);
    }
  }, [user]);

  // URLパラメータでinspiration指定時に新規投稿モーダルを自動開く
  useEffect(() => {
    const inspirationId = searchParams.get('inspiration');
    if (inspirationId && user && !isNewPostOpen) {
      console.log('🎨 インスピレーション投稿モードで新規投稿モーダルを開く:', inspirationId);
      setIsNewPostOpen(true);
    }
  }, [searchParams, user, isNewPostOpen]);
  
  // 投稿データを管理するカスタムフック
  const {
    posts,
    allPosts,
    loading: postsLoading,
    hasNextPage,
    loadMore,
    addPost,
    updatePost,
    likePost,
    unlikePost,
    bookmarkPost,
    unbookmarkPost,
    deletePost,
    isLoadingMore
  } = usePosts();
  
  // タグデータを管理するカスタムフック
  const { tags } = useTags();

  // AI分析を管理するカスタムフック
  const {
    isAnalyzing,
    photoScore,
    aiComments,
    productRecommendations,
    progress,
    isAnalysisComplete,
    analyzePost,
    resetAnalysis
  } = usePostAIAnalysis();

  // バックグラウンドでハイライトを自動更新
  useHighlightUpdater({
    allPosts,
    updateIntervalMinutes: 30, // 30分間隔で更新
    enabled: !authLoading && !postsLoading
  });

  // フィルター機能は削除済み - シンプルな無限ローディングのみ

  // 認証または投稿データの読み込み中はローディングスピナーを表示
  if (authLoading) { // postsLoadingよりもauthLoadingを優先
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  // 新しい投稿データを処理する関数
  const handleNewPost = async (postData: Parameters<typeof addPost>[0]) => {
    console.log('🔍 App.handleNewPost - 受信した投稿データ:');
    console.log('  - inspirationSourceId:', postData.inspirationSourceId);
    console.log('  - inspirationType:', postData.inspirationType);
    console.log('  - inspirationNote:', postData.inspirationNote);
    console.log('  - 投稿データ全体:', postData);
    
    const newPost = await addPost(postData);
    if (newPost) {
      console.log('✅ Post created:', newPost.id);
      
      // 投稿後のAI分析を開始
      console.log('🚀 Setting up AI analysis modal for post:', newPost.id);
      
      // まずモーダルを開く
      setAnalyzingPostId(newPost.id);
      setIsAnalysisModalOpen(true);
      
      // モーダルが確実に開いたことを確認してからAI分析を開始
      requestAnimationFrame(() => {
        setTimeout(async () => {
          try {
            console.log('🤖 Starting AI analysis for post:', newPost.id);
            console.log('🔍 Modal open state:', isAnalysisModalOpen); // この時点でのモーダル状態を確認
            console.log('🖼️ Image URL for analysis:', newPost.imageUrl);
            console.log('📝 Post data for analysis:', {
              title: newPost.title,
              userComment: newPost.userComment,
              imageAIDescription: newPost.imageAIDescription
            });
            
            const analysisResult = await analyzePost(
              newPost.imageUrl,
              newPost.title,
              newPost.userComment,
              newPost.imageAIDescription
            );
            
            console.log('🎉 AI analysis completed for post:', newPost.id);
            console.log('📊 Analysis result:', analysisResult);
            
            // 分析結果でPostをデータベースに保存
            try {
              await updatePost(newPost.id, {
                photoScore: analysisResult.photoScore,
                aiComments: analysisResult.aiComments
              });
              console.log('✅ AI analysis results saved to database for post:', newPost.id);
            } catch (updateError) {
              console.error('❌ Failed to save AI analysis results to database:', updateError);
            }
            
          } catch (error) {
            console.error('❌ AI analysis failed for post:', newPost.id, error);
            // エラーが発生してもモーダルは開いたままにする
          }
        }, 100); // requestAnimationFrameの後に少し待つ
      });
    }
  };

  const openLoginModal = () => setIsLoginOpen(true);
  
  const switchToRegister = () => {
    setIsLoginOpen(false);
    setIsRegisterOpen(true);
  };

  const switchToLogin = () => {
    setIsRegisterOpen(false);
    setIsLoginOpen(true);
  };


  // AI分析モーダル関連の関数
  const closeAnalysisModal = () => {
    setIsAnalysisModalOpen(false);
    setAnalyzingPostId(null);
    resetAnalysis();
  };

  const viewAnalyzedPost = () => {
    if (analyzingPostId) {
      const post = posts.find(p => p.id === analyzingPostId);
      if (post) {
        setSelectedPost(post);
        closeAnalysisModal();
      }
    }
  };

  // 通知から投稿を開く機能
  const handlePostClick = (postId: string) => {
    // 投稿IDから該当の投稿を見つけて開く
    const post = posts.find(p => p.id === postId);
    if (post) {
      setSelectedPost(post);
    }
  };


  // デバッグ用: モーダルの状態を確認
  useEffect(() => {
    console.log('🔍 Modal states:', {
      isAnalysisModalOpen,
      analyzingPostId,
      isAnalyzing,
      photoScore: !!photoScore,
      aiComments: aiComments?.length || 0
    });
  }, [isAnalysisModalOpen, analyzingPostId, isAnalyzing, photoScore, aiComments]);

  // ユーザーがログインしている場合の表示
  return (
    <div className="bg-neutral-50 w-full min-h-screen">
      <Header
        onNewPost={() => setIsNewPostOpen(true)}
        onLoginClick={openLoginModal}
        onPostClick={handlePostClick}
        allPosts={allPosts}
        onHighlightPostClick={setSelectedPost}
      />

      <main className="pb-20 md:pb-0 mt-20 md:mt-24">
        <Routes>
          <Route
            path="/"
            element={
              <>
                
                {/* 写真スコアランキングセクション */}
                <PhotoRankingSection
                  allPosts={allPosts}
                  onPostClick={setSelectedPost}
                  limit={10}
                />
                
                <MasonryGrid
                  posts={posts}
                  onPostClick={setSelectedPost}
                  hasNextPage={hasNextPage}
                  onLoadMore={loadMore}
                  loading={postsLoading}
                  isLoadingMore={isLoadingMore}
                  likePost={likePost}
                  unlikePost={unlikePost}
                  bookmarkPost={bookmarkPost}
                  unbookmarkPost={unbookmarkPost}
                  deletePost={deletePost}
                />
                
                {/* Floating CTA for Dashboard - Desktop only */}
                <div className="hidden md:block">
                  <PersonalJourneyCTA variant="floating" />
                </div>
              </>
            }
          />
          <Route path="/profile/:userId" element={<UserProfile />} />
          <Route path="/profile-edit" element={<ProtectedRoute><ProfileEdit /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/bookmarks" element={<ProtectedRoute><Bookmarks /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><PersonalDashboard /></ProtectedRoute>} />
          <Route path="/inspiration/:postId" element={<ProtectedRoute><InspirationLab /></ProtectedRoute>} />
        </Routes>
      </main>


      <PostModal
        post={selectedPost}
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        likePost={likePost}
        unlikePost={unlikePost}
      />

      <NewPostModal
        isOpen={isNewPostOpen}
        onClose={() => {
          setIsNewPostOpen(false);
          // inspirationパラメータをクリア
          if (searchParams.get('inspiration')) {
            console.log('🧹 inspirationパラメータをクリア');
            setSearchParams({});
          }
        }}
        tags={tags}
        inspirationPostId={searchParams.get('inspiration') || undefined}
        onSubmit={handleNewPost}
      />
      
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSwitchToRegister={switchToRegister}
      />

      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSwitchToLogin={switchToLogin}
      />

      <AIAnalysisResultModal
        isOpen={isAnalysisModalOpen}
        onClose={closeAnalysisModal}
        onViewPost={viewAnalyzedPost}
        photoScore={photoScore}
        aiComments={aiComments}
        productRecommendations={productRecommendations}
        isAnalyzing={isAnalyzing}
        analysisProgress={progress}
      />

      <BottomNavBar
        onNewPostClick={() => setIsNewPostOpen(true)}
        onLoginClick={openLoginModal}
        onPostClick={handlePostClick}
      />
    </div>
  );
}

/**
 * Appコンポーネント (アプリケーションのルート)
 * ここでアプリケーション全体で利用するProvider（ContextやRouter）を配置します。
 */
function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

// --- ✅ エラー発生時に表示される UI ---
function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="min-h-screen p-6 bg-red-100 text-red-800 flex flex-col items-center justify-center">
      <h2 className="text-xl font-bold mb-2">アプリでエラーが発生しました</h2>
      <pre className="bg-white p-4 border border-red-300 rounded whitespace-pre-wrap">
        {error.message}
      </pre>
    </div>
  );
}

export default App;
