import { useState, useEffect, useCallback } from 'react';
import { Post, FilterOptions } from '../types';
import { mockPosts } from '../data/mockData';

export const usePosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);

  const POSTS_PER_PAGE = 6;

  // Initialize with mock data
  useEffect(() => {
    setTimeout(() => {
      setPosts(mockPosts);
      setFilteredPosts(mockPosts.slice(0, POSTS_PER_PAGE));
      setLoading(false);
    }, 1000);
  }, []);

  const loadMore = useCallback(() => {
    if (!hasNextPage || loading) return;

    const startIndex = page * POSTS_PER_PAGE;
    const endIndex = startIndex + POSTS_PER_PAGE;
    const newPosts = posts.slice(startIndex, endIndex);

    if (newPosts.length > 0) {
      setFilteredPosts(prev => [...prev, ...newPosts]);
      setPage(prev => prev + 1);
    }

    if (endIndex >= posts.length) {
      setHasNextPage(false);
    }
  }, [page, posts, hasNextPage, loading]);

  const addPost = useCallback((newPost: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>) => {
    const post: Post = {
      ...newPost,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setPosts(prev => [post, ...prev]);
    setFilteredPosts(prev => [post, ...prev]);
  }, []);

  const filterPosts = useCallback((filters: FilterOptions, searchQuery: string) => {
    let filtered = [...posts];

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(query) ||
        post.userComment.toLowerCase().includes(query) ||
        post.aiDescription.toLowerCase().includes(query) ||
        post.tags.some(tag => tag.name.toLowerCase().includes(query))
      );
    }

    // Tag filters
    if (filters.tags.length > 0) {
      filtered = filtered.filter(post =>
        post.tags.some(tag => filters.tags.includes(tag.id))
      );
    }

    // Sort
    switch (filters.sortBy) {
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'popular':
        // Sort by number of AI comments
        filtered.sort((a, b) => (b.aiComments?.length || 0) - (a.aiComments?.length || 0));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    setFilteredPosts(filtered.slice(0, POSTS_PER_PAGE));
    setPage(1);
    setHasNextPage(filtered.length > POSTS_PER_PAGE);
  }, [posts]);

  return {
    posts: filteredPosts,
    loading,
    hasNextPage,
    loadMore,
    addPost,
    filterPosts,
  };
};