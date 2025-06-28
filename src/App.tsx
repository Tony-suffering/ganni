import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';

// Providers and Hooks
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { usePosts } from './hooks/usePosts';
import { useTags } from './hooks/useTags';
import { useHighlightUpdater } from './hooks/useHighlightUpdater';
import { usePostAIAnalysis } from './hooks/usePostAIAnalysis';

// Services
import { analyticsService } from './services/analyticsService';

// Components
import { Header } from './components/Header';
import { FilterPanel } from './components/FilterPanel';
import { ActiveFilters } from './components/ActiveFilters';
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

// Pages
import { ProfileEdit } from './pages/ProfileEdit';
import { Settings } from './pages/Settings';
import { Bookmarks } from './pages/Bookmarks';
import { PersonalDashboard } from './pages/PersonalDashboard';

// Data and Types
import { Post, FilterOptions } from './types';

/**
 * AppContentコンポーネント
 * アプリケーションの主要なUIとロジックを担当します。
 * useAuthフックを使用するため、AuthProviderの子要素である必要があります。
 */
function AppContent() {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({ tags: [], sortBy: 'newest' });
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
  
  // 投稿データを管理するカスタムフック
  const {
    posts,
    allPosts,
    loading: postsLoading,
    hasNextPage,
    loadMore,
    addPost,
    updatePost,
    filterPosts,
    likePost,
    unlikePost,
    bookmarkPost,
    unbookmarkPost,
    deletePost,
    isLoadingMore,
    isFiltering
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

  // フィルターや検索クエリが変更された時に投稿を再フィルタリング
  useEffect(() => {
    // 投稿のローディングが終わって、フィルター・検索が初期値でない場合のみフィルタリングを実行
    if (!postsLoading && posts.length > 0 && (filters.sortBy !== 'newest' || filters.tags.length > 0 || searchQuery.trim())) {
      filterPosts(filters, searchQuery);
    }
  }, [filters, searchQuery, postsLoading, posts, filterPosts]); // 適切な依存関係を設定

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
    const newPost = await addPost(postData);
    if (newPost) {
      console.log('✅ Post created:', newPost.id);
      
      // 投稿後のAI分析を開始
      setAnalyzingPostId(newPost.id);
      setIsAnalysisModalOpen(true);
      
      // AI分析を非同期で開始
      try {
        const analysisResult = await analyzePost(
          newPost.imageUrl,
          newPost.title,
          newPost.userComment,
          newPost.imageAIDescription
        );
        
        console.log('🎉 AI analysis completed for post:', newPost.id);
        
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
      }
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

  const handleToggleFilter = () => setIsFilterOpen(!isFilterOpen);

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

  const hasActiveFilters = filters.tags.length > 0 || filters.sortBy !== 'newest' || searchQuery.trim();

  // ユーザーがログインしている場合の表示
  return (
    <div className="bg-neutral-50 w-full min-h-screen">
      <Header
        onNewPost={() => setIsNewPostOpen(true)}
        onToggleFilter={handleToggleFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onLoginClick={openLoginModal}
        onPostClick={handlePostClick}
        hasActiveFilters={hasActiveFilters}
        allPosts={allPosts}
        onHighlightPostClick={setSelectedPost}
      />

      {/* Active Filters */}
      <ActiveFilters
        tags={tags}
        filters={filters}
        onFiltersChange={setFilters}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="pb-20 md:pb-0 mt-20 md:mt-24">
        <Routes>
          <Route
            path="/"
            element={
              <>
                {/* Filter Loading Overlay */}
                {isFiltering && (
                  <div className="fixed top-16 left-0 right-0 bg-blue-50 border-b border-blue-200 z-40 px-4 py-3">
                    <div className="max-w-7xl mx-auto flex items-center justify-center space-x-3">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-blue-700 font-medium">フィルターを適用中...</span>
                    </div>
                  </div>
                )}
                
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
                  searchQuery={searchQuery}
                />
                
                {/* Floating CTA for Dashboard */}
                <PersonalJourneyCTA variant="floating" />
              </>
            }
          />
          <Route path="/profile/:userId" element={<UserProfile />} />
          <Route path="/profile-edit" element={<ProtectedRoute><ProfileEdit /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/bookmarks" element={<ProtectedRoute><Bookmarks /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><PersonalDashboard /></ProtectedRoute>} />
        </Routes>
      </main>

      <FilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        tags={tags}
        filters={filters}
        onFiltersChange={setFilters}
      />

      <PostModal
        post={selectedPost}
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        likePost={likePost}
        unlikePost={unlikePost}
      />

      <NewPostModal
        isOpen={isNewPostOpen}
        onClose={() => setIsNewPostOpen(false)}
        tags={tags}
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
        onToggleFilter={handleToggleFilter}
        onPostClick={handlePostClick}
        hasActiveFilters={hasActiveFilters}
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
