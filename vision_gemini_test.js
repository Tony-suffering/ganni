const fetch = require('node-fetch');
const fs = require('fs');

// 画像ファイルをBase64エンコード
function encodeImageToBase64(filePath) {
  const image = fs.readFileSync(filePath);
  return image.toString('base64');
}

// 1. Google Vision APIで画像認識
async function analyzeImageWithVisionAPI(base64Image, visionApiKey) {
  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${visionApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Image },
            features: [{ type: 'LABEL_DETECTION', maxResults: 5 }],
          },
        ],
      }),
    }
  );
  const data = await response.json();
  const labels = data.responses?.[0]?.labelAnnotations?.map(l => l.description).join(', ');
  return labels;
}

// 2. Gemini APIでコメント生成
async function generateCommentWithGemini(labels, geminiApiKey) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: `この写真には次のものが写っています: ${labels}。この写真に対して面白いコメントを日本語で1つ作ってください。` }
            ]
          }
        ]
      }),
    }
  );
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'コメント生成に失敗しました';
}

// --- 実行例 ---
(async () => {
  const visionApiKey = 'AIzaSyBJCdfNDCAgQfCrN7GNuKRnXdzOYXtSDOE';
  const geminiApiKey = 'AIzaSyAaNAp3cJzMc9_WloRU57EAvIJyycqgA8o';
  const imagePath = 'sample.jpg'; // 認識したい画像ファイルのパス

  const base64Image = encodeImageToBase64(imagePath);
  const labels = await analyzeImageWithVisionAPI(base64Image, visionApiKey);
  console.log('Vision APIラベル:', labels);

  const comment = await generateCommentWithGemini(labels, geminiApiKey);
  console.log('Geminiコメント:', comment);
})();