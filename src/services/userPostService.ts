import { supabase } from '../supabase';
import { Post } from '../types';

/**
 * ユーザー投稿管理サービス
 * パーソナルダッシュボード用のデータ取得を担当
 */
export class UserPostService {
  
  /**
   * 指定ユーザーの全投稿を取得
   */
  async getUserPosts(userId: string): Promise<Post[]> {
    try {
      
      // Supabaseから投稿データを取得
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          tags:post_tags(
            tag:tags(*)
          )
        `)
        .eq('author_id', userId)
        .order('created_at', { ascending: false });

      if (postsError) {
        throw new Error(`投稿の取得に失敗しました: ${postsError.message}`);
      }

      if (!postsData) {
        return [];
      }


      // いいね数と写真スコアを取得
      const postIds = postsData.map(post => post.id);
      const [likesResult, photoScoresResult] = await Promise.all([
        supabase
          .from('likes')
          .select('post_id')
          .in('post_id', postIds),
        supabase
          .from('photo_scores')
          .select('*')
          .in('post_id', postIds)
      ]);
      
      const { data: likesData } = likesResult;
      const { data: photoScoresData } = photoScoresResult;

      // 投稿ごとのいいね数をカウント
      const likeCounts: Record<string, number> = {};
      likesData?.forEach(like => {
        likeCounts[like.post_id] = (likeCounts[like.post_id] || 0) + 1;
      });

      // 写真スコアをpost_idでマップ化
      const photoScoresMap = new Map();
      photoScoresData?.forEach(score => {
        photoScoresMap.set(score.post_id, score);
      });


      // ユーザー情報を取得（作成者情報として使用）
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, avatar_url')
        .eq('id', userId)
        .single();

      let userInfo = userData;
      if (userError) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .eq('id', userId)
          .single();
        userInfo = profileData;
      }

      // デフォルトユーザー情報
      const defaultUser = {
        id: userId,
        name: 'ユーザー',
        avatar: null
      };

      const author = userInfo ? {
        id: userInfo.id,
        name: userInfo.name || 'ユーザー',
        avatar: userInfo.avatar_url
      } : defaultUser;

      // 投稿データを適切な形式に変換
      const formattedPosts: Post[] = postsData.map(post => {
        const photoScore = photoScoresMap.get(post.id);
        
        return {
          id: post.id,
          title: post.title,
          userComment: post.description || '',
          imageUrl: post.image_url,
          createdAt: post.created_at,
          author: author,
          tags: this.formatTags(post.tags),
          likeCount: likeCounts[post.id] || 0,
          likedByCurrentUser: false, // ダッシュボードでは不要
          aiDescription: post.ai_description,
          aiComments: this.parseAIComments(post.ai_comments),
          photoScore: photoScore ? {
            technical_score: photoScore.technical_score,
            composition_score: photoScore.composition_score,
            creativity_score: photoScore.creativity_score,
            engagement_score: photoScore.engagement_score,
            total_score: photoScore.total_score,
            score_level: photoScore.score_level,
            level_description: photoScore.level_description,
            ai_comment: photoScore.ai_comment,
            image_analysis: photoScore.image_analysis
          } : undefined,
          // ダッシュボード用の追加情報
          location: post.location ? {
            latitude: post.location.latitude,
            longitude: post.location.longitude,
            address: post.location.address
          } : undefined
        };
      });

      return formattedPosts;
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * ユーザーの投稿統計を取得
   */
  async getUserStats(userId: string): Promise<{
    totalPosts: number;
    totalLikes: number;
    averageLikes: number;
    averagePhotoScore: number;
    highestPhotoScore: number;
    totalPhotoScores: number;
    firstPostDate: string | null;
    lastPostDate: string | null;
    mostUsedTags: string[];
    postingFrequency: {
      daily: number;
      weekly: number;
      monthly: number;
    };
  }> {
    try {

      // 基本統計を取得
      const { data: statsData, error: statsError } = await supabase
        .from('posts')
        .select('id, created_at')
        .eq('author_id', userId)
        .order('created_at', { ascending: true });

      if (statsError) {
        throw new Error(`統計情報の取得に失敗しました: ${statsError.message}`);
      }

      if (!statsData || statsData.length === 0) {
        return {
          totalPosts: 0,
          totalLikes: 0,
          averageLikes: 0,
          averagePhotoScore: 0,
          highestPhotoScore: 0,
          totalPhotoScores: 0,
          firstPostDate: null,
          lastPostDate: null,
          mostUsedTags: [],
          postingFrequency: { daily: 0, weekly: 0, monthly: 0 }
        };
      }

      const totalPosts = statsData.length;

      // いいね数を別途取得
      const { data: likesData, error: likesError } = await supabase
        .from('likes')
        .select('post_id')
        .in('post_id', statsData.map(post => post.id));

      if (likesError) {
      }

      const totalLikes = likesData?.length || 0;
      const averageLikes = totalPosts > 0 ? Math.round(totalLikes / totalPosts) : 0;

      // 写真スコア統計を取得
      let totalPhotoScores = 0;
      let averagePhotoScore = 0;
      let highestPhotoScore = 0;

      try {
        const { data: photoScoresData, error: photoScoresError } = await supabase
          .from('photo_scores')
          .select('total_score')
          .in('post_id', statsData.map(post => post.id));

        if (photoScoresError) {
          
          // テーブルが存在しない場合やアクセス権限がない場合は無視
          if (photoScoresError.code === 'PGRST116' || photoScoresError.code === '42P01' || photoScoresError.code === '406') {
          }
        } else if (photoScoresData && photoScoresData.length > 0) {
          totalPhotoScores = photoScoresData.length;
          averagePhotoScore = Math.round(photoScoresData.reduce((sum, score) => sum + score.total_score, 0) / totalPhotoScores);
          highestPhotoScore = Math.max(...photoScoresData.map(score => score.total_score));
          
        } else {
        }
      } catch (error) {
        // エラーがあってもアプリケーションを停止させない
      }

      const firstPostDate = statsData[0]?.created_at || null;
      const lastPostDate = statsData[statsData.length - 1]?.created_at || null;

      // 投稿頻度を計算
      const postingFrequency = this.calculatePostingFrequency(statsData.map(p => p.created_at));

      // 最もよく使われるタグを取得
      const mostUsedTags = await this.getMostUsedTags(userId);

      return {
        totalPosts,
        totalLikes,
        averageLikes,
        averagePhotoScore,
        highestPhotoScore,
        totalPhotoScores,
        firstPostDate,
        lastPostDate,
        mostUsedTags,
        postingFrequency
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * 投稿を月別にグループ化
   */
  groupPostsByMonth(posts: Post[]): Record<string, Post[]> {
    const grouped: Record<string, Post[]> = {};
    
    posts.forEach(post => {
      const date = new Date(post.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(post);
    });

    return grouped;
  }

  /**
   * 投稿の感情傾向を分析（簡易版）
   */
  analyzeEmotionalTrends(posts: Post[]): {
    positiveCount: number;
    neutralCount: number;
    energeticCount: number;
    calmCount: number;
  } {
    const trends = {
      positiveCount: 0,
      neutralCount: 0,
      energeticCount: 0,
      calmCount: 0
    };

    posts.forEach(post => {
      const text = (post.title + ' ' + post.userComment).toLowerCase();
      
      // 簡易的なキーワード分析
      const positiveWords = ['嬉しい', '楽しい', '素晴らしい', '最高', '感動', '幸せ', '美しい'];
      const energeticWords = ['興奮', 'エキサイト', '元気', 'パワー', '活動的', '刺激的'];
      const calmWords = ['静か', '落ち着く', 'リラックス', '平和', '穏やか', '癒し'];

      const hasPositive = positiveWords.some(word => text.includes(word));
      const hasEnergetic = energeticWords.some(word => text.includes(word));
      const hasCalm = calmWords.some(word => text.includes(word));

      if (hasPositive) trends.positiveCount++;
      if (hasEnergetic) trends.energeticCount++;
      if (hasCalm) trends.calmCount++;
      if (!hasPositive && !hasEnergetic && !hasCalm) trends.neutralCount++;
    });

    return trends;
  }

  /**
   * タグデータのフォーマット
   */
  private formatTags(tagsData: any[]): { id: string; name: string; color: string }[] {
    if (!tagsData || !Array.isArray(tagsData)) return [];
    
    return tagsData
      .filter(tagRelation => tagRelation.tag)
      .map(tagRelation => ({
        id: tagRelation.tag.id,
        name: tagRelation.tag.name,
        color: tagRelation.tag.color || '#6B7280'
      }));
  }

  /**
   * AIコメントのパース
   */
  private parseAIComments(aiCommentsData: any): any[] {
    if (!aiCommentsData) return [];
    
    try {
      if (typeof aiCommentsData === 'string') {
        return JSON.parse(aiCommentsData);
      }
      if (Array.isArray(aiCommentsData)) {
        return aiCommentsData;
      }
    } catch (error) {
    }
    
    return [];
  }

  /**
   * 投稿頻度の計算
   */
  private calculatePostingFrequency(dates: string[]): {
    daily: number;
    weekly: number;
    monthly: number;
  } {
    if (dates.length < 2) {
      return { daily: 0, weekly: 0, monthly: 0 };
    }

    const firstDate = new Date(dates[0]);
    const lastDate = new Date(dates[dates.length - 1]);
    const totalDays = Math.max(1, Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    const totalPosts = dates.length;
    const daily = Number((totalPosts / totalDays).toFixed(2));
    const weekly = Number((daily * 7).toFixed(1));
    const monthly = Number((daily * 30).toFixed(1));

    return { daily, weekly, monthly };
  }

  /**
   * 最もよく使われるタグを取得
   */
  private async getMostUsedTags(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('post_tags')
        .select(`
          tag:tags(name),
          post:posts!inner(author_id)
        `)
        .eq('post.author_id', userId);

      if (error || !data) {
        return [];
      }

      // タグの使用回数をカウント
      const tagCounts: Record<string, number> = {};
      data.forEach(item => {
        if (item.tag?.name) {
          tagCounts[item.tag.name] = (tagCounts[item.tag.name] || 0) + 1;
        }
      });

      // 使用回数順にソートして上位5つを返す
      return Object.entries(tagCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([tagName]) => tagName);

    } catch (error) {
      return [];
    }
  }

  /**
   * 投稿の時間帯分析
   */
  analyzePostingTimes(posts: Post[]): {
    hourlyDistribution: number[];
    mostActiveHour: number;
    dayOfWeekDistribution: number[];
    mostActiveDay: number;
  } {
    const hourlyDistribution = new Array(24).fill(0);
    const dayOfWeekDistribution = new Array(7).fill(0);

    posts.forEach(post => {
      const date = new Date(post.createdAt);
      const hour = date.getHours();
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      hourlyDistribution[hour]++;
      dayOfWeekDistribution[dayOfWeek]++;
    });

    const mostActiveHour = hourlyDistribution.indexOf(Math.max(...hourlyDistribution));
    const mostActiveDay = dayOfWeekDistribution.indexOf(Math.max(...dayOfWeekDistribution));

    return {
      hourlyDistribution,
      mostActiveHour,
      dayOfWeekDistribution,
      mostActiveDay
    };
  }

  /**
   * 投稿の多様性スコア計算
   */
  calculateDiversityScore(posts: Post[]): {
    locationDiversity: number;
    tagDiversity: number;
    timeDiversity: number;
    overallDiversity: number;
  } {
    if (posts.length === 0) {
      return { locationDiversity: 0, tagDiversity: 0, timeDiversity: 0, overallDiversity: 0 };
    }

    // タグの多様性
    const uniqueTags = new Set();
    posts.forEach(post => {
      post.tags.forEach(tag => uniqueTags.add(tag.name));
    });
    const tagDiversity = Math.min(100, (uniqueTags.size / posts.length) * 100);

    // 時間の多様性（異なる時間帯への投稿）
    const uniqueHours = new Set();
    posts.forEach(post => {
      const hour = new Date(post.createdAt).getHours();
      uniqueHours.add(hour);
    });
    const timeDiversity = Math.min(100, (uniqueHours.size / 24) * 100);

    // 位置の多様性（将来的に実装）
    const locationDiversity = 50; // プレースホルダー

    const overallDiversity = Math.round((locationDiversity + tagDiversity + timeDiversity) / 3);

    return {
      locationDiversity: Math.round(locationDiversity),
      tagDiversity: Math.round(tagDiversity),
      timeDiversity: Math.round(timeDiversity),
      overallDiversity
    };
  }
}