import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const { imageUrl } = await req.json();

  // Google Vision API呼び出し
  const visionRes = await fetch(
    "https://vision.googleapis.com/v1/images:annotate?key=AIzaSyBJCdfNDCAgQfCrN7GNuKRnXdzOYXtSDOE",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { source: { imageUri: imageUrl } },
            features: [{ type: "LABEL_DETECTION", maxResults: 5 }],
          },
        ],
      }),
    }
  );
  const visionData = await visionRes.json();
  const labels = visionData.responses?.[0]?.labelAnnotations?.map((l: any) => l.description).join(", ");

  // Gemini API呼び出し
  const geminiRes = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_GEMINI_API_KEY", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: `この写真には次のものが写っています: ${labels}。この写真に対して面白いコメントを日本語で1つ作ってください。` }
          ]
        }
      ]
    })
  });
  const geminiData = await geminiRes.json();
  const comment = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "コメント生成に失敗しました";

  return new Response(JSON.stringify({ labels, comment }), {
    headers: { "Content-Type": "application/json" },
  });
}); 