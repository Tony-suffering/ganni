export interface Post {
  id: string;
  title: string;
  imageUrl: string;
  aiDescription: string;
  userComment: string;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
  author: {
    name: string;
    avatar: string;
  };
  aiComments?: AIComment[];
}

export interface AIComment {
  id: string;
  type: 'comment' | 'question' | 'observation';
  content: string;
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  category: 'terminal' | 'aircraft' | 'people' | 'atmosphere' | 'architecture';
  color: string;
}

export interface FilterOptions {
  tags: string[];
  sortBy: 'newest' | 'oldest' | 'popular';
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  bio?: string;
  role: 'admin' | 'editor' | 'user';
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
    avatar_url?: string;
  };
}