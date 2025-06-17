export async function analyzeImageWithGemini(base64Image: string): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini APIキーが設定されていません。');
  }

  // MIMEタイプとbase64本体を抽出
  const mime = base64Image.match(/^data:(image\/\w+);base64,/i)?.[1] || "image/png";
  const pureBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=" +
    apiKey;

  const body = {
    contents: [
      {
        parts: [
          { text: "この画像を詳細に説明してください。" },
          { inline_data: { mime_type: mime, data: pureBase64 } },
        ],
      },
    ],
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini APIリクエスト失敗: ${res.status} ${errText}`);
    }
    const data = await res.json();
    // デバッグ用: レスポンス構造を出力
    if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.log("Gemini APIレスポンス:", JSON.stringify(data, null, 2));
    }
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Gemini APIから説明文が返りませんでした。');
    }
    return text;
  } catch (err: any) {
    throw new Error('Gemini画像分析エラー: ' + (err?.message || err));
  }
} 