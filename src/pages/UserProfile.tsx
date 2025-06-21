import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePosts } from '../hooks/usePosts';
import { MasonryGrid } from '../components/MasonryGrid';
import { Post, User } from '../types';
import { supabase } from '../supabase';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const { posts, loading: postsLoading, likePost, unlikePost } = usePosts();
  const [profileUser, setProfileUser] = useState<Partial<User> | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  
  const isMyProfile = currentUser?.id === userId;

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) return;
      setLoadingProfile(true);
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
    <div className="max-w-4xl mx-auto px-4 py-8">
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
                <p className="text-neutral-500">{userPosts.length} posts</p>
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

        <hr className="my-8" />

        <MasonryGrid
            posts={userPosts}
            onPostClick={() => { /* Modal logic is in App.tsx */ }}
            hasNextPage={false}
            onLoadMore={() => {}}
            loading={postsLoading}
            likePost={likePost}
            unlikePost={unlikePost}
        />
    </div>
  );
};

export default UserProfile; 