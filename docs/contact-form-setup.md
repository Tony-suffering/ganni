# お問い合わせフォーム セットアップガイド

## 概要
お問い合わせフォームからメールがengineworks.iwasaki@gmail.comに送信されるように実装しました。

## 実装内容

### 1. フロントエンド
- **場所**: `/src/pages/Settings.tsx`
- **機能**:
  - フォームバリデーション（必須項目、文字数制限、メール形式チェック）
  - エラー表示
  - 送信中・送信完了の状態表示
  - Supabaseデータベースへの保存
  - Edge Function経由でのメール送信

### 2. バックエンド（Supabase Edge Functions）
- **場所**: `/supabase/functions/send-contact-email/index.ts`
- **機能**:
  - Resend APIを使用したメール送信
  - HTMLフォーマットでの見やすいメール
  - エラーハンドリング

## セットアップ手順

### 1. Resend APIキーの取得
1. [Resend](https://resend.com)にアクセスしてアカウントを作成
2. ダッシュボードからAPIキーを取得

### 2. Supabaseプロジェクトの設定
```bash
# Supabase CLIのインストール（未インストールの場合）
npm install -g supabase

# ログイン
supabase login

# プロジェクトとリンク
supabase link --project-ref <your-project-ref>

# 環境変数の設定
supabase secrets set RESEND_API_KEY=<your-resend-api-key>
```

### 3. Edge Functionのデプロイ
```bash
supabase functions deploy send-contact-email
```

### 4. データベーステーブルの作成（オプション）
お問い合わせ内容をデータベースに保存する場合：

```sql
CREATE TABLE contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLSポリシーの設定
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーのみ挿入可能
CREATE POLICY "Users can insert their own contact messages" ON contact_messages
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
```

## メールアドレスの変更

送信先メールアドレスを変更する場合は、`/supabase/functions/send-contact-email/index.ts`の以下の行を編集：

```typescript
const TO_EMAIL = 'engineworks.iwasaki@gmail.com';
```

## トラブルシューティング

### メールが届かない場合
1. Resend APIキーが正しく設定されているか確認
2. Supabase Edge Functionのログを確認：
   ```bash
   supabase functions logs send-contact-email
   ```
3. スパムフォルダを確認

### Edge Functionがエラーになる場合
1. CORSヘッダーが正しく設定されているか確認
2. 環境変数が正しく設定されているか確認：
   ```bash
   supabase secrets list
   ```

## 注意事項
- ResendのFreeプランでは月間100通までの制限があります
- 本番環境では送信元ドメインの認証が必要です
- データベースへの保存が失敗してもメール送信は試行されます