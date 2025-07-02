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
      inspirations: {
        Row: {
          id: string;
          source_post_id: string;
          inspired_post_id: string;
          creator_id: string;
          inspiration_type: 'direct' | 'style' | 'concept' | 'technique' | 'composition' | 'mood';
          inspiration_note: string | null;
          chain_level: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          source_post_id: string;
          inspired_post_id: string;
          creator_id: string;
          inspiration_type?: 'direct' | 'style' | 'concept' | 'technique' | 'composition' | 'mood';
          inspiration_note?: string | null;
          chain_level?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          source_post_id?: string;
          inspired_post_id?: string;
          creator_id?: string;
          inspiration_type?: 'direct' | 'style' | 'concept' | 'technique' | 'composition' | 'mood';
          inspiration_note?: string | null;
          chain_level?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      inspiration_stats: {
        Row: {
          id: string;
          post_id: string;
          views: number;
          likes: number;
          shares: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          views?: number;
          likes?: number;
          shares?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          views?: number;
          likes?: number;
          shares?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_activity_stats: {
        Row: {
          id: string;
          user_id: string;
          daily_post_score: number;
          engagement_score: number;
          community_contribution_score: number;
          login_consistency_score: number;
          overall_health_score: number;
          tier: 'active' | 'watch' | 'risk';
          tier_updated_at: string;
          total_posts: number;
          weekly_posts: number;
          monthly_posts: number;
          last_post_at: string | null;
          last_login_at: string | null;
          consecutive_active_days: number;
          warning_sent_at: string | null;
          risk_tier_start_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          daily_post_score?: number;
          engagement_score?: number;
          community_contribution_score?: number;
          login_consistency_score?: number;
          overall_health_score?: number;
          tier?: 'active' | 'watch' | 'risk';
          tier_updated_at?: string;
          total_posts?: number;
          weekly_posts?: number;
          monthly_posts?: number;
          last_post_at?: string | null;
          last_login_at?: string | null;
          consecutive_active_days?: number;
          warning_sent_at?: string | null;
          risk_tier_start_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          daily_post_score?: number;
          engagement_score?: number;
          community_contribution_score?: number;
          login_consistency_score?: number;
          overall_health_score?: number;
          tier?: 'active' | 'watch' | 'risk';
          tier_updated_at?: string;
          total_posts?: number;
          weekly_posts?: number;
          monthly_posts?: number;
          last_post_at?: string | null;
          last_login_at?: string | null;
          consecutive_active_days?: number;
          warning_sent_at?: string | null;
          risk_tier_start_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      daily_activity_logs: {
        Row: {
          id: string;
          user_id: string;
          activity_date: string;
          posts_count: number;
          likes_given: number;
          likes_received: number;
          comments_made: number;
          comments_received: number;
          profile_views: number;
          login_count: number;
          active_minutes: number;
          daily_score: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_date: string;
          posts_count?: number;
          likes_given?: number;
          likes_received?: number;
          comments_made?: number;
          comments_received?: number;
          profile_views?: number;
          login_count?: number;
          active_minutes?: number;
          daily_score?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          activity_date?: string;
          posts_count?: number;
          likes_given?: number;
          likes_received?: number;
          comments_made?: number;
          comments_received?: number;
          profile_views?: number;
          login_count?: number;
          active_minutes?: number;
          daily_score?: number;
          created_at?: string;
        };
      };
      user_rotation_logs: {
        Row: {
          id: string;
          user_id: string;
          action_type: 'tier_change' | 'warning_sent' | 'moved_to_waitlist' | 'reactivated';
          from_tier: string | null;
          to_tier: string | null;
          reason: string;
          score_at_action: number | null;
          is_automated: boolean;
          admin_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action_type: 'tier_change' | 'warning_sent' | 'moved_to_waitlist' | 'reactivated';
          from_tier?: string | null;
          to_tier?: string | null;
          reason: string;
          score_at_action?: number | null;
          is_automated?: boolean;
          admin_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action_type?: 'tier_change' | 'warning_sent' | 'moved_to_waitlist' | 'reactivated';
          from_tier?: string | null;
          to_tier?: string | null;
          reason?: string;
          score_at_action?: number | null;
          is_automated?: boolean;
          admin_id?: string | null;
          created_at?: string;
        };
      };
      waitlist_users: {
        Row: {
          id: string;
          user_id: string;
          reason_for_waitlist: string;
          score_when_moved: number | null;
          can_reapply_after: string;
          priority_score: number;
          reapplication_count: number;
          last_reapplication_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          reason_for_waitlist: string;
          score_when_moved?: number | null;
          can_reapply_after: string;
          priority_score?: number;
          reapplication_count?: number;
          last_reapplication_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          reason_for_waitlist?: string;
          score_when_moved?: number | null;
          can_reapply_after?: string;
          priority_score?: number;
          reapplication_count?: number;
          last_reapplication_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      community_management: {
        Row: {
          id: string;
          total_active_users: number;
          total_watch_users: number;
          total_risk_users: number;
          total_waitlist_users: number;
          max_active_users: number;
          target_active_ratio: number;
          target_watch_ratio: number;
          target_risk_ratio: number;
          last_evaluation_at: string | null;
          next_evaluation_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          total_active_users?: number;
          total_watch_users?: number;
          total_risk_users?: number;
          total_waitlist_users?: number;
          max_active_users?: number;
          target_active_ratio?: number;
          target_watch_ratio?: number;
          target_risk_ratio?: number;
          last_evaluation_at?: string | null;
          next_evaluation_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          total_active_users?: number;
          total_watch_users?: number;
          total_risk_users?: number;
          total_waitlist_users?: number;
          max_active_users?: number;
          target_active_ratio?: number;
          target_watch_ratio?: number;
          target_risk_ratio?: number;
          last_evaluation_at?: string | null;
          next_evaluation_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_points: {
        Row: {
          id: string;
          user_id: string;
          learning_points: number;
          influence_points: number;
          total_points: number;
          level: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          learning_points?: number;
          influence_points?: number;
          level?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          learning_points?: number;
          influence_points?: number;
          level?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      point_history: {
        Row: {
          id: string;
          user_id: string;
          point_type: 'learning' | 'influence';
          points: number;
          source_type: 'inspiration_given' | 'inspiration_received' | 'chain_bonus' | 'weekly_bonus';
          source_id: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          point_type: 'learning' | 'influence';
          points: number;
          source_type: 'inspiration_given' | 'inspiration_received' | 'chain_bonus' | 'weekly_bonus';
          source_id?: string | null;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          point_type?: 'learning' | 'influence';
          points?: number;
          source_type?: 'inspiration_given' | 'inspiration_received' | 'chain_bonus' | 'weekly_bonus';
          source_id?: string | null;
          description?: string | null;
          created_at?: string;
        };
      };
      badges: {
        Row: {
          id: string;
          name: string;
          display_name: string;
          description: string;
          icon: string;
          category: 'learner' | 'mentor' | 'special' | 'achievement';
          requirement_type: 'inspiration_count' | 'chain_level' | 'diversity' | 'weekly_activity' | 'total_points';
          requirement_value: number;
          rarity: 'common' | 'rare' | 'epic' | 'legendary';
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          display_name: string;
          description: string;
          icon?: string;
          category: 'learner' | 'mentor' | 'special' | 'achievement';
          requirement_type: 'inspiration_count' | 'chain_level' | 'diversity' | 'weekly_activity' | 'total_points';
          requirement_value: number;
          rarity?: 'common' | 'rare' | 'epic' | 'legendary';
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          display_name?: string;
          description?: string;
          icon?: string;
          category?: 'learner' | 'mentor' | 'special' | 'achievement';
          requirement_type?: 'inspiration_count' | 'chain_level' | 'diversity' | 'weekly_activity' | 'total_points';
          requirement_value?: number;
          rarity?: 'common' | 'rare' | 'epic' | 'legendary';
          created_at?: string;
        };
      };
      user_badges: {
        Row: {
          id: string;
          user_id: string;
          badge_id: string;
          earned_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          badge_id: string;
          earned_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          badge_id?: string;
          earned_at?: string;
        };
      };
      user_inspiration_stats: {
        Row: {
          id: string;
          user_id: string;
          inspiration_given_count: number;
          inspiration_received_count: number;
          max_chain_level: number;
          different_types_used: number;
          weekly_inspiration_count: number;
          monthly_inspiration_count: number;
          streak_days: number;
          last_inspiration_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          inspiration_given_count?: number;
          inspiration_received_count?: number;
          max_chain_level?: number;
          different_types_used?: number;
          weekly_inspiration_count?: number;
          monthly_inspiration_count?: number;
          streak_days?: number;
          last_inspiration_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          inspiration_given_count?: number;
          inspiration_received_count?: number;
          max_chain_level?: number;
          different_types_used?: number;
          weekly_inspiration_count?: number;
          monthly_inspiration_count?: number;
          streak_days?: number;
          last_inspiration_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      likes: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      bookmarks: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
    };
  };
}