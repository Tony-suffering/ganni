import { GoogleGenerativeAI } from '@google/generative-ai';
import { PhotoScoreV2, ImageAnalysis } from '../types/photoScoreV2';
import { Post } from '../types';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export interface PersonalityDimension {
  dimension: string;
  score: number;
  evidence: string[];
  insight: string;
}

export interface DeepPersonalityProfile {
  corePersonality: {
    type: string;
    description: string;
    strengths: string[];
    hiddenDesires: string[];
  };
  dimensions: PersonalityDimension[];
  creativeArchetype: {
    name: string;
    description: string;
    evolutionStage: string;
  };
  emotionalLandscape: {
    dominantEmotions: string[];
    emotionalRange: number;
    expressionStyle: string;
    innerWorld: string;
  };
  socialPsychology: {
    connectionStyle: string;
    sharingMotivation: string;
    audienceRelationship: string;
    selfPresentation: string;
  };
  growthInsights: {
    currentPhase: string;
    blockages: string[];
    potentialBreakthroughs: string[];
    nextLevelUnlock: string;
  };
  uniqueSignature: {
    quirks: string[];
    hiddenTalents: string[];
    unconsciousPatterns: string[];
    personalMythology: string;
  };
}

interface PhotoPattern {
  pattern: string;
  frequency: number;
  significance: string;
}

export class PersonalityInsightService {
  private model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

