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
      comments: {
        Row: {
          id: string;
          content: string;
          user_id: string;
          post_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          content: string;
          user_id: string;
          post_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          content?: string;
          user_id?: string;
          post_id?: string;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          recipient_id: string;
          sender_id: string;
          post_id: string;
          type: 'like' | 'comment';
          content?: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipient_id: string;
          sender_id: string;
          post_id: string;
          type: 'like' | 'comment';
          content?: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          recipient_id?: string;
          sender_id?: string;
          post_id?: string;
          type?: 'like' | 'comment';
          content?: string;
          is_read?: boolean;
          created_at?: string;
        };
      };
      highlight_posts: {
        Row: {
          id: string;
          post_id: string;
          highlight_score: number;
          highlight_reason: string;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          highlight_score: number;
          highlight_reason: string;
          display_order: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          highlight_score?: number;
          highlight_reason?: string;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      photo_scores: {
        Row: {
          id: string;
          post_id: string;
          technical_score: number;
          composition_score: number;
          creativity_score: number;
          engagement_score: number;
          total_score: number;
          score_level: string;
          level_description: string;
          ai_comment: string;
          image_analysis?: any; // JSON column for detailed image analysis
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          technical_score: number;
          composition_score: number;
          creativity_score: number;
          engagement_score: number;
          total_score: number;
          score_level: string;
          level_description: string;
          ai_comment: string;
          image_analysis?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          technical_score?: number;
          composition_score?: number;
          creativity_score?: number;
          engagement_score?: number;
          total_score?: number;
          score_level?: string;
          level_description?: string;
          ai_comment?: string;
          image_analysis?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}