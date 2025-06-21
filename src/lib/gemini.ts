import { geminiService } from '../services/geminiService';

// Cloud Vision APIで画像ラベルを取得
async function analyzeImageWithVisionAPI(base64Image: string): Promise<string[]> {
  const apiKey = import.meta.env.VITE_GOOGLE_CLOUD_VISION_API_KEY;
  if (!apiKey) throw new Error('Cloud Vision APIキーが設定されていません。');
  const url = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
  const body = {
    requests: [
      {
        image: { content: base64Image.replace(/^data:image\/[^;]+;base64,/, '') },
        features: [{ type: "LABEL_DETECTION", maxResults: 5 }]
      }
    ]
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  console.log('Cloud Vision API response:', JSON.stringify(data, null, 2)); // 詳細ログ
  if (!data.responses || !data.responses[0].labelAnnotations) return [];
  return data.responses[0].labelAnnotations.map((label: any) => label.description);
}

// AI説明文生成（gemini-1.5-proで日本語100文字程度で説明）
export async function generateImageAIDescription(labels: string[]): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini APIキーが設定されていません。');
  const prompt = `以下の特徴を持つ画像について、日本語で150文字以内で簡単に説明してください。いいところを具体的に挙げて、その画像の特徴を説明してください。
  : ${labels.join('、')}`;
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=" + apiKey;
  const body = {
    contents: [
      { parts: [{ text: prompt }] }
    ]
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return text || '画像の内容は特定できませんでした。';
}

// 画像からAI説明文とAIコメントを生成
export async function generateImageAIComments(base64Image: string): Promise<{ description: string, comments: import('../types').AIComment[] }> {
  let labels: string[] = [];
  try {
    labels = await analyzeImageWithVisionAPI(base64Image);
  } catch (e) {
    labels = [];
  }
  // まずAI説明文を生成
  const description = labels.length > 0
    ? await generateImageAIDescription(labels)
    : '画像の内容は特定できませんでした。';
  // その説明文を使ってAIコメント生成
  try {
    const comments = await geminiService.generateAIComments('', '', description);
    return { description, comments };
  } catch (e) {
    return {
      description,
      comments: [
        { id: Date.now().toString(), type: 'comment', content: 'AIコメントを生成できませんでした', createdAt: new Date().toISOString() },
        { id: (Date.now() + 1).toString(), type: 'question', content: 'AIコメントを生成できませんでした', createdAt: new Date(Date.now() + 60000).toISOString() },
        { id: (Date.now() + 2).toString(), type: 'observation', content: 'AIコメントを生成できませんでした', createdAt: new Date(Date.now() + 120000).toISOString() }
      ]
    };
  }
} 