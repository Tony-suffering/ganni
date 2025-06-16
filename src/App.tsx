import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { FilterPanel } from './components/FilterPanel';
import { MasonryGrid } from './components/MasonryGrid';
import { PostModal } from './components/PostModal';
import { NewPostModal } from './components/NewPostModal';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { usePosts } from './hooks/usePosts';
import { mockTags } from './data/mockData';
import { Post, FilterOptions } from './types';
import { ProfileEdit } from './pages/ProfileEdit';
import { Settings } from './pages/Settings';
import { ThemeProvider } from './contexts/ThemeContext';

function AppContent() {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    tags: [],
    sortBy: 'newest'
  });

  const { loading: authLoading } = useAuth();
  const { posts, loading: postsLoading, hasNextPage, loadMore, addPost, filterPosts } = usePosts();

  React.useEffect(() => {
    filterPosts(filters, searchQuery);
  }, [filters, searchQuery, filterPosts]);

  const handleNewPost = (postData: any) => {
    addPost(postData);
  };

  if (authLoading || postsLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-3 border-primary-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 scroll-smooth w-full overflow-x-hidden">
      <Header
        onNewPost={() => setIsNewPostOpen(true)}
        onToggleFilter={() => setIsFilterOpen(!isFilterOpen)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="scroll-container">
        <Routes>
          <Route path="/" element={
            <MasonryGrid
              posts={posts}
              onPostClick={setSelectedPost}
              hasNextPage={hasNextPage}
              onLoadMore={loadMore}
            />
          } />
          <Route path="/profile-edit" element={
            <ProtectedRoute>
              <ProfileEdit />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
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
      />

      <ProtectedRoute
        fallback={
          <NewPostModal
            isOpen={isNewPostOpen}
            onClose={() => setIsNewPostOpen(false)}
            tags={mockTags}
            onSubmit={handleNewPost}
          />
        }
      >
        <NewPostModal
          isOpen={isNewPostOpen}
          onClose={() => setIsNewPostOpen(false)}
          tags={mockTags}
          onSubmit={handleNewPost}
        />
      </ProtectedRoute>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;