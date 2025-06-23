import { Post } from '../types';
import { supabase } from '../supabase';

export interface HighlightPost extends Post {
  highlightScore: number;
  highlightReason: string;
}

interface HighlightCriteria {
  likeThreshold: number;
  commentThreshold: number;
  recentDaysWeight: number;
  diversityWeight: number;
  qualityWeight: number;
}

export class HighlightService {
  private static readonly DEFAULT_CRITERIA: HighlightCriteria = {
    likeThreshold: 2, // より低いハードルで選択
    commentThreshold: 1,
    recentDaysWeight: 0.4, // 新しさを重視
    diversityWeight: 0.2,
    qualityWeight: 0.4
  };

  private static readonly MAX_HIGHLIGHTS = 1;

  /**
   * AIによる投稿のハイライト選択
   * エンゲージメント、時間、多様性、品質を総合的に評価
   * リロードするたびに異なる投稿を選択
   */
  static async selectHighlightPosts(posts: Post[]): Promise<HighlightPost[]> {
    if (posts.length === 0) return [];

    console.log('🎯 ハイライト選択開始:', {
      総投稿数: posts.length,
      タイムスタンプ: new Date().toISOString()
    });

    // 重複除去: IDでユニークな投稿のみを処理
    const uniquePosts = posts.filter((post, index, arr) => 
      arr.findIndex(p => p.id === post.id) === index
    );

    console.log('📊 重複除去後:', {
      ユニーク投稿数: uniquePosts.length,
      投稿タイトル: uniquePosts.map(p => p.title.slice(0, 20) + '...')
    });

    const scoredPosts = uniquePosts.map(post => {
      const score = this.calculateHighlightScore(post, uniquePosts);
      const reason = this.generateHighlightReason(post);
      
      console.log(`📈 投稿スコア計算: "${post.title.slice(0, 30)}..." = ${score} (${reason})`);
      
      return {
        ...post,
        highlightScore: score,
        highlightReason: reason
      };
    });

    // スコア順でソートして上位20%を取得（多様性のため）
    const sortedPosts = scoredPosts.sort((a, b) => b.highlightScore - a.highlightScore);
    const candidateCount = Math.max(3, Math.ceil(scoredPosts.length * 0.2));
    const topCandidates = sortedPosts.slice(0, candidateCount);
    
    console.log('🏆 上位候補選択:', {
      全投稿数: scoredPosts.length,
      候補数: candidateCount,
      上位候補: topCandidates.map(p => ({
        タイトル: p.title.slice(0, 25) + '...',
        スコア: p.highlightScore,
        理由: p.highlightReason
      }))
    });

    // 上位候補からランダムに選択（リロードするたびに変わる）
    // より強いランダム性を確保 - 複数の要素を組み合わせてシードを生成
    const currentTime = Date.now();
    const randomFactor = Math.random() * 10000;
    const postIdsHash = topCandidates.map(p => p.id).join('').length;
    const complexSeed = currentTime + randomFactor + postIdsHash;
    
    // より確実にランダムな選択を行う
    let randomValue = Math.abs(Math.sin(complexSeed) + Math.cos(complexSeed * 1.3) + Math.tan(complexSeed * 0.7));
    randomValue = randomValue - Math.floor(randomValue); // 0-1の小数部分を取得
    const randomIndex = Math.floor(randomValue * topCandidates.length);
    
    console.log('🎲 ランダム選択デバッグ:', {
      候補数: topCandidates.length,
      選択インデックス: randomIndex,
      選択された投稿: topCandidates[randomIndex]?.title,
      ランダム値: randomValue,
      シード: complexSeed
    });
    
    const selectedPost = topCandidates[randomIndex];

    if (!selectedPost) return [];

    // 多様性を確保するため、同じユーザーからの投稿が連続しないよう調整
    const highlights = [selectedPost];
    const diversified = this.ensureDiversity(highlights);

    // 最終的な重複チェック
    return diversified.filter((post, index, arr) => 
      arr.findIndex(p => p.id === post.id) === index
    );
  }

