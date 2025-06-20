import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';

// Providers and Hooks
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { usePosts } from './hooks/usePosts';

// Components
import { Header } from './components/Header';
import { FilterPanel } from './components/FilterPanel';
import { MasonryGrid } from './components/MasonryGrid';
import { PostModal } from './components/PostModal';
import { NewPostModal } from './components/NewPostModal';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginModal } from './components/LoginModal';

// Pages
import { ProfileEdit } from './pages/ProfileEdit';
import { Settings } from './pages/Settings';

// Data and Types
import { mockTags } from './data/mockData';
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
  } = usePosts();

  // フィルターや検索クエリが変更された時に投稿を再フィルタリング
  useEffect(() => {
    // 投稿のローディングが終わってからフィルタリングを実行
    if (!postsLoading) {
      filterPosts(filters, searchQuery);
    }
  }, [filters, searchQuery, postsLoading, filterPosts]); // filterPostsを依存配列に追加

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
    setSelectedPost(newPost);
  };

  // ユーザーがログインしている場合の表示
  return (
    <div className="min-h-screen bg-neutral-50 w-full overflow-x-hidden">
      <Header
        onNewPost={() => setIsNewPostOpen(true)}
        onToggleFilter={() => setIsFilterOpen(!isFilterOpen)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main>
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
                likePost={likePost}
                unlikePost={unlikePost}
              />
            }
          />
          <Route path="/profile-edit" element={<ProtectedRoute><ProfileEdit /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        </Routes>
      </main>

      <FilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        tags={mockTags}
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

      {/* NewPostModalはProtectedRouteでラップする必要はありません */}
      <NewPostModal
        isOpen={isNewPostOpen}
        onClose={() => setIsNewPostOpen(false)}
        tags={mockTags}
        onSubmit={handleNewPost}
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
