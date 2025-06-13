# Gemini API セットアップガイド

## 🚀 Gemini AI統合の完了

Airport MomentsブログにGemini AIが正式に統合されました！リアルタイムでAI生成コメント・質問・観察を作成できる本格的なAIシステムです。

## 🔑 APIキー設定方法

### 1. Gemini API キーを取得
1. [Google AI Studio](https://makersuite.google.com/app/apikey)にアクセス
2. 「Create API Key」をクリック
3. APIキーをコピー

### 2. 環境変数に設定
`.env`ファイルに以下を追加してください：

```bash
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

⚠️ **重要**: APIキーは秘密情報です。GitHubなどに公開しないよう注意してください。

## ✨ AI機能一覧

### 🎨 **AI情景描写生成**
- 投稿のタイトルとユーザーコメントを分析
- 詩的で美しい情景描写を自動生成
- 空港の美しさや旅の情緒を表現

### 💬 **AI応答システム**
3種類のAI応答を自動生成：

1. **🗨️ AIコメント**
   - 投稿者の感性や視点を称賛
   - 写真の美的価値について言及
   - 温かみのある敬語で表現

2. **❓ AI質問**
   - 対話を促す興味深い質問
   - 撮影時の感情や状況について尋ねる
   - 投稿者が答えたくなるような内容

3. **👁️ AI観察**
   - 文化的、社会学的、心理学的な視点
   - 建築や空間デザインの専門的観察
   - 新しい気づきや価値を提示

## 🎯 使用方法

### 新規投稿時
1. **基本情報入力**
   - タイトルを入力
   - 写真をアップロード
   - 感想・体験を記述

2. **AI情景描写生成**
   - 「AI生成」ボタンをクリック
   - Gemini AIが美しい情景描写を作成

3. **投稿・AI応答生成**
   - 「投稿する」ボタンをクリック
   - 自動的に3つのAI応答が生成される

## 🔧 技術仕様

### フォールバック機能
- APIキーが設定されていない場合、モックデータを使用
- ネットワークエラー時も正常に動作
- ユーザー体験の継続性を保証

### AI生成プロンプト最適化
- 日本語特化の高品質プロンプト
- 空港・旅行テーマに特化した内容
- 文字数制限による読みやすさの確保

### パフォーマンス最適化
- 非同期処理による快適な操作性
- 適切なローディング表示
- エラーハンドリングによる安定性

## 📊 API使用状況確認

### ステータスインジケーター
ヘッダーにAI接続状況が表示されます：
- 🟢 **Gemini AI**: API接続成功
- 🟠 **Mock Data**: フォールバックモード

### 開発者向け確認方法
```javascript
import { geminiService } from './services/geminiService';

// API状況確認
const status = geminiService.getApiStatus();
console.log('AI Status:', status);

// 接続テスト
const isAvailable = geminiService.isApiAvailable();
console.log('API Available:', isAvailable);
```

## 🛡️ セキュリティ対策

### API キー保護
- 環境変数による秘匿化
- フロントエンド配信時の適切な処理
- 本番環境での安全な管理

### エラーハンドリング
- API制限時の適切な対応
- ネットワークエラーからの復旧
- ユーザーフレンドリーなエラーメッセージ

## 🚀 本番環境デプロイ

### Netlify環境変数設定
1. Netlifyダッシュボードにアクセス
2. Site settings → Environment variables
3. `VITE_GEMINI_API_KEY`を追加

### Vercel環境変数設定
1. Vercelダッシュボードにアクセス
2. Project Settings → Environment Variables
3. `VITE_GEMINI_API_KEY`を追加

## 💡 カスタマイズ

### プロンプト調整
`src/services/geminiService.ts`でプロンプトをカスタマイズできます：
```typescript
private createCommentPrompt(title: string, userComment: string, aiDescription: string): string {
  // コメント生成プロンプトをカスタマイズ
}
```

### AI応答タイプ追加
新しいAI応答タイプを追加する場合：
1. `src/types/index.ts`でタイプを定義
2. `geminiService.ts`で生成ロジックを追加
3. UIコンポーネントで表示を対応

---

これで本格的なAI統合ブログシステムが完成しました！🎉
Gemini AIによる高品質な応答で、ユーザーエンゲージメントを大幅に向上させることができます。