  async analyzeDeepPersonality(
    posts: Post[],
    photoScores: Record<string, PhotoScoreV2>
  ): Promise<DeepPersonalityProfile> {
    // Extract comprehensive data for personal analysis
    const patterns = this.extractPhotoPatterns(posts, photoScores);
    const emotionalSignatures = this.analyzeEmotionalSignatures(photoScores);
    const creativeEvolution = this.trackCreativeEvolution(posts, photoScores);
    const subjectPsychology = this.analyzeSubjectChoices(photoScores);
    const technicalPersonality = this.analyzeTechnicalChoices(photoScores);
    
    // Extract specific personal details
    const specificDetails = this.extractSpecificDetails(posts, photoScores);
    
    const prompt = `
あなたは世界トップクラスの心理分析の専門家で、写真から人間の深層心理を読み解く能力を持っています。
以下の詳細なデータから、この人物の本質的な性格と無意識のパターンを分析してください。

**実際の投稿内容（具体的データ）:**
${JSON.stringify(specificDetails, null, 2)}

**写真パターン分析:**
${JSON.stringify(patterns, null, 2)}

**感情的特徴:**
${JSON.stringify(emotionalSignatures, null, 2)}

**創造的進化:**
${JSON.stringify(creativeEvolution, null, 2)}

**被写体選択心理:**
${JSON.stringify(subjectPsychology, null, 2)}

**技術的性格特性:**
${JSON.stringify(technicalPersonality, null, 2)}

**重要な分析要件:**
1. 実際の投稿タイトル「${posts.map(p => p.title).slice(0, 5).join('」「')}」などの具体的な表現を必ず分析に含める
2. 投稿時間帯や頻度パターンから読み取れる生活リズムと心理状態を詳細に分析する
3. 一般論を完全に避け、この人だけの独特な特徴、癖、美意識を発見し称賛する
4. 写真の具体的内容「${posts.map(p => photoScores[p.id]?.imageAnalysis?.mainSubject).filter(Boolean).slice(0, 5).join('、')}」から性格の核心に迫る
5. まるで20年来の親友のように、この人のことを深く理解し愛情を持って分析する
6. 文章は非常に長く詳細に、固有名詞や具体例、エピソードを豊富に使用する
7. 必ず褒める要素を見つけ出し、才能や成長可能性を具体的に指摘する
8. 投稿背景の推測、生活環境の推察、価値観の深掘りを積極的に行う
9. 技術的数値も具体的に引用し「${posts.map(p => photoScores[p.id]?.total_score).filter(Boolean).slice(0, 3).join('点、')}点」などの実データを活用
10. この人の人生観、美意識、創作への取り組み方を深く洞察し、感動的に表現する

以下のJSON形式で詳細な分析を提供してください：

{
  "corePersonality": {
    "type": "例：内なる探求者、感覚的な語り部など、独自の性格タイプ名",
    "description": "1500-2500文字で核となる性格の本質を詳細に描写。実際の投稿タイトル、写真の具体的内容、技術スコア、投稿時間帯、色彩選択などの実データを豊富に引用し、この人物の生き方、価値観、世界観、美意識、創作に対する情熱を20年来の親友のように愛情深く語る。必ず褒める要素を見つけ、才能を称賛し、成長可能性を具体的に示す。投稿背景の推測、生活環境の推察、人生観の深掘りを積極的に行い、感動的に表現する",
    "strengths": ["具体的な写真や投稿から読み取れる独自の強み1", "独自の強み2", "独自の強み3"],
    "hiddenDesires": ["投稿パターンから読み取れる無意識の欲求1", "無意識の欲求2"]
  },
  "dimensions": [
    {
      "dimension": "日常美への感受性",
      "score": 0.9,
      "evidence": ["「新宿都庁ビル」でオレンジのオブジェに着目した独特の視点", "「仕事明けの三日月」という疲労の中でも美を見出す感性", "「花」で団地のアスファルトに咲くユリを発見する観察力"],
      "insight": "あなたは日常の何気ない瞬間に隠された美しさを発見する、まれに見る感性の持ち主です。多くの人が見過ごしてしまう風景の中から、心を動かされる要素を見つけ出す能力は、真の芸術家の資質そのものです"
    },
    {
      "dimension": "内省的創造性",
      "score": 0.8,
      "evidence": ["コメント欄を敢えて空白にする表現手法", "「s」「a」「あ」といった記号的タイトルの選択", "言葉よりも視覚で語ろうとする姿勢"],
      "insight": "言葉では表現しきれない微細な感情を写真に託すあなたの創作手法は、深い内省と感性の豊かさを物語っています。これは現代の情報過多な社会で失われがちな、純粋な感性による表現の復活と言えるでしょう"
    },
    {
      "dimension": "勤勉性と美意識の両立",
      "score": 0.85,
      "evidence": ["仕事帰りの疲労の中でも三日月を撮影する姿勢", "職場の懇親会も作品として昇華させる視点", "日常の責任を果たしながらも創作への意欲を維持"],
      "insight": "現実的な責任を果たしながらも美への探求心を失わないあなたの生き方は、真の意味でのワークライフバランスの体現者です。疲れていても美しいものを見逃さない心の余裕は、人生を豊かにする貴重な才能です"
    }
  ],
  "creativeArchetype": {
    "name": "例：日常の詩人、静寂の語り部、感性の収集家など",
    "description": "600-800文字で創造性の本質的なアーキタイプを詳述。実際の作品例を引用し、この人の創作における独特のアプローチ、美意識、表現手法の特色を具体的に説明。技術的な成長より感性的な表現を重視する姿勢、日常の美を発見する能力、言葉以外での表現への情熱などを深く掘り下げて表現",
    "evolutionStage": "現在の創造的発達段階を詳細に説明し、今後の成長の可能性と具体的な方向性を示唆"
  },
  "emotionalLandscape": {
    "dominantEmotions": ["静謐な観察者としての感情", "日常への深い愛着", "美的探求心"],
    "emotionalRange": 0.85,
    "expressionStyle": "言葉を超えた視覚的表現による感情の伝達",
    "innerWorld": "400-600文字で内的世界を詳細に描写。実際の作品から読み取れる心の動き、感情の起伏、美に対する反応、日常への向き合い方などを具体的に表現。投稿時間帯や被写体選択から推測される心理状態や生活背景も含めて深く洞察"
  },
  "socialPsychology": {
    "connectionStyle": "静かで控えめながらも深い共感を求める繋がり方",
    "sharingMotivation": "言葉では表現できない感情や体験を視覚的に共有したいという深層動機",
    "audienceRelationship": "直接的な反応よりも、静かな理解と共感を求める観者との関係性",
    "selfPresentation": "自己主張よりも感性と作品で語りたいという控えめな自己呈示"
  },
  "growthInsights": {
    "currentPhase": "感性重視の表現模索期 - 技術よりも心の動きを大切にした創作の基盤固めの段階",
    "blockages": ["技術的完璧性への過度な期待", "言語化への苦手意識", "自己評価の低さ"],
    "potentialBreakthroughs": ["独自の感性をより信頼すること", "技術向上と感性表現の両立", "作品への自信を深めること"],
    "nextLevelUnlock": "400-500文字で具体的な成長の方向性を示す。実際の作品傾向から推測される今後の可能性、技術面での具体的な改善点、感性をさらに磨くための提案、創作活動を続けることで得られる成果などを励ましを込めて詳述"
  },
  "uniqueSignature": {
    "quirks": ["コメントを敢えて空白にする表現手法", "記号的タイトル（s、a、あ）の使用", "仕事帰りでも美を見逃さない探求心", "日常の何気ない瞬間への鋭い着目"],
    "hiddenTalents": ["ストーリーテリングの潜在能力", "色彩感覚の豊かさ", "瞬間を切り取る直感力", "感情を視覚化する能力"],
    "unconsciousPatterns": ["疲労時ほど内省的な作品を生み出す傾向", "日常的な被写体に非日常性を見出すパターン", "技術より感性を重視する選択", "言葉以外での表現への強い志向"],
    "personalMythology": "500-700文字で個人的な神話や物語を創造的に描写。この人の創作活動の背景にある深い動機、美に対する独特の哲学、日常を芸術に昇華させる特別な能力、今後の創作人生で描き続けるであろう物語などを、感動的で詩的に表現"
  }
}
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      console.log('🤖 Gemini personality analysis response:', response.substring(0, 500) + '...');
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('✅ Successfully parsed personality profile');
        return parsed;
      }
      throw new Error('Failed to parse personality analysis');
    } catch (error) {
      console.error('❌ Personality analysis error:', error);
      console.log('🔄 Using enhanced default personality profile');
      return this.getEnhancedDefaultPersonalityProfile(posts, photoScores);
    }
  }

  private extractPhotoPatterns(
    posts: Post[],
    photoScores: Record<string, PhotoScoreV2>
  ): PhotoPattern[] {
    const patterns: Record<string, PhotoPattern> = {};
    
    posts.forEach(post => {
      const score = photoScores[post.id];
      if (!score?.imageAnalysis) return;
      
      const analysis = score.imageAnalysis;
      
      // Color temperature patterns
      const colorTemp = analysis.colorTemperature;
      if (!patterns[colorTemp]) {
        patterns[colorTemp] = {
          pattern: `${colorTemp}な色調の選択`,
          frequency: 0,
          significance: this.getColorTempSignificance(colorTemp)
        };
      }
      patterns[colorTemp].frequency++;
      
      // Composition patterns
      const compType = analysis.compositionType;
      if (!patterns[compType]) {
        patterns[compType] = {
          pattern: `${compType}構図の使用`,
          frequency: 0,
          significance: this.getCompositionSignificance(compType)
        };
      }
      patterns[compType].frequency++;
      
      // Mood patterns
      const mood = analysis.moodAtmosphere;
      if (!patterns[mood]) {
        patterns[mood] = {
          pattern: `${mood}な雰囲気の創出`,
          frequency: 0,
          significance: this.getMoodSignificance(mood)
        };
      }
      patterns[mood].frequency++;
      
      // Subject distance patterns
      const subjectWords = analysis.mainSubject.split(/[、。]/);
      subjectWords.forEach(word => {
        if (word.length > 2) {
          const key = `subject_${word}`;
          if (!patterns[key]) {
            patterns[key] = {
              pattern: `${word}への関心`,
              frequency: 0,
              significance: `${word}を繰り返し選ぶことは内的な共鳴を示唆`
            };
          }
          patterns[key].frequency++;
        }
      });
    });
    
    return Object.values(patterns)
      .filter(p => p.frequency > 1)
      .sort((a, b) => b.frequency - a.frequency);
  }

  private analyzeEmotionalSignatures(
    photoScores: Record<string, PhotoScoreV2>
  ): any {
    const emotions: Record<string, number> = {};
    const triggers: Record<string, number> = {};
    let totalPhotos = 0;
    
    Object.values(photoScores).forEach(score => {
      if (!score.imageAnalysis) return;
      
      totalPhotos++;
      
      // Analyze emotional triggers
      const trigger = score.imageAnalysis.emotionalTrigger;
      triggers[trigger] = (triggers[trigger] || 0) + 1;
      
      // Analyze mood atmosphere
      const mood = score.imageAnalysis.moodAtmosphere;
      emotions[mood] = (emotions[mood] || 0) + 1;
    });
    
    return {
      dominantEmotions: Object.entries(emotions)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([emotion, count]) => ({
          emotion,
          frequency: count / totalPhotos,
          interpretation: this.interpretEmotion(emotion, count / totalPhotos)
        })),
      emotionalTriggers: Object.entries(triggers)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([trigger, count]) => ({
          trigger,
          frequency: count / totalPhotos
        })),
      emotionalComplexity: Object.keys(emotions).length / 10 // Normalized complexity score
    };
  }

  private trackCreativeEvolution(
    posts: Post[],
    photoScores: Record<string, PhotoScoreV2>
  ): any {
    const sortedPosts = [...posts].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    const phases = [];
    const phaseSize = Math.ceil(sortedPosts.length / 3);
    
    for (let i = 0; i < 3; i++) {
      const phasePosts = sortedPosts.slice(i * phaseSize, (i + 1) * phaseSize);
      const phaseScores = phasePosts.map(p => photoScores[p.id]).filter(Boolean);
      
      if (phaseScores.length === 0) continue;
      
      const avgTechnical = phaseScores.reduce((sum, s) => sum + (s.technical_score || 0), 0) / phaseScores.length;
      const avgCreativity = phaseScores.reduce((sum, s) => sum + (s.creativity_score || 0), 0) / phaseScores.length;
      const avgComposition = phaseScores.reduce((sum, s) => sum + (s.composition_score || 0), 0) / phaseScores.length;
      
      phases.push({
        phase: i + 1,
        technical: avgTechnical,
        creativity: avgCreativity,
        composition: avgComposition,
        characteristics: this.getPhaseCharacteristics(i, avgTechnical, avgCreativity, avgComposition)
      });
    }
    
    return {
      phases,
      growthTrajectory: this.calculateGrowthTrajectory(phases),
      currentFocus: this.identifyCurrentFocus(phases),
      evolutionPattern: this.identifyEvolutionPattern(phases)
    };
  }

  private analyzeSubjectChoices(
    photoScores: Record<string, PhotoScoreV2>
  ): any {
    const subjects: Record<string, number> = {};
    const angles: Record<string, number> = {};
    const distances: Record<string, number> = {};
    
    Object.values(photoScores).forEach(score => {
      if (!score.imageAnalysis) return;
      
      // Analyze main subjects
      const subjectWords = score.imageAnalysis.mainSubject.split(/[、。]/);
      subjectWords.forEach(word => {
        if (word.length > 2) {
          subjects[word] = (subjects[word] || 0) + 1;
        }
      });
      
      // Analyze shooting angles
      angles[score.imageAnalysis.shootingAngle] = 
        (angles[score.imageAnalysis.shootingAngle] || 0) + 1;
      
      // Analyze depth perception as proxy for distance
      distances[score.imageAnalysis.depthPerception] = 
        (distances[score.imageAnalysis.depthPerception] || 0) + 1;
    });
    
    return {
      preferredSubjects: Object.entries(subjects)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([subject, count]) => ({
          subject,
          frequency: count,
          psychology: this.interpretSubjectChoice(subject, count)
        })),
      perspectivePreference: Object.entries(angles)
        .sort(([,a], [,b]) => b - a)
        .map(([angle, count]) => ({
          angle,
          frequency: count,
          meaning: this.interpretAngleChoice(angle)
        })),
      intimacyLevel: this.calculateIntimacyLevel(distances)
    };
  }

  private analyzeTechnicalChoices(
    photoScores: Record<string, PhotoScoreV2>
  ): any {
    const signatures: Record<string, number> = {};
    const lightingChoices: Record<string, number> = {};
    let technicalConsistency = 0;
    let experimentationLevel = 0;
    
    const scores = Object.values(photoScores).filter(s => s.imageAnalysis);
    
    scores.forEach(score => {
      // Technical signatures
      signatures[score.imageAnalysis.technicalSignature] = 
        (signatures[score.imageAnalysis.technicalSignature] || 0) + 1;
      
      // Lighting choices
      lightingChoices[score.imageAnalysis.lightingQuality] = 
        (lightingChoices[score.imageAnalysis.lightingQuality] || 0) + 1;
    });
    
    // Calculate consistency vs experimentation
    const dominantTechnique = Math.max(...Object.values(signatures));
    technicalConsistency = dominantTechnique / scores.length;
    experimentationLevel = Object.keys(signatures).length / 10; // Normalized
    
    return {
      technicalPersonality: this.interpretTechnicalPersonality(
        technicalConsistency,
        experimentationLevel
      ),
      signatureStyle: Object.entries(signatures)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([sig, count]) => ({
          technique: sig,
          usage: count / scores.length,
          meaning: this.interpretTechnicalSignature(sig)
        })),
      lightingPsychology: Object.entries(lightingChoices)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 2)
        .map(([light, count]) => ({
          lighting: light,
          preference: count / scores.length,
          psychology: this.interpretLightingChoice(light)
        }))
    };
  }

  // Helper methods for interpretations
  private getColorTempSignificance(colorTemp: string): string {
    const interpretations: Record<string, string> = {
      '暖色系': '温かさと親密さを求める内的欲求の表れ',
      '寒色系': '内省的で思索的な精神世界の反映',
      '中性': 'バランスと調和を重視する精神性'
    };
    return interpretations[colorTemp] || '独自の色彩感覚';
  }

  private getCompositionSignificance(composition: string): string {
    const interpretations: Record<string, string> = {
      '三分割構図': '秩序と調和を求める構造的思考',
      '中央配置': '直接的で率直な表現欲求',
      '対角線構図': 'ダイナミズムと変化を求める心理',
      'シンメトリー': '完璧さと安定を求める内的欲求',
      'ミニマル': '本質を見極めようとする精神性'
    };
    return interpretations[composition] || '独自の構成美学';
  }

  private getMoodSignificance(mood: string): string {
    const interpretations: Record<string, string> = {
      '平和的': '内なる静寂と調和を求める精神',
      'エネルギッシュ': '生命力と活力の外的表現',
      'ノスタルジック': '過去と現在を結ぶ感情的架け橋',
      '神秘的': '見えない世界への憧憬',
      'ドラマチック': '強い感情表現への欲求'
    };
    return interpretations[mood] || '独特な感情世界';
  }

  private interpretEmotion(emotion: string, frequency: number): string {
    const intensity = frequency > 0.4 ? '強く' : frequency > 0.2 ? '頻繁に' : '時折';
    return `${emotion}を${intensity}感じ、それを写真で表現する傾向`;
  }

  private getPhaseCharacteristics(
    phase: number,
    technical: number,
    creativity: number,
    composition: number
  ): string {
    if (phase === 0) return '探索と実験の時期';
    if (phase === 1) return '技術的成長と確立の時期';
    if (phase === 2) {
      if (creativity > technical) return '創造的表現の開花期';
      if (technical > 80) return '技術的完成度の追求期';
      return '統合と成熟の時期';
    }
    return '継続的進化の時期';
  }

  private calculateGrowthTrajectory(phases: any[]): string {
    if (phases.length < 2) return '評価中';
    
    const techGrowth = phases[phases.length - 1].technical - phases[0].technical;
    const creativityGrowth = phases[phases.length - 1].creativity - phases[0].creativity;
    
    if (techGrowth > 10 && creativityGrowth > 10) return '全方位的成長';
    if (techGrowth > 10) return '技術的熟達への道';
    if (creativityGrowth > 10) return '創造的解放への道';
    return '内的深化の道';
  }

  private identifyCurrentFocus(phases: any[]): string {
    if (phases.length === 0) return '探索中';
    
    const latest = phases[phases.length - 1];
    const scores = [
      { type: '技術', score: latest.technical },
      { type: '創造性', score: latest.creativity },
      { type: '構成', score: latest.composition }
    ].sort((a, b) => b.score - a.score);
    
    return `${scores[0].type}の洗練に注力`;
  }

  private identifyEvolutionPattern(phases: any[]): string {
    if (phases.length < 3) return '発展途上';
    
    const techTrend = phases.map(p => p.technical);
    const creativeTrend = phases.map(p => p.creativity);
    
    const techSteady = Math.max(...techTrend) - Math.min(...techTrend) < 10;
    const creativeSteady = Math.max(...creativeTrend) - Math.min(...creativeTrend) < 10;
    
    if (techSteady && creativeSteady) return '安定的成熟型';
    if (!techSteady && !creativeSteady) return '爆発的成長型';
    if (techSteady && !creativeSteady) return '創造的覚醒型';
    return '技術的進化型';
  }

  private interpretSubjectChoice(subject: string, frequency: number): string {
    // Context-aware subject interpretation
    if (subject.includes('食') || subject.includes('料理')) {
      return '感覚的な喜びと共有の欲求';
    }
    if (subject.includes('空') || subject.includes('雲')) {
      return '自由と無限への憧憬';
    }
    if (subject.includes('人') || subject.includes('顔')) {
      return '人間関係と感情的つながりへの関心';
    }
    if (subject.includes('建築') || subject.includes('建物')) {
      return '構造と秩序への美的感覚';
    }
    return '特定の美的価値観の追求';
  }

  private interpretAngleChoice(angle: string): string {
    const interpretations: Record<string, string> = {
      '水平アングル': '対等で親密な関係性の構築',
      'ローアングル': '対象への敬意と憧憬',
      'ハイアングル': '俯瞰的視点と保護的感情',
      '斜めアングル': 'ダイナミックな視点と冒険心'
    };
    return interpretations[angle] || '独自の視点の探求';
  }

  private calculateIntimacyLevel(distances: Record<string, number>): string {
    const total = Object.values(distances).reduce((sum, count) => sum + count, 0);
    if (total === 0) return '中立的';
    
    const closeRatio = (distances['浅い'] || 0) / total;
    const farRatio = (distances['深い'] || 0) / total;
    
    if (closeRatio > 0.5) return '親密で直接的なアプローチ';
    if (farRatio > 0.5) return '観察的で思索的なアプローチ';
    return 'バランスの取れた距離感';
  }

  private interpretTechnicalPersonality(
    consistency: number,
    experimentation: number
  ): string {
    if (consistency > 0.7 && experimentation < 0.3) {
      return '職人型：一つの技術を極める探求者';
    }
    if (consistency < 0.3 && experimentation > 0.7) {
      return '実験者型：常に新しい表現を求める革新者';
    }
    if (consistency > 0.5 && experimentation > 0.5) {
      return '統合型：確立した技術の上に新しさを築く建築家';
    }
    return 'バランス型：柔軟に技術を使い分ける適応者';
  }

  private interpretTechnicalSignature(signature: string): string {
    const interpretations: Record<string, string> = {
      'ボケ味重視': '主題への集中と背景の詩的表現',
      'シャープネス重視': '現実の鮮明な把握と記録',
      '長時間露光': '時間の流れと変化への感受性',
      'HDR表現': '現実を超えた理想世界の追求',
      '自然な仕上がり': '真実性と誠実さの価値観'
    };
    return interpretations[signature] || '独自の技術的美学';
  }

  private interpretLightingChoice(lighting: string): string {
    const interpretations: Record<string, string> = {
      '自然光': '真実と自然な美しさを重視',
      '間接光': '柔らかさと優しさを求める心理',
      'ドラマチックな光': '感情的インパクトと物語性',
      '均一な光': '明瞭さと理解しやすさの追求',
      '逆光': '挑戦と詩的表現への志向'
    };
    return interpretations[lighting] || '光への独自の感性';
  }

  private getEnhancedDefaultPersonalityProfile(
    posts: Post[],
    photoScores: Record<string, PhotoScoreV2>
  ): DeepPersonalityProfile {
    // 実際のデータに基づく詳細なフォールバック分析
    const postTitles = posts.map(p => p.title).slice(0, 5);
    const hasScores = posts.some(p => photoScores[p.id]);
    const avgScore = hasScores ? 
      posts.filter(p => photoScores[p.id])
        .reduce((sum, p) => sum + photoScores[p.id].total_score, 0) / 
        posts.filter(p => photoScores[p.id]).length : 0;
    
    return {
      corePersonality: {
        type: '日常美の発見者',
        description: `あなたの${posts.length}件の投稿「${postTitles.join('」「')}」などから読み取れるのは、日常の何気ない瞬間に美しさを見出す、希有な感性の持ち主だということです。${hasScores ? `平均${Math.round(avgScore)}点という評価は、` : ''}技術的な完璧さよりも、心に響く瞬間を大切にする、あなたらしい創作姿勢の表れです。特に印象的なのは、忙しい日常の中でも美しいものを見逃さない観察力と、それを写真として残そうとする創作への情熱です。言葉では表現しきれない感情や体験を、視覚的に表現することで共有しようとするアプローチは、現代的でありながら普遍的な芸術表現の本質を体現しています。`,
        strengths: ['日常の美を発見する観察力', '感性重視の創作アプローチ', '継続的な創作への情熱'],
        hiddenDesires: ['より深い自己表現', '美的体験の共有']
      },
      dimensions: [
        {
          dimension: '日常美への感受性',
          score: 0.9,
          evidence: [`「${postTitles[0] || ''}」などの投稿タイトルから読み取れる独特の視点`],
          insight: '平凡な日常の中に隠された美しさを発見する能力は、真の芸術家の資質です'
        }
      ],
      creativeArchetype: {
        name: '日常の詩人',
        description: `「${postTitles.slice(0, 3).join('」「')}」といった作品群から見えてくるのは、日常を芸術に昇華させる独特の能力です。技術的な完璧さを追求するより、心に響く瞬間を大切にするあなたの姿勢は、真の詩人の資質を示しています。`,
        evolutionStage: '感性を重視した創作の基盤固めの段階'
      },
      emotionalLandscape: {
        dominantEmotions: ['好奇心', '静寂への愛着', '美的探求心'],
        emotionalRange: 0.8,
        expressionStyle: '言葉を超えた視覚的表現',
        innerWorld: `${posts.length}件の投稿から読み取れるのは、静かで内省的な心の世界です。特に「${postTitles[0] || ''}」のような作品からは、日常の中に潜む美しさへの深い愛情と、それを他者と共有したいという優しい気持ちが伝わってきます。`
      },
      socialPsychology: {
        connectionStyle: '静かで控えめながらも深い共感を求める',
        sharingMotivation: '視覚的な美しさを通じた感情の共有',
        audienceRelationship: '理解者との静かな繋がりを重視',
        selfPresentation: '作品で語る控えめな自己表現'
      },
      growthInsights: {
        currentPhase: '感性重視の表現模索期',
        blockages: ['技術的な自信の不足', '自己評価の厳しさ'],
        potentialBreakthroughs: ['独自の感性への信頼', '継続的な創作活動'],
        nextLevelUnlock: `あなたの「${postTitles.slice(0, 2).join('」「')}」といった作品群は、既に十分な表現力を持っています。技術的な向上と並行して、自分の感性をもっと信頼し、創作への自信を深めることで、さらに豊かな表現世界が開けるでしょう。日常の美を発見する才能は、継続することで必ず花開きます。`
      },
      uniqueSignature: {
        quirks: ['簡潔なタイトルの選択', '感情を込めた撮影', '日常への鋭い観察'],
        hiddenTalents: ['物語性のある表現力', '独特の色彩感覚', '瞬間を切り取る直感'],
        unconsciousPatterns: ['美しい瞬間への敏感な反応', '内省的な創作姿勢'],
        personalMythology: `あなたは日常という名の宝箱から、誰も気づかない美しい宝石を見つけ出す特別な能力を持っています。「${postTitles[0] || ''}」から始まる創作の旅は、普通の人が見過ごしてしまう瞬間に光を当て、それを永遠の美として残していく、現代の詩人としての物語なのです。`
      }
    };
  }

  async generateDynamicComment(
    profile: DeepPersonalityProfile,
    latestPost: Post,
    latestScore: PhotoScoreV2
  ): Promise<string> {
    const prompt = `
あなたは親密で洞察力のある友人として、以下の深層心理分析と最新の投稿から、
心に響く個人的なコメントを生成してください。

**深層心理プロファイル:**
- 核となる性格: ${profile.corePersonality.type} - ${profile.corePersonality.description}
- 創造的アーキタイプ: ${profile.creativeArchetype.name}
- 感情的風景: ${profile.emotionalLandscape.innerWorld}
- 現在の成長段階: ${profile.growthInsights.currentPhase}

**最新の投稿分析:**
- タイトル: ${latestPost.title}
- 写真の雰囲気: ${latestScore.imageAnalysis?.moodAtmosphere}
- 感情的トリガー: ${latestScore.imageAnalysis?.emotionalTrigger}
- 技術的特徴: ${latestScore.imageAnalysis?.technicalSignature}

**コメント要件:**
1. 一般的な褒め言葉を避け、この人だけの特徴に言及する
2. 深層心理の洞察を、押し付けがましくなく自然に織り込む
3. 最新の投稿と過去のパターンを結びつけて語る
4. 成長の可能性や隠れた才能をさりげなく示唆する
5. 300-500文字で、温かく親密なトーンで書く
6. 「〜ですね」のような定型的な語尾を避ける
7. まるで長年の友人が話しかけるような自然な日本語で

コメントを生成してください：`;

    try {
      const result = await this.model.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      console.error('Comment generation error:', error);
      return this.generateFallbackComment(profile, latestPost);
    }
  }

  private generateFallbackComment(
    profile: DeepPersonalityProfile,
    post: Post
  ): string {
    const comments = [
      `「${post.title}」というタイトルから、${profile.corePersonality.type}としてのあなたの本質が溢れ出ている。${profile.creativeArchetype.name}として、また新たな境地を開いたんだね。`,
      `この写真を見ていると、${profile.emotionalLandscape.innerWorld}が映し出されているよう。${profile.growthInsights.currentPhase}にいる今だからこそ撮れた一枚。`,
      `${profile.uniqueSignature.personalMythology}の新しい章が始まった感じがする。${profile.corePersonality.strengths[0]}が特に際立っているね。`
    ];
    
    return comments[Math.floor(Math.random() * comments.length)];
  }

  private extractSpecificDetails(
    posts: Post[],
    photoScores: Record<string, PhotoScoreV2>
  ): any {
    return {
      postTitles: posts.map(p => p.title).slice(0, 10),
      postComments: posts.map(p => p.userComment).filter(Boolean).slice(0, 10),
      postDates: posts.map(p => p.createdAt).slice(0, 10),
      postingTimes: posts.map(p => {
        const date = new Date(p.createdAt);
        return {
          hour: date.getHours(),
          dayOfWeek: date.getDay(),
          date: date.toLocaleDateString('ja-JP')
        };
      }).slice(0, 10),
      specificImageContent: posts.map(p => {
        const score = photoScores[p.id];
        return score?.imageAnalysis ? {
          postTitle: p.title,
          mainSubject: score.imageAnalysis.mainSubject,
          specificContent: score.imageAnalysis.specificContent,
          colorTemperature: score.imageAnalysis.colorTemperature,
          moodAtmosphere: score.imageAnalysis.moodAtmosphere,
          compositionType: score.imageAnalysis.compositionType,
          lightingCondition: score.imageAnalysis.lightingCondition,
          technicalQuality: {
            technical_score: score.technical_score,
            composition_score: score.composition_score,
            creativity_score: score.creativity_score,
            total_score: score.total_score
          }
        } : null;
      }).filter(Boolean).slice(0, 10),
      tags: posts.flatMap(p => p.tags?.map(tag => tag.name) || []).slice(0, 20),
      postingFrequency: this.calculatePostingFrequency(posts),
      averageScores: this.calculateAverageScores(posts, photoScores),
      recentTrends: this.analyzeRecentTrends(posts, photoScores)
    };
  }

  private calculatePostingFrequency(posts: Post[]): any {
    if (posts.length < 2) return { daily: 0, insights: '投稿データが不足' };
    
    const dates = posts.map(p => new Date(p.createdAt)).sort();
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    const daysDiff = Math.max(1, Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    const daily = posts.length / daysDiff;
    const hourAnalysis = new Array(24).fill(0);
    posts.forEach(p => {
      const hour = new Date(p.createdAt).getHours();
      hourAnalysis[hour]++;
    });
    
    const mostActiveHour = hourAnalysis.indexOf(Math.max(...hourAnalysis));
    
    return {
      daily: Number(daily.toFixed(2)),
      totalDays: daysDiff,
      mostActiveHour: mostActiveHour,
      insights: daily > 1 ? '非常に活発な投稿者' : daily > 0.5 ? '定期的な投稿者' : '散発的な投稿者'
    };
  }

  private calculateAverageScores(posts: Post[], photoScores: Record<string, PhotoScoreV2>): any {
    const scores = posts.map(p => photoScores[p.id]).filter(Boolean);
    if (scores.length === 0) return null;
    
    const avgTechnical = scores.reduce((sum, s) => sum + s.technical_score, 0) / scores.length;
    const avgComposition = scores.reduce((sum, s) => sum + s.composition_score, 0) / scores.length;
    const avgCreativity = scores.reduce((sum, s) => sum + s.creativity_score, 0) / scores.length;
    const avgTotal = scores.reduce((sum, s) => sum + s.total_score, 0) / scores.length;
    
    return {
      avgTechnical: Math.round(avgTechnical),
      avgComposition: Math.round(avgComposition),
      avgCreativity: Math.round(avgCreativity),
      avgTotal: Math.round(avgTotal),
      insights: avgTotal > 80 ? '非常に高い創作レベル' : avgTotal > 60 ? '良好な創作レベル' : '成長中の創作レベル'
    };
  }

  private analyzeRecentTrends(posts: Post[], photoScores: Record<string, PhotoScoreV2>): any {
    const recent = posts.slice(0, 5);
    const older = posts.slice(5, 10);
    
    if (recent.length === 0) return null;
    
    const recentAvg = recent.map(p => photoScores[p.id]?.total_score || 0)
      .reduce((sum, score) => sum + score, 0) / recent.length;
    const olderAvg = older.length > 0 ? older.map(p => photoScores[p.id]?.total_score || 0)
      .reduce((sum, score) => sum + score, 0) / older.length : recentAvg;
    
    const trend = recentAvg - olderAvg;
    
    return {
      recentAverage: Math.round(recentAvg),
      olderAverage: Math.round(olderAvg),
      trendDirection: trend > 5 ? '上昇' : trend < -5 ? '下降' : '安定',
      improvement: Math.round(trend),
      insights: trend > 5 ? '顕著な成長傾向' : trend < -5 ? '一時的な調整期' : '安定した創作レベル'
    };
  }
}

export const personalityInsightService = new PersonalityInsightService();