  /**
   * 投稿のハイライトスコアを計算（写真採点スコアベース）
   */
  private static calculateHighlightScore(post: Post, allPosts: Post[]): number {
    // デバッグログを追加
    console.log(`📊 "${post.title.slice(0, 30)}..." のスコア計算:`, {
      photoScore: post.photoScore,
      photoScore_total: post.photoScore?.total_score,
      photo_scores: post.photo_scores
    });
    
    // 写真採点スコアが存在する場合は最優先
    if (post.photoScore && post.photoScore.total_score) {
      const photoScore = post.photoScore.total_score / 100; // 0-1に正規化
      
      // 写真スコアを80%、エンゲージメントを20%で重み付け
      const engagementScore = this.calculateEngagementScore(post, allPosts);
      let finalScore = (photoScore * 0.8) + (engagementScore * 0.2);
      
      // 少しのランダム要素を追加してバリエーションを作る
      const randomVariation = (Math.random() - 0.5) * 0.05; // ±2.5%の変動
      finalScore += randomVariation;
      
      console.log(`✅ AI写真採点使用: ${post.photoScore.total_score}pt → ${finalScore}`);
      return Math.max(0, Math.min(1, Math.round(finalScore * 100) / 100));
    }
    
    // 写真採点スコアがない場合は従来通り
    const criteria = this.DEFAULT_CRITERIA;
    const engagementScore = this.calculateEngagementScore(post, allPosts);
    const recencyScore = this.calculateRecencyScore(post);
    const qualityScore = this.calculateQualityScore(post);
    
    let totalScore = 
      (engagementScore * (1 - criteria.recentDaysWeight - criteria.qualityWeight)) +
      (recencyScore * criteria.recentDaysWeight) +
      (qualityScore * criteria.qualityWeight);

    // 少しのランダム要素を追加してバリエーションを作る
    const randomVariation = (Math.random() - 0.5) * 0.1; // ±5%の変動
    totalScore += randomVariation;

    return Math.max(0, Math.min(1, Math.round(totalScore * 100) / 100));
  }

  /**
   * エンゲージメントスコアを計算
   */
  private static calculateEngagementScore(post: Post, allPosts: Post[]): number {
    const maxLikes = Math.max(...allPosts.map(p => p.likeCount || 0));
    const maxComments = Math.max(...allPosts.map(p => p.commentCount || 0));
    
    const likeScore = maxLikes > 0 ? (post.likeCount || 0) / maxLikes : 0;
    const commentScore = maxComments > 0 ? (post.commentCount || 0) / maxComments : 0;
    
    // いいねとコメントの重み付け平均
    return (likeScore * 0.7) + (commentScore * 0.3);
  }

  /**
   * 時間的新しさスコアを計算
   */
  private static calculateRecencyScore(post: Post): number {
    const now = new Date().getTime();
    const postTime = new Date(post.createdAt).getTime();
    const daysDiff = (now - postTime) / (1000 * 60 * 60 * 24);
    
    // 7日以内は高スコア、それ以降は急降下
    if (daysDiff <= 1) return 1.0;
    if (daysDiff <= 3) return 0.8;
    if (daysDiff <= 7) return 0.6;
    if (daysDiff <= 14) return 0.3;
    return 0.1;
  }

