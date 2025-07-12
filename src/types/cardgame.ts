// カードゲーム関連の型定義

export interface CardStats {
  attack: number;      // 攻撃力 (技術スコアから算出)
  defense: number;     // 守備力 (構成スコアから算出)
  speed: number;       // スピード (創造性スコアから算出)
  special: number;     // 特殊スキル (エンゲージメントスコアから算出)
}

export interface GameCard {
  id: string;
  title: string;
  imageUrl: string;
  level: number;       // 1-8 (スコアレベルから)
  rarity: 'N' | 'R' | 'SR' | 'UR';
  attribute: string[];  // タグ
  effectText: string;  // 感想
  stats: CardStats;
  totalScore: number;
  // 追加情報
  monsterType?: string; // モンスター種族
  createdAt?: string; // 投稿日時
  authorName?: string; // 投稿者名
  tags?: string[]; // タグリスト
  likesCount?: number; // いいね数
  viewsCount?: number; // 閲覧数
}