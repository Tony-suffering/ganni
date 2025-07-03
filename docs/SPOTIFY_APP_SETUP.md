# Spotify App 作成ガイド

## 1. Spotify Developer アカウントの作成

1. https://developer.spotify.com にアクセス
2. 右上の「Log in」をクリック
3. Spotifyアカウントでログイン（アカウントがない場合は作成）

## 2. アプリの作成

1. ログイン後、https://developer.spotify.com/dashboard にアクセス
2. 「Create app」ボタンをクリック
3. 以下の情報を入力：

### App name (アプリ名)
```
Airport Moments Blog
```

### App description (アプリの説明)
```
空港写真共有ブログのSpotify連携機能
```

### Website (ウェブサイト)
```
http://localhost:5174
```
（本番環境では実際のURLに変更）

### Redirect URIs (リダイレクトURI)
```
http://localhost:5174/auth/spotify
```
**重要**: このURIを正確に入力してください。末尾のスラッシュは不要です。

### Which API/SDKs are you planning to use?
「Web API」にチェック

4. 利用規約に同意して「Save」をクリック

## 3. Client IDとClient Secretの取得

1. アプリ作成後、アプリの詳細ページが表示されます
2. 「Settings」ボタンをクリック
3. 以下の情報をコピー：
   - **Client ID**: 公開されているID（例：1234567890abcdef...）
   - **Client Secret**: 「View client secret」をクリックして表示（例：abcdef1234567890...）

## 4. 環境変数の設定

1. プロジェクトの`.env`ファイルを開く
2. 以下の値を更新：

```env
VITE_SPOTIFY_CLIENT_ID=ここにClient IDを貼り付け
VITE_SPOTIFY_CLIENT_SECRET=ここにClient Secretを貼り付け
VITE_SPOTIFY_REDIRECT_URI=http://localhost:5174/auth/spotify
```

例：
```env
VITE_SPOTIFY_CLIENT_ID=1234567890abcdef1234567890abcdef
VITE_SPOTIFY_CLIENT_SECRET=abcdef1234567890abcdef1234567890
VITE_SPOTIFY_REDIRECT_URI=http://localhost:5174/auth/spotify
```

## 5. 本番環境への移行時の注意

本番環境にデプロイする際は：

1. Spotify Dashboardで新しいRedirect URIを追加
   - 例：`https://your-domain.com/auth/spotify`
   
2. `.env`ファイルのRedirect URIを更新
   ```env
   VITE_SPOTIFY_REDIRECT_URI=https://your-domain.com/auth/spotify
   ```

3. Vercelなどのホスティングサービスで環境変数を設定

## 6. 必要な権限（Scopes）

現在のアプリで使用している権限：
- `user-read-private`: ユーザープロファイル情報
- `user-read-email`: メールアドレス
- `playlist-read-private`: プライベートプレイリスト
- `user-top-read`: よく聴く曲やアーティスト

## トラブルシューティング

### 「Invalid redirect URI」エラー
- Spotify DashboardのRedirect URIと`.env`の値が完全に一致しているか確認
- 末尾のスラッシュの有無も確認

### 「Invalid client」エラー
- Client IDとClient Secretが正しくコピーされているか確認
- 環境変数が正しく読み込まれているか確認（開発サーバーの再起動）

### 認証後にエラーが発生
- ブラウザの開発者ツールでコンソールエラーを確認
- Supabaseのテーブル権限を確認

## セキュリティの注意事項

- **Client Secret**は絶対に公開しないでください
- GitHubなどにコミットしないよう`.gitignore`に`.env`が含まれていることを確認
- 本番環境では環境変数として安全に管理してください