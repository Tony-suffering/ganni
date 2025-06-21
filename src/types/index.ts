export interface Post {
  id: string;
  title: string;
  imageUrl: string;
  userComment: string;
  aiDescription: string;
  imageAIDescription: string;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  aiComments: AIComment[];
  likeCount: number;
  likedByCurrentUser: boolean;
  bookmarkedByCurrentUser: boolean;
}

export interface AIComment {
  id: string;
  type: string;
  content: string;
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  category: string;
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
  role: 'user' | 'admin';
}

export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
    avatar_url?: string;
  };
}

// Supabase Database Types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          title: string;
          image_url: string;
          user_comment: string;
          ai_description: string;
          created_at: string;
          updated_at: string;
          author_id: string;
        };
        Insert: {
          id?: string;
          title: string;
          image_url: string;
          user_comment: string;
          ai_description: string;
          created_at?: string;
          updated_at?: string;
          author_id: string;
        };
        Update: {
          id?: string;
          title?: string;
          image_url?: string;
          user_comment?: string;
          ai_description?: string;
          created_at?: string;
          updated_at?: string;
          author_id?: string;
        };
      };
      tags: {
        Row: {
          id: string;
          name: string;
          category: string;
          color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: string;
          color: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      post_tags: {
        Row: {
          id: string;
          post_id: string;
          tag_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          tag_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          tag_id?: string;
          created_at?: string;
        };
      };
      ai_comments: {
        Row: {
          id: string;
          post_id: string;
          type: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          type: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          type?: string;
          content?: string;
          created_at?: string;
        };
      };
    };
  };
}