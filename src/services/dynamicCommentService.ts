import { GoogleGenerativeAI } from '@google/generative-ai';
import { DeepPersonalityProfile } from './personalityInsightService';
import { Post } from '../types';
import { PhotoScoreV2 } from '../types/photoScoreV2';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export interface CommentStyle {
  tone: 'warm' | 'analytical' | 'poetic' | 'encouraging' | 'philosophical';
  length: 'short' | 'medium' | 'long';
  focus: 'technical' | 'emotional' | 'creative' | 'growth' | 'storytelling';
  personality: 'friend' | 'mentor' | 'peer' | 'admirer' | 'philosopher';
}

export interface DynamicComment {
  main: string;
  insight: string;
  suggestion?: string;
  hiddenMessage?: string;
}

export class DynamicCommentService {
  private model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  
  // コメントスタイルをランダムに選択して多様性を確保
  private selectCommentStyle(): CommentStyle {
    const tones: CommentStyle['tone'][] = ['warm', 'analytical', 'poetic', 'encouraging', 'philosophical'];
    const focuses: CommentStyle['focus'][] = ['technical', 'emotional', 'creative', 'growth', 'storytelling'];
    const personalities: CommentStyle['personality'][] = ['friend', 'mentor', 'peer', 'admirer', 'philosopher'];
    
    return {
      tone: tones[Math.floor(Math.random() * tones.length)],
      length: Math.random() > 0.7 ? 'long' : Math.random() > 0.3 ? 'medium' : 'short',
      focus: focuses[Math.floor(Math.random() * focuses.length)],
      personality: personalities[Math.floor(Math.random() * personalities.length)]
    };
  }

