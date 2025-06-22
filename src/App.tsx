import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';

// Providers and Hooks
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { usePosts } from './hooks/usePosts';
import { useTags } from './hooks/useTags';

// Components
import { Header } from './components/Header';
import { FilterPanel } from './components/FilterPanel';
import { MasonryGrid } from './components/MasonryGrid';
import { PostModal } from './components/PostModal';
import { NewPostModal } from './components/NewPostModal';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginModal } from './components/auth/LoginModal';
import { RegisterModal } from './components/auth/RegisterModal';
import BottomNavBar from './components/BottomNavBar';
import UserProfile from './pages/UserProfile';

// Pages
import { ProfileEdit } from './pages/ProfileEdit';
import { Settings } from './pages/Settings';
import { Bookmarks } from './pages/Bookmarks';

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

  // useAuthフックで認証状態とローディング状態を取得
  const { user, loading: authLoading } = useAuth();
  
  // 投稿データを管理するカスタムフック
  const {
    posts,
    loading: postsLoading,
    hasNextPage,
    loadMore,
    addPost,
    filterPosts,
    likePost,
    unlikePost,
    bookmarkPost,
    unbookmarkPost,
    deletePost,
    isLoadingMore
  } = usePosts();
  
  // タグデータを管理するカスタムフック
  const { tags, loading: tagsLoading } = useTags();

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
  const handleNewPost = async (postData: any) => {
    const newPost = await addPost(postData);
    if (newPost) { // Check if newPost is not null
      setSelectedPost(newPost);
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

  // 通知から投稿を開く機能
  const handlePostClick = (postId: string) => {
    // 投稿IDから該当の投稿を見つけて開く
    const post = posts.find(p => p.id === postId);
    if (post) {
      setSelectedPost(post);
    }
  };

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
      />

      <main className="mt-16 pb-20 md:pb-0">
        <Routes>
          <Route
            path="/"
            element={
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
            }
          />
          <Route path="/profile/:userId" element={<UserProfile />} />
          <Route path="/profile-edit" element={<ProtectedRoute><ProfileEdit /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/bookmarks" element={<ProtectedRoute><Bookmarks /></ProtectedRoute>} />
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

      <BottomNavBar
        onNewPostClick={() => setIsNewPostOpen(true)}
        onLoginClick={openLoginModal}
        onToggleFilter={handleToggleFilter}
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
