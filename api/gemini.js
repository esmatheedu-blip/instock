export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not set' });

  const image = req.body?.image;
  const mimeType = req.body?.mimeType || 'image/jpeg';

  if (!image) return res.status(400).json({ error: 'No image provided' });

  const prompt = `이 이미지는 화장품/뷰티 제품 사진이거나 올리브영 앱 캡처 화면입니다.
이미지에서 제품 정보를 추출해주세요.

아래 JSON 형식으로만 응답하세요. 마크다운, 코드블록, 설명 없이 순수 JSON만:
{"name":"제품명(브랜드 제외)","brand":"브랜드명","category":"스킨케어/선크림/메이크업/바디케어/헤어케어/향수/미스트/클렌징/기타 중 하나"}`;

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 256,
            responseMimeType: 'application/json'
          }
        })
      }
    );

    const d = await r.json();

    if (!r.ok) {
      return res.status(500).json({ error: 'Gemini error', detail: d });
    }

    const text = d.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // JSON 추출 - 중괄호 찾기
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return res.status(500).json({ error: 'No JSON in response', raw: text });

    const parsed = JSON.parse(match[0]);
    res.json({ success: true, ...parsed });

  } catch (e) {
    res.status(500).json({ error: 'Gemini API error', detail: e.message });
  }
}
