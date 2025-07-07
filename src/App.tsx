import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useSearchParams } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';

// Providers and Hooks
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PointsNotificationProvider } from './contexts/PointsNotificationContext';
import { usePosts } from './hooks/usePosts';
import { useTags } from './hooks/useTags';
import { useHighlightUpdater } from './hooks/useHighlightUpdater';
import { usePostAIAnalysis } from './hooks/usePostAIAnalysis';
import { useGamification } from './hooks/useGamification';
import './utils/updateExistingPhotoScores'; // グローバル関数を有効化

// Services
import { analyticsService } from './services/analyticsService';
import { PostBonusService } from './services/postBonusService';

// Components
import { Header } from './components/navigation/Header';
import { PhotoRankingSection } from './components/scoring/PhotoRankingSection';
import { MasonryGrid } from './components/layout/MasonryGrid';
import { PostModal } from './components/modals/PostModal';
import { NewPostModal } from './components/modals/NewPostModal';
import { AIAnalysisResultModal } from './components/modals/AIAnalysisResultModal';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginModal } from './components/auth/LoginModal';
import { RegisterModal } from './components/auth/RegisterModal';
import { PersonalJourneyCTA } from './components/cta/PersonalJourneyCTA';
import BottomNavBar from './components/navigation/BottomNavBar';
import UserProfile from './pages/UserProfile';
import { UserPointsDisplay } from './components/gamification/UserPointsDisplay';
import { UserBadgesDisplay } from './components/gamification/UserBadgesDisplay';
import { AnimatedPointsDisplay } from './components/gamification/AnimatedPointsDisplay';
import { MobilePointsDisplay } from './components/gamification/MobilePointsDisplay';
import { GlobalPointsNotifications } from './components/gamification/GlobalPointsNotifications';
import { usePointsNotification } from './contexts/PointsNotificationContext';
import { supabase } from './supabase';

