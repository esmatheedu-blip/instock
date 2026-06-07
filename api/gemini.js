export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not set' });

  const { image, mimeType = 'image/jpeg' } = req.body;
  if (!image) return res.status(400).json({ error: 'No image provided' });

  const prompt = `이 이미지는 화장품/뷰티 제품 사진이거나 올리브영 앱 캡처 화면입니다.
이미지에서 제품 정보를 추출해주세요.

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요:
{
  "name": "제품명 (브랜드 제외한 순수 제품명)",
  "brand": "브랜드명",
  "category": "스킨케어/선크림/메이크업/바디케어/헤어케어/향수/미스트/클렌징/기타 중 하나"
}

제품명이나 브랜드를 확인할 수 없으면 해당 필드를 빈 문자열로 두세요.`;

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: image } }
            ]
          }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 256 }
        })
      }
    );

    const d = await r.json();
    const text = d.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // JSON 파싱
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    res.json({ success: true, ...parsed });
  } catch (e) {
    res.status(500).json({ error: 'Gemini API error', detail: e.message });
  }
}