  /**
   * 品質スコアを計算（AIコメントの存在、説明の長さ等）
   */
  private static calculateQualityScore(post: Post): number {
    let score = 0.5; // ベーススコア
    
    // AIコメントの存在（多様性と深さの指標）
    if (post.aiComments && post.aiComments.length > 0) {
      score += 0.2;
      
      // 複数のAIコメントタイプがある場合はさらに加点
      const commentTypes = new Set(post.aiComments.map(c => c.type));
      if (commentTypes.size > 1) score += 0.1;
    }
    
    // 説明文の充実度
    const descriptionLength = (post.aiDescription || '').length + (post.userComment || '').length;
    if (descriptionLength > 100) score += 0.1;
    if (descriptionLength > 300) score += 0.1;
    
    // タグの多様性
    if (post.tags && post.tags.length > 0) {
      score += Math.min(post.tags.length * 0.05, 0.2);
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * ハイライト理由を生成（写真採点スコアベース）
   */
  private static generateHighlightReason(post: Post): string {
    // 写真採点スコアが存在する場合
    if (post.photoScore && post.photoScore.total_score) {
      const score = post.photoScore.total_score;
      const level = post.photoScore.score_level;
      
      if (score >= 90) return `傑作 ${level}級`;
      if (score >= 80) return `優秀 ${level}級`;
      if (score >= 70) return `良作 ${level}級`;
      return `AI評価 ${level}級`;
    }
    
    // 従来の理由生成
    const daysSincePost = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    const likeCount = post.likeCount || 0;
    const commentCount = post.commentCount || 0;
    
    if (daysSincePost <= 1) return '新着';
    if (likeCount >= 5) return '人気';
    if (commentCount >= 3) return '話題';
    if (post.aiComments && post.aiComments.length > 1) return 'AI注目';
    if (likeCount >= this.DEFAULT_CRITERIA.likeThreshold) return '注目';
    if (daysSincePost <= 7) return '今週';
    return 'おすすめ';
  }

  /**
   * 多様性を確保（同じユーザーの投稿が連続しないよう調整）
   */
  private static ensureDiversity(highlights: HighlightPost[]): HighlightPost[] {
    const diversified: HighlightPost[] = [];
    const usedAuthors = new Set<string>();
    const usedPostIds = new Set<string>();
    
    // 第一パス：異なる作者の投稿を優先（重複投稿も除外）
    for (const post of highlights) {
      if (!usedAuthors.has(post.author.id) && !usedPostIds.has(post.id)) {
        diversified.push(post);
        usedAuthors.add(post.author.id);
        usedPostIds.add(post.id);
      }
    }
    
    // 第二パス：残り枠を埋める（重複投稿を避ける）
    for (const post of highlights) {
      if (diversified.length >= this.MAX_HIGHLIGHTS) break;
      if (!usedPostIds.has(post.id)) {
        diversified.push(post);
        usedPostIds.add(post.id);
      }
    }
    
    return diversified.slice(0, this.MAX_HIGHLIGHTS);
  }

  /**
   * ハイライト投稿をSupabaseに保存
   */
  static async saveHighlights(highlights: HighlightPost[]): Promise<void> {
    try {
      // テーブル存在確認
      const { error: checkError } = await supabase
        .from('highlight_posts')
        .select('id')
        .limit(1);
      
      // テーブルが存在しない場合はスキップ
      if (checkError && checkError.message.includes('relation "public.highlight_posts" does not exist')) {
        console.warn('highlight_postsテーブルが存在しません。マイグレーションを実行してください。');
        return;
      }
      
      // 既存のハイライトを削除（全削除）
      await supabase.from('highlight_posts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 新しいハイライトを保存
      const highlightData = highlights.map((post, index) => ({
        post_id: post.id,
        highlight_score: post.highlightScore,
        highlight_reason: post.highlightReason,
        display_order: index + 1,
        created_at: new Date().toISOString()
      }));
      
      const { error } = await supabase
        .from('highlight_posts')
        .insert(highlightData);
      
      if (error) {
        console.error('ハイライト保存エラー:', error);
        // 401エラー（認証エラー）の場合は通知のみで例外を投げない
        if (error.message?.includes('Unauthorized') || error.message?.includes('401')) {
          console.warn('認証が必要なため、ハイライト保存をスキップします');
          return;
        }
        throw error;
      }
    } catch (error) {
      console.error('ハイライト保存に失敗:', error);
      // テーブルが存在しない場合はエラーを投げない
      if (error instanceof Error && error.message.includes('relation "public.highlight_posts" does not exist')) {
        console.warn('highlight_postsテーブルが存在しないため、ハイライトの永続化をスキップします。');
        return;
      }
      throw error;
    }
  }

  /**
   * 保存されたハイライト投稿を取得
   */
  static async getStoredHighlights(): Promise<HighlightPost[]> {
    try {
      const { data, error } = await supabase
        .from('highlight_posts')
        .select(`
          post_id,
          highlight_score,
          highlight_reason,
          display_order,
          posts (
            *,
            profiles:author_id (id, name, avatar_url),
            post_tags ( tags ( id, name, category, color ) ),
            ai_comments ( id, type, content, created_at )
          )
        `)
        .order('display_order', { ascending: true });

      // テーブルが存在しない場合は空配列を返す
      if (error && error.message.includes('relation "public.highlight_posts" does not exist')) {
        console.warn('highlight_postsテーブルが存在しません。空の配列を返します。');
        return [];
      }

      if (error) throw error;
      if (!data) return [];

      // データを整形
      const highlights: HighlightPost[] = data
        .filter(item => item.posts) // postsが存在する場合のみ
        .map(item => {
          const post = item.posts as Record<string, unknown>;
          const postTags = post.post_tags as Array<{ tags: Record<string, unknown> }> || [];
          const aiCommentsData = post.ai_comments as Array<Record<string, unknown>> || [];
          const profileData = post.profiles as Record<string, unknown> || {};
          
          return {
            id: post.id as string,
            title: post.title as string,
            imageUrl: post.image_url as string,
            userComment: post.user_comment as string,
            aiDescription: post.ai_description as string,
            imageAIDescription: '',
            tags: postTags.map(pt => pt.tags),
            createdAt: post.created_at as string,
            updatedAt: post.updated_at as string,
            author: {
              id: profileData.id as string || '',
              name: profileData.name as string || '',
              avatar: profileData.avatar_url as string || ''
            },
            aiComments: aiCommentsData.map(comment => ({
              id: comment.id as string,
              type: comment.type as string,
              content: comment.content as string,
              createdAt: comment.created_at as string
            })),
            likeCount: 0, // 別途取得が必要
            likedByCurrentUser: false,
            bookmarkedByCurrentUser: false,
            commentCount: 0, // 別途取得が必要
            highlightScore: item.highlight_score,
            highlightReason: item.highlight_reason
          };
        });

      return highlights;
    } catch (error) {
      console.error('ハイライト取得に失敗:', error);
      // テーブルが存在しない場合は空配列を返す
      if (error instanceof Error && error.message.includes('relation "public.highlight_posts" does not exist')) {
        return [];
      }
      return [];
    }
  }

  /**
   * 保存されたハイライトをクリア
   */
  static async clearStoredHighlights(): Promise<void> {
    try {
      // テーブル存在確認
      const { error: checkError } = await supabase
        .from('highlight_posts')
        .select('id')
        .limit(1);
      
      // テーブルが存在しない場合はスキップ
      if (checkError && checkError.message.includes('relation "public.highlight_posts" does not exist')) {
        console.warn('highlight_postsテーブルが存在しません。クリアをスキップします。');
        return;
      }
      
      // 既存のハイライトを全削除
      const { error } = await supabase
        .from('highlight_posts')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (error) {
        console.error('ハイライトクリアエラー:', error);
        // 401エラー（認証エラー）の場合は通知のみで例外を投げない
        if (error.message?.includes('Unauthorized') || error.message?.includes('401')) {
          console.warn('認証が必要なため、ハイライトクリアをスキップします');
          return;
        }
        throw error;
      }
      
      console.log('✅ 保存されたハイライトをクリアしました');
    } catch (error) {
      console.error('ハイライトクリアに失敗:', error);
      // テーブルが存在しない場合はエラーを投げない
      if (error instanceof Error && error.message.includes('relation "public.highlight_posts" does not exist')) {
        console.warn('highlight_postsテーブルが存在しないため、ハイライトクリアをスキップします。');
        return;
      }
      throw error;
    }
  }

  /**
   * 定期的なハイライト更新（バックグラウンド実行用）
   */
  static async updateHighlights(allPosts: Post[]): Promise<void> {
    try {
      console.log('ハイライト投稿を更新中...');
      await this.clearStoredHighlights();
      const highlights = await this.selectHighlightPosts(allPosts);
      await this.saveHighlights(highlights);
      console.log(`${highlights.length}件のハイライト投稿を更新しました`);
    } catch (error) {
      console.error('ハイライト更新に失敗:', error);
    }
  }
}