// Pages
import { ProfileEdit } from './pages/ProfileEdit';
import { Settings } from './pages/Settings';
import { Bookmarks } from './pages/Bookmarks';
import { PersonalDashboard } from './pages/PersonalDashboard';
import { InspirationLab } from './pages/InspirationLab';
import { InspirationExplore } from './pages/InspirationExplore';
import { SpotifyCallback } from './pages/SpotifyCallback';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // useAuthフックで認証状態とローディング状態を取得
  const { loading: authLoading, user } = useAuth();
  
  // ゲーミフィケーションデータを取得（条件付き）
  const shouldLoadGamification = !!user && !authLoading;
  const { userPoints, previousPoints, levelInfo, displayBadges, photoStats, loading: gamificationLoading, fetchUserPoints, handlePointsUpdate } = useGamification();
  const { addNotification } = usePointsNotification();
  
  
  // 画面サイズ監視
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


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

  // リアルタイムポイント更新のSubscription（App.tsxで管理）
  useEffect(() => {
    if (!user) return;

    let subscription: any = null;

    const setupSubscription = async () => {
      try {
        const channelName = `point-updates-${user.id}-${Date.now()}`;
        console.log('🔄 ポイント履歴のリアルタイム更新を開始:', { userId: user.id });
        
        subscription = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'point_history',
              filter: `user_id=eq.${user.id}`
            },
            (payload: any) => handlePointsUpdate(payload, addNotification)
          )
          .subscribe();
      } catch (error) {
        console.error('❌ サブスクリプション設定エラー:', error);
      }
    };

    setupSubscription();

    return () => {
      if (subscription) {
        console.log('🔄 ポイント履歴のリアルタイム更新を停止');
        try {
          subscription.unsubscribe();
        } catch (error) {
          console.warn('⚠️ サブスクリプション停止エラー:', error);
        }
      }
    };
  }, [user?.id, handlePointsUpdate, addNotification]);

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


  // 検索フィルタリング
  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return posts;
    
    const query = searchQuery.toLowerCase();
    return posts.filter(post => 
      (post.content && post.content.toLowerCase().includes(query)) ||
      (post.title && post.title.toLowerCase().includes(query)) ||
      (post.author_name && post.author_name.toLowerCase().includes(query)) ||
      (post.tags && post.tags.some(tag => tag.name && tag.name.toLowerCase().includes(query)))
    );
  }, [posts, searchQuery]);
  
  // タグデータを管理するカスタムフック
  const { tags } = useTags();

  // AI分析を管理するカスタムフック
  const {
    isAnalyzing,
    photoScore,
    aiComments,
    personalPattern,
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

  // いいね処理をラップしてポイント更新を含める
  const handleLikePost = useCallback(async (postId: string) => {
    try {
      await likePost(postId);
      // いいね後にポイントを更新（一度だけ）
      if (fetchUserPoints) {
        setTimeout(() => {
          fetchUserPoints();
        }, 100); // 短いディレイでデータベース更新を待つ
      }
    } catch (error) {
      console.error('いいね処理エラー:', error);
    }
  }, [likePost, fetchUserPoints]);

  const handleUnlikePost = useCallback(async (postId: string) => {
    try {
      await unlikePost(postId);
      // いいね解除後にポイントを更新（一度だけ）
      if (fetchUserPoints) {
        setTimeout(() => {
          fetchUserPoints();
        }, 100);
      }
    } catch (error) {
      console.error('いいね解除処理エラー:', error);
    }
  }, [unlikePost, fetchUserPoints]);

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
    
    try {
      const newPost = await addPost(postData);
      if (newPost) {
      console.log('✅ Post created:', newPost.id);
      
      // 投稿後のAI分析を開始
      console.log('🚀 Setting up AI analysis modal for post:', newPost.id);
      
      // まずモーダルを開く
      setAnalyzingPostId(newPost.id);
      setIsAnalysisModalOpen(true);
      
      // AI分析を即座に開始（モーダルの開閉と並行して実行）
      setTimeout(async () => {
        try {
          console.log('🤖 Starting AI analysis for post:', newPost.id);
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
            newPost.imageAIDescription,
            newPost.id // postIdを渡してデータベース保存を有効化
          );
          
          console.log('🎉 AI analysis completed for post:', newPost.id);
          console.log('📊 Analysis result:', analysisResult);
          
          // AI分析結果は自動的にデータベースに保存される
          console.log('✅ AI analysis completed for post:', newPost.id);
          
          // 投稿リストを更新して新しい写真スコアを反映
          if (analysisResult.photoScore) {
            console.log('🔄 Updating post with new photo score...');
            updatePost(newPost.id, { photoScore: analysisResult.photoScore });
          }
          
          // 注意: 投稿ボーナスはusePosts.tsで既に計算済みのため、ここでは重複計算しない
          
        } catch (error) {
          console.error('❌ AI analysis failed for post:', newPost.id, {
            message: error?.message,
            code: error?.code,
            details: error?.details,
            fullError: error
          });
          // エラーが発生してもモーダルは開いたままにする
        }
      }, 50); // より短いディレイで開始
      }
    } catch (postCreationError) {
      console.error('❌ 投稿作成失敗:', {
        message: postCreationError?.message,
        code: postCreationError?.code,
        details: postCreationError?.details,
        fullError: postCreationError
      });
      // 投稿作成エラーをユーザーに通知する処理を追加することも可能
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

  // ユーザーがログインしている場合の表示
  return (
    <div className="bg-neutral-50 w-full min-h-screen">
      <Header
        onNewPost={() => setIsNewPostOpen(true)}
        onLoginClick={openLoginModal}
        onPostClick={handlePostClick}
        allPosts={allPosts}
        onHighlightPostClick={setSelectedPost}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* ゲーミフィケーションステータスバー - スマホでは非表示 */}
      {user && (userPoints || !gamificationLoading) && (
        <div className="hidden md:block fixed top-16 left-0 right-0 z-40 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* シンプルな総合点数とレベル表示 */}
              {userPoints && levelInfo ? (
                <AnimatedPointsDisplay
                  currentPoints={userPoints.total_points}
                  level={levelInfo.level}
                  levelName={levelInfo.levelName}
                  previousPoints={previousPoints}
                />
              ) : (
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-gray-600">レベル情報を読み込み中...</span>
                </div>
              )}
              
              {/* バッジ表示 */}
              {displayBadges && displayBadges.length > 0 && (
                <UserBadgesDisplay 
                  badges={displayBadges}
                  variant="inline"
                  limit={3}
                />
              )}
            </div>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              詳細を見る →
            </button>
          </div>
        </div>
      )}

      <main 
        className="pb-20 md:pb-0"
        style={{ 
          marginTop: isMobile ? '64px' : (userPoints && levelInfo ? '120px' : '80px')
        }}
      >

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
                  posts={filteredPosts}
                  onPostClick={setSelectedPost}
                  hasNextPage={hasNextPage}
                  onLoadMore={loadMore}
                  loading={postsLoading}
                  isLoadingMore={isLoadingMore}
                  likePost={handleLikePost}
                  unlikePost={handleUnlikePost}
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
          <Route path="/inspiration/explore" element={<ProtectedRoute><InspirationExplore /></ProtectedRoute>} />
          <Route path="/auth/spotify" element={<ProtectedRoute><SpotifyCallback /></ProtectedRoute>} />
        </Routes>
      </main>


      <PostModal
        post={selectedPost}
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        likePost={handleLikePost}
        unlikePost={handleUnlikePost}
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
        personalPattern={personalPattern}
        isAnalyzing={isAnalyzing}
        analysisProgress={progress}
      />

      <BottomNavBar
        onNewPostClick={() => setIsNewPostOpen(true)}
        onLoginClick={openLoginModal}
        onPostClick={handlePostClick}
        userPoints={userPoints}
        levelInfo={levelInfo}
        previousPoints={previousPoints}
      />

      {/* グローバルポイント通知 */}
      <GlobalPointsNotifications />
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
          <PointsNotificationProvider>
            <AppContent />
          </PointsNotificationProvider>
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
