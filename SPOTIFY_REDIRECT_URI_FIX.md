# Spotify Redirect URI エラー解決ガイド

## 1. ブラウザの開発者ツールで確認

1. ブラウザで開発者ツール（F12）を開く
2. Consoleタブを開く
3. Spotify連携ボタンをクリック
4. 「🎵 Spotify Auth URL Debug:」のログを確認
   - `redirectUri`の値をコピー

## 2. Spotify Dashboardで正確に設定

1. https://developer.spotify.com/dashboard にアクセス
2. あなたのアプリ「Airport Moments Blog」をクリック
3. 「Settings」をクリック
4. 「Redirect URIs」セクションで：

### 重要な注意点：
- **末尾のスラッシュなし**: `http://localhost:5173/auth/spotify` ✅
- **末尾のスラッシュあり**: `http://localhost:5173/auth/spotify/` ❌
- **HTTPSではなくHTTP**: `http://` ✅ （localhostの場合）
- **ポート番号**: `:5173` （開発サーバーのポートと一致）
- **大文字小文字**: すべて小文字

### 手順：
1. 既存のURIをすべて削除（ゴミ箱アイコンをクリック）
2. 新しいURIを追加：
   ```
   http://localhost:5173/auth/spotify
   ```
3. 「Add」ボタンをクリック
4. 画面下部の「Save」ボタンをクリック（重要！）

## 3. 環境変数の再確認

`.env`ファイルが以下のようになっているか確認：
```
VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173/auth/spotify
```

## 4. 開発サーバーの再起動

```bash
# Ctrl+C で停止
# 再度起動
npm run dev
```

## 5. ブラウザのキャッシュクリア

1. ブラウザを完全に閉じる
2. 再度開いて http://localhost:5173 にアクセス
3. または、シークレット/プライベートウィンドウで試す

## よくある間違い

### ❌ 間違い例：
- `http://localhost:5174/auth/spotify` （ポート番号が違う）
- `https://localhost:5173/auth/spotify` （httpsになっている）
- `http://localhost:5173/auth/spotify/` （末尾にスラッシュ）
- `http://localhost:5173/callback` （パスが違う）
- `localhost:5173/auth/spotify` （http://がない）

### ✅ 正しい例：
```
http://localhost:5173/auth/spotify
```

## それでもダメな場合

1. Spotify Dashboardで新しいアプリを作成し直す
2. 新しいClient ID/Secretを`.env`に設定
3. 最初から設定をやり直す