  async generatePersonalizedComment(
    profile: DeepPersonalityProfile,
    post: Post,
    photoScore: PhotoScoreV2,
    recentPosts: Post[],
    allScores: Record<string, PhotoScoreV2>
  ): Promise<DynamicComment> {
    const style = this.selectCommentStyle();
    const context = this.buildContext(profile, post, photoScore, recentPosts, allScores);
    
    const prompt = `
あなたは共感力豊かな${this.getPersonalityDescription(style.personality)}として、
投稿者の気持ちや体験に寄り添い、温かいコメントを生成します。

**投稿情報:**
- タイトル: "${post.title}"
- 投稿者の感想: "${post.userComment}"

**写真から読み取れる情報:**
- 主要被写体: ${context.currentFeatures.mainSubject || '不明'}
- 雰囲気: ${context.currentFeatures.mood || '不明'}
- 感情的な印象: ${context.currentFeatures.emotionalTrigger || '不明'}

**コメントスタイル:**
- トーン: ${this.getToneDescription(style.tone)}
- フォーカス: ${this.getFocusDescription(style.focus)}

**コメント生成ルール:**
1. 投稿者のタイトルと感想を最も重視する
2. 投稿者の気持ちや体験に共感を示す
3. 写真から感じられる雰囲気や感情を汲み取る
4. 投稿者の表現力や想いを認める
5. 技術指導ではなく、気持ちへの理解を示す
6. その瞬間の体験や感動を大切にする
7. 投稿者の視点や感性を肯定的に受け止める
8. 絵文字は使用しない
9. 「エモい」「やばい」などのスラングは使わない
10. 自然で落ち着いた日本語で表現する

以下のJSON形式で生成してください：
{
  "main": "タイトルと感想に共感し、写真から感じられる雰囲気を踏まえた温かいコメント（絵文字なし）",
  "insight": "投稿者の表現や感想から読み取れる気持ちや体験への理解",
  "suggestion": "写真や感想から感じる素敵な部分への言及（技術指導ではない）",
  "hiddenMessage": "投稿者の感性や表現力を讃えるメッセージ"
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Failed to parse comment');
    } catch (error) {
      console.error('Dynamic comment generation error:', error);
      return this.generateFallbackDynamicComment(profile, post, style);
    }
  }

  private buildContext(
    profile: DeepPersonalityProfile,
    currentPost: Post,
    currentScore: PhotoScoreV2,
    recentPosts: Post[],
    allScores: Record<string, PhotoScoreV2>
  ) {
    // 最近の投稿から傾向を分析
    const recentTrends = this.analyzeRecentTrends(recentPosts, allScores);
    
    // 現在の投稿の特徴
    const currentFeatures = {
      title: currentPost.title,
      mood: currentScore.imageAnalysis?.moodAtmosphere,
      emotionalTrigger: currentScore.imageAnalysis?.emotionalTrigger,
      mainSubject: currentScore.imageAnalysis?.mainSubject,
      technicalSignature: currentScore.imageAnalysis?.technicalSignature,
      colorTemperature: currentScore.imageAnalysis?.colorTemperature,
      compositionType: currentScore.imageAnalysis?.compositionType,
      scores: {
        technical: currentScore.technical_score,
        creativity: currentScore.creativity_score,
        composition: currentScore.composition_score,
        engagement: currentScore.engagement_score
      }
    };
    
    // 過去との比較
    const comparison = this.compareWithPast(currentScore, recentPosts, allScores);
    
    return {
      currentFeatures,
      recentTrends,
      comparison,
      personalityRelevance: this.findPersonalityConnections(profile, currentFeatures)
    };
  }

  private analyzeRecentTrends(
    recentPosts: Post[],
    allScores: Record<string, PhotoScoreV2>
  ) {
    const trends = {
      dominantMoods: new Map<string, number>(),
      technicalProgress: [],
      creativeThemes: new Set<string>(),
      timePatterns: {
        morning: 0,
        afternoon: 0,
        evening: 0,
        night: 0
      }
    };
    
    recentPosts.slice(-10).forEach(post => {
      const score = allScores[post.id];
      if (!score?.imageAnalysis) return;
      
      // Mood trends
      const mood = score.imageAnalysis.moodAtmosphere;
      trends.dominantMoods.set(mood, (trends.dominantMoods.get(mood) || 0) + 1);
      
      // Technical progress
      trends.technicalProgress.push({
        date: post.created_at,
        technical: score.technical_score,
        creativity: score.creativity_score
      });
      
      // Creative themes
      const subjects = score.imageAnalysis.mainSubject.split(/[、。]/);
      subjects.forEach(subject => {
        if (subject.length > 2) trends.creativeThemes.add(subject);
      });
      
      // Time patterns
      const hour = new Date(post.created_at).getHours();
      if (hour >= 5 && hour < 12) trends.timePatterns.morning++;
      else if (hour >= 12 && hour < 17) trends.timePatterns.afternoon++;
      else if (hour >= 17 && hour < 21) trends.timePatterns.evening++;
      else trends.timePatterns.night++;
    });
    
    return {
      topMoods: Array.from(trends.dominantMoods.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([mood, count]) => ({ mood, frequency: count })),
      averageTechnical: trends.technicalProgress.reduce((sum, p) => sum + p.technical, 0) / trends.technicalProgress.length,
      averageCreativity: trends.technicalProgress.reduce((sum, p) => sum + p.creativity, 0) / trends.technicalProgress.length,
      uniqueThemes: Array.from(trends.creativeThemes),
      preferredTime: Object.entries(trends.timePatterns)
        .sort(([,a], [,b]) => b - a)[0][0]
    };
  }

  private compareWithPast(
    currentScore: PhotoScoreV2,
    recentPosts: Post[],
    allScores: Record<string, PhotoScoreV2>
  ) {
    const recentScores = recentPosts
      .slice(-5)
      .map(p => allScores[p.id])
      .filter(Boolean);
    
    if (recentScores.length === 0) {
      return { isBreakthrough: false, changes: [] };
    }
    
    const avgTechnical = recentScores.reduce((sum, s) => sum + (s.technical_score || 0), 0) / recentScores.length;
    const avgCreativity = recentScores.reduce((sum, s) => sum + (s.creativity_score || 0), 0) / recentScores.length;
    
    const changes = [];
    
    if (currentScore.technical_score > avgTechnical + 10) {
      changes.push('技術的な大きな飛躍');
    }
    if (currentScore.creativity_score > avgCreativity + 10) {
      changes.push('創造性の新境地');
    }
    if (currentScore.imageAnalysis?.moodAtmosphere !== recentScores[0]?.imageAnalysis?.moodAtmosphere) {
      changes.push('新しい感情表現の探求');
    }
    
    return {
      isBreakthrough: changes.length > 0,
      changes,
      technicalDelta: currentScore.technical_score - avgTechnical,
      creativityDelta: currentScore.creativity_score - avgCreativity
    };
  }

  private findPersonalityConnections(
    profile: DeepPersonalityProfile,
    features: any
  ): string[] {
    const connections = [];
    
    // Core personality connections
    if (features.mood && profile.emotionalLandscape.dominantEmotions.includes(features.mood)) {
      connections.push(`本質的な${features.mood}への回帰`);
    }
    
    // Creative archetype connections
    if (features.technicalSignature && profile.creativeArchetype.name) {
      connections.push(`${profile.creativeArchetype.name}としての技術的進化`);
    }
    
    // Growth phase connections
    if (profile.growthInsights.currentPhase) {
      connections.push(`${profile.growthInsights.currentPhase}の具現化`);
    }
    
    // Hidden desire manifestation
    profile.corePersonality.hiddenDesires.forEach(desire => {
      if (features.mainSubject && features.mainSubject.includes(desire)) {
        connections.push(`内なる${desire}の表出`);
      }
    });
    
    return connections;
  }

  private getPersonalityDescription(personality: CommentStyle['personality']): string {
    const descriptions = {
      friend: '長年の親友',
      mentor: '洞察力のあるメンター',
      peer: '共に成長する仲間',
      admirer: '深い理解を持つ賞賛者',
      philosopher: '哲学的な観察者'
    };
    return descriptions[personality];
  }

  private getToneDescription(tone: CommentStyle['tone']): string {
    const descriptions = {
      warm: '温かく親密な',
      analytical: '分析的で洞察的な',
      poetic: '詩的で感性豊かな',
      encouraging: '励ましと希望に満ちた',
      philosophical: '哲学的で思索的な'
    };
    return descriptions[tone];
  }

  private getLengthDescription(length: CommentStyle['length']): string {
    const descriptions = {
      short: '50-100文字の簡潔な',
      medium: '200-300文字の適度な',
      long: '400-500文字の詳細な'
    };
    return descriptions[length];
  }

  private getFocusDescription(focus: CommentStyle['focus']): string {
    const descriptions = {
      technical: '技術的な成長と洗練',
      emotional: '感情的な深さと表現',
      creative: '創造的な可能性と革新',
      growth: '個人的な成長と進化',
      storytelling: '物語性と意味の創造'
    };
    return descriptions[focus];
  }

  private generateFallbackDynamicComment(
    profile: DeepPersonalityProfile,
    post: Post,
    style: CommentStyle
  ): DynamicComment {
    const comments = {
      warm: {
        main: `「${post.title}」に込められた思いが、${profile.corePersonality.type}としてのあなたらしさを物語っている。`,
        insight: '今日の一枚には、いつもとは違う何かが宿っている。'
      },
      analytical: {
        main: `技術的な向上と創造的な探求が見事に融合した作品。${profile.creativeArchetype.name}としての進化が明確に表れている。`,
        insight: 'データが示す以上の深い変化が起きている。'
      },
      poetic: {
        main: `光と影の間に、${profile.emotionalLandscape.innerWorld}が静かに息づいている。`,
        insight: '写真は時に、言葉にできない真実を語る。'
      }
    };
    
    const selected = comments[style.tone] || comments.warm;
    
    return {
      main: selected.main,
      insight: selected.insight,
      suggestion: `次は${profile.growthInsights.nextLevelUnlock}を意識してみては？`,
      hiddenMessage: profile.uniqueSignature.personalMythology
    };
  }

  // 複数のコメントバリエーションを生成
  async generateCommentVariations(
    profile: DeepPersonalityProfile,
    post: Post,
    photoScore: PhotoScoreV2,
    count: number = 3
  ): Promise<DynamicComment[]> {
    const variations: DynamicComment[] = [];
    const usedStyles = new Set<string>();
    
    for (let i = 0; i < count; i++) {
      let style: CommentStyle;
      let styleKey: string;
      
      // 重複しないスタイルを選択
      do {
        style = this.selectCommentStyle();
        styleKey = `${style.tone}-${style.focus}-${style.personality}`;
      } while (usedStyles.has(styleKey) && usedStyles.size < 20);
      
      usedStyles.add(styleKey);
      
      const comment = await this.generatePersonalizedComment(
        profile,
        post,
        photoScore,
        [],
        {}
      );
      
      variations.push(comment);
    }
    
    return variations;
  }
}

export const dynamicCommentService = new DynamicCommentService();