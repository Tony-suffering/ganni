import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usePosts } from '../hooks/usePosts';
import { MasonryGrid } from '../components/layout/MasonryGrid';
import { PostModal } from '../components/modals/PostModal';
import { Post, User } from '../types';
import { supabase } from '../supabase';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useGamification } from '../hooks/useGamification';
import { UserPointsDisplay } from '../components/gamification/UserPointsDisplay';
import { UserBadgesDisplay } from '../components/gamification/UserBadgesDisplay';

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const { posts, loading: postsLoading, likePost, unlikePost, bookmarkPost, unbookmarkPost } = usePosts();
  const [profileUser, setProfileUser] = useState<Partial<User> | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [postCount, setPostCount] = useState(0);
  
  const isMyProfile = currentUser?.id === userId;
  
  // 自分のプロフィールの場合はエクスペリエンスページにリダイレクト
  useEffect(() => {
    if (isMyProfile) {
      navigate('/dashboard');
    }
  }, [isMyProfile, navigate]);
  
  // ゲーミフィケーション情報を取得（自分のプロフィールの場合のみ）
  const { userPoints, userBadges, levelInfo, toggleBadgeDisplay, loading: gamificationLoading, error: gamificationError } = useGamification();
  
  // デバッグ用ログ
  console.log('🔍 UserProfile デバッグ:', {
    isMyProfile,
    userPoints,
    levelInfo,
    userBadges: userBadges?.length,
    gamificationLoading,
    gamificationError,
    currentUserId: currentUser?.id,
    profileUserId: userId
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) return;
      setLoadingProfile(true);
      
      // プロフィール情報を取得
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfileUser(data);
      }
      
      // 投稿数を取得
      const { count, error: countError } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', userId);
      
      if (!countError && count !== null) {
        setPostCount(count);
      }
      
      setLoadingProfile(false);
    };

    fetchUserProfile();
  }, [userId]);

  const userPosts = useMemo(() => {
    return posts.filter(post => post.author.id === userId);
  }, [posts, userId]);

  if (loadingProfile || postsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <h2 className="text-2xl font-bold mb-4">Profile not found</h2>
        <p className="text-neutral-600 mb-6">The user profile you are looking for does not exist.</p>
        <Link to="/" className="text-blue-500 hover:underline">
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 mt-20 md:mt-24">
        <div className="flex items-center mb-8">
             <Link to="/" className="p-2 rounded-full hover:bg-gray-100 mr-4">
                <ArrowLeft className="w-6 h-6 text-gray-700" />
            </Link>
            <img 
                src={profileUser.avatar_url || `https://ui-avatars.com/api/?name=${profileUser.name}&background=random`} 
                alt={`${profileUser.name}'s avatar`}
                className="w-20 h-20 md:w-28 md:h-28 rounded-full object-cover border-4 border-white shadow-lg"
            />
            <div className="ml-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{profileUser.name}</h1>
                <p className="text-neutral-500">{postCount} posts</p>
                 {isMyProfile && (
                    <Link 
                        to="/profile-edit" 
                        className="mt-2 inline-block bg-gray-200 text-gray-800 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-gray-300 transition-colors"
                    >
                        Edit Profile
                    </Link>
                )}
            </div>
        </div>

        {/* ゲーミフィケーション情報（自分のプロフィールの場合のみ） */}
        {isMyProfile && (
          <div className="mb-8 space-y-6">
            {/* デバッグ情報表示 */}
            <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded-lg text-sm">
              <p><strong>デバッグ情報:</strong></p>
              <p>ローディング: {gamificationLoading ? 'はい' : 'いいえ'}</p>
              <p>エラー: {gamificationError || 'なし'}</p>
              <p>ポイント: {userPoints ? 'あり' : 'なし'}</p>
              <p>レベル情報: {levelInfo ? 'あり' : 'なし'}</p>
              <p>バッジ数: {userBadges?.length || 0}</p>
            </div>
            
            {userPoints && levelInfo ? (
              <>
                <UserPointsDisplay 
                  userPoints={userPoints} 
                  levelInfo={levelInfo} 
                />
                <UserBadgesDisplay 
                  userBadges={userBadges} 
                  onToggleDisplay={toggleBadgeDisplay}
                />
              </>
            ) : (
              <div className="bg-red-100 dark:bg-red-900 p-4 rounded-lg">
                <p className="text-red-800 dark:text-red-200">
                  ゲーミフィケーション情報の読み込みに問題があります
                </p>
                {gamificationError && (
                  <p className="text-sm mt-2">エラー: {gamificationError}</p>
                )}
              </div>
            )}
          </div>
        )}

        <hr className="my-8" />

        <MasonryGrid
            posts={userPosts}
            onPostClick={setSelectedPost}
            hasNextPage={false}
            onLoadMore={() => {}}
            loading={postsLoading}
            likePost={likePost}
            unlikePost={unlikePost}
            bookmarkPost={bookmarkPost}
            unbookmarkPost={unbookmarkPost}
            deletePost={() => {}}
        />

        <PostModal
          post={selectedPost}
          isOpen={!!selectedPost}
          onClose={() => setSelectedPost(null)}
          likePost={likePost}
          unlikePost={unlikePost}
        />
    </div>
  );
};

export default UserProfile; 